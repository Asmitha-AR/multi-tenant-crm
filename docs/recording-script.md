# Recording Script

Use this as a 15 to 20 minute walkthrough outline.

## 1. Project Overview

- Explain that the system is a multi-tenant CRM built with Django REST Framework and React
- Mention each user belongs to an organization and all data is organization-scoped
- Mention role-based access: Admin, Manager, Staff

## 2. Backend Design

- Show `Organization`, custom `User`, `Company`, `Contact`, and `ActivityLog`
- Explain tenant enforcement:
  - organization foreign keys on tenant data
  - query scoping in viewsets
  - permission classes for role restrictions
- Explain soft delete and audit logging

## 3. Authentication Flow

- Log in as `alpha_admin`
- Show JWT-based login
- Show protected frontend routes

## 4. CRM Demo

- Create a company
- Upload a logo
- Open company detail
- Create and edit contacts
- Show activity logs updating automatically

## 5. Role Restrictions

- Log in as `alpha_staff`
- Show create access
- Show that edit/delete actions are blocked
- Log in as `alpha_manager`
- Show update access and delete restriction

## 6. Tenant Isolation

- Log in as `beta_admin`
- Show that Alpha organization companies and contacts are not visible

## 7. Production Notes

- Show `.env.example`
- Explain PostgreSQL-ready configuration
- Explain AWS S3 env vars and signed URL option
- Mention tests and seed command

