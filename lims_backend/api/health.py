from django.http import JsonResponse
from django.db import connection

def health_check(request):
    """Simple health check endpoint for monitoring."""
    try:
        connection.cursor()
        db_ok = True
    except Exception:
        db_ok = False

    status_code = 200 if db_ok else 503
    return JsonResponse(
        {"status": "ok" if db_ok else "error", "database": "ok" if db_ok else "unreachable"},
        status=status_code
    )
