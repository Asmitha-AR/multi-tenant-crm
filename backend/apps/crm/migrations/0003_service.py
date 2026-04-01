from django.db import migrations, models
import django.db.models.deletion


def migrate_company_services_to_service_records(apps, schema_editor):
    Company = apps.get_model("crm", "Company")
    Service = apps.get_model("crm", "Service")

    for company in Company.objects.filter(is_deleted=False):
        seen = set()
        for service_name in company.services or []:
            clean_name = (service_name or "").strip()
            if not clean_name:
                continue
            key = clean_name.lower()
            if key in seen:
                continue
            seen.add(key)
            Service.objects.get_or_create(
                organization_id=company.organization_id,
                company_id=company.id,
                name=clean_name,
                defaults={"is_deleted": False},
            )


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0002_company_services"),
    ]

    operations = [
        migrations.CreateModel(
            name="Service",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(db_index=True, default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("name", models.CharField(max_length=160)),
                ("company", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="service_items", to="crm.company")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="services", to="accounts.organization")),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.AddConstraint(
            model_name="service",
            constraint=models.UniqueConstraint(condition=models.Q(("is_deleted", False)), fields=("company", "name"), name="unique_active_service_name_per_company"),
        ),
        migrations.RunPython(migrate_company_services_to_service_records, migrations.RunPython.noop),
    ]
