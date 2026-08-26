from django.db import migrations, models


def seed_site_content(apps, schema_editor):
    SiteContent = apps.get_model("catalog", "SiteContent")
    SiteContent.objects.get_or_create(
        pk=1,
        defaults={
            "hero_title": "Школа програмування для дітей від 5 років",
            "hero_description": "З IT Paradigma ваша дитина вже на перших заняттях створить власну гру, програму або сайт.",
            "hero_tags": ["Сертифікат про навчання", "IT-професія", "Портфоліо проектів"],
            "about_stats": [
                {
                    "number": "1000",
                    "title": "Випускників",
                    "desc": "Допомогли дітям зробити перші кроки в IT та перетворили захоплення іграми на корисні навички.",
                },
                {
                    "number": "5000",
                    "title": "Годин практики",
                    "desc": "Жодних нудних лекцій. Навчання побудоване на інтерактиві, щоб дитина не втрачала цікавість.",
                },
                {
                    "number": "700",
                    "title": "Готових проєктів",
                    "desc": "Наші учні вже створили власні ігри, сайти та додатки. Кожен проходить шлях від ідеї до релізу.",
                },
                {
                    "number": "8000",
                    "title": "Виконаних завдань",
                    "desc": "Фокус на реальній роботі з кодом. Ми вчимо логічно мислити та вирішувати складні задачі самостійно.",
                },
            ],
            "footer_description": "Онлайн-школа програмування для дітей від 5 до 17 років. Ми навчаємо створювати ігри, сайти та додатки через практику та роботу над реальними проєктами. Ми допомагаємо зробити перші кроки в IT та поступово доводимо учнів до створення власних повноцінних проєктів.",
            "footer_phone": "+380 50 600 60 94",
            "footer_copyright": "© 2026 IT Paradigma. Всі права захищені",
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0002_course_updated_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteContent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "hero_title",
                    models.CharField(default="Школа програмування для дітей від 5 років", max_length=255),
                ),
                (
                    "hero_description",
                    models.TextField(
                        default="З IT Paradigma ваша дитина вже на перших заняттях створить власну гру, програму або сайт."
                    ),
                ),
                ("hero_tags", models.JSONField(blank=True, default=list)),
                ("about_stats", models.JSONField(blank=True, default=list)),
                (
                    "footer_description",
                    models.TextField(
                        default="Онлайн-школа програмування для дітей від 5 до 17 років. Ми навчаємо створювати ігри, сайти та додатки через практику та роботу над реальними проєктами."
                    ),
                ),
                ("footer_phone", models.CharField(default="+380 50 600 60 94", max_length=64)),
                (
                    "footer_copyright",
                    models.CharField(default="© 2026 IT Paradigma. Всі права захищені", max_length=255),
                ),
            ],
            options={
                "verbose_name": "Контент сайту",
                "verbose_name_plural": "Контент сайту",
            },
        ),
        migrations.RunPython(seed_site_content, migrations.RunPython.noop),
    ]
