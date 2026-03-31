# Submission Checklist

- Push the latest code to GitHub
- Verify `.env` is not committed
- Confirm `.env.example` contains all needed variables
- Run backend checks: `python backend/manage.py check`
- Run backend tests: `python backend/manage.py test`
- Run frontend build: `cd frontend && npm run build`
- Start backend and frontend locally
- Record a 15 to 20 minute walkthrough
- Mention multi-tenancy, RBAC, soft delete, audit logs, and S3 strategy in the recording
