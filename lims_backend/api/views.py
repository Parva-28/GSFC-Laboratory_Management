from django.shortcuts import render
from datetime import datetime, timedelta
import json
import os
import uuid
import secrets
from . import models as models  # needed for models.InstrumentCalibration / ShiftHandover
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from functools import wraps
from django_ratelimit.decorators import ratelimit

from .services import EmailService, AlertService
from .ml_models import PredictiveModel
from .rules_engine import RuleEngine
from .anomaly_detector import StatisticalDetector
from .alerts_service import AlertsLogService
from .product_schemas import PRODUCT_SCHEMAS
from .excel_schema_writer import ExcelSchemaWriter
from .utils import api_response, paginate_list
from .serializers import (
    LoginSerializer, TankerArrivalSerializer, TankerDispatchSerializer,
    LabDataSaveSerializer, InventoryBorrowSerializer,
    InventoryAddStockSerializer, InventoryApproveRejectSerializer,
)
from .models import (
    InventoryMaster, InventoryInward, InventoryRequest, InventoryApproval,
    TankerArrival, TankerHistory, LabData, AuthToken, SystemAlert, User,
    LoginAuditLog,
)

TOKEN_EXPIRY_HOURS = 24


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def get_client_ip(request):
    """Extract the real client IP, accounting for reverse proxies."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_login_attempt(request, username, user=None, success=False):
    """Write a row to LoginAuditLog."""
    LoginAuditLog.objects.create(
        user=user,
        username_attempted=username,
        ip_address=get_client_ip(request),
        success=success,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
    )


# ---------------------------------------------------------------------------
# AUTHENTICATION (DB-backed tokens with expiry + rate limiting + audit)
# ---------------------------------------------------------------------------

@csrf_exempt
@ratelimit(key='ip', rate='5/m', method='POST', block=False)
def auth_login(request):
    """POST { username, password } → { success, message, data: {token, username, role, lab} }"""
    if request.method != "POST":
        return api_response(False, "POST required", status=405)

    # Check rate limit
    was_limited = getattr(request, 'limited', False)
    if was_limited:
        return api_response(
            False,
            "Too many login attempts. Please wait 1 minute before trying again.",
            status=429,
        )

    try:
        data = json.loads(request.body.decode("utf-8"))

        # Validate input via serializer
        serializer = LoginSerializer(data=data)
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)

        username = serializer.validated_data["username"].strip()
        password = serializer.validated_data["password"].strip()

        from django.contrib.auth import authenticate
        user = authenticate(username=username, password=password)

        if user is None:
            # Log failed attempt
            log_login_attempt(request, username, user=None, success=False)
            return api_response(False, "Invalid username or password", status=401)

        # Log successful login
        log_login_attempt(request, username, user=user, success=True)

        # Delete any existing tokens for this user (single-session policy)
        AuthToken.objects.filter(user=user).delete()

        # Generate a cryptographically random token and store in DB
        token_key = secrets.token_hex(32)
        AuthToken.objects.create(
            key=token_key,
            user=user,
            expires_at=timezone.now() + timedelta(hours=TOKEN_EXPIRY_HOURS)
        )

        return api_response(True, "Login successful", data={
            "token":    token_key,
            "username": user.username,
            "role":     user.role,
            "lab":      user.lab,
        })

    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
def auth_logout(request):
    """POST /api/auth/logout/ → Deletes token from DB (real server-side revocation)."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token_key = auth_header.split(" ")[1]
        AuthToken.objects.filter(key=token_key).delete()
    return api_response(True, "Logged out successfully")


def require_auth(allowed_roles=None):
    """
    Decorator to protect views.
    Expects Authorization: Bearer <token>
    Validates token against DB, checks expiry, and checks role.
    Passes `request.user_data` to the view.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return api_response(False, "Unauthorized: Missing or invalid token", status=401)

            token_key = auth_header.split(" ")[1]
            try:
                auth_token = AuthToken.objects.select_related('user').get(key=token_key)
            except AuthToken.DoesNotExist:
                return api_response(False, "Unauthorized: Invalid token", status=401)

            if auth_token.is_expired():
                auth_token.delete()
                return api_response(False, "Unauthorized: Token expired, please login again", status=401)

            user = auth_token.user
            user_data = {
                "username": user.username,
                "role": user.role,
                "lab": user.lab,
                "user_obj": user,   # reference to actual User model instance
            }

            if allowed_roles is not None and user_data["role"] not in allowed_roles:
                return api_response(False, "Forbidden: Insufficient role permissions", status=403)

            request.user_data = user_data
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


@csrf_exempt
@require_auth()
def auth_me(request):
    """GET /api/auth/me/ → Returns current user profile based on token."""
    return api_response(True, "Authenticated", data={
        "username": request.user_data["username"],
        "role": request.user_data["role"],
        "lab": request.user_data["lab"],
    })


# ---------------------------------------------------------------------------
# INVENTORY VIEWS
# ---------------------------------------------------------------------------

def _init_inventory_master():
    # Initialize inventory master with default values if empty
    if InventoryMaster.objects.exists():
        return
    defaults = [
        ["MAT-001", "Nitrogen", "MT", 1000, 500],
        ["MAT-002", "Sulphuric Acid", "MT", 1000, 400],
        ["MAT-003", "Caustic Soda", "MT", 1000, 300],
        ["MAT-004", "Phosphoric Acid", "MT", 1000, 250],
        ["MAT-005", "Ammonia", "MT", 1000, 500],
        ["MAT-006", "Potassium Chloride", "MT", 1000, 200],
    ]
    for d in defaults:
        InventoryMaster.objects.create(
            material_id=d[0],
            material_name=d[1],
            unit=d[2],
            current_balance=d[3],
            min_threshold=d[4]
        )

@require_auth()
def inventory_get_balance(request):
    """GET /api/inventory/materials → returns current balance from db."""
    try:
        _init_inventory_master()
        balances = []
        for row in InventoryMaster.objects.all():
            balances.append({
                "material_id": row.material_id,
                "material": row.material_name,
                "unit": row.unit,
                "balance": row.current_balance,
                "minStock": row.min_threshold,
                "last_updated": row.last_updated_at.strftime("%d-%m-%Y %H:%M")
            })
        return api_response(True, "Inventory balances retrieved", data={"balances": balances})
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth(["SUPER_ADMIN"])
def inventory_add_stock(request):
    """POST /api/inventory/inward → append IN row to db and update master."""
    if request.method != "POST":
        return api_response(False, "POST required", status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))

        serializer = InventoryAddStockSerializer(data=data)
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)

        v = serializer.validated_data
        material = v["material"].strip()
        quantity = v["quantity"]
        unit     = v["unit"]
        supplier = v["supplier"]
        invoice_no = v["invoice_no"]
        remarks  = v["remarks"]
        
        _init_inventory_master()
        
        item, created = InventoryMaster.objects.get_or_create(
            material_name=material,
            defaults={
                'material_id': f"MAT-{str(uuid.uuid4())[:4].upper()}",
                'unit': unit,
                'min_threshold': 0
            }
        )
        item.current_balance += quantity
        item.save()

        # Append to Inward Log
        inward_id = f"INW-{str(uuid.uuid4())[:8].upper()}"
        InventoryInward.objects.create(
            inward_id=inward_id,
            material=item,
            qty_added=quantity,
            supplier=supplier,
            invoice_no=invoice_no,
            added_by=request.user_data["username"],
            remarks=remarks
        )

        return api_response(True, "Stock added successfully", data={"new_balance": round(item.current_balance, 3)})
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth()
def inventory_borrow_request(request):
    """POST → create a new Pending borrow/withdraw request."""
    if request.method != "POST":
        return api_response(False, "POST required", status=405)
    try:
        data = json.loads(request.body.decode("utf-8"))

        serializer = InventoryBorrowSerializer(data=data)
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)

        v = serializer.validated_data
        user_lab = request.user_data["lab"]

        request_id = "REQ-" + str(uuid.uuid4())[:8].upper()

        InventoryRequest.objects.create(
            request_id=request_id,
            raw_material=v["raw_material"],
            quantity=v["quantity"],
            unit=v["unit"],
            purpose=v["purpose"],
            employee_name=v["employee_name"],
            employee_id=v["employee_id"],
            request_date=v["request_date"],
            request_time=v["request_time"],
            remarks=v["remarks"],
            status="Pending",
            lab_id=user_lab,
            request_type=v["request_type"]
        )

        return api_response(True, "Borrow request created", data={"request_id": request_id})

    except Exception as e:
        return api_response(False, str(e), status=400)


@require_auth()
def inventory_get_requests(request):
    """GET → returns paginated requests (optionally filter by ?status=Pending)."""
    try:
        status_filter = request.GET.get("status", None)
        user_role = request.user_data["role"]
        user_lab = request.user_data["lab"]
        is_super = user_role == "SUPER_ADMIN"
        
        qs = InventoryRequest.objects.all().order_by('-id')
        if status_filter:
            qs = qs.filter(status=status_filter)
            
        records = []
        for req in qs:
            if not is_super and req.lab_id != user_lab:
                continue

            records.append({
                "request_id":    req.request_id,
                "raw_material":  req.raw_material,
                "quantity":      req.quantity,
                "unit":          req.unit,
                "purpose":       req.purpose,
                "employee_name": req.employee_name,
                "employee_id":   req.employee_id,
                "date":          req.request_date,
                "time":          req.request_time,
                "remarks":       req.remarks,
                "status":        req.status,
                "approved_by":   req.approved_by,
                "approval_time": req.approval_time,
                "lab_id":        req.lab_id,
                "issued_by":     req.issued_by,
                "issued_at":     req.issued_at,
                "request_type":  req.request_type
            })

        paginated = paginate_list(request, records)
        return api_response(True, "Inventory requests retrieved", data=paginated)
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth(["SUPER_ADMIN", "LAB_ADMIN"])
def inventory_approve_reject(request):
    """PATCH equivalent → Admin approves, rejects, or issues a request.
    On ISSUE (for BORROW): deducts balance from inventory master.
    On APPROVE (for ADD): adds balance to inventory master and writes inward log.
    Payload: { request_id, action: 'APPROVE' | 'REJECT' | 'ISSUE', approved_by }
    """
    if request.method != "POST":
        return api_response(False, "POST required", status=405)
    try:
        data = json.loads(request.body.decode("utf-8"))

        serializer = InventoryApproveRejectSerializer(data=data)
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)

        v = serializer.validated_data
        request_id  = v["request_id"]
        action      = v["action"].upper()
        acting_user = v["approved_by"] if v["approved_by"] else request.user_data["username"]

        now_str = datetime.now().strftime("%d-%m-%Y %H:%M")

        try:
            req_obj = InventoryRequest.objects.get(request_id=request_id)
        except InventoryRequest.DoesNotExist:
            return api_response(False, f"Request ID {request_id} not found", status=404)

        current_status = req_obj.status.upper()
        
        if action == "APPROVE":
            if current_status != "PENDING":
                 return api_response(False, f"Cannot approve request with status {current_status}", status=400)
            
            if req_obj.request_type == "ADD":
                item, created = InventoryMaster.objects.get_or_create(
                    material_name=req_obj.raw_material,
                    defaults={
                        'material_id': f"MAT-{str(uuid.uuid4())[:4].upper()}",
                        'unit': req_obj.unit,
                        'min_threshold': 0
                    }
                )
                item.current_balance += req_obj.quantity
                item.save()

                # Append to Inward Log
                inward_id = f"INW-{str(uuid.uuid4())[:8].upper()}"
                InventoryInward.objects.create(
                    inward_id=inward_id,
                    material=item,
                    qty_added=req_obj.quantity,
                    supplier=req_obj.purpose,
                    added_by=acting_user,
                    remarks=f"Approved Add Request ID: {request_id}"
                )

                # Mark Request Completed
                req_obj.status = "Completed"
                req_obj.approved_by = acting_user
                req_obj.approval_time = now_str
                new_status = "Completed"
                
                temp_email = f"{req_obj.employee_id}@gsfc.com" if req_obj.employee_id else "employee@gsfc.com"
                EmailService.send_inventory_request_approved(temp_email, req_obj.raw_material, req_obj.quantity)

            else:
                req_obj.status = "Approved"
                req_obj.approved_by = acting_user
                req_obj.approval_time = now_str
                new_status = "Approved"

        elif action == "REJECT":
            if current_status != "PENDING":
                 return api_response(False, f"Cannot reject request with status {current_status}", status=400)
            req_obj.status = "Rejected"
            req_obj.approved_by = acting_user
            req_obj.approval_time = now_str
            new_status = "Rejected"
            
            temp_email = f"{req_obj.employee_id}@gsfc.com" if req_obj.employee_id else "employee@gsfc.com"
            EmailService.send_inventory_request_rejected(temp_email, req_obj.raw_material, req_obj.quantity)
        elif action == "ISSUE":
            if req_obj.request_type == "ADD":
                return api_response(False, "Cannot manually issue an ADD request", status=400)

            if current_status != "APPROVED":
                 return api_response(False, f"Cannot issue request with status {current_status}", status=400)
                 
            try:
                item = InventoryMaster.objects.get(material_name=req_obj.raw_material)
            except InventoryMaster.DoesNotExist:
                return api_response(False, f"Material {req_obj.raw_material} not found in master", status=400)
                
            if item.current_balance < req_obj.quantity:
                 return api_response(False, f"Insufficient stock! Available: {item.current_balance}", status=400)
            
            item.current_balance -= req_obj.quantity
            item.save()
            
            # Update request row
            req_obj.status = "Issued"
            req_obj.issued_by = acting_user
            req_obj.issued_at = now_str
            new_status = "Issued"
            
            temp_email = f"{req_obj.employee_id}@gsfc.com" if req_obj.employee_id else "employee@gsfc.com"
            EmailService.send_inventory_request_approved(temp_email, req_obj.raw_material, req_obj.quantity)

        req_obj.save()

        # Log action to approvals DB
        InventoryApproval.objects.create(
            approval_timestamp=now_str,
            request_id=request_id,
            action_taken=action,
            admin_username=acting_user,
            material_name=req_obj.raw_material,
            quantity=req_obj.quantity,
            request_status=new_status
        )

        return api_response(True, f"Request {action.lower()}d successfully", data={"status": new_status})

    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth()
def labdata_save(request):
    if request.method != "POST":
        return api_response(False, "POST required", status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))

        serializer = LabDataSaveSerializer(data=data)
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)

        v = serializer.validated_data
        tanker_id = v["tanker_id"]
        sample_id = v["sample_id"]
        batch_id = v["batch_id"]
        order_number = v["order_number"]
        product = v["product"]
        moisture = v["moisture"]
        purity = v["purity"]
        analyst = v["analyst"]
        sample_date = v["sample_date"]
        sample_time = v["sample_time"]

        # --- QUALITY ANOMALY DETECTION (AI + RULE ENGINE) ---
        is_rule_violation, rule_score, rule_reason, rule_severity = RuleEngine.evaluate_rules(product, moisture=moisture, purity=purity)
        is_stat_anomaly, stat_score, stat_reason, stat_severity = StatisticalDetector.detect_anomalies(product, moisture, purity)
        
        anomaly_flag = "NO"
        anomaly_score = 0
        anomaly_reasons = []
        final_severity = "LOW"
        review_status = ""
        
        if is_rule_violation or is_stat_anomaly:
            anomaly_flag = "YES"
            review_status = "PENDING_REVIEW"
            anomaly_score = max(rule_score, stat_score)
            
            if is_rule_violation:
                anomaly_reasons.append(rule_reason)
                final_severity = rule_severity  # Usually HIGH
            if is_stat_anomaly:
                anomaly_reasons.append(stat_reason)
                if not is_rule_violation:
                     final_severity = stat_severity # Usually MEDIUM
                     anomaly_score = stat_score
            
            combined_reason = " | ".join(anomaly_reasons)
            
            # Create Alert Log (now DB-backed)
            AlertsLogService.create_alert(
                alert_type="ANOMALY",
                severity=final_severity,
                sample_id=sample_id,
                batch_id=batch_id,
                message=combined_reason
            )
            
            # Send Notification for HIGH severity
            if final_severity == "HIGH":
                 sample_data = {
                     "sample_id": sample_id,
                     "product": product,
                     "moisture": moisture,
                     "purity": purity,
                     "analyst": analyst,
                     "reason": combined_reason
                 }
                 # In production, lookup Admin emails from DB
                 EmailService.send_high_severity_anomaly_alert(["central_admin@gsfc.com"], sample_data)
        else:
            combined_reason = ""
            review_status = "CLEARED"

        LabData.objects.create(
            tanker_id=tanker_id,
            sample_id=sample_id,
            batch_id=batch_id,
            order_number=order_number,
            product=product,
            moisture=moisture,
            purity=purity,
            analyst=analyst,
            sample_date=sample_date,
            sample_time=sample_time,
            lab=v["lab"],
            status="PENDING",
            anomaly_flag=anomaly_flag,
            anomaly_score=anomaly_score,
            anomaly_reason=combined_reason,
            review_status=review_status
        )

        # Invalidate the baseline cache down the line since DB is updated
        StatisticalDetector.invalidate_cache(product)

        return api_response(True, "Lab data saved successfully", data={
            "anomaly_flag": anomaly_flag,
            "anomaly_score": anomaly_score,
            "anomaly_reason": combined_reason,
        })

    except Exception as e:
        return api_response(False, str(e), status=400)


@require_auth()
def labdata_latest(request):
    """GET /api/labdata/latest/ -> returns all LabData entries ordered newest first"""
    try:
        user_lab = request.user_data["lab"]
        is_super = request.user_data["role"] == "SUPER_ADMIN"
        
        qs = LabData.objects.all()
        if not is_super:
             qs = qs.filter(lab=user_lab)
             
        entries = qs.order_by("-id")[:50]  # Cap at 50 most recent
        
        records = []
        for row in entries:
            records.append({
                "sample_id": row.sample_id,
                "batch_id": row.batch_id,
                "product": row.product,
                "moisture": row.moisture,
                "purity": row.purity,
                "analyst": row.analyst,
                "date": row.sample_date.strftime("%Y-%m-%d") if isinstance(row.sample_date, datetime) else row.sample_date,
                "time": row.sample_time.strftime("%H:%M") if hasattr(row.sample_time, "strftime") else row.sample_time,
                "anomaly_flag": row.anomaly_flag,
                "anomaly_reason": row.anomaly_reason,
            })
             
        return api_response(True, "Records retrieved", data={"records": records})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return api_response(False, str(e), status=400)


@require_auth()
def dashboard_stats(request):
    """GET /api/dashboard/stats/ -> real-time dashboard numbers"""
    try:
        today = datetime.now().date()
        today_str = today.strftime("%Y-%m-%d")
        start_of_week = today - timedelta(days=today.weekday())  # Monday

        # ── Samples Today (sample_date is CharField, try exact match) ──
        samples_today = LabData.objects.filter(sample_date=today_str).count()
        if samples_today == 0:
            # Fallback: maybe stored with different separator
            samples_today = LabData.objects.filter(sample_date__contains=today_str).count()

        # ── Yesterday for comparison ──
        yesterday = today - timedelta(days=1)
        yesterday_str = yesterday.strftime("%Y-%m-%d")
        samples_yesterday = LabData.objects.filter(sample_date=yesterday_str).count()
        if samples_yesterday > 0:
            pct_change = round(((samples_today - samples_yesterday) / samples_yesterday) * 100, 1)
        else:
            pct_change = 0 if samples_today == 0 else 100.0

        # ── Pending Reviews (anomalies flagged) ──
        pending_count = LabData.objects.filter(anomaly_flag="YES").count()

        # ── Active Alerts ──
        alerts_count = SystemAlert.objects.filter(is_active=True).count()

        # ── Total samples this month (use startswith on YYYY-MM prefix) ──
        month_prefix = today.strftime("%Y-%m")
        monthly_samples = LabData.objects.filter(sample_date__startswith=month_prefix).count()

        # ── Daily samples for current week (Mon-Sun) ──
        day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        daily_breakdown = []
        for i in range(7):
            d = start_of_week + timedelta(days=i)
            d_str = d.strftime("%Y-%m-%d")
            cnt = LabData.objects.filter(sample_date=d_str).count()
            daily_breakdown.append({"day": day_labels[i], "samples": cnt})

        return api_response(True, "Dashboard stats", data={
            "samples_today": samples_today,
            "pct_change_yesterday": pct_change,
            "pending_approvals": pending_count,
            "active_alerts": alerts_count,
            "monthly_samples": monthly_samples,
            "daily_samples": daily_breakdown,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return api_response(False, str(e), status=400)


# ---------------------------------------------------------------------------
# DYNAMIC SCHEMA-DRIVEN LAB FORMS
# ---------------------------------------------------------------------------

@require_auth()
def get_products(request):
    """GET /api/products/ → Returns minimalistic list of supported dynamic products"""
    products = [{"id": k, "name": v["name"]} for k, v in PRODUCT_SCHEMAS.items()]
    return api_response(True, "Products retrieved", data={"products": products})

@require_auth()
def get_product_schema(request, product_id):
    """GET /api/products/<product_id>/schema/"""
    schema = PRODUCT_SCHEMAS.get(product_id)
    if not schema:
        return api_response(False, "Product schema not found", status=404)
        
    return api_response(True, "Schema retrieved", data={"schema": schema})

@csrf_exempt
@require_auth(["SUPER_ADMIN", "LAB_ADMIN", "EMPLOYEE"])
def dynamic_labdata_save(request, product_id):
    """POST /api/lab-data/dynamic/<product_id>/"""
    if request.method != "POST":
         return api_response(False, "POST method required", status=405)
         
    try:
        data = json.loads(request.body)
        schema = PRODUCT_SCHEMAS.get(product_id)
        
        if not schema:
             return api_response(False, f"Schema not supported: {product_id}", status=400)
             
        # Extract Standard Top-Level Data mappings if they exist logically
        moisture = data.get("pct_moisture", data.get("moisture", 0))
        purity = data.get("pct_purity", data.get("purity", data.get("pct_h2so4_product", 0)))
        
        is_rule_violation, rule_score, rule_reason, rule_severity = RuleEngine.evaluate_rules(schema["name"], **data)
        
        anomaly_flag = "NO"
        anomaly_score = 0
        anomaly_reasons = []
        final_severity = "LOW"
        review_status = ""
        
        if is_rule_violation:
            anomaly_flag = "YES"
            review_status = "PENDING_REVIEW"
            anomaly_score = rule_score
            anomaly_reasons.append(rule_reason)
            final_severity = rule_severity
            
            combined_reason = " | ".join(anomaly_reasons)
            
            # Create Alert Log
            sample_id = data.get("sample_id", f"DYN-{uuid.uuid4().hex[:6].upper()}")
            batch_id = data.get("batch_id", data.get("batch_no", ""))
            
            AlertsLogService.create_alert(
                alert_type="ANOMALY",
                severity=final_severity,
                sample_id=sample_id,
                batch_id=batch_id,
                message=combined_reason
            )
            
            # Send Notification for HIGH severity
            if final_severity == "HIGH":
                 sample_data = {
                     "sample_id": sample_id,
                     "product": schema["name"],
                     "moisture": moisture,
                     "purity": purity,
                     "analyst": data.get("analyst", request.user_data["username"]),
                     "reason": combined_reason
                 }
                 EmailService.send_high_severity_anomaly_alert(["central_admin@gsfc.com"], sample_data)
        else:
            combined_reason = ""
            review_status = "CLEARED"
            
        # Write to Excel
        success, next_sr = ExcelSchemaWriter.write_dynamic_data(schema["sheet_name"], schema["fields"], data)
        
        # Save placeholder record to LabData to show up in Dashboard / Anomalies
        if "sample_id" not in data:
             data["sample_id"] = f"DYN-{uuid.uuid4().hex[:8].upper()}"
        
        LabData.objects.create(
            tanker_id=data.get("tanker_no", data.get("tanker_id", "")),
            sample_id=data.get("sample_id"),
            batch_id=data.get("batch_no", data.get("batch_id", "")),
            order_number=data.get("order_number", ""),
            product=schema["name"],
            moisture=str(moisture),
            purity=str(purity),
            analyst=data.get("analyst", request.user_data["username"]),
            sample_date=data.get("dater", data.get("sample_date", datetime.now().strftime("%Y-%m-%d"))),
            sample_time=data.get("time", data.get("sample_time", datetime.now().strftime("%H:%M"))),
            lab=request.user_data["lab"],
            status="PENDING",
            anomaly_flag=anomaly_flag,
            anomaly_score=anomaly_score,
            anomaly_reason=combined_reason,
            review_status=review_status
        )

        return api_response(True, "Dynamic lab data saved", data={"sr_no_assigned": next_sr})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return api_response(False, str(e), status=400)


def generate_tanker_id():
    today_str = datetime.now().strftime("%Y%m%d")
    count = TankerArrival.objects.filter(tanker_id__startswith=f"TNK-{today_str}-").count()
    return f"TNK-{today_str}-{count + 1:03d}"

@csrf_exempt
@require_auth()
def tanker_arrival(request):
    if request.method != "POST":
        return api_response(False, "POST required", status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))

        serializer = TankerArrivalSerializer(data=data)
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)

        v = serializer.validated_data
        tanker_no = v["tanker_number"]
        material = v["raw_material"]
        quantity = v["quantity"]
        supplier = v["supplier"]
        driver = v["driver_name"]
        arrival_date = v["arrival_date"]
        arrival_time = v["arrival_time"]
        sampling_date = v["sampling_date"]
        sampling_time = v["sampling_time"]
        batch_no = v["batch_number"]
        order_no = v["order_number"]

        tanker_id = generate_tanker_id()

        TankerArrival.objects.create(
            tanker_id=tanker_id,
            tanker_no=tanker_no,
            material=material,
            quantity=quantity,
            supplier=supplier,
            driver=driver,
            arrival_date=arrival_date,
            arrival_time=arrival_time,
            sampling_date=sampling_date,
            sampling_time=sampling_time,
            batch_no=batch_no,
            order_no=order_no,
            created_by=request.user_data["username"],
            timestamp=datetime.now().strftime("%d-%m-%Y %H:%M"),
            lab=v["lab"]
        )

        # ---------- SAVE INTO TANKER RECORDS ----------
        TankerHistory.objects.create(
            tanker_no=tanker_no,
            movement_type="ARRIVAL",
            material_or_product=material,
            quantity=quantity,
            date=arrival_date,
            time=arrival_time,
            batch_no=batch_no,
            order_no=order_no,
            source_destination=supplier,
            recorded_by=request.user_data["username"],
            recorded_at=datetime.now().strftime("%d-%m-%Y %H:%M"),
            lab=request.user_data["lab"]
        )

        return api_response(True, "Tanker arrival recorded", data={"tanker_id": tanker_id})

    except Exception as e:
        return api_response(False, str(e), status=400)
    


@csrf_exempt
@require_auth()
def tanker_dispatch(request):
    if request.method != "POST":
        return api_response(False, "POST required", status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))

        serializer = TankerDispatchSerializer(data=data)
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)

        v = serializer.validated_data
        tanker_no = v["tanker_number"]
        product = v["finished_product"]
        quantity = v["quantity"]
        dispatch_date = v["dispatch_date"]
        dispatch_time = v["dispatch_time"]
        destination = v["destination"]
        batch_no = v["batch_number"]
        order_no = v["order_number"]

        # ---------- SAVE INTO TANKER RECORDS ----------
        TankerHistory.objects.create(
            tanker_no=tanker_no,
            movement_type="DISPATCH",
            material_or_product=product,
            quantity=quantity,
            date=dispatch_date,
            time=dispatch_time,
            batch_no=batch_no,
            order_no=order_no,
            source_destination=destination,
            recorded_by=request.user_data["username"],
            recorded_at=datetime.now().strftime("%d-%m-%Y %H:%M"),
            lab=request.user_data["lab"]
        )

        return api_response(True, "Tanker dispatch recorded")

    except Exception as e:
        return api_response(False, str(e), status=400)


@require_auth()
def tanker_history(request):
    """GET /api/tanker/history/ — Paginated tanker history."""
    try:
        user_role = request.user_data["role"]
        user_lab = request.user_data["lab"]
        is_super = user_role == "SUPER_ADMIN"

        qs = TankerHistory.objects.all().order_by('-id')
        records = []

        for row in qs:
            if not is_super and row.lab != user_lab:
                continue

            records.append({
                "tanker_number": row.tanker_no,
                "movement_type": row.movement_type,
                "material_or_product": row.material_or_product,
                "quantity": row.quantity,
                "date": row.date,
                "time": row.time,
                "batch_number": row.batch_no,
                "order_number": row.order_no,
                "source_destination": row.source_destination,
                "recorded_by": row.recorded_by,
                "recorded_at": row.recorded_at,
            })

        paginated = paginate_list(request, records)
        return api_response(True, "Tanker history retrieved", data=paginated)

    except Exception as e:
        return api_response(False, str(e), status=400)

# ---------------------------------------------------------------------------
# INTELLIGENT AUTOMATION (ALERTS & AI PREDICTIONS)
# ---------------------------------------------------------------------------

@require_auth()
def get_alerts(request):
    """GET /api/alerts/ → Returns a list of active alerts from DB + low-stock checks."""
    try:
        # DB-backed alerts (anomaly, system)
        db_alerts = AlertsLogService.get_open_alerts(status_filter="OPEN")

        # Low-stock alerts (generated dynamically from inventory)
        low_stock_alerts = []
        for item in InventoryMaster.objects.all():
            if item.current_balance < item.min_threshold:
                low_stock_alerts.append({
                    "alert_id": f"ALT-INV-{item.material_id}",
                    "type": "LOW_STOCK",
                    "severity": "HIGH",
                    "title": f"Low Stock: {item.material_name}",
                    "message": f"{item.material_name} stock is {item.current_balance} (Below {item.min_threshold})",
                    "lab": None,
                    "is_active": True,
                    "created_at": "",
                    "resolved_at": "",
                    "resolved_by": "",
                })

        all_alerts = db_alerts + low_stock_alerts
        return api_response(True, "Alerts retrieved", data={"alerts": all_alerts})
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth(["SUPER_ADMIN", "LAB_ADMIN"])
def resolve_alert(request, alert_id):
    """PATCH /api/alerts/<alert_id>/resolve/ → Mark an alert as resolved."""
    if request.method != "PATCH":
        return api_response(False, "PATCH required", status=405)

    try:
        user = request.user_data.get("user_obj")
        success = AlertsLogService.resolve_alert(alert_id, user)

        if not success:
            return api_response(False, f"Alert {alert_id} not found or already resolved", status=404)

        return api_response(True, f"Alert {alert_id} resolved successfully")
    except Exception as e:
        return api_response(False, str(e), status=400)


@require_auth()
def predict_material_usage(request):
    """GET /api/ai/predict-material-usage?material=X → Returns next 7 days prediction."""
    try:
        material_name = request.GET.get("material", "")
        if not material_name:
            return api_response(False, "Material parameter required", status=400)
            
        prediction_result = PredictiveModel.predict_material_usage(material_name)
        
        if "error" in prediction_result:
            return api_response(False, prediction_result["error"])
            
        return api_response(True, "Prediction generated", data={"prediction": prediction_result})
    except Exception as e:
        return api_response(False, str(e), status=400)

@csrf_exempt
@require_auth(["SUPER_ADMIN", "LAB_ADMIN"])
def anomaly_review(request, sample_id, action):
    """PATCH /api/lab/anomaly/<sample_id>/(clear|confirm)"""
    if request.method != "PATCH":
        return api_response(False, "PATCH required", status=405)
        
    try:
        now_str = datetime.now().strftime("%d-%m-%Y %H:%M")
        acting_user = request.user_data["username"]
        
        try:
            lab_entry = LabData.objects.get(sample_id=sample_id)
        except LabData.DoesNotExist:
            return api_response(False, f"Sample {sample_id} not found", status=404)

        if action == "clear":
            lab_entry.anomaly_flag = "NO"
            lab_entry.review_status = "CLEARED"
            new_status = "CLEARED"
        elif action == "confirm":
            lab_entry.anomaly_flag = "YES"
            lab_entry.review_status = "CONFIRMED_ANOMALY"
            new_status = "CONFIRMED_ANOMALY"
        else:
            return api_response(False, "Invalid action parameter", status=400)
        
        lab_entry.reviewed_by = acting_user
        lab_entry.reviewed_at = now_str
        lab_entry.save()
        
        # Mark related alert as CLOSED via alerts service
        AlertsLogService.close_alert_by_sample(sample_id, acting_user, now_str)

        # Send email notification about the review action
        EmailService.send_anomaly_review_notification(
            ["central_admin@gsfc.com"],
            sample_id,
            action,
            acting_user,
            lab_entry.anomaly_reason
        )

        return api_response(True, f"Anomaly {action}ed", data={"status": new_status, "sample_id": sample_id})
    except Exception as e:
        return api_response(False, str(e), status=400)

@require_auth()
def lab_anomalies_summary(request):
    """GET /api/reports/anomalies-summary — Paginated."""
    try:
        anomalies = LabData.objects.filter(anomaly_flag="YES")
        
        if not anomalies.exists():
            return api_response(True, "No anomalies found", data={"summary": {}, "table_data": {"results": [], "count": 0, "page": 1, "page_size": 25, "total_pages": 1}})
        
        open_anomalies = anomalies.filter(review_status="PENDING_REVIEW").count()
        high_severity = anomalies.filter(anomaly_score__gte=40).count()
        
        # Group by Product
        by_product = {}
        by_analyst = {}
        for entry in anomalies:
            by_product[entry.product] = by_product.get(entry.product, 0) + 1
            by_analyst[entry.analyst] = by_analyst.get(entry.analyst, 0) + 1
        
        # Detailed list of anomalies
        table_data = []
        for entry in anomalies:
            table_data.append({
                "Tanker_ID": entry.tanker_id,
                "Sample_ID": entry.sample_id,
                "Batch_ID": entry.batch_id,
                "Order_Number": entry.order_number,
                "Product": entry.product,
                "Moisture_%": entry.moisture,
                "Purity_%": entry.purity,
                "Analyst": entry.analyst,
                "Sample_Date": entry.sample_date,
                "Sample_Time": entry.sample_time,
                "Lab": entry.lab,
                "Status": entry.status,
                "Anomaly_Flag": entry.anomaly_flag,
                "Anomaly_Score": entry.anomaly_score,
                "Anomaly_Reason": entry.anomaly_reason,
                "Review_Status": entry.review_status,
                "Reviewed_By": entry.reviewed_by,
                "Reviewed_At": entry.reviewed_at,
            })
        
        paginated_table = paginate_list(request, table_data)
        
        return api_response(True, "Anomalies summary retrieved", data={
            "summary": {
                "open_count": open_anomalies,
                "high_severity_count": high_severity,
                "by_product": by_product,
                "by_analyst": by_analyst
            },
            "table_data": paginated_table
        })
    except Exception as e:
        return api_response(False, str(e), status=400)

@require_auth()
def trace_records(request, filter_type, filter_value):
    """GET /api/trace/<filter_type>/<filter_value>/ → End-to-end traceability via DB."""
    user_role = request.user_data["role"]
    user_lab = request.user_data["lab"]
    is_super = user_role == "SUPER_ADMIN"

    matched_tanker_ids = set()
    matched_batch_ids = set()
    matched_order_nos = set()
    matched_sample_ids = set()

    if filter_type == "by-tanker":
        matched_tanker_ids.add(filter_value)
    elif filter_type == "by-batch":
        matched_batch_ids.add(filter_value)
    elif filter_type == "by-order":
        matched_order_nos.add(filter_value)
    elif filter_type == "by-sample":
        matched_sample_ids.add(filter_value)
    
    def check_lab(row_lab):
        return is_super or row_lab == user_lab

    # Load all data from DB
    arrivals = []
    for row in TankerArrival.objects.all():
        if check_lab(row.lab):
            arrivals.append({
                "tanker_id": row.tanker_id, "tanker_no": row.tanker_no, "material": row.material,
                "quantity": row.quantity, "supplier": row.supplier, "driver": row.driver,
                "arrival_date": row.arrival_date, "arrival_time": row.arrival_time,
                "batch_no": row.batch_no, "order_no": row.order_no
            })

    labs = []
    for row in LabData.objects.all():
        if check_lab(row.lab):
            labs.append({
                "tanker_id": row.tanker_id, "sample_id": row.sample_id, "batch_id": row.batch_id,
                "order_no": row.order_number, "product": row.product, "moisture": row.moisture,
                "purity": row.purity, "analyst": row.analyst, "sample_date": row.sample_date,
                "sample_time": row.sample_time, "status": row.status
            })

    dispatches = []
    for row in TankerHistory.objects.filter(movement_type="DISPATCH"):
        if check_lab(row.lab):
            dispatches.append({
                "tanker_no": row.tanker_no, "product": row.material_or_product,
                "quantity": row.quantity, "dispatch_date": row.date, "dispatch_time": row.time,
                "destination": row.source_destination, "batch_no": row.batch_no, "order_no": row.order_no
            })

    # Iteratively expand matched keys
    while True:
        prev_sum = len(matched_tanker_ids) + len(matched_batch_ids) + len(matched_order_nos) + len(matched_sample_ids)
        
        for a in arrivals:
            if a["tanker_id"] in matched_tanker_ids or a["batch_no"] in matched_batch_ids or a["order_no"] in matched_order_nos:
                if a["tanker_id"]: matched_tanker_ids.add(a["tanker_id"])
                if a["batch_no"]: matched_batch_ids.add(a["batch_no"])
                if a["order_no"]: matched_order_nos.add(a["order_no"])
                
        for l in labs:
            if l["tanker_id"] in matched_tanker_ids or l["sample_id"] in matched_sample_ids or l["batch_id"] in matched_batch_ids or l["order_no"] in matched_order_nos:
                if l["tanker_id"]: matched_tanker_ids.add(l["tanker_id"])
                if l["sample_id"]: matched_sample_ids.add(l["sample_id"])
                if l["batch_id"]: matched_batch_ids.add(l["batch_id"])
                if l["order_no"]: matched_order_nos.add(l["order_no"])
                
        for d in dispatches:
            if d["batch_no"] in matched_batch_ids or d["order_no"] in matched_order_nos:
                if d["batch_no"]: matched_batch_ids.add(d["batch_no"])
                if d["order_no"]: matched_order_nos.add(d["order_no"])
                
        curr_sum = len(matched_tanker_ids) + len(matched_batch_ids) + len(matched_order_nos) + len(matched_sample_ids)
        if curr_sum == prev_sum:
            break
            
    final_arrivals = [a for a in arrivals if a["tanker_id"] in matched_tanker_ids or a["batch_no"] in matched_batch_ids or a["order_no"] in matched_order_nos]
    final_labs = [l for l in labs if l["tanker_id"] in matched_tanker_ids or l["sample_id"] in matched_sample_ids or l["batch_id"] in matched_batch_ids or l["order_no"] in matched_order_nos]
    final_dispatches = [d for d in dispatches if d["batch_no"] in matched_batch_ids or d["order_no"] in matched_order_nos]
    
    timeline = []
    for a in final_arrivals:
        if a["arrival_date"] and a["arrival_time"]:
            timeline.append({"event": f"Tanker Arrived ({a['tanker_id']})", "datetime": f"{a['arrival_date']} {a['arrival_time']}"})
    for l in final_labs:
        if l["sample_date"] and l["sample_time"]:
            timeline.append({"event": f"Sample Collected ({l['sample_id']})", "datetime": f"{l['sample_date']} {l['sample_time']}"})
    for d in final_dispatches:
        if d["dispatch_date"] and d["dispatch_time"]:
            timeline.append({"event": f"Dispatched ({d['tanker_no']})", "datetime": f"{d['dispatch_date']} {d['dispatch_time']}"})

    return api_response(True, "Trace records retrieved", data={
        "tanker": final_arrivals[0] if final_arrivals else {},
        "tanker_arrivals": final_arrivals,
        "lab_samples": final_labs,
        "production": {},
        "dispatch": final_dispatches,
        "timeline": timeline
    })


# ---------------------------------------------------------------------------
# ADMIN: LOGIN AUDIT LOGS (Section 2.3)
# ---------------------------------------------------------------------------

@require_auth(["SUPER_ADMIN"])
def admin_login_logs(request):
    """GET /api/admin/login-logs/ — SUPER_ADMIN only.
    Optional query params: ?user=<username>&success=true|false&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    """
    try:
        qs = LoginAuditLog.objects.select_related('user').all()

        # Filter by username
        user_filter = request.GET.get('user')
        if user_filter:
            qs = qs.filter(username_attempted=user_filter)

        # Filter by success
        success_filter = request.GET.get('success')
        if success_filter is not None:
            if success_filter.lower() in ('true', '1'):
                qs = qs.filter(success=True)
            elif success_filter.lower() in ('false', '0'):
                qs = qs.filter(success=False)

        # Filter by date range
        date_from = request.GET.get('date_from')
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        date_to = request.GET.get('date_to')
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)

        records = []
        for log in qs[:500]:  # limit to most recent 500
            records.append({
                "id": log.id,
                "username": log.username_attempted,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.strftime("%d-%m-%Y %H:%M:%S") if log.timestamp else "",
                "success": log.success,
                "user_agent": log.user_agent,
            })

        paginated = paginate_list(request, records)
        return api_response(True, "Login logs retrieved", data=paginated)

    except Exception as e:
        return api_response(False, str(e), status=400)


# ---------------------------------------------------------------------------
@require_auth(None)
def users_list(request):
    """GET /api/users/list/ - Returns basic list of active users for dropdowns."""
    try:
        users = User.objects.filter(is_active=True).order_by('username')
        data = [{"username": u.username, "lab": u.lab} for u in users]
        return api_response(True, "Users retrieved", data=data)
    except Exception as e:
        return api_response(False, str(e), status=400)

# ---------------------------------------------------------------------------

@require_auth(["SUPER_ADMIN"])
def admin_users_list(request):
    """GET /api/admin/users/ — Returns all users"""
    try:
        users = User.objects.all().order_by('username')
        data = [{
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "lab": u.lab,
            "is_active": u.is_active,
            "date_joined": u.date_joined.strftime("%Y-%m-%d %H:%M:%S")
        } for u in users]
        return api_response(True, "Users retrieved", data=data)
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth(["SUPER_ADMIN"])
def admin_users_create(request):
    """POST /api/admin/users/ — Creates a new user"""
    if request.method != "POST":
        return api_response(False, "POST required", status=405)
    
    try:
        from .serializers import UserCreateSerializer
        data = json.loads(request.body.decode("utf-8"))
        serializer = UserCreateSerializer(data=data)
        
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)
            
        v = serializer.validated_data
        
        if User.objects.filter(username=v["username"]).exists():
            return api_response(False, "Username already exists", status=400)
            
        user = User.objects.create_user(
            username=v["username"],
            password=v["password"],
            email=v.get("email", ""),
            role=v["role"],
            lab=v.get("lab", "")
        )
        
        return api_response(True, "User created successfully", data={"user_id": user.id})
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth(["SUPER_ADMIN"])
def admin_users_update(request, user_id):
    """PATCH /api/admin/users/<id>/ — Updates user info/role"""
    if request.method != "PATCH":
        return api_response(False, "PATCH required", status=405)
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return api_response(False, "User not found", status=404)
        
    try:
        from .serializers import UserUpdateSerializer
        data = json.loads(request.body.decode("utf-8"))
        serializer = UserUpdateSerializer(data=data)
        
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)
            
        v = serializer.validated_data
        if "email" in v: user.email = v["email"]
        if "role" in v: user.role = v["role"]
        if "lab" in v: user.lab = v["lab"]
        if "is_active" in v: user.is_active = v["is_active"]
        
        user.save()
        return api_response(True, "User updated successfully")
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth(["SUPER_ADMIN"])
def admin_users_reset_password(request, user_id):
    """POST /api/admin/users/<id>/reset-password/"""
    if request.method != "POST":
        return api_response(False, "POST required", status=405)
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return api_response(False, "User not found", status=404)
        
    try:
        from .serializers import PasswordResetSerializer
        data = json.loads(request.body.decode("utf-8"))
        serializer = PasswordResetSerializer(data=data)
        
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)
            
        from django.contrib.auth.password_validation import validate_password
        new_password = serializer.validated_data["new_password"]
        
        # Run validators
        validate_password(new_password, user)
        
        user.set_password(new_password)
        user.save()
        
        # Invalidate existing sessions
        AuthToken.objects.filter(user=user).delete()
        
        return api_response(True, "Password reset successfully")
    except Exception as e:
        return api_response(False, str(e), status=400)


# ---------------------------------------------------------------------------
# INSTRUMENT CALIBRATION (Section 3.4)
# ---------------------------------------------------------------------------

@require_auth()
def instrument_calibration_list(request):
    """GET /api/instruments/calibration/"""
    try:
        # If LAB_ADMIN, only see their lab unless filter applied
        qs = models.InstrumentCalibration.objects.all()
        
        lab_filter = request.GET.get('lab')
        if lab_filter:
             qs = qs.filter(lab=lab_filter)
        elif request.user_data["role"] in ["LAB_ADMIN", "EMPLOYEE"]:
             qs = qs.filter(lab=request.user_data["lab"])
             
        status_filter = request.GET.get('status')
        if status_filter:
             qs = qs.filter(status=status_filter.upper())
             
        data = [{
            "id": i.id,
            "instrument_id": i.instrument_id,
            "name": i.name,
            "lab": i.lab,
            "last_calibration": i.last_calibration_date.strftime("%Y-%m-%d") if i.last_calibration_date else None,
            "next_due": i.next_due_date.strftime("%Y-%m-%d"),
            "status": i.status,
            "calibrated_by": i.calibrated_by,
            "notes": i.notes
        } for i in qs]
        
        return api_response(True, "Calibrations retrieved", data=data)
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth()
def instrument_calibration_add(request):
    """POST /api/instruments/calibration/"""
    if request.method != "POST":
         return api_response(False, "POST required", status=405)
         
    try:
        from .serializers import InstrumentCalibrationSerializer
        data = json.loads(request.body.decode("utf-8"))
        serializer = InstrumentCalibrationSerializer(data=data)
        
        if not serializer.is_valid():
            return api_response(False, "Validation error", errors=serializer.errors, status=400)
            
        v = serializer.validated_data
        
        if models.InstrumentCalibration.objects.filter(instrument_id=v["instrument_id"]).exists():
             return api_response(False, "Instrument ID already exists", status=400)
             
        models.InstrumentCalibration.objects.create(
            instrument_id=v["instrument_id"],
            name=v["name"],
            lab=request.user_data["lab"],
            last_calibration_date=v.get("last_calibration_date"),
            next_due_date=v["next_due_date"],
            status=v.get("status", "PENDING"),
            calibrated_by=v.get("calibrated_by", ""),
            notes=v.get("notes", "")
        )
        return api_response(True, "Instrument added successfully")
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth()
def instrument_calibration_update(request, pk):
    """PATCH /api/instruments/calibration/<id>/"""
    if request.method != "PATCH":
         return api_response(False, "PATCH required", status=405)
         
    try:
         inst = models.InstrumentCalibration.objects.get(pk=pk)
         if request.user_data["role"] != "SUPER_ADMIN" and inst.lab != request.user_data["lab"]:
              return api_response(False, "Forbidden from editing other lab's instruments", status=403)
              
         data = json.loads(request.body.decode("utf-8"))
         
         if "status" in data: inst.status = data["status"]
         if "last_calibration_date" in data: inst.last_calibration_date = data["last_calibration_date"]
         if "next_due_date" in data: inst.next_due_date = data["next_due_date"]
         if "calibrated_by" in data: inst.calibrated_by = data["calibrated_by"]
         if "notes" in data: inst.notes = data["notes"]
         
         inst.save()
         return api_response(True, "Instrument updated")
    except Exception as e:
         return api_response(False, str(e), status=400)


# ---------------------------------------------------------------------------
# SHIFT HANDOVER (Section 3.5)
# ---------------------------------------------------------------------------

@require_auth()
def shift_handover_list(request):
    """GET /api/shifts/handovers/"""
    try:
        qs = models.ShiftHandover.objects.select_related('handed_over_by', 'handed_over_to').all()
        
        lab_filter = request.GET.get('lab')
        if lab_filter:
             qs = qs.filter(lab=lab_filter)
        elif request.user_data["role"] in ["LAB_ADMIN", "EMPLOYEE"]:
             qs = qs.filter(lab=request.user_data["lab"])
             
        data = [{
            "id": h.id,
            "lab": h.lab,
            "shift_date": h.shift_date.strftime("%Y-%m-%d"),
            "shift_type": h.shift_type,
            "handed_over_by": h.handed_over_by.username,
            "handed_over_to": h.handed_over_to.username,
            "notes": h.notes,
            "pending_tasks": h.pending_tasks,
            "equipment_status": h.equipment_status,
            "created_at": h.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for h in qs]
        
        paginated = paginate_list(request, data)
        return api_response(True, "Handovers retrieved", data=paginated)
    except Exception as e:
        return api_response(False, str(e), status=400)


@csrf_exempt
@require_auth()
def shift_handover_create(request):
    """POST /api/shifts/handovers/"""
    if request.method != "POST":
         return api_response(False, "POST required", status=405)
         
    try:
         from .serializers import ShiftHandoverSerializer
         data = json.loads(request.body.decode("utf-8"))
         serializer = ShiftHandoverSerializer(data=data)
         
         if not serializer.is_valid():
             return api_response(False, "Validation error", errors=serializer.errors, status=400)
             
         v = serializer.validated_data
         
         try:
             to_user = User.objects.get(username=v["handed_over_to_username"])
         except User.DoesNotExist:
             return api_response(False, "Receiving user not found", status=404)
             
         models.ShiftHandover.objects.create(
             lab=v["lab"],
             shift_date=v["shift_date"],
             shift_type=v["shift_type"],
             handed_over_by=request.user_data["user_obj"],
             handed_over_to=to_user,
             notes=v["notes"],
             pending_tasks=v.get("pending_tasks", ""),
             equipment_status=v.get("equipment_status", "")
         )
         
         return api_response(True, "Handover recorded successfully")
    except Exception as e:
         return api_response(False, str(e), status=400)


# ---------------------------------------------------------------------------
# EXPORTS & REPORTS (Section 3.2 & 3.3)
# ---------------------------------------------------------------------------

from django.http import HttpResponse
import openpyxl
from openpyxl.utils import get_column_letter

@require_auth()
def export_list_excel(request, dataset_type):
    """GET /api/export/excel/<dataset_type>/"""
    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"{dataset_type.capitalize()} Export"
        
        lab_filter = request.user_data["lab"] if request.user_data["role"] != "SUPER_ADMIN" else None

        if dataset_type == "labdata":
            qs = LabData.objects.all()
            if lab_filter: qs = qs.filter(lab=lab_filter)
            headers = ["Sample ID", "Tanker ID", "Product", "Moisture", "Purity", "Status", "Date"]
            ws.append(headers)
            for obj in qs:
                ws.append([obj.sample_id, obj.tanker_id, obj.product, obj.moisture, obj.purity, obj.status, obj.sample_date])
                
        elif dataset_type == "tankers":
            qs = TankerArrival.objects.all()
            if lab_filter: qs = qs.filter(lab=lab_filter)
            headers = ["Tanker ID", "Material", "Qty", "Supplier", "Date"]
            ws.append(headers)
            for obj in qs:
                ws.append([obj.tanker_id, obj.material, obj.quantity, obj.supplier, obj.arrival_date])
                
        else:
            return api_response(False, "Unsupported export type", status=400)

        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{dataset_type}_export.xlsx"'
        wb.save(response)
        return response

    except Exception as e:
        return api_response(False, str(e), status=500)


# 'from xhtml2pdf import pisa' causes a reportlab/freetype font-scanning 
# deadlock on some Windows environments which hangs the server indefinitely.
# We will disable it for now to allow the server to start successfully.
pisa = None

@require_auth()
def export_list_pdf(request, dataset_type):
    """GET /api/export/pdf/<dataset_type>/"""
    if not pisa:
        return api_response(False, "PDF generation library (xhtml2pdf) not installed", status=500)
        
    try:
        lab_filter = request.user_data["lab"] if request.user_data["role"] != "SUPER_ADMIN" else None
        
        html = f"<html><body><h1>{dataset_type.capitalize()} Report</h1><table border='1' cellpadding='5' cellspacing='0'><tr>"

        if dataset_type == "labdata":
            qs = LabData.objects.all()
            if lab_filter: qs = qs.filter(lab=lab_filter)
            html += "<th>Sample ID</th><th>Product</th><th>Status</th><th>Date</th></tr>"
            for obj in qs:
                html += f"<tr><td>{obj.sample_id}</td><td>{obj.product}</td><td>{obj.status}</td><td>{obj.sample_date}</td></tr>"
                
        elif dataset_type == "tankers":
            qs = TankerArrival.objects.all()
            if lab_filter: qs = qs.filter(lab=lab_filter)
            html += "<th>Tanker ID</th><th>Material</th><th>Qty</th><th>Date</th></tr>"
            for obj in qs:
                html += f"<tr><td>{obj.tanker_id}</td><td>{obj.material}</td><td>{obj.quantity}</td><td>{obj.arrival_date}</td></tr>"
                
        else:
            return api_response(False, "Unsupported export type", status=400)

        html += "</table></body></html>"

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{dataset_type}_report.pdf"'
        
        pisa_status = pisa.CreatePDF(html, dest=response)
        if pisa_status.err:
            return api_response(False, "PDF creation failed", status=500)
            
        return response
    except Exception as e:
        return api_response(False, str(e), status=500)


@require_auth()
def generate_coa(request, sample_id):
    """GET /api/reports/coa/<sample_id>/ -> PDF output"""
    if not pisa:
        return api_response(False, "PDF generation library (xhtml2pdf) not installed", status=500)
        
    try:
        sample = LabData.objects.get(sample_id=sample_id)
        
        # Verify access
        if request.user_data["role"] != "SUPER_ADMIN" and sample.lab != request.user_data["lab"]:
            return api_response(False, "Unauthorized to view this CoA", status=403)
            
        # Very basic CoA HTML structure
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Helvetica, sans-serif; }}
                .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }}
                .content table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                .content th, .content td {{ border: 1px solid #ccc; padding: 10px; text-align: left; }}
                .footer {{ margin-top: 50px; font-size: 12px; color: #666; }}
                .signatures {{ margin-top: 80px; width: 100%; }}
                .signatures td {{ padding-top: 40px; text-align: center; border-top: 1px solid #333; width: 33%; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>GUJARAT STATE FERTILIZERS & CHEMICALS LTD.</h2>
                <h1>CERTIFICATE OF ANALYSIS</h1>
            </div>
            
            <div class="info">
                <p><strong>Sample ID:</strong> {sample.sample_id}</p>
                <p><strong>Product:</strong> {sample.product}</p>
                <p><strong>Batch / Tanker:</strong> {sample.batch_id or sample.tanker_id or 'N/A'}</p>
                <p><strong>Date Analyzed:</strong> {sample.sample_date} {sample.sample_time}</p>
                <p><strong>Laboratory:</strong> {sample.lab}</p>
            </div>
            
            <div class="content">
                <table>
                    <tr>
                        <th style="background-color: #f5f5f5;">Parameter</th>
                        <th style="background-color: #f5f5f5;">Result</th>
                    </tr>
                    <tr>
                        <td>Moisture</td>
                        <td>{sample.moisture}</td>
                    </tr>
                    <tr>
                        <td>Purity</td>
                        <td>{sample.purity}</td>
                    </tr>
                </table>
            </div>
            
            <div class="footer">
                <p><strong>Status:</strong> {sample.status}</p>
                <p><strong>Remarks:</strong> {sample.anomaly_reason or 'Meets expected parameters'}</p>
                
                <table class="signatures">
                    <tr>
                        <td>Analyzed By: {sample.analyst}</td>
                        <td></td>
                        <td>Approved By (Lab Admin)</td>
                    </tr>
                </table>
                <p style="text-align: center; margin-top: 30px;">This is a system generated certificate.</p>
            </div>
        </body>
        </html>
        """
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="CoA_{sample.sample_id}.pdf"'
        
        pisa_status = pisa.CreatePDF(html, dest=response)
        if pisa_status.err:
            return api_response(False, "CoA generation failed", status=500)
            
        return response
        
    except LabData.DoesNotExist:
        return api_response(False, "Sample not found", status=404)
    except Exception as e:
        return api_response(False, str(e), status=500)
