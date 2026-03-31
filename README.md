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

## S3 Notes

- Credentials are read from environment variables only
- No credentials are hardcoded in code
- For private assets, enable `AWS_USE_SIGNED_URLS=True`
- For simpler demos, expose bucket objects with controlled public read policy
- Keep uploaded logo files small to stay within AWS Free Tier limits

## Remaining Work

- Generate migrations
- Seed sample organizations, users, companies, and contacts
- Add create/edit/delete forms in the frontend
- Add tests and a demo script for the screen recording
