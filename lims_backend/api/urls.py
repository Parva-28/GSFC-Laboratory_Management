from django.urls import path
from .views import (
    auth_login,
    labdata_save,
    tanker_arrival,
    tanker_dispatch,
    tanker_history,
    inventory_get_balance,
    inventory_borrow_request,
    inventory_get_requests,
    inventory_approve_reject,
    inventory_add_stock,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────
    path("auth/login/",              auth_login,                 name="auth_login"),

    # ── Lab Data ──────────────────────────────────────────────
    path("labdata/save/",            labdata_save,               name="labdata_save"),

    # ── Tanker ────────────────────────────────────────────────
    path("tanker/arrival/",          tanker_arrival,             name="tanker_arrival"),
    path("tanker/dispatch/",         tanker_dispatch,            name="tanker_dispatch"),
    path("tanker/history/",          tanker_history,             name="tanker_history"),

    # ── Inventory ─────────────────────────────────────────────
    path("inventory/balance/",       inventory_get_balance,      name="inventory_balance"),
    path("inventory/borrow/",        inventory_borrow_request,   name="inventory_borrow"),
    path("inventory/requests/",      inventory_get_requests,     name="inventory_requests"),
    path("inventory/approve/",       inventory_approve_reject,   name="inventory_approve"),
    path("inventory/add-stock/",     inventory_add_stock,        name="inventory_add_stock"),
]
