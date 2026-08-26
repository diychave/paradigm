from django.conf import settings
from django.db import migrations, models


def backfill_demo_passwords(apps, schema_editor):
    User = apps.get_model("users", "User")
    password = getattr(settings, "DEMO_PASSWORD", "demo1234")
    User.objects.filter(username__in=["student", "teacher", "manager"]).update(office_password=password)


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_user_teacher_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="office_password",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.RunPython(backfill_demo_passwords, migrations.RunPython.noop),
    ]
