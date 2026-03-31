# Multi-Tenant CRM System

This repository is structured for the Associate Full Stack Developer technical assessment.

## Stack

- Backend: Django, Django REST Framework, Simple JWT, PostgreSQL-ready config
- Frontend: React, Vite, TypeScript, Zustand
- Storage: AWS S3 ready through `django-storages`

## Features Covered

- Multi-tenant organization data model
- Middleware and manager-level tenant isolation
- Custom user with organization and role
- JWT authentication
- Role-based access control
- Subscription-plan enforcement for Pro-only features
- Company and contact CRUD endpoints
- Soft delete strategy
- Activity logging
- Versioned API routes under `/api/v1/`
- React pages for login, dashboard, companies, company detail, and activity logs

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

This creates sample organizations, users, companies, and contacts for testing the app.

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

## Quick Start Summary

If you want the shortest version, run these commands:

```bash
git clone https://github.com/Asmitha-AR/multi-tenant-crm.git
cd multi-tenant-crm
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..
cp .env.example .env
python backend/manage.py migrate
python backend/manage.py seed_demo_data
python backend/manage.py runserver localhost:8000
```

Then open another terminal:

```bash
cd multi-tenant-crm/frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

### Demo Credentials

- `alpha_admin` / `alpha12345`
- `alpha_manager` / `alpha12345`
- `alpha_staff` / `alpha12345`
- `beta_admin` / `beta12345`

Use `alpha_admin` for the easiest full CRUD demo.

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

## Presentation Assets

- Recording outline: [`docs/recording-script.md`](/Users/asmithathiraviyarasa/Desktop/Multi-Tenant%20CRM%20System/docs/recording-script.md)
- Submission checklist: [`docs/submission-checklist.md`](/Users/asmithathiraviyarasa/Desktop/Multi-Tenant%20CRM%20System/docs/submission-checklist.md)

## Current State

- Initial migrations are included
- Demo seed command is included
- Frontend supports login, dashboard, companies, contacts, and activity logs
- Company and contact pages support create, edit, and delete flows with role-based restrictions
- Tenant isolation was verified with seeded users across two organizations
- Tenant context is applied through middleware and tenant-aware model managers

## Recommended Next Improvements

- Add automated API tests for permission and isolation coverage
- Add company logo upload UI for the S3 path
- Record the final walkthrough and architecture explanation
