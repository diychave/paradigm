from django.contrib import admin

from apps.users.permissions import ManagerCRMMixin

from .models import Lead


@admin.register(Lead)
class LeadAdmin(ManagerCRMMixin, admin.ModelAdmin):
    list_display = ("name", "phone", "status", "assigned_to", "created_at")
    list_filter = ("status", "assigned_to")
    search_fields = ("name", "phone", "message")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("assigned_to", "converted_user")
