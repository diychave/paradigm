from django.contrib.auth.models import Group
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User

ROLE_GROUP_MAP = {
    User.Role.ADMIN: "Admin",
    User.Role.MANAGER: "Manager",
    User.Role.TEACHER: "Teacher",
    User.Role.STUDENT: "Student",
}


def ensure_role_groups():
    for name in ROLE_GROUP_MAP.values():
        Group.objects.get_or_create(name=name)


@receiver(post_save, sender=User)
def sync_user_role_group(sender, instance, **kwargs):
    ensure_role_groups()
    target = ROLE_GROUP_MAP.get(instance.role)
    role_group_names = list(ROLE_GROUP_MAP.values())
    for group in instance.groups.filter(name__in=role_group_names):
        instance.groups.remove(group)
    if target:
        group = Group.objects.get(name=target)
        instance.groups.add(group)

    updates = {}
    if instance.role in (User.Role.ADMIN, User.Role.MANAGER) and not instance.is_staff:
        updates["is_staff"] = True
    if instance.role == User.Role.STUDENT and instance.is_staff and not instance.is_superuser:
        updates["is_staff"] = False
    if instance.role == User.Role.TEACHER and instance.is_staff and not instance.is_superuser:
        updates["is_staff"] = False
    if updates:
        User.objects.filter(pk=instance.pk).update(**updates)
