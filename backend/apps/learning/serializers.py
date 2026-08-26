from rest_framework import serializers

from .models import (
    AssignmentProgress,
    CourseSection,
    CourseTopic,
    Enrollment,
    LessonProgress,
    ScheduleException,
    ScheduleSlot,
    StudentMaterial,
    TopicAssignment,
    TopicMaterial,
    TopicProgress,
)


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ("id", "title", "order", "is_done", "completed_at", "materials")


class TopicMaterialSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="material_type")

    class Meta:
        model = TopicMaterial
        fields = ("id", "title", "type", "meta", "url", "order")


class StudentMaterialSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="material_type")
    from_teacher = serializers.SerializerMethodField()

    class Meta:
        model = StudentMaterial
        fields = ("id", "title", "type", "meta", "url", "order", "from_teacher")

    def get_from_teacher(self, obj):
        return True


class TopicAssignmentSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    hw_status = serializers.SerializerMethodField()

    class Meta:
        model = TopicAssignment
        fields = (
            "id",
            "title",
            "description",
            "due_label",
            "order",
            "status",
            "status_label",
            "hw_status",
            "grade",
        )

    def _progress(self, obj):
        map_ = self.context.get("assignment_progress") or {}
        return map_.get(obj.id)

    def get_status(self, obj):
        row = self._progress(obj)
        if row and getattr(row, "hw_status", ""):
            return row.hw_status
        return row.status if row else AssignmentProgress.Status.NOT_STARTED

    def get_hw_status(self, obj):
        row = self._progress(obj)
        return (row.hw_status if row else "") or ""

    def get_grade(self, obj):
        row = self._progress(obj)
        return row.grade if row else ""

    def get_status_label(self, obj):
        status = self.get_status(obj)
        labels = {
            **dict(AssignmentProgress.Status.choices),
            **dict(AssignmentProgress.HwStatus.choices),
        }
        return labels.get(status, status)


class CourseTopicSerializer(serializers.ModelSerializer):
    materials = TopicMaterialSerializer(many=True, read_only=True)
    extra_materials = serializers.SerializerMethodField()
    assignments = serializers.SerializerMethodField()
    materials_count = serializers.SerializerMethodField()
    assignments_count = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    number = serializers.SerializerMethodField()

    class Meta:
        model = CourseTopic
        fields = (
            "id",
            "number",
            "title",
            "description",
            "order",
            "materials_count",
            "assignments_count",
            "status",
            "status_label",
            "materials",
            "extra_materials",
            "assignments",
        )

    def _enrollment(self):
        return self.context.get("enrollment")

    def _personal_assignments(self, obj):
        enrollment = self._enrollment()
        items = list(obj.assignments.all())
        if not enrollment:
            return []
        return [item for item in items if item.enrollment_id == enrollment.id]

    def _extra_materials(self, obj):
        enrollment = self._enrollment()
        items = list(obj.student_materials.all())
        if not enrollment:
            return []
        return [item for item in items if item.enrollment_id == enrollment.id]

    def get_number(self, obj):
        return f"{obj.order + 1:02d}"

    def get_extra_materials(self, obj):
        return StudentMaterialSerializer(self._extra_materials(obj), many=True).data

    def get_assignments(self, obj):
        return TopicAssignmentSerializer(
            self._personal_assignments(obj),
            many=True,
            context=self.context,
        ).data

    def get_materials_count(self, obj):
        return len(obj.materials.all()) + len(self._extra_materials(obj))

    def get_assignments_count(self, obj):
        return len(self._personal_assignments(obj))

    def _progress(self, obj):
        map_ = self.context.get("topic_progress") or {}
        return map_.get(obj.id)

    def get_status(self, obj):
        row = self._progress(obj)
        return row.status if row else TopicProgress.Status.NOT_STARTED

    def get_status_label(self, obj):
        status = self.get_status(obj)
        return dict(TopicProgress.Status.choices).get(status, status)


class CourseSectionSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField()
    topics_count = serializers.SerializerMethodField()

    class Meta:
        model = CourseSection
        fields = ("id", "title", "order", "topics_count", "topics")

    def get_topics(self, obj):
        topics = list(obj.topics.all())
        if self.context.get("hide_locked_topics"):
            progress = self.context.get("topic_progress") or {}
            opened = {TopicProgress.Status.IN_PROGRESS, TopicProgress.Status.DONE}
            topics = [
                topic
                for topic in topics
                if progress.get(topic.id) and progress[topic.id].status in opened
            ]
        return CourseTopicSerializer(topics, many=True, context=self.context).data

    def get_topics_count(self, obj):
        return len(self.get_topics(obj))


class EnrollmentSerializer(serializers.ModelSerializer):
    course_id = serializers.CharField(source="course.id")
    course_title = serializers.CharField(source="course.title")
    course_subtitle = serializers.CharField(source="course.subtitle")
    course_image = serializers.CharField(source="course.card_image")
    course_description = serializers.CharField(source="course.card_description")
    short_title = serializers.SerializerMethodField()
    age_range = serializers.CharField(source="course.age_range")
    lessons = LessonProgressSerializer(many=True, read_only=True)
    sections = serializers.SerializerMethodField()
    done_count = serializers.SerializerMethodField()
    total_count = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = (
            "id",
            "status",
            "started_at",
            "course_id",
            "course_title",
            "short_title",
            "course_subtitle",
            "course_image",
            "course_description",
            "age_range",
            "lessons",
            "sections",
            "done_count",
            "total_count",
            "progress_percent",
        )

    def get_short_title(self, obj):
        title = obj.course.title or ""
        for prefix in ("Курс ", "Course "):
            if title.startswith(prefix):
                return title[len(prefix) :].strip()
        return title.split()[-1] if title else obj.course_id

    def _topic_qs(self, obj):
        return CourseTopic.objects.filter(section__course_id=obj.course_id)

    def get_done_count(self, obj):
        if obj.course.sections.exists():
            return obj.topic_progress.filter(status=TopicProgress.Status.DONE).count()
        return sum(1 for lesson in obj.lessons.all() if lesson.is_done)

    def get_total_count(self, obj):
        if obj.course.sections.exists():
            return self._topic_qs(obj).count()
        return obj.lessons.count()

    def get_progress_percent(self, obj):
        total = self.get_total_count(obj)
        if not total:
            return 0
        return int(round(self.get_done_count(obj) / total * 100))

    def get_sections(self, obj):
        sections = (
            CourseSection.objects.filter(course_id=obj.course_id)
            .prefetch_related(
                "topics__materials",
                "topics__assignments",
                "topics__student_materials",
            )
        )
        topic_progress = {
            row.topic_id: row for row in obj.topic_progress.select_related("topic")
        }
        assignment_progress = {
            row.assignment_id: row
            for row in obj.assignment_progress.select_related("assignment")
        }
        data = CourseSectionSerializer(
            sections,
            many=True,
            context={
                "enrollment": obj,
                "topic_progress": topic_progress,
                "assignment_progress": assignment_progress,
                "hide_locked_topics": self.context.get("hide_locked_topics", False),
            },
        ).data
        if self.context.get("hide_locked_topics"):
            return [section for section in data if section.get("topics")]
        return data


class EnrollmentListSerializer(EnrollmentSerializer):
    class Meta(EnrollmentSerializer.Meta):
        fields = (
            "id",
            "status",
            "started_at",
            "course_id",
            "course_title",
            "short_title",
            "course_subtitle",
            "course_image",
            "course_description",
            "age_range",
            "done_count",
            "total_count",
            "progress_percent",
        )


class ScheduleSlotSerializer(serializers.ModelSerializer):
    weekday_label = serializers.CharField(source="get_weekday_display", read_only=True)
    mode_label = serializers.CharField(source="get_mode_display", read_only=True)
    start_time = serializers.TimeField(format="%H:%M")
    end_time = serializers.TimeField(format="%H:%M")
    course_id = serializers.CharField(source="enrollment.course.id")
    course_title = serializers.CharField(source="enrollment.course.title")
    short_title = serializers.SerializerMethodField()
    course_image = serializers.CharField(source="enrollment.course.card_image")

    class Meta:
        model = ScheduleSlot
        fields = (
            "id",
            "weekday",
            "weekday_label",
            "start_time",
            "end_time",
            "mode",
            "mode_label",
            "place",
            "course_id",
            "course_title",
            "short_title",
            "course_image",
        )

    def get_short_title(self, obj):
        title = obj.enrollment.course.title or ""
        for prefix in ("Курс ", "Course "):
            if title.startswith(prefix):
                return title[len(prefix) :].strip()
        return title.split()[-1] if title else obj.enrollment.course_id


class ScheduleExceptionSerializer(serializers.ModelSerializer):
    slot_id = serializers.IntegerField(source="slot.id")
    date = serializers.DateField(format="%Y-%m-%d")
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ScheduleException
        fields = ("id", "slot_id", "date", "status", "status_label")
