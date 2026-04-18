# TGE-Billing Deployment Guide

## Architecture

| Layer | Platform | What it does |
|---|---|---|
| Frontend (React SPA) | **Vercel** | Static build served from CDN |
| Backend API (/api/*) | **Vercel Serverless** | Express wrapped in a serverless function |
| AI Worker | **Puter Serverless** | Chat, lead scoring, content generation |
| Database | **Neon PostgreSQL** | Managed Postgres (DATABASE_URL) |
| Payments | **Stripe** | Invoicing & payment processing |

## Repository

GitHub: `MolochDaGod/TGE-Billing` (branch: `main`)

## Quick Start (Local Dev)

```bash
npm install
npm run dev       # Express + Vite dev server on port 5000
```

## Deploy to Vercel

### 1. Connect GitHub repo to Vercel

1. Go to https://vercel.com/new
2. Import `MolochDaGod/TGE-Billing`
3. Vercel auto-detects `vercel.json` config

### 2. Set environment variables in Vercel dashboard

Required env vars (Settings > Environment Variables):

- `DATABASE_URL` — Neon PostgreSQL connection string
- `SESSION_SECRET` — Random secret for sessions
- `STRIPE_SECRET_KEY` — Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY` — Stripe publishable key
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth secret
- `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY` — Service account JSON
- `TWILIO_ACCOUNT_SID` — Twilio SID
- `TWILIO_AUTH_TOKEN` — Twilio auth token
- `TWILIO_PHONE_NUMBER` — Twilio phone
- `AGENTMAIL_API_KEY` — AgentMail key
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI key
- `VITE_TGEWORKER_URL` — Puter worker URL (set after deploying worker)
- `APP_URL` — Your production URL (e.g. https://tgebilling.pro)

### 3. Deploy

Push to `main` — Vercel auto-deploys.

### How Vercel serves the app

- `vercel.json` routes `/api/*` requests to `api/index.ts` (serverless Express)
- Everything else is served as static files from the Vite build (`dist/public`)
- The `vercel-build` script runs `vite build` to produce the frontend

### Limitation

WebSocket (realtime AI voice) is not supported on Vercel serverless. AI chat works via HTTP through the Express API routes and the Puter worker.

## PostgreSQL Runbook (Production)

### Apply required migrations

Run migrations before switching traffic to a new release:

```bash
npx drizzle-kit push
```

If you are manually applying SQL in Neon/PostgreSQL, run:

- `migrations/add_companies_and_roles.sql`
- `migrations/20260417_sykes_vendor_admin_setup.sql`

### What the Sykes migration does

- Ensures `tgebilling@gmail.com` is `admin`
- Creates/updates Sykes company profile (`Texas City, TX 77671, Highway 4`)
- Creates/updates Sykes vendor login (`sykes`) and capital-member/captain login (`sykes-captain`)
- Keeps vendor branding/invoice prefix (`SYS`) and portal profile in sync

## Deployment Best Practices

1. Use separate environments (`dev`, `preview`, `prod`) with isolated databases.
2. Run schema migrations before deploying app code that depends on new columns/tables.
3. Use strong secrets (`SESSION_SECRET`, API keys) and rotate them quarterly.
4. Enable Postgres PITR/backups and test restore quarterly.
5. Add health checks for `/api/user` and `/api/invoices` after each deploy.
6. Keep seed scripts idempotent and never rely on one-time manual SQL in production.
7. Monitor error rates and p95 latency in the first 30 minutes post-deploy.
8. Roll forward with a hotfix commit instead of editing prod data ad hoc unless emergency.
9. Restrict admin roles to named accounts and audit role changes monthly.
10. Store deployment and migration logs with release tags for traceability.

## Deploy Puter AI Worker

### Prerequisites

```bash
npm install -g puter-cli
puter login
```

### Automated deploy

```bash
node scripts/deploy-puter.js              # Deploy site + worker
node scripts/deploy-puter.js --site       # Frontend only
node scripts/deploy-puter.js --worker     # Worker only
```

### Manual worker activation

After uploading, activate the worker in the Puter browser console:

```js
const dep = await puter.hosting.create('tgeworker', 'tgeworker.js');
console.log('Worker URL:', dep.subdomain + '.puter.site');
```

Then add the worker URL as `VITE_TGEWORKER_URL` in Vercel env vars.

## Build Scripts

- `npm run dev` — Local development (Express + Vite HMR on port 5000)
- `npm run build` — Full production build (frontend + backend bundle)
- `npm run vercel-build` — Frontend-only build (used by Vercel)
- `npm run start` — Run production server locally (`node dist/index.js`)
- `npm run db:push` — Push Drizzle schema to database

## Project Structure

```
api/index.ts          — Vercel serverless entry point
client/               — React frontend (Vite)
server/               — Express backend
workers/tgeworker.js  — Puter AI worker
scripts/              — Deploy scripts
shared/               — Shared types & schemas
vercel.json           — Vercel routing config
```

---

**Last Updated**: March 14, 2026
**Status**: Ready for Vercel + Puter deployment
