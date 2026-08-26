from django.conf import settings


AUTH_FAILED = "Невірний логін або пароль"


def is_public_student(user):
    return bool(
        user
        and user.is_active
        and not getattr(user, "is_archived", False)
        and getattr(user, "is_student_role", False)
        and not user.is_staff
        and not user.is_superuser
    )


def is_office_staff(user):
    return bool(
        user
        and user.is_active
        and (getattr(user, "is_admin_role", False) or getattr(user, "is_manager_role", False))
    )


def is_office_admin(user):
    return bool(user and user.is_active and getattr(user, "is_admin_role", False))


def is_studio_teacher(user):
    return bool(
        user
        and user.is_active
        and not getattr(user, "is_archived", False)
        and getattr(user, "is_teacher_role", False)
        and not user.is_staff
        and not user.is_superuser
    )


def user_payload(user, token_key=None, request=None):
    from .serializers import UserSerializer

    data = UserSerializer(user, context={"request": request}).data
    if token_key:
        data["token"] = token_key
    if is_public_student(user):
        data["redirect"] = "/account"
    elif is_studio_teacher(user):
        path = settings.TEACHER_PATH.strip("/")
        data["redirect"] = f"/{path}"
    elif is_office_staff(user):
        path = settings.STAFF_PATH.strip("/")
        data["redirect"] = f"/{path}"
        data["office"] = {
            "is_admin": is_office_admin(user),
            "can_manage_managers": is_office_admin(user),
            "can_manage_transactions": is_office_admin(user),
        }
    else:
        data["redirect"] = "/"
    return data
