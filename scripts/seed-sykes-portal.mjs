/**
 * seed-sykes-portal.mjs
 * Sets up Sykes and Sons Logistics as a vendor/user of TGE Billing.
 *  - User: username=sykes / password=sykes  (role: vendor)
 *  - Vendor: Sykes and Sons Logistics — Texas City, TX 77372
 *  - Client record for invoicing
 *
 * Run:  node scripts/seed-sykes-portal.mjs
 */
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL?.trim());

// ──────────────────────────────────────────
// 1. Create / update user account
// ──────────────────────────────────────────
console.log("\n🔑  Creating user account for Sykes portal…");

const existingUser = await sql`
  SELECT id FROM users WHERE username = 'sykes' LIMIT 1
`;
let userId;

if (existingUser.length > 0) {
  userId = existingUser[0].id;
  console.log(`  ⏭  User already exists: ${userId}`);
  // Keep role=vendor and refresh password hash
  const passwordHash = await bcrypt.hash("sykes", 10);
  await sql`
    UPDATE users
    SET role = 'vendor', password_hash = ${passwordHash}, auth_provider = 'local'
    WHERE id = ${userId}
  `;
  console.log("  ✅  Password refreshed → sykes / sykes");
} else {
  const passwordHash = await bcrypt.hash("sykes", 10);
  const result = await sql`
    INSERT INTO users (email, name, username, password_hash, role, auth_provider)
    VALUES (
      'info@sykesandsonlogistics.com',
      'Sykes and Sons Logistics',
      'sykes',
      ${passwordHash},
      'vendor',
      'local'
    )
    RETURNING id
  `;
  userId = result[0].id;
  console.log(`  ✅  Created user: sykes (${userId})`);
}

// ──────────────────────────────────────────
// 2. Create / update vendor profile
// ──────────────────────────────────────────
console.log("\n🏢  Creating vendor profile…");

const existingVendor = await sql`
  SELECT id FROM vendors WHERE user_id = ${userId} LIMIT 1
`;
let vendorId;

if (existingVendor.length > 0) {
  vendorId = existingVendor[0].id;
  console.log(`  ⏭  Vendor already exists: ${vendorId}`);
} else {
  const result = await sql`
    INSERT INTO vendors (
      user_id, name, legal_name, contact_person, email, phone,
      address, city, state, zip,
      service_category, description,
      services, service_areas,
      primary_color, tagline,
      website_slug, website_enabled, onboarding_status, is_active
    ) VALUES (
      ${userId},
      'Sykes and Sons Logistics',
      'Sykes and Sons Logistics LLC',
      'Joshua Sykes',
      'info@sykesandsonlogistics.com',
      '(832) 555-0100',
      '1001 Logistics Blvd',
      'Texas City',
      'TX',
      '77372',
      'logistics',
      'Professional logistics and security services — camera installation, lock systems, and freight solutions.',
      ${ ["Freight Logistics", "Camera Installation", "Lock Systems", "Unit Processing", "Security Consulting"] },
      ${ ["Texas City", "Houston", "Galveston", "League City"] },
      '#1e3a5f',
      'Moving Texas Forward',
      'sykes-and-sons-logistics',
      true,
      'approved',
      true
    )
    RETURNING id
  `;
  vendorId = result[0].id;
  console.log(`  ✅  Created vendor: Sykes and Sons Logistics (${vendorId})`);
}

// ──────────────────────────────────────────
// 3. Create client record (for invoicing)
// ──────────────────────────────────────────
console.log("\n👤  Creating client record…");

const existingClient = await sql`
  SELECT id FROM clients WHERE vendor_id = ${vendorId} LIMIT 1
`;
let clientId;

if (existingClient.length > 0) {
  clientId = existingClient[0].id;
  console.log(`  ⏭  Client already exists: ${clientId}`);
} else {
  const result = await sql`
    INSERT INTO clients (
      vendor_id, name, email, phone,
      address, city, state, zip,
      status, tags, source, notes
    ) VALUES (
      ${vendorId},
      'Sykes and Sons Logistics',
      'info@sykesandsonlogistics.com',
      '(832) 555-0100',
      '1001 Logistics Blvd',
      'Texas City',
      'TX',
      '77372',
      'active',
      ${ ["logistics", "vendor-client"] },
      'vendor-registration',
      'Sykes and Sons Logistics — primary client for portal invoicing'
    )
    RETURNING id
  `;
  clientId = result[0].id;
  console.log(`  ✅  Created client: Sykes and Sons Logistics (${clientId})`);
}

// ──────────────────────────────────────────
// Summary
// ──────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════════");
console.log("✅  Sykes and Sons Logistics portal setup complete!");
console.log("═══════════════════════════════════════════════════");
console.log(`  User ID:    ${userId}`);
console.log(`  Vendor ID:  ${vendorId}`);
console.log(`  Client ID:  ${clientId}`);
console.log("  Portal URL: /sykes");
console.log("  Login:      sykes / sykes");
console.log("═══════════════════════════════════════════════════\n");
