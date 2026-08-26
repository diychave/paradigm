from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .listing_views import SiteView
from .views import CourseViewSet, FaqViewSet, PricingViewSet, SocialsViewSet, VideoViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"courses", CourseViewSet, basename="courses")
router.register(r"pricing", PricingViewSet, basename="pricing")
router.register(r"faq", FaqViewSet, basename="faq")
router.register(r"socials", SocialsViewSet, basename="socials")
router.register(r"video", VideoViewSet, basename="video")

urlpatterns = [
    path("site", SiteView.as_view(), name="site-content"),
    path("site/", SiteView.as_view()),
    path("", include(router.urls)),
]
