"""
GSFC LIMS — DRF Serializers for API input validation (Section 2.4).

Every POST/PATCH endpoint that previously used raw request.data access
now validates through an explicit serializer with defined fields.
"""

from rest_framework import serializers


# ---------------------------------------------------------------------------
# Auth & User Management (Section 3.1)
# ---------------------------------------------------------------------------

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(max_length=128, required=True)

class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(max_length=128, required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[
        "SUPER_ADMIN", "LAB_ADMIN", "EMPLOYEE", "VIEWER"
    ], required=True)
    lab = serializers.CharField(max_length=50, required=False, allow_blank=True)

class UserUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[
        "SUPER_ADMIN", "LAB_ADMIN", "EMPLOYEE", "VIEWER"
    ], required=False)
    lab = serializers.CharField(max_length=50, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)

class PasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(max_length=128, required=True)


# ---------------------------------------------------------------------------
# Tanker
# ---------------------------------------------------------------------------

class TankerArrivalSerializer(serializers.Serializer):
    tanker_number = serializers.CharField(max_length=50, required=True)
    raw_material = serializers.CharField(max_length=150, required=True)
    quantity = serializers.FloatField(required=True, min_value=0)
    supplier = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    driver_name = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    arrival_date = serializers.CharField(max_length=50, required=True)
    arrival_time = serializers.CharField(max_length=50, required=True)
    sampling_date = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    sampling_time = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    batch_number = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    order_number = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)


class TankerDispatchSerializer(serializers.Serializer):
    tanker_number = serializers.CharField(max_length=50, required=True)
    finished_product = serializers.CharField(max_length=150, required=True)
    quantity = serializers.FloatField(required=True, min_value=0)
    driver_name = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    dispatch_date = serializers.CharField(max_length=50, required=True)
    dispatch_time = serializers.CharField(max_length=50, required=True)
    destination = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    customer_name = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    batch_number = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    order_number = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)


# ---------------------------------------------------------------------------
# Lab Data (static form)
# ---------------------------------------------------------------------------

class LabDataSaveSerializer(serializers.Serializer):
    tanker_id = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    sample_id = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    batch_id = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    order_number = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    product = serializers.CharField(max_length=100, required=True)
    moisture = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    purity = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    analyst = serializers.CharField(max_length=100, required=True)
    sample_date = serializers.CharField(max_length=50, required=True)
    sample_time = serializers.CharField(max_length=50, required=True)


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

class InventoryBorrowSerializer(serializers.Serializer):
    raw_material = serializers.CharField(max_length=150, required=True)
    quantity = serializers.FloatField(required=True, min_value=0.001)
    unit = serializers.CharField(max_length=20, required=False, default="MT")
    purpose = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    employee_name = serializers.CharField(max_length=100, required=True)
    employee_id = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    request_date = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    request_time = serializers.CharField(max_length=50, required=False, default="", allow_blank=True)
    remarks = serializers.CharField(required=False, default="", allow_blank=True)
    request_type = serializers.ChoiceField(choices=["BORROW", "ADD"], default="BORROW")


class InventoryAddStockSerializer(serializers.Serializer):
    material = serializers.CharField(max_length=150, required=True)
    quantity = serializers.FloatField(required=True, min_value=0.001)
    unit = serializers.CharField(max_length=20, required=False, default="MT")
    supplier = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    invoice_no = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    remarks = serializers.CharField(required=False, default="", allow_blank=True)


class InventoryApproveRejectSerializer(serializers.Serializer):
    request_id = serializers.CharField(max_length=50, required=True)
    action = serializers.ChoiceField(choices=["APPROVE", "REJECT", "ISSUE"], required=True)
    approved_by = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)


# ---------------------------------------------------------------------------
# Instrument Calibration (Section 3.4)
# ---------------------------------------------------------------------------

class InstrumentCalibrationSerializer(serializers.Serializer):
    instrument_id = serializers.CharField(max_length=50, required=True)
    name = serializers.CharField(max_length=150, required=True)
    last_calibration_date = serializers.DateField(required=False, allow_null=True)
    next_due_date = serializers.DateField(required=True)
    status = serializers.ChoiceField(choices=["PENDING", "COMPLETED", "OVERDUE"], default="PENDING")
    calibrated_by = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    notes = serializers.CharField(required=False, default="", allow_blank=True)


# ---------------------------------------------------------------------------
# Shift Handover (Section 3.5)
# ---------------------------------------------------------------------------

class ShiftHandoverSerializer(serializers.Serializer):
    shift_date = serializers.DateField(required=True)
    shift_type = serializers.CharField(max_length=20, required=True)
    handed_over_to_username = serializers.CharField(max_length=150, required=True)
    lab = serializers.CharField(max_length=50, required=True)
    notes = serializers.CharField(required=True)
    pending_tasks = serializers.CharField(required=False, default="", allow_blank=True)
    equipment_status = serializers.CharField(required=False, default="", allow_blank=True)
