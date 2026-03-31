from django.db import models
from django.utils import timezone


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


class TenantScopedModel(SoftDeleteModel):
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
    )

    objects = TenantScopedQuerySet.as_manager()

    class Meta:
        abstract = True


class ActivityAction(models.TextChoices):
    CREATE = "CREATE", "Create"
    UPDATE = "UPDATE", "Update"
    DELETE = "DELETE", "Delete"


def logo_upload_path(instance, filename):
    return f"organizations/{instance.organization_id}/companies/{instance.pk or 'new'}/{filename}"
