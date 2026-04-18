-- Migration: Sykes & Sons Logistics vendor portal setup + role hardening
-- Safe to run multiple times (idempotent)

BEGIN;

-- bcrypt helpers for password_hash generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Ensure TGE Billing account is always admin
UPDATE users
SET role = 'admin'
WHERE lower(email) = 'tgebilling@gmail.com';

-- 2) Upsert Sykes company profile used for partner-branded invoices/portal
WITH upsert_company AS (
  INSERT INTO companies (
    name,
    legal_name,
    email,
    phone,
    address,
    city,
    state,
    zip,
    primary_color,
    tagline,
    invoice_prefix,
    tax_rate,
    is_active
  )
  SELECT
    'Sykes and Sons Logistics',
    'Sykes and Sons Logistics LLC',
    'info@sykesandsonlogistics.com',
    '(832) 555-0100',
    '77671 Highway 4',
    'Texas City',
    'TX',
    '77671',
    '#1e3a5f',
    'Moving Texas Forward',
    'SYS',
    0.00,
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM companies WHERE name = 'Sykes and Sons Logistics'
  )
  RETURNING id
),
company_id_cte AS (
  SELECT id FROM upsert_company
  UNION ALL
  SELECT id FROM companies WHERE name = 'Sykes and Sons Logistics' LIMIT 1
)

-- 3) Ensure Sykes vendor login exists
INSERT INTO users (
  username,
  password_hash,
  auth_provider,
  email,
  name,
  role,
  company_id
)
SELECT
  'sykes',
  crypt('sykes', gen_salt('bf')),
  'local',
  'info@sykesandsonlogistics.com',
  'Sykes and Sons Logistics',
  'vendor',
  (SELECT id FROM company_id_cte LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'sykes'
);

UPDATE users
SET
  role = 'vendor',
  auth_provider = 'local',
  company_id = (SELECT id FROM company_id_cte LIMIT 1)
WHERE username = 'sykes';

-- 4) Ensure captain/capital-member login exists
INSERT INTO users (
  username,
  password_hash,
  auth_provider,
  email,
  name,
  role,
  company_id
)
SELECT
  'sykes-captain',
  crypt('sykescaptain', gen_salt('bf')),
  'local',
  'captain@sykesandsonlogistics.com',
  'Sykes Capital Member',
  'staff_captain',
  (SELECT id FROM company_id_cte LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'sykes-captain'
);

UPDATE users
SET
  role = 'staff_captain',
  company_id = (SELECT id FROM company_id_cte LIMIT 1)
WHERE username = 'sykes-captain';

-- 5) Ensure vendor profile references sykes user and branding
INSERT INTO vendors (
  user_id,
  name,
  legal_name,
  contact_person,
  email,
  phone,
  address,
  city,
  state,
  zip,
  service_category,
  description,
  services,
  service_areas,
  primary_color,
  tagline,
  website_slug,
  website_enabled,
  onboarding_status,
  is_active
)
SELECT
  u.id,
  'Sykes and Sons Logistics',
  'Sykes and Sons Logistics LLC',
  'Joshua Sykes',
  'info@sykesandsonlogistics.com',
  '(832) 555-0100',
  '77671 Highway 4',
  'Texas City',
  'TX',
  '77671',
  'logistics',
  'Professional logistics and security services — freight management, camera installation, lock systems, and unit processing.',
  ARRAY['Freight Logistics','Camera Installation','Lock Systems','Unit Processing','Security Consulting'],
  ARRAY['Texas City','Houston','Galveston','League City'],
  '#1e3a5f',
  'Moving Texas Forward',
  'sykes-and-sons-logistics',
  true,
  'approved',
  true
FROM users u
WHERE u.username = 'sykes'
  AND NOT EXISTS (
    SELECT 1 FROM vendors v WHERE v.user_id = u.id
  );

UPDATE vendors
SET
  address = '77671 Highway 4',
  city = 'Texas City',
  state = 'TX',
  zip = '77671',
  primary_color = '#1e3a5f',
  website_enabled = true,
  onboarding_status = 'approved',
  is_active = true,
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE username = 'sykes' LIMIT 1);

COMMIT;
