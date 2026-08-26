from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.catalog.models import Course


class Enrollment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Активний"
        PAUSED = "paused", "Пауза"
        COMPLETED = "completed", "Завершений"
        CANCELLED = "cancelled", "Скасований"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="enrollments",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "student"},
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="taught_enrollments",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "teacher"},
    )
    course = models.ForeignKey(
        Course,
        related_name="enrollments",
        on_delete=models.CASCADE,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    started_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]
        unique_together = ("student", "course")
        verbose_name = "Запис на курс"
        verbose_name_plural = "Записи на курси"

    def __str__(self):
        return f"{self.student} → {self.course_id}"


class CourseTeacher(models.Model):
    course = models.ForeignKey(Course, related_name="teacher_access", on_delete=models.CASCADE)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="course_access",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
    )
    granted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("course", "teacher")
        ordering = ["course_id", "teacher__last_name", "teacher__first_name"]
        verbose_name = "Доступ викладача до курсу"
        verbose_name_plural = "Доступ викладачів до курсів"

    def __str__(self):
        return f"{self.teacher} → {self.course_id}"


class LessonProgress(models.Model):
    """Legacy flat lessons — kept for backwards compatibility."""

    enrollment = models.ForeignKey(
        Enrollment,
        related_name="lessons",
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    is_done = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    materials = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Прогрес уроку"
        verbose_name_plural = "Прогрес уроків"

    def __str__(self):
        mark = "✓" if self.is_done else "○"
        return f"{mark} {self.title}"

    def mark_done(self):
        self.is_done = True
        self.completed_at = timezone.now()
        self.save(update_fields=["is_done", "completed_at"])


class CourseSection(models.Model):
    course = models.ForeignKey(Course, related_name="sections", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Розділ курсу"
        verbose_name_plural = "Розділи курсу"

    def __str__(self):
        return f"{self.course_id}: {self.title}"


class CourseTopic(models.Model):
    section = models.ForeignKey(CourseSection, related_name="topics", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=512, blank=True)
    order = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Тема"
        verbose_name_plural = "Теми"

    def __str__(self):
        return self.title


class TopicMaterial(models.Model):
    class MaterialType(models.TextChoices):
        PDF = "pdf", "PDF"
        DOC = "doc", "Документ"
        PPT = "ppt", "Презентація"
        ZIP = "zip", "ZIP"
        LINK = "link", "Посилання"
        VIDEO = "video", "Відео"

    topic = models.ForeignKey(CourseTopic, related_name="materials", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    material_type = models.CharField(max_length=16, choices=MaterialType.choices, default=MaterialType.PDF)
    meta = models.CharField(max_length=128, blank=True)
    url = models.CharField(max_length=512, blank=True, default="#")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Матеріал курсу"
        verbose_name_plural = "Матеріали курсу"


class StudentMaterial(models.Model):
    """Extra files a teacher gives to one student, not the whole course."""

    enrollment = models.ForeignKey(
        Enrollment,
        related_name="extra_materials",
        on_delete=models.CASCADE,
    )
    topic = models.ForeignKey(
        CourseTopic,
        related_name="student_materials",
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255)
    material_type = models.CharField(
        max_length=16,
        choices=TopicMaterial.MaterialType.choices,
        default=TopicMaterial.MaterialType.LINK,
    )
    meta = models.CharField(max_length=128, blank=True)
    url = models.CharField(max_length=512, blank=True, default="#")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Матеріал студента"
        verbose_name_plural = "Матеріали студентів"

    def __str__(self):
        return f"{self.title} → {self.enrollment_id}"


class TopicAssignment(models.Model):
    topic = models.ForeignKey(CourseTopic, related_name="assignments", on_delete=models.CASCADE)
    enrollment = models.ForeignKey(
        Enrollment,
        related_name="personal_assignments",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Якщо задано — домашка лише для цього студента.",
    )
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=512, blank=True)
    due_label = models.CharField(max_length=128, blank=True, default="До наступного заняття")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Домашнє завдання"
        verbose_name_plural = "Домашні завдання"


class TopicProgress(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Не розпочато"
        IN_PROGRESS = "in_progress", "В роботі"
        DONE = "done", "Пройдено"

    enrollment = models.ForeignKey(Enrollment, related_name="topic_progress", on_delete=models.CASCADE)
    topic = models.ForeignKey(CourseTopic, related_name="progress_rows", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)

    class Meta:
        unique_together = ("enrollment", "topic")


class AssignmentProgress(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Не розпочато"
        IN_PROGRESS = "in_progress", "В роботі"
        SUBMITTED = "submitted", "На перевірці"
        REVIEWED = "reviewed", "Перевірено"

    class HwStatus(models.TextChoices):
        DONE = "done", "Виконано"
        PARTIAL = "partial", "Частково"
        NOT_DONE = "not_done", "Не виконано"

    enrollment = models.ForeignKey(
        Enrollment, related_name="assignment_progress", on_delete=models.CASCADE
    )
    assignment = models.ForeignKey(TopicAssignment, related_name="progress_rows", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    hw_status = models.CharField(max_length=16, choices=HwStatus.choices, blank=True)
    grade = models.CharField(max_length=16, blank=True)

    class Meta:
        unique_together = ("enrollment", "assignment")


class ScheduleSlot(models.Model):
    class Weekday(models.IntegerChoices):
        MON = 0, "Понеділок"
        TUE = 1, "Вівторок"
        WED = 2, "Середа"
        THU = 3, "Четвер"
        FRI = 4, "П’ятниця"
        SAT = 5, "Субота"
        SUN = 6, "Неділя"

    class Mode(models.TextChoices):
        ONLINE = "online", "Онлайн"
        OFFLINE = "offline", "У школі"

    enrollment = models.ForeignKey(
        Enrollment,
        related_name="schedule_slots",
        on_delete=models.CASCADE,
    )
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    mode = models.CharField(max_length=16, choices=Mode.choices, default=Mode.ONLINE)
    place = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ["weekday", "start_time", "id"]
        unique_together = ("enrollment", "weekday", "start_time")
        verbose_name = "Слот розкладу"
        verbose_name_plural = "Розклад"

    def __str__(self):
        return f"{self.get_weekday_display()} {self.start_time} · {self.enrollment}"


class ScheduleException(models.Model):
    class Status(models.TextChoices):
        HELD = "held", "Проведено"
        CANCELLED = "cancelled", "Скасовано"
        COMPENSATED = "compensated", "Скасовано з компенсацією"

    slot = models.ForeignKey(
        ScheduleSlot,
        related_name="exceptions",
        on_delete=models.CASCADE,
    )
    date = models.DateField()
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.CANCELLED,
    )

    class Meta:
        ordering = ["-date", "id"]
        unique_together = ("slot", "date")
        verbose_name = "Виняток розкладу"
        verbose_name_plural = "Винятки розкладу"

    def __str__(self):
        return f"{self.date} · {self.get_status_display()}"


class LessonAttendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "present", "Присутній"
        LATE = "late", "Запізнився"
        ABSENT = "absent", "Відсутній"

    enrollment = models.ForeignKey(
        Enrollment,
        related_name="attendance",
        on_delete=models.CASCADE,
    )
    slot = models.ForeignKey(
        ScheduleSlot,
        related_name="attendance_rows",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    date = models.DateField()
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PRESENT,
    )

    class Meta:
        ordering = ["-date", "id"]
        unique_together = ("enrollment", "slot", "date")
        verbose_name = "Відвідуваність"
        verbose_name_plural = "Відвідуваність"

    def __str__(self):
        return f"{self.date} · {self.get_status_display()}"


class CabinetSync(models.Model):
    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="cabinet_sync",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "student"},
    )
    version = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Синхронізація кабінету"
        verbose_name_plural = "Синхронізація кабінетів"


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Очікує"
        PAID = "paid", "Оплачено"
        FAILED = "failed", "Помилка"
        REFUNDED = "refunded", "Повернено"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="transactions",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "student"},
    )
    course = models.ForeignKey(
        Course,
        related_name="transactions",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    amount = models.PositiveIntegerField(help_text="Сума в гривнях")
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="created_transactions",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Транзакція"
        verbose_name_plural = "Транзакції"

    def __str__(self):
        return f"{self.amount} грн · {self.student} · {self.get_status_display()}"
