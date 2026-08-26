from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from .models import Course, FaqItem, PricingPlan, SocialLink, VideoItem
from .serializers import (
    CourseSerializer,
    FaqItemSerializer,
    PricingPlanSerializer,
    SocialLinkSerializer,
    VideoItemSerializer,
)


class CourseViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = CourseSerializer
    lookup_field = "id"
    queryset = (
        Course.objects.filter(is_published=True)
        .prefetch_related("fits", "plan_levels")
        .all()
    )


class PricingViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = PricingPlanSerializer
    queryset = PricingPlan.objects.all()


class FaqViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = FaqItemSerializer
    queryset = FaqItem.objects.filter(is_published=True)


class SocialsViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = SocialLinkSerializer
    queryset = SocialLink.objects.all()


class VideoViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = VideoItemSerializer
    queryset = VideoItem.objects.filter(is_published=True)
