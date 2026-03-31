from django.db import models

from apps.core.models import ActivityAction, TimeStampedModel
from apps.core.tenant import get_current_organization


class ActivityLogQuerySet(models.QuerySet):
    def for_organization(self, organization):
        return self.filter(organization=organization)

    def apply_current_organization(self):
        organization = get_current_organization()
        if organization is None:
            return self
        return self.for_organization(organization)


class ActivityLogManager(models.Manager):
    def get_queryset(self):
        queryset = ActivityLogQuerySet(self.model, using=self._db)
        return queryset.apply_current_organization()

    def for_organization(self, organization):
        return self.get_queryset().for_organization(organization)


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

    objects = ActivityLogManager()
    all_objects = ActivityLogQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
