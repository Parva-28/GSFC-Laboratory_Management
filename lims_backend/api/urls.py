from django.urls import path
from .views import labdata_save, tanker_arrival, tanker_dispatch ,tanker_history

urlpatterns = [
    path("labdata/save/", labdata_save, name="labdata_save"),
    path("tanker/arrival/", tanker_arrival, name="tanker_arrival"),
    path("tanker/dispatch/", tanker_dispatch, name="tanker_dispatch"),
    path("tanker/history/", tanker_history, name="tanker_history"),
  
]
