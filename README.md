# Multi-Tenant CRM System

This repository is structured for the Associate Full Stack Developer technical assessment.

## Stack

- Backend: Django, Django REST Framework, Simple JWT, PostgreSQL-ready config
- Frontend: React, Vite, TypeScript, Zustand
- Storage: AWS S3 ready through `django-storages`

## Features Covered

- Multi-tenant organization data model
- Custom user with organization and role
- JWT authentication
- Role-based access control
- Company and contact CRUD endpoints
- Soft delete strategy
- Activity logging
- Versioned API routes under `/api/v1/`
- React pages for login, dashboard, companies, company detail, and activity logs

## Local Setup

1. Copy `.env.example` to `.env`
2. Install backend dependencies:
   `pip install -r backend/requirements.txt`
3. Install frontend dependencies:
   `cd frontend && npm install`
4. Run Django migrations and create a superuser
5. Start backend with `python manage.py runserver` from `backend/`
6. Start frontend with `npm run dev` from `frontend/`

### Quick Demo Setup

1. Create a virtual environment:
   `python3 -m venv .venv`
2. Install backend packages:
   `.venv/bin/pip install -r backend/requirements.txt`
3. Run migrations:
   `.venv/bin/python backend/manage.py migrate`
4. Seed demo data:
   `.venv/bin/python backend/manage.py seed_demo_data`
5. Start the backend:
   `.venv/bin/python backend/manage.py runserver 127.0.0.1:8000`
6. Start the frontend:
   `cd frontend && npm run dev`

### Demo Credentials

- `alpha_admin` / `alpha12345`
- `alpha_manager` / `alpha12345`
- `alpha_staff` / `alpha12345`
- `beta_admin` / `beta12345`

Use `alpha_admin` for the easiest full CRUD demo.

## S3 Notes

- Credentials are read from environment variables only
- No credentials are hardcoded in code
- For private assets, enable `AWS_USE_SIGNED_URLS=True`
- For simpler demos, expose bucket objects with controlled public read policy
- Keep uploaded logo files small to stay within AWS Free Tier limits

## Current State

- Initial migrations are included
- Demo seed command is included
- Frontend supports login, dashboard, companies, contacts, and activity logs
- Company and contact pages support create, edit, and delete flows with role-based restrictions
- Tenant isolation was verified with seeded users across two organizations

## Recommended Next Improvements

- Add automated API tests for permission and isolation coverage
- Add company logo upload UI for the S3 path
- Record the final walkthrough and architecture explanation
