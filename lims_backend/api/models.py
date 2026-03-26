from django.db import models
from django.contrib.auth.models import AbstractUser
class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class User(AbstractUser):
    ROLE_CHOICES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('LAB_ADMIN', 'Lab Admin'),
        ('EMPLOYEE', 'Employee'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYEE')
    lab = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role} - {self.lab})"

# Inventory Models
class InventoryMaster(models.Model):
    material_id = models.CharField(max_length=50, unique=True, db_index=True)
    material_name = models.CharField(max_length=150, db_index=True)
    unit = models.CharField(max_length=20, default='MT')
    current_balance = models.FloatField(default=0.0)
    min_threshold = models.FloatField(default=0.0)
    last_updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    def __str__(self):
        return self.material_name

class InventoryInward(models.Model):
    inward_id = models.CharField(max_length=50, unique=True)
    datetime = models.DateTimeField(auto_now_add=True)
    material = models.ForeignKey(InventoryMaster, on_delete=models.CASCADE)
    qty_added = models.FloatField()
    supplier = models.CharField(max_length=200, blank=True)
    invoice_no = models.CharField(max_length=100, blank=True)
    added_by = models.CharField(max_length=100)
    remarks = models.TextField(blank=True)

class InventoryRequest(models.Model):
    request_id = models.CharField(max_length=50, unique=True, db_index=True)
    raw_material = models.CharField(max_length=150, db_index=True)
    quantity = models.FloatField()
    unit = models.CharField(max_length=20, default='MT')
    purpose = models.CharField(max_length=200, blank=True)
    employee_name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=50, blank=True)
    request_date = models.CharField(max_length=50, db_index=True)
    request_time = models.CharField(max_length=50)
    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='Pending')
    approved_by = models.CharField(max_length=100, blank=True)
    approval_time = models.CharField(max_length=50, blank=True)
    lab_id = models.CharField(max_length=50, blank=True)
    issued_by = models.CharField(max_length=100, blank=True)
    issued_at = models.CharField(max_length=50, blank=True)
    request_type = models.CharField(max_length=20, default='BORROW')

class InventoryApproval(models.Model):
    approval_timestamp = models.CharField(max_length=50)
    request_id = models.CharField(max_length=50)
    action_taken = models.CharField(max_length=50)
    admin_username = models.CharField(max_length=100)
    material_name = models.CharField(max_length=150)
    quantity = models.FloatField()
    request_status = models.CharField(max_length=50)

# Tanker Models
class TankerArrival(models.Model):
    tanker_id = models.CharField(max_length=50, unique=True, db_index=True)
    tanker_no = models.CharField(max_length=50, db_index=True)
    material = models.CharField(max_length=150, db_index=True)
    quantity = models.FloatField()
    supplier = models.CharField(max_length=200, blank=True)
    driver = models.CharField(max_length=100, blank=True)
    arrival_date = models.CharField(max_length=50, db_index=True)
    arrival_time = models.CharField(max_length=50)
    sampling_date = models.CharField(max_length=50, blank=True)
    sampling_time = models.CharField(max_length=50, blank=True)
    batch_no = models.CharField(max_length=100, blank=True)
    order_no = models.CharField(max_length=100, blank=True)
    created_by = models.CharField(max_length=100)
    timestamp = models.CharField(max_length=50)
    lab = models.CharField(max_length=50)
    is_deleted = models.BooleanField(default=False, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

class TankerHistory(models.Model):
    tanker_no = models.CharField(max_length=50, db_index=True)
    movement_type = models.CharField(max_length=50, db_index=True)
    material_or_product = models.CharField(max_length=150, db_index=True)
    quantity = models.FloatField()
    date = models.CharField(max_length=50, db_index=True)
    time = models.CharField(max_length=50)
    batch_no = models.CharField(max_length=100, blank=True)
    order_no = models.CharField(max_length=100, blank=True)
    source_destination = models.CharField(max_length=200, blank=True)
    recorded_by = models.CharField(max_length=100)
    recorded_at = models.CharField(max_length=50)
    lab = models.CharField(max_length=50)
    is_deleted = models.BooleanField(default=False, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

# Lab Data Model
class LabData(models.Model):
    tanker_id = models.CharField(max_length=50, blank=True, db_index=True)
    sample_id = models.CharField(max_length=50, unique=True, null=True, blank=True, db_index=True)
    batch_id = models.CharField(max_length=100, blank=True)
    order_number = models.CharField(max_length=100, blank=True)
    product = models.CharField(max_length=100, db_index=True)
    moisture = models.CharField(max_length=50, blank=True)
    purity = models.CharField(max_length=50, blank=True)
    analyst = models.CharField(max_length=100)
    sample_date = models.CharField(max_length=50, db_index=True)
    sample_time = models.CharField(max_length=50)
    lab = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='PENDING', db_index=True)
    anomaly_flag = models.CharField(max_length=20, default='NO', db_index=True)
    anomaly_score = models.FloatField(default=0.0)
    anomaly_reason = models.TextField(blank=True)
    review_status = models.CharField(max_length=50, blank=True)
    reviewed_by = models.CharField(max_length=100, blank=True)
    reviewed_at = models.CharField(max_length=50, blank=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

# Auth Token Model (DB-backed, replaces Signer tokens)
class AuthToken(models.Model):
    key = models.CharField(max_length=128, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_tokens')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Token for {self.user.username} (expires {self.expires_at})"


# ---------------------------------------------------------------------------
# System Alerts (persistent — replaces in-memory alerts)
# ---------------------------------------------------------------------------
class SystemAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('LOW_STOCK', 'Low Stock'),
        ('ANOMALY', 'Anomaly'),
        ('SYSTEM', 'System'),
    ]
    SEVERITY_CHOICES = [
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
        ('INFO', 'Info'),
    ]

    alert_id = models.CharField(max_length=50, unique=True, db_index=True)
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='INFO')
    title = models.CharField(max_length=255)
    message = models.TextField()
    lab = models.CharField(max_length=50, blank=True, null=True)  # null = system-wide
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, blank=True, null=True,
        related_name='resolved_alerts'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'lab']),
            models.Index(fields=['is_active', 'alert_type']),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.title} ({self.alert_id})"


# ---------------------------------------------------------------------------
# Login Audit Log (Section 2.3)
# ---------------------------------------------------------------------------
class LoginAuditLog(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='login_logs'
    )
    username_attempted = models.CharField(max_length=150)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)
    user_agent = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['success', '-timestamp']),
        ]

    def __str__(self):
        status = "SUCCESS" if self.success else "FAILED"
        return f"{self.username_attempted} — {status} — {self.timestamp}"


# ---------------------------------------------------------------------------
# Instrument Calibration (Section 3.4)
# ---------------------------------------------------------------------------
class InstrumentCalibration(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('OVERDUE', 'Overdue'),
    ]

    instrument_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    lab = models.CharField(max_length=50)
    last_calibration_date = models.DateField(null=True, blank=True)
    next_due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    calibrated_by = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['next_due_date']
        indexes = [
            models.Index(fields=['lab', 'status']),
            models.Index(fields=['next_due_date']),
        ]

    def __str__(self):
        return f"{self.name} ({self.instrument_id}) - Due: {self.next_due_date}"

# ---------------------------------------------------------------------------
# Shift Handover (Section 3.5)
# ---------------------------------------------------------------------------
class ShiftHandover(models.Model):
    lab = models.CharField(max_length=50)
    shift_date = models.DateField()
    shift_type = models.CharField(max_length=20) # e.g., 'Morning', 'Evening', 'Night'
    handed_over_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='handovers_given')
    handed_over_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='handovers_received')
    notes = models.TextField()
    pending_tasks = models.TextField(blank=True)
    equipment_status = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lab', '-shift_date']),
        ]

    def __str__(self):
        return f"{self.lab} Handover: {self.shift_date} {self.shift_type} ({self.handed_over_by.username} -> {self.handed_over_to.username})"
