from django.shortcuts import render


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
