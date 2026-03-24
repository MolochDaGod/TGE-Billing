/**
 * seed-sikes-vendor.mjs
 * Seeds vendor "Sikes and Sons Logistics" with:
 *  - User account (joshuasikes93@gmail.com / admin123)
 *  - Vendor profile linked to user
 *  - Client record (for invoicing)
 *  - Invoice for $2,550 (last week) with line items:
 *      • Locking and processing of 5 units — $800
 *      • Installation of 7 cameras — $1,750
 */
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL?.trim());

// ──────────────────────────────────────────
// 1. Create User Account
// ──────────────────────────────────────────
console.log("\n🔑 Creating user account for Sikes and Sons Logistics...");

const existingUser = await sql`SELECT id FROM users WHERE email = 'joshuasikes93@gmail.com' LIMIT 1`;
let userId;

if (existingUser.length > 0) {
  userId = existingUser[0].id;
  console.log(`  ⏭  User already exists: ${userId}`);
  // Ensure role is vendor
  await sql`UPDATE users SET role = 'vendor' WHERE id = ${userId}`;
} else {
  const passwordHash = await bcrypt.hash("admin123", 10);
  const username = "joshuasikes93_" + Date.now().toString(36);

  const userResult = await sql`
    INSERT INTO users (
      email, name, username, password_hash, role, auth_provider
    ) VALUES (
      'joshuasikes93@gmail.com',
      'Joshua Sikes',
      ${username},
      ${passwordHash},
      'vendor',
      'local'
    )
    RETURNING id
  `;
  userId = userResult[0].id;
  console.log(`  ✅ Created user: Joshua Sikes (${userId})`);
}

// ──────────────────────────────────────────
// 2. Create Vendor Profile
// ──────────────────────────────────────────
console.log("\n🏢 Creating vendor profile...");

const existingVendor = await sql`SELECT id FROM vendors WHERE email = 'joshuasikes93@gmail.com' LIMIT 1`;
let vendorId;

if (existingVendor.length > 0) {
  vendorId = existingVendor[0].id;
  console.log(`  ⏭  Vendor already exists: ${vendorId}`);
} else {
  const websiteSlug = "sikes-and-sons-logistics-" + Date.now().toString(36).slice(-4);

  const vendorResult = await sql`
    INSERT INTO vendors (
      user_id, name, legal_name, contact_person, email, phone,
      service_category, description, services, website_slug,
      website_enabled, onboarding_status, is_active
    ) VALUES (
      ${userId},
      'Sikes and Sons Logistics',
      'Sikes and Sons Logistics LLC',
      'Joshua Sikes',
      'joshuasikes93@gmail.com',
      '(832) 000-0000',
      'security',
      'Professional security and logistics services including camera installation, lock systems, and unit processing.',
      ${["Camera Installation", "Lock Systems", "Unit Processing", "Security Consulting"]},
      ${websiteSlug},
      false,
      'approved',
      true
    )
    RETURNING id
  `;
  vendorId = vendorResult[0].id;
  console.log(`  ✅ Created vendor: Sikes and Sons Logistics (${vendorId})`);
}

// ──────────────────────────────────────────
// 3. Create Client Record (for invoice linking)
// ──────────────────────────────────────────
console.log("\n👤 Creating client record for Sikes and Sons Logistics...");

const existingClient = await sql`SELECT id FROM clients WHERE name = 'Sikes and Sons Logistics' LIMIT 1`;
let clientId;

if (existingClient.length > 0) {
  clientId = existingClient[0].id;
  console.log(`  ⏭  Client already exists: ${clientId}`);
} else {
  const clientResult = await sql`
    INSERT INTO clients (
      vendor_id, name, email, phone, status, tags, source, notes
    ) VALUES (
      ${vendorId},
      'Sikes and Sons Logistics',
      'joshuasikes93@gmail.com',
      '(832) 000-0000',
      'active',
      ${["security", "logistics", "vendor-client"]},
      'vendor-registration',
      'Sikes and Sons Logistics — vendor client for invoicing. Locking, processing, and camera installation services.'
    )
    RETURNING id
  `;
  clientId = clientResult[0].id;
  console.log(`  ✅ Created client: Sikes and Sons Logistics (${clientId})`);
}

// ──────────────────────────────────────────
// 4. Create Invoice — $2,550 for last week
// ──────────────────────────────────────────
console.log("\n🧾 Creating invoice for $2,550...");

const invoiceNumber = "SIKES-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-001";

const existingInvoice = await sql`SELECT id FROM invoices WHERE invoice_number = ${invoiceNumber} LIMIT 1`;
let invoiceId;

if (existingInvoice.length > 0) {
  invoiceId = existingInvoice[0].id;
  console.log(`  ⏭  Invoice already exists: ${invoiceNumber} (${invoiceId})`);
} else {
  // Last week dates
  const now = new Date();
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 7);
  const dueDate = new Date(now);
  dueDate.setDate(now.getDate() + 23); // Net 30 from last week

  const invoiceNotes = `Invoice for security services rendered week of ${lastWeekStart.toISOString().slice(0, 10)}. Includes locking and processing of 5 units and installation of 7 cameras.`;

  const invoiceResult = await sql`
    INSERT INTO invoices (
      invoice_number, client_id, created_by, status,
      invoice_date, due_date,
      subtotal, tax_rate, tax_amount, total,
      notes
    ) VALUES (
      ${invoiceNumber},
      ${clientId},
      ${userId},
      'sent',
      ${lastWeekStart.toISOString()},
      ${dueDate.toISOString()},
      '2550.00',
      '0',
      '0',
      '2550.00',
      ${invoiceNotes}
    )
    RETURNING id
  `;
  invoiceId = invoiceResult[0].id;
  console.log(`  ✅ Created invoice: ${invoiceNumber} (${invoiceId})`);

  // ──────────────────────────────────────────
  // 5. Create Invoice Line Items
  // ──────────────────────────────────────────
  console.log("\n📝 Adding invoice line items...");

  // Line item 1: Locking and processing — 5 units × $160 = $800
  await sql`
    INSERT INTO invoice_items (
      invoice_id, description, quantity, unit_price, amount, order_index
    ) VALUES (
      ${invoiceId},
      'Locking and Processing of Units',
      '5',
      '160.00',
      '800.00',
      0
    )
  `;
  console.log("  ✅ Line item 1: Locking and Processing of 5 Units — $800.00");

  // Line item 2: Camera installation — 7 cameras × $250 = $1,750
  await sql`
    INSERT INTO invoice_items (
      invoice_id, description, quantity, unit_price, amount, order_index
    ) VALUES (
      ${invoiceId},
      'Security Camera Installation',
      '7',
      '250.00',
      '1750.00',
      1
    )
  `;
  console.log("  ✅ Line item 2: Installation of 7 Cameras — $1,750.00");
}

// ──────────────────────────────────────────
// Summary
// ──────────────────────────────────────────
console.log("\n═══════════════════════════════════════════");
console.log("✅ Sikes and Sons Logistics setup complete!");
console.log("═══════════════════════════════════════════");
console.log(`  User ID:    ${userId}`);
console.log(`  Vendor ID:  ${vendorId}`);
console.log(`  Client ID:  ${clientId}`);
console.log(`  Invoice:    ${invoiceNumber} — $2,550.00`);
console.log(`  Login:      joshuasikes93@gmail.com / admin123`);
console.log("═══════════════════════════════════════════\n");
