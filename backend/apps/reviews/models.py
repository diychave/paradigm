from django.db import models

from apps.catalog.models import Course


class TextReview(models.Model):
    name = models.CharField(max_length=128)
    age = models.CharField(max_length=16, blank=True)
    course = models.ForeignKey(
        Course,
        related_name="reviews",
        on_delete=models.CASCADE,
        to_field="id",
    )
    review = models.TextField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Текстовий відгук"
        verbose_name_plural = "Текстові відгуки"

    def __str__(self):
        return f"{self.name} — {self.course_id}"
