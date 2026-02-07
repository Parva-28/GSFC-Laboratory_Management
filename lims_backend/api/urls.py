from django.urls import path
from .views import labdata_save

urlpatterns = [
    path("labdata/save/", labdata_save, name="labdata_save"),
]
