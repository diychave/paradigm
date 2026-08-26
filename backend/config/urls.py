from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

urlpatterns = [
    path("admin/", include("apps.users.admin_urls")),
    path("cabinet/", include("apps.learning.urls")),
    path("api/", include("apps.catalog.urls")),
    path("api/", include("apps.reviews.urls")),
    path("api/", include("apps.leads.urls")),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.learning.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
