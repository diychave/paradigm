from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        TEACHER = "teacher", "Teacher"
        STUDENT = "student", "Student"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        db_index=True,
    )
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to="avatars/%Y/%m/", blank=True)
    office_password = models.CharField(max_length=128, blank=True)
    is_archived = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name = "Користувач"
        verbose_name_plural = "Користувачі"

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_manager_role(self):
        return self.role == self.Role.MANAGER

    @property
    def is_teacher_role(self):
        return self.role == self.Role.TEACHER and not self.is_superuser

    @property
    def is_student_role(self):
        return self.role == self.Role.STUDENT and not self.is_superuser
