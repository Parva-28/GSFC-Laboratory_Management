from django.shortcuts import render
from datetime import datetime
import json
import os
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from openpyxl import load_workbook

# ---------------------------------------------------------------------------
# AUTHENTICATION — Hardcoded credentials (no DB)
# ---------------------------------------------------------------------------

HARDCODED_USERS = {
    "Admin001":    {"password": "AD001",  "role": "CENTRAL_ADMIN",   "lab": "Central"},
    "Employee001": {"password": "EMP001", "role": "PLANT_EMPLOYEE",  "lab": "Plant-1"},
    "Employee002": {"password": "EMP002", "role": "PLANT_EMPLOYEE",  "lab": "Plant-2"},
    "Employee003": {"password": "EMP003", "role": "PLANT_EMPLOYEE",  "lab": "Plant-3"},
    "Employee004": {"password": "EMP004", "role": "PLANT_EMPLOYEE",  "lab": "Plant-4"},
    "Employee005": {"password": "EMP005", "role": "PLANT_EMPLOYEE",  "lab": "Plant-5"},
    "Employee006": {"password": "EMP006", "role": "PLANT_EMPLOYEE",  "lab": "Plant-6"},
    "Employee007": {"password": "EMP007", "role": "PLANT_EMPLOYEE",  "lab": "Plant-7"},
}


@csrf_exempt
def auth_login(request):
    """POST { username, password } → { ok, token, username, role, lab }"""
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "POST required"}, status=405)

    try:
        data     = json.loads(request.body.decode("utf-8"))
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()

        user = HARDCODED_USERS.get(username)

        if user is None or user["password"] != password:
            return JsonResponse({"ok": False, "error": "Invalid username or password"}, status=401)

        token = f"TOKEN-{username.upper()}"

        return JsonResponse({
            "ok":       True,
            "token":    token,
            "username": username,
            "role":     user["role"],
            "lab":      user["lab"],
        })

    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)


# ---------------------------------------------------------------------------
# INVENTORY ADD STOCK (Central Admin only — enforced on frontend)
# ---------------------------------------------------------------------------

INV_STOCK_HEADERS = [
    "Date", "Time", "Transaction_Type", "Material",
    "Quantity", "Unit", "Supplier_Name", "Invoice_LR_No",
    "Received_By", "Remarks", "Balance_Qty",
]

# Sheet name map (same as previous inventory views below)
_SHEET_FOR_MATERIAL = {
    "Nitrogen":           "Nitrogen",
    "Sulphuric Acid":     "Sulphuric_Acid",
    "Caustic Soda":       "Caustic_Soda",
    "Phosphoric Acid":    "Phosphoric_Acid",
    "Ammonia":            "Ammonia",
    "Potassium Chloride": "Potassium_Chloride",
}


@csrf_exempt
def inventory_add_stock(request):
    """POST → append an IN row to the relevant sheet in inventory.xlsx.
    Creates the sheet (with headers) if it does not yet exist.
    """
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "POST required"}, status=405)

    try:
        data        = json.loads(request.body.decode("utf-8"))
        material    = data.get("material", "").strip()
        quantity    = data.get("quantity", "")
        unit        = data.get("unit", "MT")
        supplier    = data.get("supplier", "")
        invoice_no  = data.get("invoice_no", "")
        stock_date  = data.get("date", "")
        stock_time  = data.get("time", "")
        remarks     = data.get("remarks", "")
        received_by = data.get("received_by", "Admin")

        if not material or not quantity:
            return JsonResponse({"ok": False, "error": "material and quantity are required"}, status=400)

        sheet_name = _SHEET_FOR_MATERIAL.get(material, material.replace(" ", "_"))
        inv_path   = os.path.join(os.getcwd(), "inventory.xlsx")

        wb = load_workbook(inv_path)

        # Create sheet with headers if it doesn't exist
        if sheet_name not in wb.sheetnames:
            ws = wb.create_sheet(sheet_name)
            ws.append(INV_STOCK_HEADERS)
        else:
            ws = wb[sheet_name]

        # Compute running balance.
        # New sheets (11 col) store Balance_Qty at index 10.
        # Old sheets (9 col) store Inward at index 4, Outward at index 5, Balance at index 6.
        # We detect which format by checking the header row.
        last_balance = 0
        header = [str(c.value).strip() if c.value else "" for c in next(ws.iter_rows(min_row=1, max_row=1))]
        # Find Balance_Qty column (new format) or fall back to computing from Inward/Outward
        balance_col = None
        inward_col  = None
        outward_col = None
        for i, h in enumerate(header):
            if h == "Balance_Qty":
                balance_col = i
            elif h in ("Inward_Qty", "Quantity") and inward_col is None:
                inward_col = i
            elif h in ("Outward_Qty",) and outward_col is None:
                outward_col = i

        for row in ws.iter_rows(min_row=2, values_only=True):
            if balance_col is not None and len(row) > balance_col and row[balance_col] is not None:
                try:
                    last_balance = float(row[balance_col])
                except (TypeError, ValueError):
                    pass
            elif inward_col is not None:
                # Old-format: recompute on the fly
                try:
                    last_balance += float(row[inward_col] or 0)
                except (TypeError, ValueError):
                    pass
                if outward_col is not None:
                    try:
                        last_balance -= float(row[outward_col] or 0)
                    except (TypeError, ValueError):
                        pass

        new_balance = last_balance + float(quantity)

        ws.append([
            stock_date,
            stock_time,
            "IN",
            material,
            float(quantity),
            unit,
            supplier,
            invoice_no,
            received_by,
            remarks,
            round(new_balance, 3),
        ])

        wb.save(inv_path)
        return JsonResponse({"ok": True, "new_balance": round(new_balance, 3)})

    except FileNotFoundError:
        return JsonResponse({"ok": False, "error": "inventory.xlsx not found beside manage.py"}, status=400)
    except PermissionError:
        return JsonResponse({"ok": False, "error": "Close inventory.xlsx (file is open/locked)"}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)


# ---------------------------------------------------------------------------
# INVENTORY VIEWS
# ---------------------------------------------------------------------------

# Sheet name map: material key (used in API) → Excel sheet name
MATERIAL_SHEET_MAP = {
    "Nitrogen":           "Nitrogen",
    "Sulphuric Acid":     "Sulphuric_Acid",
    "Caustic Soda":       "Caustic_Soda",
    "Phosphoric Acid":    "Phosphoric_Acid",
    "Ammonia":            "Ammonia",
    "Potassium Chloride": "Potassium_Chloride",
}

INVENTORY_PATH    = os.path.join(os.getcwd(), "inventory.xlsx")
INV_REQUESTS_PATH = os.path.join(os.getcwd(), "inventory_requests.xlsx")


def _compute_balance(sheet):
    """Sum all Inward_Qty (col E, index 4) minus Outward_Qty (col F, index 5).
    Row 1 is the header; col indices are 0-based from iter_rows values_only."""
    inward = 0
    outward = 0
    for row in sheet.iter_rows(min_row=2, values_only=True):
        try:
            inward += float(row[4] or 0)
        except (TypeError, ValueError):
            pass
        try:
            outward += float(row[5] or 0)
        except (TypeError, ValueError):
            pass
    return inward - outward


def inventory_get_balance(request):
    """GET → returns current balance for every raw material."""
    try:
        wb = load_workbook(INVENTORY_PATH)
        balances = []
        for material, sheet_name in MATERIAL_SHEET_MAP.items():
            ws = wb[sheet_name]
            balance = _compute_balance(ws)
            balances.append({"material": material, "balance": round(balance, 3)})
        return JsonResponse({"ok": True, "balances": balances})
    except FileNotFoundError:
        return JsonResponse({"ok": False, "error": "inventory.xlsx not found"}, status=400)
    except PermissionError:
        return JsonResponse({"ok": False, "error": "Close inventory.xlsx (file is open/locked)"}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)


@csrf_exempt
def inventory_borrow_request(request):
    """POST → create a new Pending borrow/withdraw request."""
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "POST required"}, status=405)
    try:
        data = json.loads(request.body.decode("utf-8"))

        material    = data.get("raw_material", "")
        quantity    = data.get("quantity", "")
        unit        = data.get("unit", "MT")
        purpose     = data.get("purpose", "")
        emp_name    = data.get("employee_name", "")
        emp_id      = data.get("employee_id", "")
        req_date    = data.get("request_date", "")
        req_time    = data.get("request_time", "")
        remarks     = data.get("remarks", "")

        if not material or not quantity or not emp_name:
            return JsonResponse({"ok": False, "error": "material, quantity and employee_name are required"}, status=400)

        request_id = "REQ-" + str(uuid.uuid4())[:8].upper()

        wb = load_workbook(INV_REQUESTS_PATH)
        ws = wb["Requests"]
        ws.append([
            request_id, material, quantity, unit, purpose,
            emp_name, emp_id, req_date, req_time, remarks,
            "Pending", "", ""
        ])
        wb.save(INV_REQUESTS_PATH)

        return JsonResponse({"ok": True, "request_id": request_id})

    except FileNotFoundError:
        return JsonResponse({"ok": False, "error": "inventory_requests.xlsx not found"}, status=400)
    except PermissionError:
        return JsonResponse({"ok": False, "error": "Close inventory_requests.xlsx (file is open/locked)"}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)


def inventory_get_requests(request):
    """GET → returns all requests (optionally filter by ?status=Pending)."""
    try:
        status_filter = request.GET.get("status", None)
        wb = load_workbook(INV_REQUESTS_PATH)
        ws = wb["Requests"]
        records = []
        for row in ws.iter_rows(min_row=2, values_only=True):
            if row[0] is None:
                continue
            r = {
                "request_id":    row[0],
                "raw_material":  row[1],
                "quantity":      row[2],
                "unit":          row[3],
                "purpose":       row[4],
                "employee_name": row[5],
                "employee_id":   row[6],
                "date":          row[7],
                "time":          row[8],
                "remarks":       row[9],
                "status":        row[10],
                "approved_by":   row[11],
                "approval_time": row[12],
            }
            if status_filter and r["status"] != status_filter:
                continue
            records.append(r)
        return JsonResponse({"ok": True, "requests": records})
    except FileNotFoundError:
        return JsonResponse({"ok": False, "error": "inventory_requests.xlsx not found"}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)


@csrf_exempt
def inventory_approve_reject(request):
    """POST → Admin approves or rejects a request.
    On APPROVE: appends OUT row to inventory.xlsx sheet and reduces balance.
    Payload: { request_id, action: 'APPROVE' | 'REJECT', approved_by }
    """
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "POST required"}, status=405)
    try:
        data = json.loads(request.body.decode("utf-8"))
        request_id  = data.get("request_id", "")
        action      = data.get("action", "").upper()   # APPROVE or REJECT
        approved_by = data.get("approved_by", "Admin")

        if action not in ("APPROVE", "REJECT"):
            return JsonResponse({"ok": False, "error": "action must be APPROVE or REJECT"}, status=400)

        # --- Update inventory_requests.xlsx ---
        req_wb = load_workbook(INV_REQUESTS_PATH)
        req_ws = req_wb["Requests"]

        found_row    = None
        material     = None
        quantity     = None
        emp_name     = None

        for row in req_ws.iter_rows(min_row=2):
            if str(row[0].value) == request_id:
                found_row = row
                material  = str(row[1].value)
                quantity  = float(row[2].value or 0)
                emp_name  = str(row[5].value)
                break

        if found_row is None:
            return JsonResponse({"ok": False, "error": f"Request ID {request_id} not found"}, status=404)

        approval_time = datetime.now().strftime("%d-%m-%Y %H:%M")
        new_status    = "Approved" if action == "APPROVE" else "Rejected"

        found_row[10].value = new_status
        found_row[11].value = approved_by
        found_row[12].value = approval_time
        req_wb.save(INV_REQUESTS_PATH)

        # --- If APPROVED, write OUT row to inventory.xlsx ---
        if action == "APPROVE":
            sheet_name = MATERIAL_SHEET_MAP.get(material)
            if not sheet_name:
                return JsonResponse({"ok": False, "error": f"Unknown material: {material}"}, status=400)

            inv_wb = load_workbook(INVENTORY_PATH)
            inv_ws = inv_wb[sheet_name]

            # Compute current balance before this OUT
            current_balance = _compute_balance(inv_ws)
            new_balance     = current_balance - quantity

            now    = datetime.now()
            d_str  = now.strftime("%d-%m-%Y")
            t_str  = now.strftime("%H:%M")

            inv_ws.append([
                d_str, t_str, "OUT",
                "",          # opening qty (not applicable for OUT)
                0,           # inward qty
                quantity,    # outward qty
                round(new_balance, 3),
                emp_name,
                request_id
            ])
            inv_wb.save(INVENTORY_PATH)

        return JsonResponse({"ok": True, "status": new_status})

    except FileNotFoundError as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)
    except PermissionError:
        return JsonResponse({"ok": False, "error": "Close Excel files (file is open/locked)"}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)


@csrf_exempt
def labdata_save(request):
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))

        sample_id = data.get("sample_id", "")
        batch_id = data.get("batch_id", "")
        order_number = data.get("order_number", "")
        product = data.get("product", "")
        moisture = data.get("moisture", "")
        purity = data.get("purity", "")
        analyst = data.get("analyst", "")
        sample_date = data.get("sample_date", "")
        sample_time = data.get("sample_time", "")

        excel_path = os.path.join(os.getcwd(), "lab_data.xlsx")  # keep lab_data.xlsx beside manage.py

        wb = load_workbook(excel_path)
        ws = wb.active
        ws.append([
            sample_id, batch_id, order_number, product,
            moisture, purity, analyst, sample_date, sample_time
        ])
        wb.save(excel_path)

        return JsonResponse({"ok": True})

    except FileNotFoundError:
        return JsonResponse({"ok": False, "error": "lab_data.xlsx not found beside manage.py"}, status=400)
    except PermissionError:
        return JsonResponse({"ok": False, "error": "Close lab_data.xlsx (file is open/locked)"}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)


@csrf_exempt
def tanker_arrival(request):
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))

        tanker_no = data.get("tanker_number", "")
        material = data.get("raw_material", "")
        quantity = data.get("quantity", "")
        supplier = data.get("supplier", "")
        driver = data.get("driver_name", "")
        arrival_date = data.get("arrival_date", "")
        arrival_time = data.get("arrival_time", "")
        sampling_date = data.get("sampling_date", "")
        sampling_time = data.get("sampling_time", "")
        batch_no = data.get("batch_number", "")
        order_no = data.get("order_number", "")

        excel_path = os.path.join(os.getcwd(), "tanker_arrival.xlsx")

        wb = load_workbook(excel_path)
        sheet = wb["Arrival"]

        sheet.append([
            tanker_no,
            material,
            quantity,
            supplier,
            driver,
            arrival_date,
            arrival_time,
            sampling_date,
            sampling_time,
            batch_no,
            order_no,
            "Central Admin",
            datetime.now().strftime("%d-%m-%Y %H:%M")
        ])

        wb.save(excel_path)

        # ---------- SAVE INTO TANKER RECORDS ----------
        history_path = os.path.join(os.getcwd(), "tanker_history.xlsx")
        history_wb = load_workbook(history_path)
        history_ws = history_wb["Tanker_Records"]

        history_ws.append([
            tanker_no,
            "ARRIVAL",
            material,
            quantity,
            arrival_date,
            arrival_time,
            batch_no,
            order_no,
            supplier,
            "Central Admin",
            datetime.now().strftime("%d-%m-%Y %H:%M")
        ])

        history_wb.save(history_path)


        return JsonResponse({"ok": True})

    except FileNotFoundError:
        return JsonResponse({"ok": False, "error": "tanker_arrival.xlsx not found beside manage.py"}, status=400)
    except PermissionError:
        return JsonResponse({"ok": False, "error": "Close tanker_arrival.xlsx (file is open/locked)"}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)
    
    


@csrf_exempt
def tanker_dispatch(request):
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))

        tanker_no = data.get("tanker_number", "")
        product = data.get("finished_product", "")
        quantity = data.get("quantity", "")
        driver = data.get("driver_name", "")
        dispatch_date = data.get("dispatch_date", "")
        dispatch_time = data.get("dispatch_time", "")
        destination = data.get("destination", "")
        customer = data.get("customer_name", "")
        batch_no = data.get("batch_number", "")
        order_no = data.get("order_number", "")

        excel_path = os.path.join(os.getcwd(), "tanker_dispatch.xlsx")

        wb = load_workbook(excel_path)
        sheet = wb["Dispatch"]

        sheet.append([
            tanker_no,
            product,
            quantity,
            driver,
            dispatch_date,
            dispatch_time,
            destination,
            customer,
            batch_no,
            order_no,
            "Central Admin",
            datetime.now().strftime("%d-%m-%Y %H:%M")
        ])

        wb.save(excel_path)

                # ---------- SAVE INTO TANKER RECORDS ----------
        history_path = os.path.join(os.getcwd(), "tanker_history.xlsx")
        history_wb = load_workbook(history_path)
        history_ws = history_wb["Tanker_Records"]

        history_ws.append([
            tanker_no,
            "DISPATCH",
            product,
            quantity,
            dispatch_date,
            dispatch_time,
            batch_no,
            order_no,
            destination,
            "Central Admin",
            datetime.now().strftime("%d-%m-%Y %H:%M")
        ])

        history_wb.save(history_path)


        return JsonResponse({"ok": True})

    except FileNotFoundError:
        return JsonResponse({"ok": False, "error": "tanker_dispatch.xlsx not found"}, status=400)
    except PermissionError:
        return JsonResponse({"ok": False, "error": "Close tanker_dispatch.xlsx"}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)



def tanker_history(request):
    try:
        history_path = os.path.join(os.getcwd(), "tanker_history.xlsx")

        wb = load_workbook(history_path)
        ws = wb["Tanker_Records"]   # 👈 CONFIRMED SHEET NAME

        records = []

        for row in ws.iter_rows(min_row=2, values_only=True):
            records.append({
                "tanker_number": row[0],
                "movement_type": row[1],
                "material_or_product": row[2],
                "quantity": row[3],
                "date": row[4],
                "time": row[5],
                "batch_number": row[6],
                "order_number": row[7],
                "source_destination": row[8],
                "recorded_by": row[9],
                "recorded_at": row[10],
            })

        return JsonResponse(records, safe=False)

    except FileNotFoundError:
        return JsonResponse(
            {"error": "tanker_history.xlsx not found"},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=400
        )
