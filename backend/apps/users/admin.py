from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "role", "phone", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Роль", {"fields": ("role", "phone", "avatar")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Роль", {"fields": ("role", "phone")}),
    )
    search_fields = ("username", "first_name", "last_name", "email", "phone")
    ordering = ("username",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_admin_role:
            return qs
        if request.user.is_manager_role:
            return qs.filter(role=User.Role.STUDENT)
        return qs.none()

    def has_module_permission(self, request):
        return request.user.is_authenticated and (
            request.user.is_admin_role or request.user.is_manager_role
        )

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_add_permission(self, request):
        return request.user.is_authenticated and (
            request.user.is_admin_role or request.user.is_manager_role
        )

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        if request.user.is_admin_role:
            return True
        if request.user.is_manager_role:
            return obj is None or obj.role == User.Role.STUDENT
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_authenticated and request.user.is_admin_role

    def save_model(self, request, obj, form, change):
        if request.user.is_manager_role and not request.user.is_admin_role:
            obj.role = User.Role.STUDENT
            obj.is_staff = False
            obj.is_superuser = False
        super().save_model(request, obj, form, change)
