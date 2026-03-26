"""
GSFC LIMS — Alerts Service (DB-backed via SystemAlert model).
Replaces the old in-memory _alerts list.
"""
import uuid
from django.utils import timezone
from .models import SystemAlert


class AlertsLogService:
    """Create, resolve, and query SystemAlert records via the ORM."""

    @classmethod
    def create_alert(cls, alert_type, severity, title=None, message="",
                     lab=None, sample_id=None, batch_id=None):
        """
        Create a new active alert and return the alert_id.
        Accepts sample_id/batch_id for backward compatibility — they are
        folded into the title and message.
        """
        alert_id = f"ALT-{str(uuid.uuid4())[:8].upper()}"

        if title is None:
            title = f"{alert_type} alert"
            if sample_id:
                title += f" — Sample {sample_id}"

        if sample_id and sample_id not in message:
            message = f"Sample: {sample_id} | Batch: {batch_id or 'N/A'} | {message}"

        SystemAlert.objects.create(
            alert_id=alert_id,
            alert_type=alert_type if alert_type in ('LOW_STOCK', 'ANOMALY', 'SYSTEM') else 'SYSTEM',
            severity=severity if severity in ('HIGH', 'MEDIUM', 'LOW', 'INFO') else 'INFO',
            title=title,
            message=message,
            lab=lab,
        )
        return alert_id

    @classmethod
    def get_open_alerts(cls, status_filter=None, lab=None):
        """Return alerts as a list of dicts, optionally filtered by status/lab."""
        qs = SystemAlert.objects.all()

        if status_filter and status_filter.upper() == "OPEN":
            qs = qs.filter(is_active=True)
        elif status_filter and status_filter.upper() == "CLOSED":
            qs = qs.filter(is_active=False)

        if lab:
            # Include system-wide alerts (lab=None) plus lab-specific
            qs = qs.filter(models_lab_q(lab))

        alerts = []
        for a in qs:
            alerts.append({
                "alert_id": a.alert_id,
                "type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "message": a.message,
                "lab": a.lab,
                "is_active": a.is_active,
                "created_at": a.created_at.strftime("%d-%m-%Y %H:%M") if a.created_at else "",
                "resolved_at": a.resolved_at.strftime("%d-%m-%Y %H:%M") if a.resolved_at else "",
                "resolved_by": a.resolved_by.username if a.resolved_by else "",
            })
        return alerts

    @classmethod
    def close_alert_by_sample(cls, sample_id, closed_by_username, closed_at_str=None):
        """Close any active alerts whose message references the given sample_id."""
        from .models import User
        alerts = SystemAlert.objects.filter(
            is_active=True,
            message__icontains=sample_id,
        )
        try:
            user = User.objects.get(username=closed_by_username)
        except User.DoesNotExist:
            user = None

        for alert in alerts:
            alert.is_active = False
            alert.resolved_at = timezone.now()
            alert.resolved_by = user
            alert.save()

    @classmethod
    def resolve_alert(cls, alert_id, user):
        """Resolve a specific alert by alert_id.  Returns True on success."""
        try:
            alert = SystemAlert.objects.get(alert_id=alert_id, is_active=True)
        except SystemAlert.DoesNotExist:
            return False

        alert.is_active = False
        alert.resolved_at = timezone.now()
        alert.resolved_by = user
        alert.save()
        return True


def models_lab_q(lab):
    """Return a Q filter for lab-specific + system-wide alerts."""
    from django.db.models import Q
    return Q(lab=lab) | Q(lab__isnull=True)
