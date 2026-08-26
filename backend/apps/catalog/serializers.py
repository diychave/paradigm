from rest_framework import serializers

from .models import Course, CourseFit, FaqItem, PricingPlan, SocialLink, VideoItem


class CourseFitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseFit
        fields = ("title", "description")


class CourseSerializer(serializers.ModelSerializer):
    cardDescription = serializers.CharField(source="card_description")
    cardImage = serializers.CharField(source="card_image")
    ageRange = serializers.CharField(source="age_range")
    fit = CourseFitSerializer(source="fits", many=True)
    plans = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id",
            "cardDescription",
            "cardImage",
            "title",
            "subtitle",
            "ageRange",
            "tags",
            "description",
            "image",
            "video",
            "fit",
            "plans",
            "suitable",
        )

    def get_plans(self, obj):
        levels = {pl.level: pl.topics for pl in obj.plan_levels.all()}
        result = []
        for key in ("junior", "middle", "senior"):
            if key in levels:
                result.append({key: levels[key]})
        # include any other levels not in the standard order
        for key, topics in levels.items():
            if key not in ("junior", "middle", "senior"):
                result.append({key: topics})
        return result


class CourseListSerializer(CourseSerializer):
    """Same shape as detail — frontend uses full objects on listing too."""


class PricingPlanSerializer(serializers.ModelSerializer):
    lessonsLabel = serializers.CharField(source="lessons_label")
    lessonsCount = serializers.IntegerField(source="lessons_count")
    pricePerLesson = serializers.IntegerField(source="price_per_lesson")

    class Meta:
        model = PricingPlan
        fields = (
            "id",
            "tag",
            "lessonsLabel",
            "lessonsCount",
            "pricePerLesson",
            "hidden",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not instance.hidden:
            data.pop("hidden", None)
        return data


class FaqItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaqItem
        fields = ("id", "title", "description")


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ("id", "url")


class VideoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoItem
        fields = ("id", "video")
