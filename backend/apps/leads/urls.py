from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .staff_views import OfficeLeadDetailView, OfficeLeadsView
from .views import LeadViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"leads", LeadViewSet, basename="leads")

# Also accept trailing slash for POST from browsers/forms
router_slash = DefaultRouter(trailing_slash=True)
router_slash.register(r"leads", LeadViewSet, basename="leads-slash")

urlpatterns = [
    path("office/leads", OfficeLeadsView.as_view(), name="office-leads"),
    path("office/leads/", OfficeLeadsView.as_view()),
    path("office/leads/<int:pk>", OfficeLeadDetailView.as_view(), name="office-lead"),
    path("office/leads/<int:pk>/", OfficeLeadDetailView.as_view()),
    path("", include(router.urls)),
    path("", include(router_slash.urls)),
]
