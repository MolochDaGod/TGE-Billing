-- Migration: Add Companies table and new role system
-- This migration creates the multi-company infrastructure and role hierarchy

-- Step 1: Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  owner_id VARCHAR,
  license_number TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  logo_url TEXT,
  tagline TEXT,
  primary_color TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 8.25,
  invoice_prefix TEXT DEFAULT 'INV',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 2: Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_to VARCHAR REFERENCES users(id);

-- Step 3: Add company_id to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id VARCHAR REFERENCES companies(id);

-- Step 4: Create T.G.E. Billing as the first company
INSERT INTO companies (id, name, legal_name, email, phone, license_number, tax_rate, invoice_prefix, tagline)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'T.G.E. Billing',
  'T.G.E. Billing LLC',
  'tgebilling@gmail.com',
  '(555) 750-7779',
  '750779',
  8.25,
  'TGE',
  'We make power easy'
)
ON CONFLICT DO NOTHING;

-- Step 5: Create Notable Solution as second company (ready for onboarding)
INSERT INTO companies (id, name, legal_name, email, phone, invoice_prefix, tagline)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Notable Solution',
  'Notable Solution LLC',
  'info@notablesolution.com',
  '(555) 123-4567',
  'NS',
  'Building a business that will build business'
)
ON CONFLICT DO NOTHING;

-- Step 6: Update existing users with proper roles and company associations
-- Set admin users to 'pirate_king' role for JB Emmons
UPDATE users 
SET role = 'pirate_king'
WHERE email = 'grudgedev@gmail.com';

-- Set Chris as partner and associate with T.G.E. Billing
UPDATE users 
SET role = 'partner', company_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'chris@tgebilling.com';

-- Update T.G.E. Billing company owner to Chris
UPDATE companies
SET owner_id = (SELECT id FROM users WHERE email = 'chris@tgebilling.com')
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 7: Associate existing invoices with T.G.E. Billing
UPDATE invoices
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_reports_to ON users(reports_to);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
