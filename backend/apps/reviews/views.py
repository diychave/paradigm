from django_filters import rest_framework as filters
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from .models import TextReview
from .pagination import JsonServerPagination
from .serializers import TextReviewSerializer


class TextReviewFilter(filters.FilterSet):
    course = filters.CharFilter(field_name="course_id")

    class Meta:
        model = TextReview
        fields = ["course"]


class TextReviewViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = TextReviewSerializer
    pagination_class = JsonServerPagination
    filterset_class = TextReviewFilter
    queryset = TextReview.objects.filter(is_published=True).select_related("course")
