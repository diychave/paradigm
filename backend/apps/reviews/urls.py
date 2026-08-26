from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TextReviewViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"reviews", TextReviewViewSet, basename="reviews")

urlpatterns = [
    path("", include(router.urls)),
]
