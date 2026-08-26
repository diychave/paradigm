from django.conf import settings
from django.db import migrations, models


def personalize_homework(apps, schema_editor):
    TopicAssignment = apps.get_model("learning", "TopicAssignment")
    Enrollment = apps.get_model("learning", "Enrollment")
    AssignmentProgress = apps.get_model("learning", "AssignmentProgress")

    shared = list(TopicAssignment.objects.filter(enrollment__isnull=True).select_related("topic__section"))
    for assignment in shared:
        course_id = assignment.topic.section.course_id
        enrollments = list(Enrollment.objects.filter(course_id=course_id))
        progress_by_enrollment = {
            row.enrollment_id: row
            for row in AssignmentProgress.objects.filter(assignment_id=assignment.id)
        }
        for enrollment in enrollments:
            clone = TopicAssignment.objects.create(
                topic_id=assignment.topic_id,
                enrollment_id=enrollment.id,
                title=assignment.title,
                description=assignment.description,
                due_label=assignment.due_label,
                order=assignment.order,
            )
            old = progress_by_enrollment.get(enrollment.id)
            if old:
                old.assignment_id = clone.id
                old.save(update_fields=["assignment_id"])
            else:
                AssignmentProgress.objects.create(
                    enrollment_id=enrollment.id,
                    assignment_id=clone.id,
                    status="not_started",
                )
        assignment.delete()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("learning", "0010_lesson_compensated_status"),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentMaterial",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                (
                    "material_type",
                    models.CharField(
                        choices=[
                            ("pdf", "PDF"),
                            ("doc", "Документ"),
                            ("ppt", "Презентація"),
                            ("zip", "ZIP"),
                            ("link", "Посилання"),
                            ("video", "Відео"),
                        ],
                        default="link",
                        max_length=16,
                    ),
                ),
                ("meta", models.CharField(blank=True, max_length=128)),
                ("url", models.CharField(blank=True, default="#", max_length=512)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "enrollment",
                    models.ForeignKey(
                        on_delete=models.CASCADE,
                        related_name="extra_materials",
                        to="learning.enrollment",
                    ),
                ),
                (
                    "topic",
                    models.ForeignKey(
                        on_delete=models.CASCADE,
                        related_name="student_materials",
                        to="learning.coursetopic",
                    ),
                ),
            ],
            options={
                "verbose_name": "Матеріал студента",
                "verbose_name_plural": "Матеріали студентів",
                "ordering": ["order", "id"],
            },
        ),
        migrations.AlterModelOptions(
            name="topicassignment",
            options={
                "ordering": ["order", "id"],
                "verbose_name": "Домашнє завдання",
                "verbose_name_plural": "Домашні завдання",
            },
        ),
        migrations.AlterModelOptions(
            name="topicmaterial",
            options={
                "ordering": ["order", "id"],
                "verbose_name": "Матеріал курсу",
                "verbose_name_plural": "Матеріали курсу",
            },
        ),
        migrations.AddField(
            model_name="topicassignment",
            name="enrollment",
            field=models.ForeignKey(
                blank=True,
                help_text="Якщо задано — домашка лише для цього студента.",
                null=True,
                on_delete=models.CASCADE,
                related_name="personal_assignments",
                to="learning.enrollment",
            ),
        ),
        migrations.RunPython(personalize_homework, noop),
    ]
