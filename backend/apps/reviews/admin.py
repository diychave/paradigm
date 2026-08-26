from django.contrib import admin

from apps.users.permissions import ManagerReadOnlyAdminMixin, StaffCMSMixin

from .models import TextReview


@admin.register(TextReview)
class TextReviewAdmin(ManagerReadOnlyAdminMixin, StaffCMSMixin, admin.ModelAdmin):
    list_display = ("name", "age", "course", "is_published", "created_at")
    list_filter = ("course", "is_published")
    search_fields = ("name", "review")
