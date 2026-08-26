from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0004_coursesection_coursetopic_topicmaterial_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ScheduleSlot",
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
                (
                    "weekday",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (0, "Понеділок"),
                            (1, "Вівторок"),
                            (2, "Середа"),
                            (3, "Четвер"),
                            (4, "П’ятниця"),
                            (5, "Субота"),
                            (6, "Неділя"),
                        ]
                    ),
                ),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                (
                    "mode",
                    models.CharField(
                        choices=[("online", "Онлайн"), ("offline", "У школі")],
                        default="online",
                        max_length=16,
                    ),
                ),
                ("place", models.CharField(blank=True, max_length=64)),
                (
                    "enrollment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="schedule_slots",
                        to="learning.enrollment",
                    ),
                ),
            ],
            options={
                "verbose_name": "Слот розкладу",
                "verbose_name_plural": "Розклад",
                "ordering": ["weekday", "start_time", "id"],
                "unique_together": {("enrollment", "weekday", "start_time")},
            },
        ),
    ]
