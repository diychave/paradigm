from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0005_scheduleslot"),
    ]

    operations = [
        migrations.CreateModel(
            name="ScheduleException",
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
                ("date", models.DateField()),
                (
                    "status",
                    models.CharField(
                        choices=[("cancelled", "Скасовано")],
                        default="cancelled",
                        max_length=16,
                    ),
                ),
                (
                    "slot",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="exceptions",
                        to="learning.scheduleslot",
                    ),
                ),
            ],
            options={
                "verbose_name": "Виняток розкладу",
                "verbose_name_plural": "Винятки розкладу",
                "ordering": ["-date", "id"],
                "unique_together": {("slot", "date")},
            },
        ),
    ]
