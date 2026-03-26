from django.urls import path
from .views import (
    auth_login,
    auth_logout,
    auth_me,
    labdata_save,
    labdata_latest,
    get_products,
    get_product_schema,
    dynamic_labdata_save,
    tanker_arrival,
    tanker_dispatch,
    tanker_history,
    inventory_get_balance,
    inventory_borrow_request,
    inventory_get_requests,
    inventory_approve_reject,
    inventory_add_stock,
    trace_records,
    get_alerts,
    resolve_alert,
    predict_material_usage,
    anomaly_review,
    lab_anomalies_summary,
    admin_login_logs,
    admin_users_list,
    admin_users_create,
    admin_users_update,
    admin_users_reset_password,
    users_list,
    instrument_calibration_list,
    instrument_calibration_add,
    instrument_calibration_update,
    shift_handover_list,
    shift_handover_create,
    export_list_excel,
    export_list_pdf,
    generate_coa,
    dashboard_stats,
)
from .health import health_check

urlpatterns = [
    # ── Health Check ──────────────────────────────────────────
    path("health/",                  health_check,               name="health_check"),

    # ── Auth ──────────────────────────────────────────────────
    path("auth/login/",              auth_login,                 name="auth_login"),
    path("auth/logout/",             auth_logout,                name="auth_logout"),
    path("auth/me/",                 auth_me,                    name="auth_me"),

    # ── Dashboard ─────────────────────────────────────────────
    path("dashboard/stats/",          dashboard_stats,            name="dashboard_stats"),

    # ── Lab Data ──────────────────────────────────────────────
    path("labdata/save/",            labdata_save,               name="labdata_save"),       # Hardcoded fallback
    path("labdata/latest/",          labdata_latest,             name="labdata_latest"),
    path("products/",                get_products,               name="get_products"),       # Dynamic Schema
    path("products/<str:product_id>/schema/", get_product_schema,name="get_product_schema"), # Dynamic Schema
    path("lab-data/dynamic/<str:product_id>/", dynamic_labdata_save, name="dynamic_labdata_save"), # Dynamic Submit

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

    # ── Traceability ──────────────────────────────────────────
    path("trace/<str:filter_type>/<str:filter_value>/", trace_records, name="trace_records"),

    # ── Intelligent Automation ────────────────────────────────
    path("alerts/",                  get_alerts,                 name="get_alerts"),
    path("alerts/<str:alert_id>/resolve/", resolve_alert,       name="resolve_alert"),
    path("ai/predict-material-usage/", predict_material_usage,   name="predict_material_usage"),
    path("lab/anomaly/<str:sample_id>/<str:action>/", anomaly_review, name="anomaly_review"),
    path("reports/anomalies-summary/", lab_anomalies_summary,    name="lab_anomalies_summary"),

    # ── Admin & Users ─────────────────────────────────────────
    path("admin/login-logs/",        admin_login_logs,           name="admin_login_logs"),
    path("admin/users/",             admin_users_list,           name="admin_users_list"),
    path("admin/users/create/",      admin_users_create,         name="admin_users_create"),
    path("admin/users/<int:user_id>/", admin_users_update,       name="admin_users_update"),
    path("admin/users/<int:user_id>/reset-password/", admin_users_reset_password, name="admin_users_reset_password"),

    path("users/list/",              users_list,                 name="users_list"),

    # ── Instruments & Shifts ──────────────────────────────────
    path("instruments/calibration/",        instrument_calibration_list,   name="instrument_calibration_list"),
    path("instruments/calibration/add/",    instrument_calibration_add,    name="instrument_calibration_add"),
    path("instruments/calibration/<int:pk>/", instrument_calibration_update, name="instrument_calibration_update"),
    
    path("shifts/handovers/",               shift_handover_list,           name="shift_handover_list"),
    path("shifts/handovers/create/",        shift_handover_create,         name="shift_handover_create"),

    # ── Exports & Reports ─────────────────────────────────────
    path("export/excel/<str:dataset_type>/", export_list_excel,  name="export_list_excel"),
    path("export/pdf/<str:dataset_type>/",   export_list_pdf,    name="export_list_pdf"),
    path("reports/coa/<str:sample_id>/",     generate_coa,       name="generate_coa"),
]

