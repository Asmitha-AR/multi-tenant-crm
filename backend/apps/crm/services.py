from apps.audits.services import create_activity_log
from apps.core.models import ActivityAction
from apps.crm.models import Service


def log_crm_activity(*, user, action, instance):
    create_activity_log(
        user=user,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=instance.pk,
    )


def sync_company_service_snapshot(company):
    service_names = list(
        company.service_items.filter(is_deleted=False).order_by("name").values_list("name", flat=True)
    )
    if company.services != service_names:
        company.services = service_names
        company.save(update_fields=["services", "updated_at"])


def replace_company_services(company, service_names):
    normalized = []
    seen = set()
    for service_name in service_names:
        clean_name = service_name.strip()
        if not clean_name:
            continue
        key = clean_name.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(clean_name)

    active_services = list(company.service_items.filter(is_deleted=False))
    desired_keys = {name.lower() for name in normalized}

    for service in active_services:
        if service.name.lower() not in desired_keys:
            service.soft_delete()

    for service_name in normalized:
        existing_service = Service.all_objects.filter(
            company=company,
            organization=company.organization,
            name__iexact=service_name,
        ).first()
        if existing_service:
            updates = []
            if existing_service.name != service_name:
                existing_service.name = service_name
                updates.append("name")
            if existing_service.is_deleted:
                existing_service.is_deleted = False
                existing_service.deleted_at = None
                updates.extend(["is_deleted", "deleted_at"])
            if updates:
                updates.append("updated_at")
                existing_service.save(update_fields=updates)
            continue

        Service.objects.create(
            organization=company.organization,
            company=company,
            name=service_name,
        )

    sync_company_service_snapshot(company)
