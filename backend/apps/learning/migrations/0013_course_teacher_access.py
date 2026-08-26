from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def backfill_teacher_access(apps, schema_editor):
    Enrollment = apps.get_model("learning", "Enrollment")
    CourseTeacher = apps.get_model("learning", "CourseTeacher")
    seen = set()
    rows = Enrollment.objects.filter(teacher_id__isnull=False).exclude(status="cancelled")
    for row in rows:
        key = (row.course_id, row.teacher_id)
        if key in seen:
            continue
        seen.add(key)
        CourseTeacher.objects.get_or_create(course_id=row.course_id, teacher_id=row.teacher_id)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("learning", "0012_office_transactions"),
    ]

    operations = [
        migrations.CreateModel(
            name="CourseTeacher",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("granted_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="teacher_access",
                        to="catalog.course",
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        limit_choices_to={"role": "teacher"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="course_access",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Доступ викладача до курсу",
                "verbose_name_plural": "Доступ викладачів до курсів",
                "ordering": ["course_id", "teacher__last_name", "teacher__first_name"],
                "unique_together": {("course", "teacher")},
            },
        ),
        migrations.RunPython(backfill_teacher_access, migrations.RunPython.noop),
    ]
