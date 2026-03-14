# TGE Operations — Contractor Management Platform

A full-stack contractor management platform built for teams working under TGE. Manage invoices, estimates, clients, vendors, jobs, payments, and team communication from a single dashboard.

## Tech Stack

- **Frontend:** React 18 + Vite, Tailwind CSS, shadcn/ui, wouter routing, TanStack Query
- **Backend:** Express.js, Drizzle ORM, PostgreSQL (Neon)
- **Payments:** Stripe, PayPal
- **Email:** AgentMail (dynamic branding from company settings)
- **SMS:** Twilio
- **AI:** OpenAI / Puter AI (TGE Assistant)
- **Auth:** Local, Google OAuth, Web3Auth (Solana), Puter

## Features

### Core Operations
- **Invoices** — Create, edit, send, and track invoices with line items, tax calculation, PDF generation, and Stripe/PayPal payments
- **Estimates** — Full estimate lifecycle (draft → sent → accepted/rejected/expired), convert accepted estimates to invoices with one click
- **Clients** — CRM with status tracking, tags, lifetime value, follow-up reminders, preferred contact method
- **Jobs** — Scheduling, assignment, status tracking, location and notes
- **Vendors** — Vendor registration, profiles, public contractor sites, portfolio, testimonials

### Business Growth
- **Sales Pipeline** — Lead management with activities, stages, and value tracking
- **Marketing** — Content generation for social platforms
- **Bookings** — Appointment scheduling and calendar
- **Referrals** — Referral code system with tracking

### Communication
- **Team Messages** — Channel-based messaging (General, Crew, Admin) with role-based access
- **AI Assistant** — Context-aware assistant for invoicing, scheduling, and operations questions
- **Email Integration** — Branded emails (invoice, appointment, welcome, follow-up, review request) with dynamic company branding from `company_settings`
- **SMS Notifications** — Twilio-powered invoice, booking, and follow-up notifications

### Administration
- **Role-Based Access** — Owner, Admin, Partner, Team Lead, Staff, Vendor, Client roles with granular permissions
- **Compliance** — Permit tracking, inspection management
- **Company Settings** — Branding, contact info, license details (used across emails and UI)
- **User Management** — Role assignment, department management, reporting hierarchy
- **Onboarding Workflows** — Vendor-to-employee and employee-to-client onboarding with checklists and document templates

## Project Structure

```
client/src/
  pages/         — Route pages (invoices, estimates, clients, jobs, sales, etc.)
  components/    — Shared UI components (sidebar, AI assistant, etc.)
  hooks/         — Custom React hooks (useAuth, useToast, etc.)
  lib/           — Utilities (queryClient, auth, puter AI)
  contexts/      — React contexts (RoleSwitch)

server/
  routes.ts      — All API endpoints
  storage.ts     — Database access layer (IStorage / DbStorage)
  auth.ts        — Authentication middleware
  services/      — AgentMail, Twilio integrations

shared/
  schema.ts      — Drizzle ORM schema + Zod validation
  roles.ts       — Role definitions and display names
```

## Getting Started

1. Install dependencies: `npm install`
2. Set environment variables (see `.env.example` or deployment docs)
3. Run development server: `npm run dev`

## Environment Variables

Key variables needed:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `STRIPE_SECRET_KEY` / `VITE_STRIPE_PUBLIC_KEY` — Stripe payments
- `AGENTMAIL_API_KEY` — Email sending
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` — SMS
- `AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY` — AI
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `SESSION_SECRET` — Express session encryption
