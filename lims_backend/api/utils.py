"""
GSFC LIMS — Shared API utilities.

- api_response()            : standardised JSON envelope for all views
- paginate_list()           : manual page-number pagination for function-based views
- custom_exception_handler(): DRF exception handler that uses the standard envelope
"""

import math
from django.http import JsonResponse
from rest_framework.views import exception_handler as drf_exception_handler


# ---------------------------------------------------------------------------
# 1.  Standard API response helper
# ---------------------------------------------------------------------------

def api_response(success, message, data=None, errors=None, status=200):
    """
    Return a JsonResponse with a consistent envelope:

        Success → { "success": true,  "message": "...", "data": {...} }
        Error   → { "success": false, "message": "...", "errors": {...} }
    """
    body = {
        "success": success,
        "message": message,
    }
    if data is not None:
        body["data"] = data
    if errors is not None:
        body["errors"] = errors
    return JsonResponse(body, status=status)


# ---------------------------------------------------------------------------
# 2.  Pagination helper  (for function-based views, not DRF ViewSets)
# ---------------------------------------------------------------------------

def paginate_list(request, items, default_page_size=25, max_page_size=100):
    """
    Apply page-number pagination to a plain Python list (or evaluated queryset).

    Query params recognised:
        ?page=1        (1-indexed, default 1)
        ?page_size=25  (max 100)

    Returns a dict ready to be used as the `data` payload:
        {
            "results": [...],
            "count": <total>,
            "page": <current>,
            "page_size": <size>,
            "total_pages": <pages>,
        }
    """
    try:
        page = max(int(request.GET.get("page", 1)), 1)
    except (ValueError, TypeError):
        page = 1

    try:
        page_size = int(request.GET.get("page_size", default_page_size))
    except (ValueError, TypeError):
        page_size = default_page_size

    page_size = min(max(page_size, 1), max_page_size)

    total = len(items) if isinstance(items, list) else items.count() if hasattr(items, 'count') else len(list(items))
    total_pages = max(math.ceil(total / page_size), 1)
    page = min(page, total_pages)

    start = (page - 1) * page_size
    end = start + page_size

    if isinstance(items, list):
        results = items[start:end]
    else:
        results = list(items[start:end])

    return {
        "results": results,
        "count": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# ---------------------------------------------------------------------------
# 3.  DRF custom exception handler
# ---------------------------------------------------------------------------

def custom_exception_handler(exc, context):
    """
    Wraps DRF's built-in exception handler to return errors in our
    standard { success, message, errors } format.
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        detail = response.data

        # DRF may return a dict, list, or string
        if isinstance(detail, dict):
            message = detail.pop("detail", str(exc))
            errors = detail if detail else None
        elif isinstance(detail, list):
            message = detail[0] if detail else str(exc)
            errors = {"non_field_errors": detail}
        else:
            message = str(detail)
            errors = None

        response.data = {
            "success": False,
            "message": str(message),
        }
        if errors:
            response.data["errors"] = errors

    return response
