from django.db import models
from django.utils import timezone

from apps.core.tenant import get_current_organization


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_deleted=False)

    def deleted(self):
        return self.filter(is_deleted=True)

    def delete(self):
        return super().update(is_deleted=True, deleted_at=timezone.now())


class SoftDeleteModel(TimeStampedModel):
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteQuerySet.as_manager()

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


class TenantScopedQuerySet(SoftDeleteQuerySet):
    def for_organization(self, organization):
        return self.filter(organization=organization)

    def apply_current_organization(self):
        organization = get_current_organization()
        if organization is None:
            return self
        return self.for_organization(organization)


class TenantScopedManager(models.Manager):
    def get_queryset(self):
        queryset = TenantScopedQuerySet(self.model, using=self._db)
        return queryset.apply_current_organization()

    def for_organization(self, organization):
        return self.get_queryset().for_organization(organization)


class TenantScopedModel(SoftDeleteModel):
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
    )

    objects = TenantScopedManager()
    all_objects = TenantScopedQuerySet.as_manager()

    class Meta:
        abstract = True


class ActivityAction(models.TextChoices):
    CREATE = "CREATE", "Create"
    UPDATE = "UPDATE", "Update"
    DELETE = "DELETE", "Delete"


def logo_upload_path(instance, filename):
    return f"organizations/{instance.organization_id}/companies/{instance.pk or 'new'}/{filename}"
