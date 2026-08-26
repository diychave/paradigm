from rest_framework import serializers

from .models import TextReview


class TextReviewSerializer(serializers.ModelSerializer):
    course = serializers.CharField(source="course_id")

    class Meta:
        model = TextReview
        fields = ("id", "name", "age", "course", "review")
