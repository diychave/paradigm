from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("learning", "0011_personal_homework"),
    ]

    operations = [
        migrations.AddField(
            model_name="enrollment",
            name="teacher",
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={"role": "teacher"},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="taught_enrollments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name="Transaction",
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
                ("amount", models.PositiveIntegerField(help_text="Сума в гривнях")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Очікує"),
                            ("paid", "Оплачено"),
                            ("failed", "Помилка"),
                            ("refunded", "Повернено"),
                        ],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("note", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "course",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="transactions",
                        to="catalog.course",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_transactions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        limit_choices_to={"role": "student"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="transactions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Транзакція",
                "verbose_name_plural": "Транзакції",
                "ordering": ["-created_at", "-id"],
            },
        ),
    ]
