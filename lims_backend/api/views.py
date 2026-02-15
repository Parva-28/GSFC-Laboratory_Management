from django.shortcuts import render
from datetime import datetime
import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from openpyxl import load_workbook


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
