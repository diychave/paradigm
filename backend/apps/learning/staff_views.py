import re
import uuid

from django.db import IntegrityError
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Course
from apps.leads.models import Lead
from apps.users.access import is_office_admin, is_office_staff
from apps.users.models import User

from .models import (
    CourseSection,
    CourseTeacher,
    CourseTopic,
    Enrollment,
    ScheduleException,
    ScheduleSlot,
    TopicMaterial,
    TopicProgress,
    Transaction,
)
from .serializers import ScheduleExceptionSerializer, ScheduleSlotSerializer, TopicMaterialSerializer
from .sync import bump_course, bump_students
from .teacher_views import avatar_url


class IsOfficeStaff(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and is_office_staff(request.user)


class IsOfficeAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and is_office_admin(request.user)


def display_name(user):
    if not user:
        return ""
    return user.get_full_name().strip() or user.username


def person_payload(user, request=None):
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "display_name": display_name(user),
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "is_archived": bool(getattr(user, "is_archived", False)),
        "avatar": avatar_url(request, user),
    }


def unique_course_id(title, explicit=""):
    raw = (explicit or "").strip().lower()
    base = slugify(raw) or slugify(title) or f"course-{uuid.uuid4().hex[:8]}"
    base = re.sub(r"[^a-z0-9\-]+", "-", base).strip("-")[:56] or f"course-{uuid.uuid4().hex[:8]}"
    slug = base
    n = 2
    while Course.objects.filter(pk=slug).exists():
        slug = f"{base[:52]}-{n}"
        n += 1
    return slug


def course_card(course):
    return {
        "id": course.id,
        "title": course.title,
        "subtitle": course.subtitle,
        "age_range": course.age_range,
        "description": course.description,
        "is_published": course.is_published,
        "order": course.order,
        "topics_count": CourseTopic.objects.filter(section__course=course).count(),
        "materials_count": TopicMaterial.objects.filter(topic__section__course=course).count(),
        "sections_count": course.sections.count(),
        "students_count": Enrollment.objects.filter(
            course=course, status=Enrollment.Status.ACTIVE
        ).count(),
        "teachers_count": CourseTeacher.objects.filter(course=course).count(),
        "updated_at": course.updated_at.isoformat() if getattr(course, "updated_at", None) else "",
    }


def serialize_office_slot(slot, request=None):
    item = ScheduleSlotSerializer(slot).data
    enrollment = slot.enrollment
    student = enrollment.student
    teacher = enrollment.teacher
    item["student_id"] = student.id
    item["student_name"] = display_name(student)
    item["student_avatar"] = avatar_url(request, student)
    item["teacher_id"] = teacher.id if teacher else None
    item["teacher_name"] = display_name(teacher) if teacher else ""
    item["enrollment_id"] = enrollment.id
    return item


def transaction_payload(row):
    return {
        "id": row.id,
        "amount": row.amount,
        "status": row.status,
        "status_label": row.get_status_display(),
        "note": row.note,
        "created_at": row.created_at.isoformat(),
        "student_id": row.student_id,
        "student_name": display_name(row.student),
        "course_id": row.course_id or "",
        "course_title": row.course.title if row.course_id else "",
        "created_by_name": display_name(row.created_by) if row.created_by_id else "",
    }


def touch_topic(topic):
    CourseTopic.objects.filter(pk=topic.pk).update(updated_at=timezone.now())


def parse_time(value, field):
    text = str(value or "").strip()
    if not text:
        raise ValueError(field)
    parts = text.split(":")
    from datetime import time as time_cls

    try:
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
        return time_cls(hour, minute)
    except (TypeError, ValueError):
        raise ValueError(field)


class OfficeHomeView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request):
        today = timezone.localdate()
        slots = list(
            ScheduleSlot.objects.filter(
                enrollment__status=Enrollment.Status.ACTIVE,
                enrollment__student__is_archived=False,
            )
            .select_related("enrollment__course", "enrollment__student", "enrollment__teacher")
        )
        cancelled = {
            (row.slot_id, row.date)
            for row in ScheduleException.objects.filter(
                slot__in=slots,
                date=today,
                status__in={
                    ScheduleException.Status.CANCELLED,
                    ScheduleException.Status.COMPENSATED,
                },
            )
        }
        today_lessons = [
            serialize_office_slot(slot, request)
            for slot in slots
            if slot.weekday == today.weekday() and (slot.id, today) not in cancelled
        ]
        today_lessons.sort(key=lambda item: item["start_time"])
        pending = Transaction.objects.filter(status=Transaction.Status.PENDING).count()
        new_leads = Lead.objects.filter(status=Lead.Status.NEW).count()
        return Response(
            {
                "students": User.objects.filter(role=User.Role.STUDENT, is_archived=False).count(),
                "teachers": User.objects.filter(role=User.Role.TEACHER, is_archived=False).count(),
                "managers": User.objects.filter(role=User.Role.MANAGER).count(),
                "courses": Course.objects.count(),
                "published_courses": Course.objects.filter(is_published=True).count(),
                "today_lessons_count": len(today_lessons),
                "pending_payments": pending,
                "new_leads": new_leads,
                "today_lessons": today_lessons[:12],
                "is_admin": is_office_admin(request.user),
            }
        )


class OfficeLookupsView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request):
        students = User.objects.filter(role=User.Role.STUDENT, is_archived=False, is_active=True).order_by(
            "last_name", "first_name", "username"
        )
        teachers = User.objects.filter(role=User.Role.TEACHER, is_archived=False, is_active=True).order_by(
            "last_name", "first_name", "username"
        )
        courses = Course.objects.all().order_by("order", "title")
        return Response(
            {
                "students": [person_payload(user, request) for user in students],
                "teachers": [person_payload(user, request) for user in teachers],
                "courses": [
                    {"id": course.id, "title": course.title, "is_published": course.is_published}
                    for course in courses
                ],
            }
        )


class OfficeCoursesView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request):
        courses = Course.objects.all().order_by("order", "title")
        return Response([course_card(course) for course in courses])

    def post(self, request):
        title = (request.data.get("title") or "").strip()
        if not title:
            return Response({"detail": "Вкажіть назву курсу"}, status=status.HTTP_400_BAD_REQUEST)
        course_id = unique_course_id(title, request.data.get("id"))
        max_order = Course.objects.order_by("-order").values_list("order", flat=True).first() or 0
        course = Course.objects.create(
            id=course_id,
            title=title,
            subtitle=(request.data.get("subtitle") or "").strip(),
            age_range=(request.data.get("age_range") or "").strip(),
            description=(request.data.get("description") or "").strip(),
            card_description=(request.data.get("description") or "").strip()[:400],
            is_published=bool(request.data.get("is_published")),
            order=max_order + 1,
        )
        CourseSection.objects.create(course=course, title="Програма курсу", order=0)
        return Response(course_card(course), status=status.HTTP_201_CREATED)


class OfficeCourseDetailView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if not course:
            return Response({"detail": "Курс не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        sections = []
        for section in course.sections.all().prefetch_related("topics__materials"):
            topics = []
            for topic in section.topics.all():
                topics.append(
                    {
                        "id": topic.id,
                        "title": topic.title,
                        "description": topic.description,
                        "order": topic.order,
                        "updated_at": topic.updated_at.isoformat() if topic.updated_at else "",
                        "materials": TopicMaterialSerializer(topic.materials.all(), many=True).data,
                    }
                )
            sections.append(
                {
                    "id": section.id,
                    "title": section.title,
                    "order": section.order,
                    "topics": topics,
                }
            )
        data = course_card(course)
        data["sections"] = sections
        data["student_access"] = [
            person_payload(row.student, request)
            for row in Enrollment.objects.filter(
                course=course, status=Enrollment.Status.ACTIVE, student__is_archived=False
            )
            .select_related("student")
            .order_by("student__last_name", "student__first_name")
        ]
        data["teacher_access"] = [
            person_payload(row.teacher, request)
            for row in CourseTeacher.objects.filter(course=course, teacher__is_archived=False).select_related(
                "teacher"
            )
        ]
        taken_students = {item["id"] for item in data["student_access"]}
        taken_teachers = {item["id"] for item in data["teacher_access"]}
        data["available_students"] = [
            person_payload(user, request)
            for user in User.objects.filter(
                role=User.Role.STUDENT, is_active=True, is_archived=False
            ).order_by("last_name", "first_name", "username")
            if user.id not in taken_students
        ]
        data["available_teachers"] = [
            person_payload(user, request)
            for user in User.objects.filter(
                role=User.Role.TEACHER, is_active=True, is_archived=False
            ).order_by("last_name", "first_name", "username")
            if user.id not in taken_teachers
        ]
        return Response(data)

    def patch(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if not course:
            return Response({"detail": "Курс не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        fields = []
        for key in ("title", "subtitle", "age_range", "description"):
            if key in request.data:
                setattr(course, key, str(request.data.get(key) or "").strip())
                fields.append(key)
        if "is_published" in request.data:
            course.is_published = bool(request.data.get("is_published"))
            fields.append("is_published")
        if fields:
            course.save(update_fields=fields)
            bump_course(course.id)
        return Response(course_card(course))


def ensure_enrollment_progress(enrollment):
    topics = list(
        CourseTopic.objects.filter(section__course=enrollment.course).order_by(
            "section__order", "order", "id"
        )
    )
    for index, topic in enumerate(topics):
        defaults = {
            "status": TopicProgress.Status.IN_PROGRESS
            if index == 0
            else TopicProgress.Status.NOT_STARTED
        }
        TopicProgress.objects.get_or_create(
            enrollment=enrollment,
            topic=topic,
            defaults=defaults,
        )


class OfficeCourseAccessView(APIView):
    permission_classes = [IsOfficeStaff]

    def post(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if not course:
            return Response({"detail": "Курс не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        role = (request.data.get("role") or "").strip()
        if role == "student":
            student = User.objects.filter(
                pk=request.data.get("user_id"),
                role=User.Role.STUDENT,
                is_active=True,
                is_archived=False,
            ).first()
            if not student:
                return Response({"detail": "Оберіть учня"}, status=status.HTTP_400_BAD_REQUEST)
            enrollment, created = Enrollment.objects.get_or_create(
                student=student,
                course=course,
                defaults={"status": Enrollment.Status.ACTIVE},
            )
            if not created and enrollment.status != Enrollment.Status.ACTIVE:
                enrollment.status = Enrollment.Status.ACTIVE
                enrollment.save(update_fields=["status"])
            ensure_enrollment_progress(enrollment)
            bump_students([student.id])
            return Response(person_payload(student, request), status=status.HTTP_201_CREATED)
        if role == "teacher":
            teacher = User.objects.filter(
                pk=request.data.get("user_id"),
                role=User.Role.TEACHER,
                is_active=True,
                is_archived=False,
            ).first()
            if not teacher:
                return Response({"detail": "Оберіть викладача"}, status=status.HTTP_400_BAD_REQUEST)
            CourseTeacher.objects.get_or_create(course=course, teacher=teacher)
            return Response(person_payload(teacher, request), status=status.HTTP_201_CREATED)
        return Response({"detail": "Вкажіть учня або викладача"}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, user_id):
        course = Course.objects.filter(pk=pk).first()
        if not course:
            return Response({"detail": "Курс не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        role = (request.query_params.get("role") or "").strip()
        if role == "teacher":
            deleted, _ = CourseTeacher.objects.filter(course=course, teacher_id=user_id).delete()
            if not deleted:
                return Response({"detail": "Доступ не знайдено"}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        enrollment = Enrollment.objects.filter(course=course, student_id=user_id).first()
        if not enrollment:
            return Response({"detail": "Доступ не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        enrollment.status = Enrollment.Status.CANCELLED
        enrollment.save(update_fields=["status"])
        bump_students([user_id])
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfficeSectionView(APIView):
    permission_classes = [IsOfficeStaff]

    def post(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if not course:
            return Response({"detail": "Курс не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        title = (request.data.get("title") or "").strip() or "Новий розділ"
        order = course.sections.count()
        section = CourseSection.objects.create(course=course, title=title, order=order)
        bump_course(course.id)
        return Response({"id": section.id, "title": section.title, "order": section.order, "topics": []})

    def patch(self, request, section_id):
        section = CourseSection.objects.filter(pk=section_id).select_related("course").first()
        if not section:
            return Response({"detail": "Розділ не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if "title" in request.data:
            title = (request.data.get("title") or "").strip()
            if title:
                section.title = title
        if "order" in request.data:
            try:
                section.order = int(request.data.get("order"))
            except (TypeError, ValueError):
                return Response({"detail": "Невірний порядок"}, status=status.HTTP_400_BAD_REQUEST)
        section.save()
        bump_course(section.course_id)
        return Response({"id": section.id, "title": section.title, "order": section.order})

    def delete(self, request, section_id):
        section = CourseSection.objects.filter(pk=section_id).select_related("course").first()
        if not section:
            return Response({"detail": "Розділ не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        course_id = section.course_id
        section.delete()
        bump_course(course_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfficeTopicView(APIView):
    permission_classes = [IsOfficeStaff]

    def post(self, request, section_id):
        section = CourseSection.objects.filter(pk=section_id).first()
        if not section:
            return Response({"detail": "Розділ не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        title = (request.data.get("title") or "").strip() or "Нова тема"
        topic = CourseTopic.objects.create(
            section=section,
            title=title,
            description=(request.data.get("description") or "").strip(),
            order=section.topics.count(),
        )
        bump_course(section.course_id)
        return Response(
            {
                "id": topic.id,
                "title": topic.title,
                "description": topic.description,
                "order": topic.order,
                "materials": [],
            },
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, topic_id):
        topic = CourseTopic.objects.filter(pk=topic_id).select_related("section").first()
        if not topic:
            return Response({"detail": "Тему не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if "title" in request.data:
            title = (request.data.get("title") or "").strip()
            if title:
                topic.title = title
        if "description" in request.data:
            topic.description = (request.data.get("description") or "").strip()
        if "order" in request.data:
            try:
                topic.order = int(request.data.get("order"))
            except (TypeError, ValueError):
                return Response({"detail": "Невірний порядок"}, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get("section_id"):
            section = CourseSection.objects.filter(
                pk=request.data.get("section_id"), course_id=topic.section.course_id
            ).first()
            if section:
                topic.section = section
        topic.save()
        bump_course(topic.section.course_id)
        return Response(
            {
                "id": topic.id,
                "title": topic.title,
                "description": topic.description,
                "order": topic.order,
                "section_id": topic.section_id,
            }
        )

    def delete(self, request, topic_id):
        topic = CourseTopic.objects.filter(pk=topic_id).select_related("section").first()
        if not topic:
            return Response({"detail": "Тему не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        course_id = topic.section.course_id
        topic.delete()
        bump_course(course_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfficeMaterialView(APIView):
    permission_classes = [IsOfficeStaff]

    def post(self, request, topic_id):
        topic = CourseTopic.objects.filter(pk=topic_id).select_related("section").first()
        if not topic:
            return Response({"detail": "Тему не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        title = (request.data.get("title") or "").strip()
        if not title:
            return Response({"detail": "Вкажіть назву матеріалу"}, status=status.HTTP_400_BAD_REQUEST)
        material_type = request.data.get("type") or TopicMaterial.MaterialType.LINK
        allowed = {choice for choice, _ in TopicMaterial.MaterialType.choices}
        if material_type not in allowed:
            return Response({"detail": "Невірний тип файлу"}, status=status.HTTP_400_BAD_REQUEST)
        material = TopicMaterial.objects.create(
            topic=topic,
            title=title,
            material_type=material_type,
            url=(request.data.get("url") or "#").strip() or "#",
            meta=(request.data.get("meta") or "").strip(),
            order=topic.materials.count(),
        )
        touch_topic(topic)
        bump_course(topic.section.course_id)
        return Response(TopicMaterialSerializer(material).data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        material = TopicMaterial.objects.filter(pk=pk).select_related("topic__section").first()
        if not material:
            return Response({"detail": "Матеріал не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if request.data.get("title"):
            material.title = request.data.get("title").strip()
        if "url" in request.data:
            material.url = (request.data.get("url") or "#").strip() or "#"
        if request.data.get("type"):
            material.material_type = request.data.get("type")
        if "meta" in request.data:
            material.meta = (request.data.get("meta") or "").strip()
        if "order" in request.data:
            try:
                material.order = int(request.data.get("order"))
            except (TypeError, ValueError):
                return Response({"detail": "Невірний порядок"}, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get("topic_id"):
            topic = CourseTopic.objects.filter(pk=request.data.get("topic_id")).select_related("section").first()
            if topic and topic.section.course_id == material.topic.section.course_id:
                material.topic = topic
        material.save()
        touch_topic(material.topic)
        bump_course(material.topic.section.course_id)
        return Response(TopicMaterialSerializer(material).data)

    def delete(self, request, pk):
        material = TopicMaterial.objects.filter(pk=pk).select_related("topic__section").first()
        if not material:
            return Response({"detail": "Матеріал не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        topic = material.topic
        course_id = topic.section.course_id
        material.delete()
        touch_topic(topic)
        bump_course(course_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


def apply_order(queryset, ids, field="pk"):
    id_list = [int(item) for item in ids or [] if str(item).isdigit() or isinstance(item, int)]
    remaining = list(queryset)
    by_id = {getattr(item, field): item for item in remaining}
    ordered = []
    for item_id in id_list:
        row = by_id.pop(item_id, None)
        if row:
            ordered.append(row)
    ordered.extend(by_id.values())
    for index, row in enumerate(ordered):
        if row.order != index:
            row.order = index
            row.save(update_fields=["order"])


class OfficeReorderView(APIView):
    permission_classes = [IsOfficeStaff]

    def patch(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if not course:
            return Response({"detail": "Курс не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        section_ids = request.data.get("sections")
        if section_ids is not None:
            apply_order(list(course.sections.all()), section_ids)
        topics_map = request.data.get("topics") or {}
        for section_id, topic_ids in topics_map.items():
            section = CourseSection.objects.filter(pk=section_id, course=course).first()
            if section:
                apply_order(list(section.topics.all()), topic_ids)
        materials_map = request.data.get("materials") or {}
        for topic_id, material_ids in materials_map.items():
            topic = CourseTopic.objects.filter(pk=topic_id, section__course=course).first()
            if topic:
                apply_order(list(topic.materials.all()), material_ids)
        bump_course(course.id)
        return Response({"ok": True})


class OfficeMaterialDuplicateView(APIView):
    permission_classes = [IsOfficeStaff]

    def post(self, request, pk):
        material = TopicMaterial.objects.filter(pk=pk).select_related("topic__section").first()
        if not material:
            return Response({"detail": "Матеріал не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        clone = TopicMaterial.objects.create(
            topic=material.topic,
            title=f"{material.title} (копія)",
            material_type=material.material_type,
            url=material.url,
            meta=material.meta,
            order=material.topic.materials.count(),
        )
        touch_topic(material.topic)
        bump_course(material.topic.section.course_id)
        return Response(TopicMaterialSerializer(clone).data, status=status.HTTP_201_CREATED)


class OfficeMaterialsBulkView(APIView):
    permission_classes = [IsOfficeStaff]

    def post(self, request):
        ids = request.data.get("ids") or []
        action = (request.data.get("action") or "").strip()
        rows = list(TopicMaterial.objects.filter(pk__in=ids).select_related("topic__section"))
        if not rows:
            return Response({"detail": "Нічого не вибрано"}, status=status.HTTP_400_BAD_REQUEST)
        course_ids = {row.topic.section.course_id for row in rows}
        topic_ids = {row.topic_id for row in rows}
        if action == "delete":
            TopicMaterial.objects.filter(pk__in=[row.id for row in rows]).delete()
        elif action == "type":
            next_type = request.data.get("type")
            allowed = {choice for choice, _ in TopicMaterial.MaterialType.choices}
            if next_type not in allowed:
                return Response({"detail": "Невірний тип"}, status=status.HTTP_400_BAD_REQUEST)
            TopicMaterial.objects.filter(pk__in=[row.id for row in rows]).update(material_type=next_type)
        elif action == "move":
            topic = CourseTopic.objects.filter(pk=request.data.get("topic_id")).select_related("section").first()
            if not topic:
                return Response({"detail": "Оберіть тему"}, status=status.HTTP_400_BAD_REQUEST)
            if topic.section.course_id not in course_ids:
                return Response({"detail": "Невірна тема"}, status=status.HTTP_400_BAD_REQUEST)
            start = topic.materials.count()
            for index, row in enumerate(rows):
                row.topic = topic
                row.order = start + index
                row.save(update_fields=["topic", "order"])
            topic_ids.add(topic.id)
        else:
            return Response({"detail": "Невірна дія"}, status=status.HTTP_400_BAD_REQUEST)
        CourseTopic.objects.filter(pk__in=topic_ids).update(updated_at=timezone.now())
        for course_id in course_ids:
            bump_course(course_id)
        return Response({"ok": True, "count": len(rows)})


class OfficePeopleView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request):
        role = (request.query_params.get("role") or "").strip()
        archived = str(request.query_params.get("archived") or "").lower() in {"1", "true", "yes"}
        qs = User.objects.exclude(role=User.Role.ADMIN).order_by("role", "last_name", "first_name")
        if not is_office_admin(request.user):
            qs = qs.exclude(role=User.Role.MANAGER)
        if archived:
            qs = qs.filter(is_archived=True, role__in={User.Role.STUDENT, User.Role.TEACHER})
        else:
            qs = qs.filter(is_archived=False)
            if role in {User.Role.STUDENT, User.Role.TEACHER, User.Role.MANAGER}:
                if role == User.Role.MANAGER and not is_office_admin(request.user):
                    return Response({"detail": "Немає доступу"}, status=status.HTTP_403_FORBIDDEN)
                qs = qs.filter(role=role)
        return Response([person_payload(user, request) for user in qs])

    def post(self, request):
        role = (request.data.get("role") or "").strip()
        allowed = {User.Role.STUDENT, User.Role.TEACHER}
        if is_office_admin(request.user):
            allowed.add(User.Role.MANAGER)
        if role not in allowed:
            return Response({"detail": "Не можна створити цей тип акаунта"}, status=status.HTTP_403_FORBIDDEN)
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        if not username or not password:
            return Response(
                {"detail": "Вкажіть логін і пароль"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username__iexact=username).exists():
            return Response({"detail": "Цей логін уже зайнятий"}, status=status.HTTP_400_BAD_REQUEST)
        email = (request.data.get("email") or "").strip()
        if email and User.objects.filter(email__iexact=email).exclude(email="").exists():
            return Response({"detail": "Цей email уже використовується"}, status=status.HTTP_400_BAD_REQUEST)
        user = User(
            username=username,
            email=email,
            first_name=(request.data.get("first_name") or "").strip(),
            last_name=(request.data.get("last_name") or "").strip(),
            phone=(request.data.get("phone") or "").strip(),
            role=role,
            is_staff=role == User.Role.MANAGER,
            is_superuser=False,
        )
        user.set_password(password)
        user.office_password = password
        user.save()
        return Response(person_payload(user, request), status=status.HTTP_201_CREATED)


def person_detail(user, request=None):
    data = person_payload(user, request)
    data["date_joined"] = user.date_joined.isoformat() if user.date_joined else ""
    data["password"] = user.office_password or ""
    if user.role == User.Role.STUDENT:
        rows = (
            Enrollment.objects.filter(student=user, status=Enrollment.Status.ACTIVE)
            .select_related("course", "teacher")
            .order_by("course__title")
        )
        data["courses"] = [
            {
                "id": row.course_id,
                "title": row.course.title,
                "teacher_name": display_name(row.teacher) if row.teacher_id else "",
            }
            for row in rows
        ]
    elif user.role == User.Role.TEACHER:
        rows = CourseTeacher.objects.filter(teacher=user).select_related("course").order_by("course__title")
        data["courses"] = [{"id": row.course_id, "title": row.course.title} for row in rows]
    else:
        data["courses"] = []
    return data


class OfficePersonDetailView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if not user or user.role == User.Role.ADMIN:
            return Response({"detail": "Користувача не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if user.role == User.Role.MANAGER and not is_office_admin(request.user):
            return Response({"detail": "Немає доступу"}, status=status.HTTP_403_FORBIDDEN)
        return Response(person_detail(user, request))

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if not user or user.role == User.Role.ADMIN:
            return Response({"detail": "Користувача не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if user.role == User.Role.MANAGER and not is_office_admin(request.user):
            return Response({"detail": "Немає доступу"}, status=status.HTTP_403_FORBIDDEN)
        for key in ("first_name", "last_name", "email", "phone"):
            if key in request.data:
                setattr(user, key, str(request.data.get(key) or "").strip())
        if "is_archived" in request.data:
            if user.role not in {User.Role.STUDENT, User.Role.TEACHER}:
                return Response(
                    {"detail": "В архів можна перемістити лише студентів і викладачів"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.is_archived = bool(request.data.get("is_archived"))
            user.is_active = not user.is_archived
        elif "is_active" in request.data:
            user.is_active = bool(request.data.get("is_active"))
        password = request.data.get("password")
        if password:
            user.set_password(password)
            user.office_password = password
        user.save()
        return Response(person_detail(user, request))


class OfficeScheduleView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request):
        slots = (
            ScheduleSlot.objects.filter(
                enrollment__status=Enrollment.Status.ACTIVE,
                enrollment__student__is_archived=False,
            )
            .select_related("enrollment__course", "enrollment__student", "enrollment__teacher")
            .order_by("weekday", "start_time")
        )
        exceptions = ScheduleException.objects.filter(slot__in=slots)
        return Response(
            {
                "slots": [serialize_office_slot(slot, request) for slot in slots],
                "exceptions": ScheduleExceptionSerializer(exceptions, many=True).data,
            }
        )

    def post(self, request):
        student = User.objects.filter(
            pk=request.data.get("student_id"),
            role=User.Role.STUDENT,
            is_archived=False,
            is_active=True,
        ).first()
        course = Course.objects.filter(pk=request.data.get("course_id")).first()
        if not student or not course:
            return Response({"detail": "Оберіть студента і курс"}, status=status.HTTP_400_BAD_REQUEST)
        enrollment = Enrollment.objects.filter(
            student=student, course=course, status=Enrollment.Status.ACTIVE
        ).first()
        if not enrollment:
            return Response(
                {"detail": "Спочатку відкрийте цей курс учню"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        teacher = None
        teacher_id = request.data.get("teacher_id")
        if teacher_id:
            teacher = User.objects.filter(
                pk=teacher_id, role=User.Role.TEACHER, is_archived=False, is_active=True
            ).first()
            if not teacher:
                return Response({"detail": "Викладача не знайдено"}, status=status.HTTP_400_BAD_REQUEST)
            if not CourseTeacher.objects.filter(course=course, teacher=teacher).exists():
                return Response(
                    {"detail": "Спочатку відкрийте цей курс викладачу"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        try:
            weekday = int(request.data.get("weekday"))
            start_time = parse_time(request.data.get("start_time"), "start_time")
            end_time = parse_time(request.data.get("end_time"), "end_time")
        except (TypeError, ValueError):
            return Response({"detail": "Вкажіть день і час заняття"}, status=status.HTTP_400_BAD_REQUEST)
        if weekday not in range(7):
            return Response({"detail": "Невірний день тижня"}, status=status.HTTP_400_BAD_REQUEST)
        if end_time <= start_time:
            return Response({"detail": "Час завершення має бути пізніше початку"}, status=status.HTTP_400_BAD_REQUEST)
        if teacher and enrollment.teacher_id != teacher.id:
            enrollment.teacher = teacher
            enrollment.save(update_fields=["teacher"])
        mode = request.data.get("mode") or ScheduleSlot.Mode.ONLINE
        if mode not in {choice for choice, _ in ScheduleSlot.Mode.choices}:
            mode = ScheduleSlot.Mode.ONLINE
        try:
            slot = ScheduleSlot.objects.create(
                enrollment=enrollment,
                weekday=weekday,
                start_time=start_time,
                end_time=end_time,
                mode=mode,
                place=(request.data.get("place") or "").strip(),
            )
        except IntegrityError:
            return Response(
                {"detail": "Такий слот уже є в розкладі цього студента"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bump_students([student.id])
        return Response(serialize_office_slot(slot, request), status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        slot = ScheduleSlot.objects.filter(pk=pk).select_related("enrollment").first()
        if not slot:
            return Response({"detail": "Слот не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        student_id = slot.enrollment.student_id
        slot.delete()
        bump_students([student_id])
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfficeTransactionsView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request):
        rows = Transaction.objects.select_related("student", "course", "created_by")
        return Response([transaction_payload(row) for row in rows])

    def post(self, request):
        if not is_office_admin(request.user):
            return Response({"detail": "Немає доступу"}, status=status.HTTP_403_FORBIDDEN)
        student = User.objects.filter(
            pk=request.data.get("student_id"),
            role=User.Role.STUDENT,
            is_archived=False,
        ).first()
        if not student:
            return Response({"detail": "Оберіть студента"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount = int(request.data.get("amount"))
        except (TypeError, ValueError):
            return Response({"detail": "Вкажіть суму"}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({"detail": "Сума має бути більшою за нуль"}, status=status.HTTP_400_BAD_REQUEST)
        course = None
        if request.data.get("course_id"):
            course = Course.objects.filter(pk=request.data.get("course_id")).first()
        next_status = request.data.get("status") or Transaction.Status.PAID
        allowed = {choice for choice, _ in Transaction.Status.choices}
        if next_status not in allowed:
            next_status = Transaction.Status.PAID
        row = Transaction.objects.create(
            student=student,
            course=course,
            amount=amount,
            status=next_status,
            note=(request.data.get("note") or "").strip(),
            created_by=request.user,
        )
        return Response(transaction_payload(row), status=status.HTTP_201_CREATED)


class OfficeTransactionDetailView(APIView):
    permission_classes = [IsOfficeAdmin]

    def patch(self, request, pk):
        row = Transaction.objects.filter(pk=pk).select_related("student", "course", "created_by").first()
        if not row:
            return Response({"detail": "Транзакцію не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if "amount" in request.data:
            try:
                amount = int(request.data.get("amount"))
            except (TypeError, ValueError):
                return Response({"detail": "Невірна сума"}, status=status.HTTP_400_BAD_REQUEST)
            if amount <= 0:
                return Response({"detail": "Сума має бути більшою за нуль"}, status=status.HTTP_400_BAD_REQUEST)
            row.amount = amount
        if "status" in request.data:
            next_status = request.data.get("status")
            allowed = {choice for choice, _ in Transaction.Status.choices}
            if next_status not in allowed:
                return Response({"detail": "Невірний статус"}, status=status.HTTP_400_BAD_REQUEST)
            row.status = next_status
        if "note" in request.data:
            row.note = (request.data.get("note") or "").strip()
        if "course_id" in request.data:
            course_id = request.data.get("course_id")
            row.course = Course.objects.filter(pk=course_id).first() if course_id else None
        row.save()
        return Response(transaction_payload(row))

    def delete(self, request, pk):
        row = Transaction.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Транзакцію не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        row.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
