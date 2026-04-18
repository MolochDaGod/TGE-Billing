-- =============================================================================
-- TGE Billing — PostgreSQL Deployment Setup & Best Practices
-- Run once on a fresh database, or safely on an existing one (IF NOT EXISTS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- trigram indexes for ILIKE search
CREATE EXTENSION IF NOT EXISTS "citext";       -- case-insensitive text (emails)

-- ---------------------------------------------------------------------------
-- 2. ENSURE ROLES COLUMN ACCEPTS capital_member
-- ---------------------------------------------------------------------------
-- The role column is plain text — no enum change needed.
-- This comment documents the valid values:
-- pirate_king | admin | partner | capital_member | staff_captain | staff |
-- vendor | sparky_ai | sparky | client

-- ---------------------------------------------------------------------------
-- 3. PERFORMANCE INDEXES
-- ---------------------------------------------------------------------------

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username     ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_company_id   ON users (company_id);

-- Sessions (expire sweep)
CREATE INDEX IF NOT EXISTS idx_session_expire     ON sessions (expire);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_company_id  ON invoices (company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id   ON invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by  ON invoices (created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date    ON invoices (due_date);

-- Invoice items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_vendor_id  ON clients (vendor_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients (company_id);
CREATE INDEX IF NOT EXISTS idx_clients_status     ON clients (status);
-- Trigram index for fast client name search
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm  ON clients USING gin (name gin_trgm_ops);

-- Vendors
CREATE INDEX IF NOT EXISTS idx_vendors_user_id    ON vendors (user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_slug       ON vendors (website_slug);
CREATE INDEX IF NOT EXISTS idx_vendors_status     ON vendors (onboarding_status);
CREATE INDEX IF NOT EXISTS idx_vendors_active     ON vendors (is_active);

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies (owner_id);

-- Jobs
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to   ON jobs (assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id     ON jobs (client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status        ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled     ON jobs (scheduled_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments (status);

-- ---------------------------------------------------------------------------
-- 4. ADMIN ACCOUNT — tgebilling@gmail.com (Chris)
--    Upsert so this is safe to run repeatedly.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id text;
  v_company_id text;
BEGIN
  -- Get or create T.G.E. Electrical company
  SELECT id INTO v_company_id FROM companies WHERE name = 'T.G.E. Electrical' LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO companies (id, name, legal_name, email, phone, invoice_prefix, primary_color, tax_rate, is_active)
    VALUES (
      gen_random_uuid()::text,
      'T.G.E. Electrical',
      'T.G.E. Electrical LLC',
      'tgebilling@gmail.com',
      '(832) 000-0000',
      'TGE',
      '#16a34a',
      8.25,
      true
    )
    RETURNING id INTO v_company_id;
    RAISE NOTICE 'Created T.G.E. Electrical company: %', v_company_id;
  END IF;

  -- Upsert admin user
  SELECT id INTO v_user_id FROM users WHERE email = 'tgebilling@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO users (id, email, name, username, role, auth_provider, company_id, created_at)
    VALUES (
      gen_random_uuid()::text,
      'tgebilling@gmail.com',
      'Chris — TGE Admin',
      'tge-admin',
      'admin',
      'local',
      v_company_id,
      NOW()
    );
    RAISE NOTICE 'Created admin user tgebilling@gmail.com — set password via /api/register or bcrypt update';
  ELSE
    UPDATE users
    SET role = 'admin', company_id = v_company_id
    WHERE id = v_user_id;
    RAISE NOTICE 'Updated tgebilling@gmail.com → role=admin';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. SYKES AND SONS LOGISTICS — correct address
-- ---------------------------------------------------------------------------
UPDATE vendors
SET address = 'Hwy 4', city = 'Texas City', state = 'TX', zip = '77591'
WHERE name = 'Sykes and Sons Logistics'
  AND (zip IS NULL OR zip != '77591');

UPDATE companies
SET address = 'Hwy 4', city = 'Texas City', state = 'TX', zip = '77591'
WHERE name = 'Sykes and Sons Logistics'
  AND (zip IS NULL OR zip != '77591');

-- ---------------------------------------------------------------------------
-- 6. CONNECTION POOLING SETTINGS (PgBouncer / Neon / Supabase)
-- ---------------------------------------------------------------------------
-- Recommended settings for production (apply in postgresql.conf or platform UI):
--
--   max_connections          = 100        (PgBouncer sits in front)
--   shared_buffers           = 256MB
--   effective_cache_size     = 768MB
--   work_mem                 = 4MB
--   maintenance_work_mem     = 64MB
--   wal_buffers              = 16MB
--   checkpoint_completion_target = 0.9
--   random_page_cost         = 1.1       (SSD/cloud storage)
--   effective_io_concurrency = 200
--   autovacuum               = on
--   log_min_duration_statement = 1000    (log slow queries > 1s)
--
-- For Neon / Supabase serverless:
--   Use the pooled connection string (port 6543) in DATABASE_URL for all
--   application queries. Use the direct string (port 5432) only for migrations.

-- ---------------------------------------------------------------------------
-- 7. DEPLOYMENT CHECKLIST (notes)
-- ---------------------------------------------------------------------------
-- [ ] Set DATABASE_URL in Vercel env vars (pooled connection string)
-- [ ] Set SESSION_SECRET to a 64-char random string
-- [ ] Set NODE_ENV=production
-- [ ] Run: npm run db:push  (or apply migrations manually)
-- [ ] Run this SQL file against the production database
-- [ ] Verify: SELECT role FROM users WHERE email = 'tgebilling@gmail.com';
-- [ ] Test: /sykes  → Sykes portal  (login: sykes / sykes)
-- [ ] Test: /tge    → TGE portal    (login: tge-vendor / tgevendor)
-- [ ] Test: /auth   → Admin login   (tgebilling@gmail.com)
-- =============================================================================
