# UFriends Project Requirements Summary

This document summarizes the functional scope inferred from the repository and aligns with a staged build-out plan.

## Core Personas
- End User: purchases services and submits verification/KYC requests.
- Admin: manages pricing, approvals, assignments, reports, logs, and settings.
- Marketer: enrolls in marketing program, tracks performance.

## Major Modules
- Authentication & Profiles
- KYC (BVN/NIN capture, document uploads, status tracking)
- Services Catalog (Airtime, Data, Bills, BVN, NIN, CAC, Education, Verification)
- Agency Banking (POS requests, Marketer program)
- Software Development Requests (User submission, Admin assignment, delivery)
- Wallet & Payments (top-up, transactions, invoices)
- Training (free/premium, enrollment, materials)
- Admin Portal (pricing, reports, logs, settings)
- Notifications (toasts, email/SMS, system messages)

## Key User Flows
- Sign up / login, view dashboard, complete KYC.
- Browse services, view dynamic pricing, submit requests.
- Pay for airtime/data/bills and receive receipts.
- Submit POS terminal request; admin approval and assignment.
- Submit software-dev project; admin assigns developer; user tracks progress.
- Manage wallet; top-up; purchases deduct balance.

## Admin Flows
- Adjust service pricing; manage API/vendor settings.
- Review KYC/BVN/NIN requests; approve/reject, audit logs.
- View reports: revenue, weekly requests, service distribution.
- Manage software-dev requests: assignment, delivery, finance and costs.
- Manage users, marketers, training sessions.

## Non-Functional & Integrations
- Persistence with PostgreSQL (Prisma ORM).
- Payments via Paystack/Flutterwave.
- Vendors for Airtime/Data/Bills; BVN/NIN verification providers.
- Storage for documents (S3-compatible).
- Background jobs for verification webhook processing.
- Observability: audit logs, metrics, rate limiting, input validation.

## Initial Endpoints (Route Handlers)
- `/api/health` — health check.
- `/api/auth/*` — signup/login/session/logout.
- `/api/kyc/*` — submit KYC, upload docs, status.
- `/api/services/*` — list services and pricing.
- `/api/bvn/*`, `/api/nin/*` — requests & verification.
- `/api/airtime/*`, `/api/data/*`, `/api/bills/*` — purchases and vendors.
- `/api/pos/*` — POS requests and status.
- `/api/software/*` — project requests, assignment, delivery.
- `/api/wallet/*`, `/api/payments/*` — wallet & payment gateway.
- `/api/admin/*` — reports, pricing, settings.

## Initial Data Models (Prisma)
- User, Profile, KycRequest, Document
- ServiceCategory, Service, ServicePricing
- BvnRequest, NinRequest, Vendor, BillPayment, Transaction
- Wallet, Payment, PosRequest, Agent
- SoftwareRequest, Assignment, DeliveryFile
- MarketerProfile, TrainingSession, Enrollment
- Notification, SystemSettings, ApiSettings, AuditLog

## Milestone Plan
See project build plan tracked in repo milestones and README.