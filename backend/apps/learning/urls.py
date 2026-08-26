from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path
from django.views.decorators.http import require_POST

from .models import Enrollment, LessonProgress


def student_required(view):
    @login_required(login_url="/cabinet/login/")
    def _wrapped(request, *args, **kwargs):
        user = request.user
        if not getattr(user, "is_student_role", False) or user.is_staff or user.is_superuser:
            return HttpResponseForbidden("Немає доступу")
        return view(request, *args, **kwargs)

    return _wrapped


class CabinetLoginView(LoginView):
    template_name = "cabinet/login.html"
    redirect_authenticated_user = True

    def form_valid(self, form):
        user = form.get_user()
        if (
            not getattr(user, "is_student_role", False)
            or user.is_staff
            or user.is_superuser
        ):
            form.add_error(None, "Невірний логін або пароль")
            return self.form_invalid(form)
        return super().form_valid(form)

    def get_success_url(self):
        return "/cabinet/"


@student_required
def cabinet_home(request):
    enrollments = (
        Enrollment.objects.filter(student=request.user, status=Enrollment.Status.ACTIVE)
        .select_related("course")
        .prefetch_related("lessons")
    )
    return render(
        request,
        "cabinet/home.html",
        {"enrollments": enrollments},
    )


@student_required
def enrollment_detail(request, pk):
    enrollment = get_object_or_404(
        Enrollment.objects.select_related("course").prefetch_related("lessons"),
        pk=pk,
        student=request.user,
    )
    lessons = enrollment.lessons.all()
    total = lessons.count()
    done = lessons.filter(is_done=True).count()
    percent = int(done / total * 100) if total else 0
    return render(
        request,
        "cabinet/enrollment.html",
        {
            "enrollment": enrollment,
            "lessons": lessons,
            "total": total,
            "done": done,
            "percent": percent,
        },
    )


@student_required
@require_POST
def toggle_lesson(request, pk):
    lesson = get_object_or_404(
        LessonProgress.objects.select_related("enrollment"),
        pk=pk,
        enrollment__student=request.user,
    )
    if lesson.is_done:
        lesson.is_done = False
        lesson.completed_at = None
        lesson.save(update_fields=["is_done", "completed_at"])
    else:
        lesson.mark_done()
    return redirect("cabinet-enrollment", pk=lesson.enrollment_id)


urlpatterns = [
    path("login/", CabinetLoginView.as_view(), name="cabinet-login"),
    path(
        "logout/",
        LogoutView.as_view(next_page="/cabinet/login/"),
        name="cabinet-logout",
    ),
    path("", cabinet_home, name="cabinet-home"),
    path("courses/<int:pk>/", enrollment_detail, name="cabinet-enrollment"),
    path("lessons/<int:pk>/toggle/", toggle_lesson, name="cabinet-toggle-lesson"),
]
