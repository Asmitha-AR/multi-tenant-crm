from django.core.management.base import BaseCommand

from apps.accounts.models import Organization, User
from apps.crm.models import Company, Contact, Service
from apps.crm.services import replace_company_services


class Command(BaseCommand):
    help = "Seed demo organizations, users, companies, and contacts for the assessment."

    def handle(self, *args, **options):
        organizations = {
            "alpha": self.upsert_organization(
                name="Alpha Corp",
                subscription_plan=Organization.SubscriptionPlan.PRO,
            ),
            "beta": self.upsert_organization(
                name="Beta Ventures",
                subscription_plan=Organization.SubscriptionPlan.BASIC,
            ),
        }

        self.seed_users(organizations)
        self.seed_companies_and_contacts(organizations)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write("Organizations: 2")
        self.stdout.write("Companies: 9")
        self.stdout.write("Contacts: 18")

    def upsert_organization(self, name, subscription_plan):
        organization, _ = Organization.objects.get_or_create(
            name=name,
            defaults={"subscription_plan": subscription_plan},
        )
        if organization.subscription_plan != subscription_plan:
            organization.subscription_plan = subscription_plan
            organization.save(update_fields=["subscription_plan"])
        return organization

    def seed_users(self, organizations):
        user_specs = [
            ("alpha_admin", "alpha12345", organizations["alpha"], User.Role.ADMIN),
            ("alpha_manager", "alpha12345", organizations["alpha"], User.Role.MANAGER),
            ("alpha_staff", "alpha12345", organizations["alpha"], User.Role.STAFF),
            ("beta_admin", "beta12345", organizations["beta"], User.Role.ADMIN),
            ("beta_manager", "beta12345", organizations["beta"], User.Role.MANAGER),
            ("beta_staff", "beta12345", organizations["beta"], User.Role.STAFF),
        ]

        for username, password, organization, role in user_specs:
            self.create_user(username, password, organization, role)

    def seed_companies_and_contacts(self, organizations):
        company_specs = [
            {
                "organization": organizations["alpha"],
                "name": "Acme Logistics",
                "industry": "Logistics",
                "country": "Sri Lanka",
                "services": [
                    ("Freight Coordination", Service.Status.ACTIVE),
                    ("Warehouse Support", Service.Status.ACTIVE),
                    ("Route Planning", Service.Status.PLANNED),
                ],
                "contacts": [
                    ("Kamal Perera", "operations@acme.test", "94771234567", "Operations Lead"),
                    ("Nadeesha Silva", "accounts@acme.test", "94779876543", "Account Manager"),
                ],
            },
            {
                "organization": organizations["alpha"],
                "name": "Nova Health",
                "industry": "Healthcare",
                "country": "Singapore",
                "services": [
                    ("Clinic Setup", Service.Status.ACTIVE),
                    ("Health Data Support", Service.Status.ACTIVE),
                    ("Care Operations Consulting", Service.Status.PLANNED),
                ],
                "contacts": [
                    ("Sara Lim", "hello@nova.test", "6581234567", "Partnership Manager"),
                    ("Daniel Koh", "growth@nova.test", "6587654321", "Business Lead"),
                ],
            },
            {
                "organization": organizations["alpha"],
                "name": "Atlas Trading",
                "industry": "Retail",
                "country": "United Arab Emirates",
                "services": [
                    ("Procurement Advisory", Service.Status.ACTIVE),
                    ("Vendor Sourcing", Service.Status.ACTIVE),
                    ("Retail Expansion Support", Service.Status.PLANNED),
                ],
                "contacts": [
                    ("Nimal Perera", "nimal@atlas.test", "971501112223", "Regional Buyer"),
                    ("Farah Khan", "farah@atlas.test", "971501119999", "Procurement Director"),
                ],
            },
            {
                "organization": organizations["alpha"],
                "name": "BlueWave Retail",
                "industry": "Retail",
                "country": "India",
                "services": [
                    ("Store Rollout", Service.Status.ACTIVE),
                    ("Category Planning", Service.Status.PLANNED),
                    ("Merchandising Support", Service.Status.ACTIVE),
                ],
                "contacts": [
                    ("Anika Rao", "anika@bluewave.test", "919876543210", "Store Expansion Manager"),
                    ("Rishi Menon", "rishi@bluewave.test", "919123456789", "Category Lead"),
                ],
            },
            {
                "organization": organizations["alpha"],
                "name": "Orbit Tech",
                "industry": "Software",
                "country": "Malaysia",
                "services": [
                    ("CRM Implementation", Service.Status.ACTIVE),
                    ("Support Operations", Service.Status.ACTIVE),
                    ("Customer Success Enablement", Service.Status.PAUSED),
                ],
                "contacts": [
                    ("Ishan Fernando", "ishan@orbit.test", "60123456789", "Solutions Consultant"),
                    ("Mei Tan", "mei@orbit.test", "60199887766", "Customer Success Lead"),
                ],
            },
            {
                "organization": organizations["beta"],
                "name": "Beta Foods",
                "industry": "Food & Beverage",
                "country": "India",
                "services": [
                    ("Distribution Planning", Service.Status.ACTIVE),
                    ("Supplier Coordination", Service.Status.PLANNED),
                ],
                "contacts": [
                    ("Arjun Patel", "arjun@betafoods.test", "918888777666", "Distribution Manager"),
                    ("Kavya Shah", "kavya@betafoods.test", "917777666555", "Procurement Lead"),
                ],
            },
            {
                "organization": organizations["beta"],
                "name": "Cedar Manufacturing",
                "industry": "Manufacturing",
                "country": "Sri Lanka",
                "services": [
                    ("Production Oversight", Service.Status.ACTIVE),
                    ("Vendor Management", Service.Status.ACTIVE),
                    ("Plant Coordination", Service.Status.PAUSED),
                ],
                "contacts": [
                    ("Tharindu Jayasuriya", "tharindu@cedar.test", "94771230000", "Plant Supervisor"),
                    ("Ayesha Nawarathne", "ayesha@cedar.test", "94774567890", "Vendor Coordinator"),
                ],
            },
            {
                "organization": organizations["beta"],
                "name": "Summit Services",
                "industry": "Business Services",
                "country": "Bangladesh",
                "services": [
                    ("Client Support", Service.Status.ACTIVE),
                    ("Operations Delivery", Service.Status.ACTIVE),
                    ("Managed Services", Service.Status.PLANNED),
                ],
                "contacts": [
                    ("Nusrat Jahan", "nusrat@summit.test", "8801712345678", "Client Services Lead"),
                    ("Tariq Hasan", "tariq@summit.test", "8801812345678", "Operations Manager"),
                ],
            },
            {
                "organization": organizations["beta"],
                "name": "Luma Interiors",
                "industry": "Design",
                "country": "Thailand",
                "services": [
                    ("Interior Planning", Service.Status.ACTIVE),
                    ("Project Design", Service.Status.ACTIVE),
                    ("Client Presentation Support", Service.Status.PLANNED),
                ],
                "contacts": [
                    ("Pimchanok Suriya", "pim@luma.test", "66812345678", "Project Designer"),
                    ("Narin Chai", "narin@luma.test", "66887654321", "Client Partner"),
                ],
            },
        ]

        for company_spec in company_specs:
            company = self.upsert_company(
                organization=company_spec["organization"],
                name=company_spec["name"],
                industry=company_spec["industry"],
                country=company_spec["country"],
                services=company_spec.get("services", []),
            )
            for full_name, email, phone, role in company_spec["contacts"]:
                self.upsert_contact(
                    organization=company_spec["organization"],
                    company=company,
                    full_name=full_name,
                    email=email,
                    phone=phone,
                    role=role,
                )

    def upsert_company(self, organization, name, industry, country, services):
        company, _ = Company.objects.get_or_create(
            organization=organization,
            name=name,
            defaults={
                "industry": industry,
                "country": country,
                "services": [item[0] if isinstance(item, tuple) else item for item in services],
            },
        )
        company.industry = industry
        company.country = country
        company.services = [item[0] if isinstance(item, tuple) else item for item in services]
        company.save(update_fields=["industry", "country", "services"])
        replace_company_services(company, [item[0] if isinstance(item, tuple) else item for item in services])
        for item in services:
            service_name, status = item if isinstance(item, tuple) else (item, Service.Status.ACTIVE)
            Service.objects.filter(company=company, name__iexact=service_name).update(status=status)
        return company

    def upsert_contact(self, organization, company, full_name, email, phone, role):
        contact, _ = Contact.objects.get_or_create(
            organization=organization,
            company=company,
            email=email,
            defaults={
                "full_name": full_name,
                "phone": phone,
                "role": role,
            },
        )
        contact.full_name = full_name
        contact.phone = phone
        contact.role = role
        contact.save(update_fields=["full_name", "phone", "role"])

    def create_user(self, username, password, organization, role):
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={
                "organization": organization,
                "role": role,
                "email": f"{username}@example.com",
            },
        )
        user.organization = organization
        user.role = role
        user.email = f"{username}@example.com"
        user.set_password(password)
        user.save(update_fields=["organization", "role", "email", "password"])
