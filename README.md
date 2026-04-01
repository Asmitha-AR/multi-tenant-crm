# Multi-Tenant CRM System

This repository is structured for the Associate Full Stack Developer technical assessment.

## Stack

- Backend: Django, Django REST Framework, Simple JWT, PostgreSQL-ready config
- Frontend: React, Vite, TypeScript, Zustand
- Storage: AWS S3 ready through `django-storages`

## Step-By-Step Setup From Clone To Run

Follow these steps if you are starting from scratch.

### 1. Clone the repository

```bash
git clone https://github.com/Asmitha-AR/multi-tenant-crm.git
cd multi-tenant-crm
```

### 2. Create and activate a Python virtual environment

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

If you do not want to activate it, you can run Python commands with `.venv/bin/python` and pip commands with `.venv/bin/pip`.

### 3. Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Create the environment file

Copy the example file:

```bash
cp .env.example .env
```

For local development, the default values are enough to get started with SQLite.

Important local setup notes:

- Keep `USE_SQLITE=True` for quick local setup
- Keep `DJANGO_DEBUG=True` during local development
- Keep `DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173`
- You can leave all AWS values empty unless you want real S3 uploads
- You can leave `VITE_API_BASE_URL` empty for local development because the frontend uses the Vite proxy

### 6. Run database migrations

```bash
.venv/bin/python backend/manage.py migrate
```

If your virtual environment is activated, you can also run:

```bash
python backend/manage.py migrate
```

### 7. Seed demo data

This creates realistic sample organizations, users, companies, contacts, and service records for testing the app.

```bash
.venv/bin/python backend/manage.py seed_demo_data
```

### 8. Start the backend server

From the project root:

```bash
.venv/bin/python backend/manage.py runserver localhost:8000
```

Keep this terminal running.

### 9. Start the frontend server

Open a second terminal, go to the project root, then run:

```bash
cd frontend
npm run dev
```

Keep this terminal running too.

### 10. Open the application

Frontend:

```text
http://localhost:5173
```

Backend API root:

```text
http://localhost:8000/api/v1/
```

### 11. Log in with a demo user

Recommended account for full demo access:

- Username: `alpha_admin`
- Password: `alpha12345`

Other seeded users:

- `alpha_manager` / `alpha12345`
- `alpha_staff` / `alpha12345`
- `beta_admin` / `beta12345`
- `beta_manager` / `beta12345`
- `beta_staff` / `beta12345`

### 12. Verify the project is working

Backend checks:

```bash
.venv/bin/python backend/manage.py check
```

Backend tests:

```bash
.venv/bin/python backend/manage.py test apps.crm
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Features Covered

- Multi-tenant organization data model
- Middleware and manager-level tenant isolation
- Custom user with organization and role
- JWT authentication
- Role-based access control
- Subscription-plan enforcement for Pro-only features
- PostgreSQL-ready and environment-based configuration
- AWS S3-ready company logo upload flow
- Logo preview, size validation, and remove/change actions
- Company and contact CRUD endpoints
- Dedicated contacts page with quick-add contact modal
- Dedicated services page for service catalog, company assignment, and status tracking
- Per-service add, edit, delete, and company assignment workflow
- Service catalog overview with reusable service list
- Service status tracking with `Active`, `Planned`, and `Paused`
- Company contact count visibility in list and detail views
- Company search, industry filter, and country filter
- Contact search, company filter, and role filter
- Service search, industry filter, country filter, and status filter
- Soft delete strategy
- Activity logging
- Activity log filters by action, model, user, and date range
- Dashboard analytics for industry mix, recent activity, and weekly contact additions
- Better loading, empty, and retry states in the frontend
- Versioned API routes under `/api/v1/`
- React pages for login, dashboard, companies, company detail, contacts, and activity logs

## Architecture Decisions

### Why a multi-tenant approach

This system is designed for multiple organizations to use the same application while keeping their data isolated.
Instead of running a separate deployment per organization, the app stores tenant ownership through the `organization`
relationship on core business records such as companies, contacts, and activity logs.

Why this approach:

- keeps the product scalable for multiple customers
- reduces infrastructure duplication
- allows role and subscription logic to be applied per organization
- matches the assessment requirement for shared-platform tenant isolation

### Why middleware and manager-level tenant isolation

Tenant isolation is implemented in layers rather than relying only on view logic.

- `CurrentOrganizationMiddleware` resolves the organization from the authenticated user or JWT request context
- tenant-aware managers and querysets automatically scope data to the current organization
- viewsets still apply explicit permission and filtering rules as an extra guard

This layered approach reduces the risk of accidental cross-tenant access by keeping tenant scoping as a safer default.

### Why JWT authentication

JWT was chosen because the frontend is a separate React client and the backend is exposed as a REST API.
Using JWT makes the authentication flow simple for a decoupled frontend/backend architecture.

Why JWT:

- works well with SPA clients
- keeps API requests stateless
- supports role-aware access after login through bearer tokens
- is easy to test in tools like Postman or browser-based API flows

### Why soft delete

Companies and contacts are soft deleted instead of being immediately removed from the database.
The system marks them with `is_deleted` and `deleted_at`, and normal queries only return active records.

Why soft delete:

- preserves auditability
- avoids losing business records too quickly
- fits CRM workflows where deleted records may need review or recovery
- works naturally with activity logging and safer operational controls

## Deployment And Production Readiness Notes

### Environment-based configuration

The project is configured through environment variables instead of hardcoded secrets or machine-specific values.
This makes it easier to move between local development, staging, and production environments.

Configured through environment variables:

- Django secret key
- debug mode
- allowed hosts and CORS origins
- database engine and connection details
- JWT token lifetimes
- AWS S3 storage settings

### PostgreSQL-ready setup

The backend supports a quick local SQLite workflow for development, but the settings are already prepared for
PostgreSQL in a more production-oriented deployment. This was chosen to keep local setup simple while still showing
that the application can be moved to a more scalable relational database without changing business logic.

### S3-ready storage

Company logo uploads are designed to work with local file storage in development and AWS S3 in a cloud environment.
The storage backend switches based on environment configuration, which keeps the application portable and avoids
hardcoded infrastructure dependencies.

Same codebase can use:

- local `media/` storage during development
- S3 bucket storage in production
- credentials outside the codebase

### Security considerations

Several choices were made with safer defaults in mind:

- JWT-based authenticated API access
- tenant isolation enforced in middleware, managers, and view permissions
- role-based access control for Admin, Manager, and Staff users
- subscription-based restrictions for premium features
- soft delete to avoid immediate destructive data loss
- environment-based secret handling instead of hardcoded credentials

Production extensions that could be added:

- HTTPS-only deployment
- stronger secret management through a cloud secret store
- stricter host and CORS configuration per environment
- production logging and monitoring
- rate limiting and additional API hardening

### Scalability notes

The system is structured to scale in a practical way for a CRM product:

- tenant-scoped data model allows many organizations to share one platform safely
- modular Django app structure keeps accounts, CRM, audits, and core logic separated
- versioned API routes under `/api/v1/` support future iteration
- PostgreSQL-ready configuration supports growth beyond local development
- S3-ready file storage avoids keeping uploaded files only on the application server

These decisions keep the assessment project closer to a realistic production-oriented CRM design.

### Seeded Demo Data Overview

- `Alpha Corp` uses the `Pro` plan
- `Beta Ventures` uses the `Basic` plan
- total seeded companies: `9`
- total seeded contacts: `18`
- total seeded service records: `26`
- total seeded demo users: `6`

## Common Issues

### Companies page returns `500`

Check your AWS environment variables in `.env`.

If you are not actively using S3, leave these empty:

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=
AWS_S3_CUSTOM_DOMAIN=
```

If you are using S3, make sure the region is only the region code, for example:

```env
AWS_S3_REGION_NAME=ap-southeast-1
```

Do not use display labels like:

```env
AWS_S3_REGION_NAME=Asia Pacific (Singapore) ap-southeast-1
```

### Frontend cannot reach backend

Make sure:

- backend is running on `localhost:8000`
- frontend is running on `localhost:5173`
- you restarted both servers after changing `.env`

## S3 Notes

- Credentials are read from environment variables only
- No credentials are hardcoded in code
- For private assets, enable `AWS_USE_SIGNED_URLS=True`
- For simpler demos, expose bucket objects with controlled public read policy
- Keep uploaded logo files small to stay within AWS Free Tier limits
- Frontend company forms support logo upload and send multipart requests to the API

## Subscription Plan Rules

- `Pro` organizations can upload company logos
- `Pro` organizations can access activity logs
- `Basic` organizations still have core CRM access but are blocked from those premium features

## Testing

The backend currently includes API tests for the main CRM risk areas:

- tenant isolation between organizations
- role-based permissions for Admin, Manager, and Staff
- subscription restrictions for Pro-only features
- company CRUD flow
- service CRUD flow and service status filtering
- soft delete behavior
- activity log creation and access
- contact email uniqueness validation

Run the backend API test suite with:

```bash
.venv/bin/python backend/manage.py test apps.crm
```

## Verification

- Backend checks: `.venv/bin/python backend/manage.py check`
- Backend tests: `.venv/bin/python backend/manage.py test apps.crm`
- Frontend build: `cd frontend && npm run build`

## Current State

- Initial migrations are included
- Demo seed command is included
- Frontend supports login, dashboard, services, companies, contacts, and activity logs
- Company and contact pages support create, edit, and delete flows with role-based restrictions
- Services page supports separate service records with per-company assignment and status tracking
- Tenant isolation was verified with seeded users across two organizations
- Tenant context is applied through middleware and tenant-aware model managers
