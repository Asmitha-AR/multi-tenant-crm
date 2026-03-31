from apps.audits.models import ActivityLog


def create_activity_log(*, user, action, model_name, object_id):
    ActivityLog.objects.create(
        user=user,
        organization=user.organization,
        action=action,
        model_name=model_name,
        object_id=object_id,
    )

