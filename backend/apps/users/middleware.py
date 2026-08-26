from django.http import HttpResponseForbidden, HttpResponseRedirect


class RoleRedirectMiddleware:
    """Keep Django admin for staff only. Students and teachers stay out."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        path = request.path

        if not user or not user.is_authenticated:
            return self.get_response(request)
        if not path.startswith("/admin/") or path.startswith("/admin/logout"):
            return self.get_response(request)

        staff = getattr(user, "is_admin_role", False) or getattr(user, "is_manager_role", False)
        if staff and user.is_staff:
            return self.get_response(request)

        if path.startswith("/admin/login"):
            return HttpResponseRedirect("/")
        return HttpResponseForbidden("Немає доступу")
