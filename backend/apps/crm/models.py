from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import TenantScopedModel, logo_upload_path


class Company(TenantScopedModel):
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=120)
    country = models.CharField(max_length=120)
    logo = models.ImageField(upload_to=logo_upload_path, blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("organization", "name")]

    def __str__(self):
        return self.name


class Contact(TenantScopedModel):
    phone_validator = RegexValidator(
        regex=r"^\d{8,15}$",
        message="Phone number must contain 8 to 15 digits.",
    )

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="contacts")
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True, validators=[phone_validator])
    role = models.CharField(max_length=120)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "email"],
                condition=models.Q(is_deleted=False),
                name="unique_active_contact_email_per_company",
            )
        ]

    def __str__(self):
        return self.full_name

