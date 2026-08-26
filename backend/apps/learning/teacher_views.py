from datetime import date, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Course
from apps.users.models import User

from .models import (
    AssignmentProgress,
    CabinetSync,
    CourseTeacher,
    CourseTopic,
    Enrollment,
    LessonAttendance,
    ScheduleException,
    ScheduleSlot,
    StudentMaterial,
    TopicMaterial,
    TopicProgress,
    TopicAssignment,
)
from .serializers import (
    EnrollmentListSerializer,
    EnrollmentSerializer,
    ScheduleExceptionSerializer,
    ScheduleSlotSerializer,
    StudentMaterialSerializer,
    TopicMaterialSerializer,
)
from .sync import bump_students

CANCEL_STATUSES = {
    ScheduleException.Status.CANCELLED,
    ScheduleException.Status.COMPENSATED,
    "teacher_fault",
}


class IsTeacher(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, "is_teacher_role", False)


def teacher_course_ids(user):
    return CourseTeacher.objects.filter(teacher=user).values("course_id")


def scoped_enrollments(user):
    return Enrollment.objects.filter(
        status=Enrollment.Status.ACTIVE,
        course_id__in=teacher_course_ids(user),
    )


def teacher_owns_enrollment(user, enrollment):
    return bool(
        enrollment
        and CourseTeacher.objects.filter(teacher=user, course_id=enrollment.course_id).exists()
    )


def avatar_url(request, user):
    if not getattr(user, "avatar", None):
        return ""
    url = user.avatar.url
    if request:
        return request.build_absolute_uri(url)
    return url


def short_title(course):
    title = getattr(course, "title", "") or ""
    for prefix in ("Курс ", "Course "):
        if title.startswith(prefix):
            return title[len(prefix) :].strip()
    return title.split()[-1] if title else getattr(course, "id", "")


def iter_slot_dates(slot, start, end):
    offset = (slot.weekday - start.weekday()) % 7
    current = start + timedelta(days=offset)
    while current <= end:
        yield current
        current += timedelta(days=7)


def last_lesson_date(slots, cancelled_map, today):
    last = None
    start = today - timedelta(days=180)
    for slot in slots:
        cancelled = cancelled_map.get(slot.id, set())
        for day in iter_slot_dates(slot, start, today):
            if day in cancelled:
                continue
            if last is None or day > last:
                last = day
    return last


def next_lesson_date(slots, cancelled_map, today):
    soonest = None
    end = today + timedelta(days=60)
    start = today + timedelta(days=1)
    for slot in slots:
        cancelled = cancelled_map.get(slot.id, set())
        for day in iter_slot_dates(slot, start, end):
            if day in cancelled:
                continue
            if soonest is None or day < soonest:
                soonest = day
                break
    return soonest


def format_last_lesson(value, today):
    if not value:
        return ""
    if value == today:
        return "Сьогодні"
    if value == today - timedelta(days=1):
        return "Вчора"
    return value.isoformat()


def current_topic(enrollment):
    topics = list(
        CourseTopic.objects.filter(section__course=enrollment.course)
        .select_related("section")
        .order_by("section__order", "order", "id")
    )
    if not topics:
        return None
    done_ids = set(
        enrollment.topic_progress.filter(status=TopicProgress.Status.DONE).values_list(
            "topic_id", flat=True
        )
    )
    for topic in topics:
        if topic.id not in done_ids:
            return topic
    return topics[-1]


def homework_counts(enrollment):
    assignments = list(enrollment.personal_assignments.all())
    total = len(assignments)
    done_ids = {
        row.assignment_id
        for row in enrollment.assignment_progress.all()
        if row.hw_status == AssignmentProgress.HwStatus.DONE
    }
    done = sum(1 for item in assignments if item.id in done_ids)
    return done, total


def personal_assignments(topic, enrollment):
    return [
        item
        for item in topic.assignments.all()
        if item.enrollment_id == enrollment.id
    ]


class TeacherStudentsView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        today = timezone.localdate()
        enrollments = list(
            scoped_enrollments(request.user)
            .select_related("course", "student")
            .prefetch_related(
                "topic_progress",
                "assignment_progress",
                "schedule_slots",
                "personal_assignments",
            )
        )
        student_ids = {row.student_id for row in enrollments}
        students = (
            User.objects.filter(id__in=student_ids, role=User.Role.STUDENT, is_active=True)
            .order_by("last_name", "first_name", "username")
        )
        by_student = {}
        for row in enrollments:
            by_student.setdefault(row.student_id, []).append(row)

        slots = [slot for row in enrollments for slot in row.schedule_slots.all()]
        exceptions = ScheduleException.objects.filter(slot__in=slots)
        cancelled_map = {}
        for item in exceptions:
            if item.status in CANCEL_STATUSES:
                cancelled_map.setdefault(item.slot_id, set()).add(item.date)

        data = []
        for student in students:
            rows = by_student.get(student.id, [])
            primary = rows[0] if rows else None
            homework_done = 0
            homework_total = 0
            for row in rows:
                done, total = homework_counts(row)
                homework_done += done
                homework_total += total
            student_slots = [slot for row in rows for slot in row.schedule_slots.all()]
            last = last_lesson_date(student_slots, cancelled_map, today)
            next_day = next_lesson_date(student_slots, cancelled_map, today)
            data.append(
                {
                    "id": student.id,
                    "username": student.username,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "display_name": student.get_full_name().strip() or student.username,
                    "email": student.email,
                    "phone": student.phone,
                    "avatar": avatar_url(request, student),
                    "courses": EnrollmentListSerializer(rows, many=True).data,
                    "course_title": short_title(primary.course) if primary else "",
                    "course_id": primary.course_id if primary else "",
                    "enrollment_id": primary.id if primary else None,
                    "progress_percent": EnrollmentListSerializer(primary).data["progress_percent"]
                    if primary
                    else 0,
                    "started_at": primary.started_at if primary else None,
                    "homework_done": homework_done,
                    "homework_total": homework_total,
                    "last_lesson": format_last_lesson(last, today),
                    "last_lesson_date": last.isoformat() if last else "",
                    "next_lesson_date": next_day.isoformat() if next_day else "",
                    "notes": primary.notes if primary else "",
                }
            )
        return Response(data)


class TeacherStudentDetailView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request, pk):
        today = timezone.localdate()
        student = User.objects.filter(pk=pk, role=User.Role.STUDENT, is_active=True).first()
        if not student:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        enrollments = (
            scoped_enrollments(request.user)
            .filter(student=student)
            .select_related("course")
            .prefetch_related(
                "lessons",
                "topic_progress",
                "assignment_progress",
                "attendance",
                "schedule_slots",
                "course__sections__topics__materials",
                "course__sections__topics__assignments",
                "course__sections__topics__student_materials",
                "personal_assignments",
            )
        )
        enrollments = list(enrollments)
        if not enrollments:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        enrollment_data = []
        for row in enrollments:
            payload = EnrollmentSerializer(row).data
            payload["notes"] = row.notes
            slots = list(row.schedule_slots.all())
            cancelled_map = {}
            for item in ScheduleException.objects.filter(slot__in=slots):
                if item.status in CANCEL_STATUSES:
                    cancelled_map.setdefault(item.slot_id, set()).add(item.date)
            last = last_lesson_date(slots, cancelled_map, today)
            nxt = next_lesson_date(slots, cancelled_map, today)
            present = row.attendance.filter(
                status__in=[LessonAttendance.Status.PRESENT, LessonAttendance.Status.LATE]
            ).count()
            hw_done, hw_total = homework_counts(row)
            payload["attended_count"] = present
            payload["homework_done"] = hw_done
            payload["homework_total"] = hw_total
            payload["last_lesson"] = format_last_lesson(last, today)
            payload["last_lesson_date"] = last.isoformat() if last else ""
            payload["next_lesson_date"] = nxt.isoformat() if nxt else ""
            payload["attendance"] = [
                {
                    "id": item.id,
                    "date": item.date.isoformat(),
                    "status": item.status,
                    "status_label": item.get_status_display(),
                    "slot_id": item.slot_id,
                }
                for item in row.attendance.all()
            ]
            enrollment_data.append(payload)
        return Response(
            {
                "id": student.id,
                "username": student.username,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "display_name": student.get_full_name().strip() or student.username,
                "email": student.email,
                "phone": student.phone,
                "avatar": avatar_url(request, student),
                "enrollments": enrollment_data,
            }
        )


class TeacherNotesView(APIView):
    permission_classes = [IsTeacher]

    def patch(self, request, enrollment_id):
        enrollment = scoped_enrollments(request.user).filter(pk=enrollment_id).select_related("student").first()
        if not enrollment:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        enrollment.notes = request.data.get("notes") or ""
        enrollment.save(update_fields=["notes"])
        return Response({"notes": enrollment.notes})


class TeacherTopicStatusView(APIView):
    permission_classes = [IsTeacher]

    def patch(self, request, enrollment_id, topic_id):
        enrollment = scoped_enrollments(request.user).filter(pk=enrollment_id).select_related("student").first()
        topic = CourseTopic.objects.filter(
            pk=topic_id, section__course=enrollment.course if enrollment else None
        ).first()
        if not enrollment or not topic:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        next_status = request.data.get("status") or TopicProgress.Status.DONE
        allowed = {choice for choice, _ in TopicProgress.Status.choices}
        if next_status not in allowed:
            return Response({"detail": "Невірний статус"}, status=status.HTTP_400_BAD_REQUEST)
        row, _ = TopicProgress.objects.update_or_create(
            enrollment=enrollment,
            topic=topic,
            defaults={"status": next_status},
        )
        bump_students([enrollment.student_id])
        return Response({"id": row.id, "status": row.status})


class TeacherAddAssignmentView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request, topic_id):
        topic = CourseTopic.objects.filter(pk=topic_id).select_related("section").first()
        if not topic:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        enrollment = scoped_enrollments(request.user).filter(
            pk=request.data.get("enrollment_id"),
            course=topic.section.course,
        ).select_related("student").first()
        if not enrollment:
            return Response(
                {"detail": "Домашку задають окремо одному студенту"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        title = (request.data.get("title") or "").strip()
        description = (request.data.get("description") or "").strip()
        due_label = (request.data.get("due_label") or "До наступного заняття").strip()
        if not title:
            return Response({"detail": "Вкажіть назву домашки"}, status=status.HTTP_400_BAD_REQUEST)
        order = topic.assignments.filter(enrollment=enrollment).count()
        assignment = TopicAssignment.objects.create(
            topic=topic,
            enrollment=enrollment,
            title=title,
            description=description,
            due_label=due_label,
            order=order,
        )
        AssignmentProgress.objects.create(
            enrollment=enrollment,
            assignment=assignment,
            status=AssignmentProgress.Status.NOT_STARTED,
        )
        bump_students([enrollment.student_id])
        return Response(
            {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "due_label": assignment.due_label,
            },
            status=status.HTTP_201_CREATED,
        )


class TeacherAssignmentUpdateView(APIView):
    permission_classes = [IsTeacher]

    def patch(self, request, assignment_id):
        assignment = TopicAssignment.objects.filter(pk=assignment_id).select_related(
            "topic__section", "enrollment"
        ).first()
        if not assignment or not teacher_owns_enrollment(request.user, assignment.enrollment):
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        title = request.data.get("title")
        description = request.data.get("description")
        due_label = request.data.get("due_label")
        fields = []
        if title is not None:
            assignment.title = str(title).strip() or assignment.title
            fields.append("title")
        if description is not None:
            assignment.description = str(description).strip()
            fields.append("description")
        if due_label is not None:
            assignment.due_label = str(due_label).strip()
            fields.append("due_label")
        if fields:
            assignment.save(update_fields=fields)
            if assignment.enrollment_id:
                bump_students([assignment.enrollment.student_id])
        return Response(
            {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "due_label": assignment.due_label,
            }
        )

    def delete(self, request, assignment_id):
        assignment = TopicAssignment.objects.filter(pk=assignment_id).select_related(
            "enrollment"
        ).first()
        if not assignment or not teacher_owns_enrollment(request.user, assignment.enrollment):
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        student_id = assignment.enrollment.student_id if assignment.enrollment_id else None
        assignment.delete()
        if student_id:
            bump_students([student_id])
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeacherStudentMaterialView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request, enrollment_id, topic_id):
        enrollment = scoped_enrollments(request.user).filter(pk=enrollment_id).select_related("student", "course").first()
        topic = CourseTopic.objects.filter(
            pk=topic_id, section__course=enrollment.course if enrollment else None
        ).first()
        if not enrollment or not topic:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        title = (request.data.get("title") or "").strip()
        url = (request.data.get("url") or "").strip() or "#"
        material_type = request.data.get("type") or TopicMaterial.MaterialType.LINK
        allowed = {choice for choice, _ in TopicMaterial.MaterialType.choices}
        if material_type not in allowed:
            return Response({"detail": "Невірний тип"}, status=status.HTTP_400_BAD_REQUEST)
        if not title:
            return Response({"detail": "Вкажіть назву матеріалу"}, status=status.HTTP_400_BAD_REQUEST)
        row = StudentMaterial.objects.create(
            enrollment=enrollment,
            topic=topic,
            title=title,
            url=url,
            material_type=material_type,
            meta=request.data.get("meta") or "Від викладача",
            order=enrollment.extra_materials.filter(topic=topic).count(),
        )
        bump_students([enrollment.student_id])
        return Response(StudentMaterialSerializer(row).data, status=status.HTTP_201_CREATED)


class TeacherStudentMaterialDetailView(APIView):
    permission_classes = [IsTeacher]

    def delete(self, request, pk):
        row = StudentMaterial.objects.filter(pk=pk).select_related("enrollment").first()
        if not row or not teacher_owns_enrollment(request.user, row.enrollment):
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        student_id = row.enrollment.student_id
        row.delete()
        bump_students([student_id])
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeacherGradeView(APIView):
    permission_classes = [IsTeacher]

    def patch(self, request, enrollment_id, assignment_id):
        enrollment = scoped_enrollments(request.user).filter(pk=enrollment_id).select_related("student").first()
        assignment = TopicAssignment.objects.filter(pk=assignment_id).first()
        if not enrollment or not assignment:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        if assignment.enrollment_id and assignment.enrollment_id != enrollment.id:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        grade = str(request.data.get("grade") or "").strip()
        hw_status = request.data.get("hw_status")
        allowed_hw = {choice for choice, _ in AssignmentProgress.HwStatus.choices} | {""}
        if hw_status is not None and hw_status not in allowed_hw:
            return Response({"detail": "Невірний статус домашки"}, status=status.HTTP_400_BAD_REQUEST)
        next_status = request.data.get("status")
        if not next_status:
            if hw_status == AssignmentProgress.HwStatus.DONE:
                next_status = AssignmentProgress.Status.REVIEWED
            elif hw_status:
                next_status = AssignmentProgress.Status.SUBMITTED
            else:
                next_status = (
                    AssignmentProgress.Status.REVIEWED if grade else AssignmentProgress.Status.SUBMITTED
                )
        allowed = {choice for choice, _ in AssignmentProgress.Status.choices}
        if next_status not in allowed:
            return Response({"detail": "Невірний статус"}, status=status.HTTP_400_BAD_REQUEST)
        defaults = {"status": next_status, "grade": grade}
        if hw_status is not None:
            defaults["hw_status"] = hw_status
        row, _ = AssignmentProgress.objects.update_or_create(
            enrollment=enrollment,
            assignment=assignment,
            defaults=defaults,
        )
        bump_students([enrollment.student_id])
        return Response(
            {
                "id": row.id,
                "status": row.status,
                "hw_status": row.hw_status,
                "grade": row.grade,
            }
        )


class TeacherAttendanceView(APIView):
    permission_classes = [IsTeacher]

    def patch(self, request):
        enrollment = scoped_enrollments(request.user).filter(pk=request.data.get("enrollment_id")).select_related(
            "student"
        ).first()
        if not enrollment:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        day = request.data.get("date")
        att_status = request.data.get("status") or LessonAttendance.Status.PRESENT
        allowed = {choice for choice, _ in LessonAttendance.Status.choices}
        if att_status not in allowed:
            return Response({"detail": "Невірний статус"}, status=status.HTTP_400_BAD_REQUEST)
        slot_id = request.data.get("slot_id")
        slot = ScheduleSlot.objects.filter(pk=slot_id, enrollment=enrollment).first() if slot_id else None
        row, _ = LessonAttendance.objects.update_or_create(
            enrollment=enrollment,
            slot=slot,
            date=day,
            defaults={"status": att_status},
        )
        bump_students([enrollment.student_id])
        return Response(
            {
                "id": row.id,
                "date": row.date.isoformat(),
                "status": row.status,
                "status_label": row.get_status_display(),
            }
        )


class TeacherCoursesView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        courses = Course.objects.filter(id__in=teacher_course_ids(request.user))
        data = []
        for course in courses:
            students = Enrollment.objects.filter(
                course=course, status=Enrollment.Status.ACTIVE
            ).count()
            topics = CourseTopic.objects.filter(section__course=course).count()
            lessons = ScheduleSlot.objects.filter(
                enrollment__course=course, enrollment__status=Enrollment.Status.ACTIVE
            ).count()
            data.append(
                {
                    "id": course.id,
                    "title": course.title,
                    "short_title": short_title(course),
                    "subtitle": course.subtitle,
                    "image": course.card_image,
                    "students_count": students,
                    "topics_count": topics,
                    "lessons_count": lessons,
                }
            )
        return Response(data)


class TeacherCourseDetailView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request, pk):
        course = Course.objects.filter(pk=pk).prefetch_related(
            "sections__topics__materials"
        ).first()
        if not course or not CourseTeacher.objects.filter(teacher=request.user, course=course).exists():
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        topics = []
        number = 1
        for section in course.sections.all():
            for topic in section.topics.all():
                topics.append(
                    {
                        "id": topic.id,
                        "number": number,
                        "title": topic.title,
                        "description": topic.description,
                        "section": section.title,
                        "materials": TopicMaterialSerializer(topic.materials.all(), many=True).data,
                    }
                )
                number += 1
        students = []
        enrollments = (
            Enrollment.objects.filter(course=course, status=Enrollment.Status.ACTIVE)
            .select_related("student")
            .prefetch_related("personal_assignments", "assignment_progress")
        )
        for row in enrollments:
            done, total = homework_counts(row)
            student = row.student
            students.append(
                {
                    "id": student.id,
                    "enrollment_id": row.id,
                    "display_name": student.get_full_name().strip() or student.username,
                    "avatar": avatar_url(request, student),
                    "progress_percent": EnrollmentListSerializer(row).data["progress_percent"],
                    "homework_done": done,
                    "homework_total": total,
                }
            )
        return Response(
            {
                "id": course.id,
                "title": course.title,
                "short_title": short_title(course),
                "subtitle": course.subtitle,
                "students_count": len(students),
                "topics": topics,
                "students": students,
            }
        )


class TeacherScheduleView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        slots = ScheduleSlot.objects.filter(
            enrollment__in=scoped_enrollments(request.user)
        ).select_related("enrollment__course", "enrollment__student")
        exceptions = ScheduleException.objects.filter(slot__in=slots)
        payload = []
        for slot in slots:
            item = ScheduleSlotSerializer(slot).data
            student = slot.enrollment.student
            item["student_id"] = student.id
            item["student_name"] = student.get_full_name().strip() or student.username
            item["student_avatar"] = avatar_url(request, student)
            item["enrollment_id"] = slot.enrollment_id
            payload.append(item)
        return Response(
            {
                "slots": payload,
                "exceptions": ScheduleExceptionSerializer(exceptions, many=True).data,
            }
        )


class TeacherScheduleExceptionView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request):
        slot = ScheduleSlot.objects.filter(pk=request.data.get("slot_id")).select_related(
            "enrollment"
        ).first()
        date_value = request.data.get("date")
        if not slot or not date_value or not teacher_owns_enrollment(request.user, slot.enrollment):
            return Response({"detail": "Потрібні slot_id і date"}, status=status.HTTP_400_BAD_REQUEST)
        next_status = request.data.get("status") or ScheduleException.Status.CANCELLED
        allowed = {choice for choice, _ in ScheduleException.Status.choices}
        if next_status not in allowed:
            return Response({"detail": "Невірний статус заняття"}, status=status.HTTP_400_BAD_REQUEST)
        row, _ = ScheduleException.objects.update_or_create(
            slot=slot,
            date=date_value,
            defaults={"status": next_status},
        )
        bump_students([slot.enrollment.student_id])
        return Response(ScheduleExceptionSerializer(row).data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        row = ScheduleException.objects.filter(pk=pk).select_related("slot__enrollment").first()
        if not row or not teacher_owns_enrollment(request.user, row.slot.enrollment):
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        student_id = row.slot.enrollment.student_id
        row.delete()
        bump_students([student_id])
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeacherLessonView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request, slot_id, day):
        slot = (
            ScheduleSlot.objects.filter(pk=slot_id)
            .select_related("enrollment__course", "enrollment__student")
            .first()
        )
        if not slot or not teacher_owns_enrollment(request.user, slot.enrollment):
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            lesson_date = date.fromisoformat(day)
        except ValueError:
            return Response({"detail": "Невірна дата"}, status=status.HTTP_400_BAD_REQUEST)
        enrollment = slot.enrollment
        student = enrollment.student
        topic = current_topic(enrollment)
        prev_assignment = None
        topics = list(
        CourseTopic.objects.filter(section__course=enrollment.course)
        .select_related("section")
        .order_by("section__order", "order", "id")
        )
        if topic and topics:
            try:
                idx = [item.id for item in topics].index(topic.id)
            except ValueError:
                idx = 0
            for prev in reversed(topics[:idx]):
                prev_assignment = (
                    prev.assignments.filter(enrollment=enrollment).order_by("-order").first()
                )
                if prev_assignment:
                    break
        attendance = LessonAttendance.objects.filter(
            enrollment=enrollment, slot=slot, date=lesson_date
        ).first()
        hw_map = {row.assignment_id: row for row in enrollment.assignment_progress.all()}

        def hw_payload(assignment):
            if not assignment:
                return None
            progress = hw_map.get(assignment.id)
            return {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "due_label": assignment.due_label,
                "hw_status": progress.hw_status if progress else "",
                "status_label": dict(AssignmentProgress.HwStatus.choices).get(
                    progress.hw_status if progress else "", "Не перевірено"
                ),
            }

        return Response(
            {
                "slot_id": slot.id,
                "date": lesson_date.isoformat(),
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "weekday_label": slot.get_weekday_display(),
                "course_id": enrollment.course_id,
                "course_title": enrollment.course.title,
                "short_title": short_title(enrollment.course),
                "topic": {
                    "id": topic.id,
                    "title": topic.title,
                    "description": topic.description,
                    "materials": TopicMaterialSerializer(topic.materials.all(), many=True).data,
                    "assignments": [
                        hw_payload(item) for item in personal_assignments(topic, enrollment)
                    ],
                }
                if topic
                else None,
                "student": {
                    "id": student.id,
                    "display_name": student.get_full_name().strip() or student.username,
                    "avatar": avatar_url(request, student),
                    "enrollment_id": enrollment.id,
                    "attendance": attendance.status if attendance else "",
                    "attendance_label": attendance.get_status_display() if attendance else "Не відмічено",
                },
                "previous_homework": hw_payload(prev_assignment),
            }
        )


class MySyncView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, "is_student_role", False):
            return Response({"version": 0})
        row, _ = CabinetSync.objects.get_or_create(student=request.user)
        return Response({"version": row.version, "updated_at": row.updated_at})
