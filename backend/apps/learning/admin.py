from django.contrib import admin

from apps.users.permissions import ManagerCRMMixin, ManagerReadOnlyAdminMixin, StaffCMSMixin

from .models import (
    AssignmentProgress,
    CourseSection,
    CourseTeacher,
    CourseTopic,
    Enrollment,
    LessonAttendance,
    LessonProgress,
    ScheduleException,
    ScheduleSlot,
    StudentMaterial,
    TopicAssignment,
    TopicMaterial,
    TopicProgress,
    Transaction,
)


class LessonProgressInline(admin.TabularInline):
    model = LessonProgress
    extra = 0


class TopicProgressInline(admin.TabularInline):
    model = TopicProgress
    extra = 0
    autocomplete_fields = ("topic",)


class StudentMaterialInline(admin.TabularInline):
    model = StudentMaterial
    extra = 0
    autocomplete_fields = ("topic",)


class PersonalAssignmentInline(admin.TabularInline):
    model = TopicAssignment
    extra = 0
    autocomplete_fields = ("topic",)
    fk_name = "enrollment"


class AssignmentProgressInline(admin.TabularInline):
    model = AssignmentProgress
    extra = 0
    autocomplete_fields = ("assignment",)


class ScheduleSlotInline(admin.TabularInline):
    model = ScheduleSlot
    extra = 0


@admin.register(Enrollment)
class EnrollmentAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("student", "teacher", "course", "status", "started_at")
    list_filter = ("status", "course")
    search_fields = ("student__username", "student__email", "course__title")
    autocomplete_fields = ("student", "teacher", "course")
    inlines = [
        ScheduleSlotInline,
        LessonProgressInline,
        TopicProgressInline,
        PersonalAssignmentInline,
        StudentMaterialInline,
        AssignmentProgressInline,
    ]


@admin.register(CourseTeacher)
class CourseTeacherAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("teacher", "course", "granted_at")
    list_filter = ("course",)
    search_fields = ("teacher__username", "teacher__last_name", "course__title")
    autocomplete_fields = ("teacher", "course")


@admin.register(LessonProgress)
class LessonProgressAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("title", "enrollment", "order", "is_done", "completed_at")
    list_filter = ("is_done", "enrollment__course")
    search_fields = ("title", "enrollment__student__username")


class TopicMaterialInline(admin.TabularInline):
    model = TopicMaterial
    extra = 1


class CourseTopicInline(admin.TabularInline):
    model = CourseTopic
    extra = 1
    show_change_link = True


@admin.register(CourseSection)
class CourseSectionAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    search_fields = ("title", "course__title")
    autocomplete_fields = ("course",)
    inlines = [CourseTopicInline]


@admin.register(CourseTopic)
class CourseTopicAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("title", "section", "order")
    list_filter = ("section__course",)
    search_fields = ("title",)
    autocomplete_fields = ("section",)
    inlines = [TopicMaterialInline]


@admin.register(TopicMaterial)
class TopicMaterialAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("title", "material_type", "topic", "order")
    list_filter = ("material_type",)


@admin.register(TopicAssignment)
class TopicAssignmentAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("title", "topic", "enrollment", "order")
    search_fields = ("title", "enrollment__student__username")
    autocomplete_fields = ("topic", "enrollment")


@admin.register(StudentMaterial)
class StudentMaterialAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("title", "topic", "enrollment", "material_type")
    search_fields = ("title", "enrollment__student__username")
    autocomplete_fields = ("topic", "enrollment")


@admin.register(TopicProgress)
class TopicProgressAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("topic", "enrollment", "status")
    list_filter = ("status",)


@admin.register(AssignmentProgress)
class AssignmentProgressAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("assignment", "enrollment", "status", "hw_status", "grade")
    list_filter = ("status", "hw_status")


class ScheduleExceptionInline(admin.TabularInline):
    model = ScheduleException
    extra = 0


@admin.register(ScheduleSlot)
class ScheduleSlotAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("enrollment", "weekday", "start_time", "end_time", "mode", "place")
    list_filter = ("weekday", "mode", "enrollment__course")
    search_fields = ("enrollment__student__username", "enrollment__course__title")
    autocomplete_fields = ("enrollment",)
    inlines = [ScheduleExceptionInline]


@admin.register(ScheduleException)
class ScheduleExceptionAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("date", "slot", "status")
    list_filter = ("status", "date")
    autocomplete_fields = ("slot",)


@admin.register(LessonAttendance)
class LessonAttendanceAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("date", "enrollment", "status")
    list_filter = ("status", "date")
    autocomplete_fields = ("enrollment", "slot")


@admin.register(Transaction)
class TransactionAdmin(ManagerReadOnlyAdminMixin, StaffCMSMixin, admin.ModelAdmin):
    list_display = ("created_at", "student", "course", "amount", "status")
    list_filter = ("status", "course")
    search_fields = ("student__username", "student__last_name", "note")
    autocomplete_fields = ("student", "course", "created_by")
    readonly_fields = ("created_at",)
