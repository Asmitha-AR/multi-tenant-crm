from django.db import models

from apps.core.models import ActivityAction, TimeStampedModel


class ActivityLog(TimeStampedModel):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="activity_logs")
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="activity_logs",
    )
    action = models.CharField(max_length=20, choices=ActivityAction.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.PositiveBigIntegerField()

    class Meta:
        ordering = ["-created_at"]

