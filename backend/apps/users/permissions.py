"""Role helpers for ModelAdmin classes."""


class StaffCMSMixin:
    """Admin and manager can see the module; students cannot."""

    def has_module_permission(self, request):
        user = request.user
        return user.is_authenticated and (user.is_admin_role or user.is_manager_role)

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)


class ManagerReadOnlyAdminMixin:
    """Managers may view catalog content but not change it."""

    def has_add_permission(self, request):
        return request.user.is_authenticated and request.user.is_admin_role

    def has_change_permission(self, request, obj=None):
        return request.user.is_authenticated and request.user.is_admin_role

    def has_delete_permission(self, request, obj=None):
        return request.user.is_authenticated and request.user.is_admin_role


class ManagerCRMMixin:
    """Admin and manager full access for CRM/learning."""

    def has_module_permission(self, request):
        user = request.user
        return user.is_authenticated and (user.is_admin_role or user.is_manager_role)

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_add_permission(self, request):
        return self.has_module_permission(request)

    def has_change_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_delete_permission(self, request, obj=None):
        return request.user.is_authenticated and (
            request.user.is_admin_role or request.user.is_manager_role
        )
