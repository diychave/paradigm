from django.contrib import admin

from apps.users.permissions import ManagerReadOnlyAdminMixin, StaffCMSMixin

from .models import Course, CourseFit, CoursePlanLevel, FaqItem, PricingPlan, SiteContent, SocialLink, VideoItem


class CourseFitInline(admin.TabularInline):
    model = CourseFit
    extra = 0


class CoursePlanLevelInline(admin.TabularInline):
    model = CoursePlanLevel
    extra = 0


@admin.register(Course)
class CourseAdmin(ManagerReadOnlyAdminMixin, StaffCMSMixin, admin.ModelAdmin):
    list_display = ("id", "title", "age_range", "is_published", "order")
    list_filter = ("is_published",)
    search_fields = ("id", "title", "subtitle")
    inlines = [CourseFitInline, CoursePlanLevelInline]
    prepopulated_fields = {}


@admin.register(PricingPlan)
class PricingPlanAdmin(ManagerReadOnlyAdminMixin, StaffCMSMixin, admin.ModelAdmin):
    list_display = ("id", "tag", "lessons_count", "price_per_lesson", "hidden", "order")
    list_filter = ("hidden",)


@admin.register(FaqItem)
class FaqItemAdmin(ManagerReadOnlyAdminMixin, StaffCMSMixin, admin.ModelAdmin):
    list_display = ("title", "order", "is_published")
    list_filter = ("is_published",)


@admin.register(SocialLink)
class SocialLinkAdmin(ManagerReadOnlyAdminMixin, StaffCMSMixin, admin.ModelAdmin):
    list_display = ("id", "url", "order")


@admin.register(VideoItem)
class VideoItemAdmin(ManagerReadOnlyAdminMixin, StaffCMSMixin, admin.ModelAdmin):
    list_display = ("id", "video", "order", "is_published")
    list_filter = ("is_published",)


@admin.register(SiteContent)
class SiteContentAdmin(ManagerReadOnlyAdminMixin, StaffCMSMixin, admin.ModelAdmin):
    list_display = ("hero_title", "footer_phone")
