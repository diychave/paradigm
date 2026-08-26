from django.urls import path

from .views import AvatarView, LoginView, LogoutView, MeView, StaffLoginView, TeacherLoginView

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/login/", LoginView.as_view()),
    path("auth/teacher-login", TeacherLoginView.as_view(), name="auth-teacher-login"),
    path("auth/teacher-login/", TeacherLoginView.as_view()),
    path("auth/staff-login", StaffLoginView.as_view(), name="auth-staff-login"),
    path("auth/staff-login/", StaffLoginView.as_view()),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/logout/", LogoutView.as_view()),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("auth/me/", MeView.as_view()),
    path("auth/me/avatar", AvatarView.as_view(), name="auth-avatar"),
    path("auth/me/avatar/", AvatarView.as_view()),
]
