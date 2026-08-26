from django.contrib import admin
from django.urls import path

admin.site.site_header = "Paradigm Admin"
admin.site.site_title = "Paradigm"
admin.site.index_title = "Керування"

urlpatterns = [
    path("", admin.site.urls),
]
