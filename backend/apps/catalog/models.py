from django.db import models


class Course(models.Model):
    id = models.SlugField(primary_key=True, max_length=64)
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    card_description = models.TextField(blank=True)
    card_image = models.CharField(max_length=512, blank=True)
    age_range = models.CharField(max_length=64, blank=True)
    tags = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True)
    image = models.CharField(max_length=512, blank=True)
    video = models.CharField(max_length=512, blank=True)
    suitable = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "title"]
        verbose_name = "Курс"
        verbose_name_plural = "Курси"

    def __str__(self):
        return self.title


class CourseFit(models.Model):
    course = models.ForeignKey(Course, related_name="fits", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Для кого курс"
        verbose_name_plural = "Для кого курс"

    def __str__(self):
        return f"{self.course_id}: {self.title}"


class CoursePlanLevel(models.Model):
    class Level(models.TextChoices):
        JUNIOR = "junior", "Junior"
        MIDDLE = "middle", "Middle"
        SENIOR = "senior", "Senior"

    course = models.ForeignKey(Course, related_name="plan_levels", on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=Level.choices)
    topics = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        unique_together = ("course", "level")
        verbose_name = "План рівня"
        verbose_name_plural = "Плани рівнів"

    def __str__(self):
        return f"{self.course_id} / {self.level}"


class PricingPlan(models.Model):
    id = models.SlugField(primary_key=True, max_length=64)
    tag = models.CharField(max_length=64)
    lessons_label = models.CharField(max_length=64)
    lessons_count = models.PositiveIntegerField()
    price_per_lesson = models.PositiveIntegerField()
    hidden = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "lessons_count"]
        verbose_name = "Тариф"
        verbose_name_plural = "Тарифи"

    def __str__(self):
        return self.tag


class FaqItem(models.Model):
    title = models.CharField(max_length=512)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "FAQ"
        verbose_name_plural = "FAQ"

    def __str__(self):
        return self.title


class SocialLink(models.Model):
    id = models.SlugField(primary_key=True, max_length=64)
    url = models.URLField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Соцмережа"
        verbose_name_plural = "Соцмережі"

    def __str__(self):
        return self.id


class VideoItem(models.Model):
    video = models.CharField(max_length=512)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Відео-відгук"
        verbose_name_plural = "Відео-відгуки"

    def __str__(self):
        return f"Video #{self.pk}"


class SiteContent(models.Model):
    hero_title = models.CharField(max_length=255, default="Школа програмування для дітей від 5 років")
    hero_description = models.TextField(
        default="З IT Paradigma ваша дитина вже на перших заняттях створить власну гру, програму або сайт."
    )
    hero_tags = models.JSONField(default=list, blank=True)
    about_stats = models.JSONField(default=list, blank=True)
    footer_description = models.TextField(
        default="Онлайн-школа програмування для дітей від 5 до 17 років. Ми навчаємо створювати ігри, сайти та додатки через практику та роботу над реальними проєктами."
    )
    footer_phone = models.CharField(max_length=64, default="+380 50 600 60 94")
    footer_copyright = models.CharField(max_length=255, default="© 2026 IT Paradigma. Всі права захищені")

    class Meta:
        verbose_name = "Контент сайту"
        verbose_name_plural = "Контент сайту"

    def __str__(self):
        return "Контент сайту"
