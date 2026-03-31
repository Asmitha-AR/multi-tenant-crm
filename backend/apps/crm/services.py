from apps.audits.services import create_activity_log
from apps.core.models import ActivityAction


def log_crm_activity(*, user, action, instance):
    create_activity_log(
        user=user,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=instance.pk,
    )

