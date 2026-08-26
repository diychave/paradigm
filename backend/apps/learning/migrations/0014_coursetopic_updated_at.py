from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0013_course_teacher_access"),
    ]

    operations = [
        migrations.AddField(
            model_name="coursetopic",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
