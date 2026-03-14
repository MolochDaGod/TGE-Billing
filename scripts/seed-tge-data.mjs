/**
 * seed-tge-data.mjs
 * Seeds TGE Pros production DB with:
 *  - Company settings
 *  - All known clients (from Google Drive review)
 *  - Invoice stubs linked to Google Drive TGEINVOICES folder
 *  - Job stubs from Projects folder
 */
import { neon } from "@neondatabase/serverless";
import { randomBytes } from "crypto";

const sql = neon(process.env.DATABASE_URL?.trim());

const GRUDACHAIN_USER_ID = "7346665e-456d-4af4-878f-499b1971373d";
const TGEINVOICES_FOLDER_URL = "https://drive.google.com/drive/folders/1GjX-A2GKs-2e98exDkUCjVQQnUkBGufz?usp=sharing";
const PROJECTS_FOLDER_URL = "https://drive.google.com/drive/folders/1IcBBTzMqjU_smiVPdoAY7ypntfbzcAsE?usp=sharing";

// ──────────────────────────────────────────
// 1. Company Settings
// ──────────────────────────────────────────
console.log("\n📋 Setting up company settings...");
const existing = await sql`SELECT id FROM company_settings LIMIT 1`;
if (existing.length === 0) {
  await sql`
    INSERT INTO company_settings (
      company_name, email, phone, address, city, state, zip,
      license_number, tagline, about
    ) VALUES (
      'T.G.E. Pros',
      'tgebilling@gmail.com',
      '(832) 000-0000',
      '2200 Willowick Rd',
      'Houston',
      'TX',
      '77027',
      'Texas Master Electrician License #750779',
      'Professional Electrical & Maintenance Services',
      'T.G.E. Pros provides professional electrical installation, fiber networking, maintenance, and remodeling services in the Houston area.'
    )
  `;
  console.log("✅ Company settings created");
} else {
  await sql`
    UPDATE company_settings SET
      company_name = 'T.G.E. Pros',
      email = 'tgebilling@gmail.com',
      license_number = 'Texas Master Electrician License #750779',
      tagline = 'Professional Electrical & Maintenance Services',
      address = '2200 Willowick Rd',
      city = 'Houston',
      state = 'TX',
      zip = '77027'
    WHERE id = ${existing[0].id}
  `;
  console.log("✅ Company settings updated");
}

// ──────────────────────────────────────────
// 2. Clients
// ──────────────────────────────────────────
console.log("\n👥 Creating clients...");

const clientsToCreate = [
  {
    key: "WPH",
    name: "The Willowick",
    email: "management@thewillowick.com",
    address: "2200 Willowick Rd",
    city: "Houston",
    state: "TX",
    zip: "77027",
    notes: "Major commercial client — apartment complex. Fiber installation, network equipment, residential installation packages. 20+ service invoices. Quotes: 1512 Fiber Install, 1513 Network Equipment, 1514 Residential Package.",
    status: "vip",
    tags: ["commercial", "electrical", "networking", "fiber", "willowick"],
    source: "direct",
  },
  {
    key: "BE",
    name: "BE Client",
    email: null,
    address: null,
    city: "Houston",
    state: "TX",
    zip: null,
    notes: "Client code BE — full name needed. 2 invoices on file (BE#1, BE#2). Update name/contact when available.",
    status: "active",
    tags: ["electrical"],
    source: "direct",
  },
  {
    key: "SM",
    name: "SM Client",
    email: null,
    address: null,
    city: "Houston",
    state: "TX",
    zip: null,
    notes: "Client code SM — full name needed. 1 invoice on file (SM#1). Update name/contact when available.",
    status: "active",
    tags: ["electrical"],
    source: "direct",
  },
  {
    key: "ELEANOR",
    name: "Eleanor Williams",
    email: null,
    address: "2200 Willowick Rd, Unit 9H",
    city: "Houston",
    state: "TX",
    zip: "77027",
    notes: "Residential tenant at The Willowick, Unit 9H. Project on file in Projects folder.",
    status: "active",
    tags: ["residential", "willowick"],
    source: "direct",
  },
  {
    key: "JB",
    name: "JB Bath Remodel",
    email: null,
    address: null,
    city: "Houston",
    state: "TX",
    zip: null,
    notes: "Bath remodel project. Full client name needed — update when available.",
    status: "active",
    tags: ["remodel", "residential"],
    source: "direct",
  },
  {
    key: "MARK_HALLAM",
    name: "Mark Hallam",
    email: null,
    address: null,
    city: "Houston",
    state: "TX",
    zip: null,
    notes: "Remodel project on file in Projects folder.",
    status: "active",
    tags: ["remodel", "residential"],
    source: "direct",
  },
];

const clientIdMap = {}; // key → DB id

for (const c of clientsToCreate) {
  const existing = await sql`SELECT id FROM clients WHERE name = ${c.name} LIMIT 1`;
  if (existing.length > 0) {
    clientIdMap[c.key] = existing[0].id;
    console.log(`  ⏭  Client already exists: ${c.name}`);
    continue;
  }

  const result = await sql`
    INSERT INTO clients (
      name, email, address, city, state, zip, notes,
      status, tags, source
    ) VALUES (
      ${c.name},
      ${c.email},
      ${c.address},
      ${c.city},
      ${c.state},
      ${c.zip},
      ${c.notes},
      ${c.status},
      ${c.tags},
      ${c.source}
    )
    RETURNING id
  `;
  clientIdMap[c.key] = result[0].id;
  console.log(`  ✅ Created client: ${c.name} (${result[0].id})`);
}

// ──────────────────────────────────────────
// 3. Invoice Stubs — WPH#1-20
// ──────────────────────────────────────────
console.log("\n🧾 Creating WPH invoice stubs...");
const wphClientId = clientIdMap["WPH"];

for (let i = 1; i <= 20; i++) {
  const invoiceNum = `WPH#${i}`;
  const existing = await sql`SELECT id FROM invoices WHERE invoice_number = ${invoiceNum} LIMIT 1`;
  if (existing.length > 0) {
    console.log(`  ⏭  Invoice already exists: ${invoiceNum}`);
    continue;
  }

  // Approximate dates based on Drive listing (WPH#1-9 around Feb, #10-11 Dec 2025, #12 Jan, #13+ Feb)
  const dateMap = {
    1: "2026-02-05", 2: "2026-02-05", 3: "2026-02-05", 4: "2026-02-05", 5: "2026-02-05",
    6: "2026-02-05", 7: "2026-02-05", 8: "2026-02-05", 9: "2026-02-05",
    10: "2025-12-31", 11: "2025-12-31",
    12: "2026-01-06", 13: "2026-02-05", 14: "2026-02-05", 15: "2026-02-09",
    16: "2026-02-11", 17: "2026-02-12", 18: "2026-02-17", 19: "2026-02-27",
    20: "2026-03-13",
  };

  const invoiceDate = dateMap[i] || "2026-02-01";

  await sql`
    INSERT INTO invoices (
      invoice_number, client_id, created_by, status,
      invoice_date, subtotal, tax_rate, tax_amount, total,
      notes, pdf_url
    ) VALUES (
      ${invoiceNum},
      ${wphClientId},
      ${GRUDACHAIN_USER_ID},
      'paid',
      ${new Date(invoiceDate).toISOString()},
      '0.00', '0.00', '0.00', '0.00',
      ${'Imported from TGE Google Drive. Update amounts from PDF: ' + TGEINVOICES_FOLDER_URL},
      ${TGEINVOICES_FOLDER_URL}
    )
  `;
  console.log(`  ✅ ${invoiceNum} (${invoiceDate})`);
}

// ──────────────────────────────────────────
// 4. Invoice Stubs — BE#1, BE#2
// ──────────────────────────────────────────
console.log("\n🧾 Creating BE invoice stubs...");
const beClientId = clientIdMap["BE"];
for (const num of [1, 2]) {
  const invoiceNum = `BE#${num}`;
  const existing = await sql`SELECT id FROM invoices WHERE invoice_number = ${invoiceNum} LIMIT 1`;
  if (existing.length > 0) { console.log(`  ⏭  ${invoiceNum} exists`); continue; }
  const date = num === 1 ? "2025-12-08" : "2025-12-12";
  await sql`
    INSERT INTO invoices (
      invoice_number, client_id, created_by, status,
      invoice_date, subtotal, tax_rate, tax_amount, total, notes, pdf_url
    ) VALUES (
      ${invoiceNum}, ${beClientId}, ${GRUDACHAIN_USER_ID}, 'paid',
      ${new Date(date).toISOString()}, '0.00', '0.00', '0.00', '0.00',
      ${'Imported from TGE Google Drive. Update amounts from PDF: ' + TGEINVOICES_FOLDER_URL},
      ${TGEINVOICES_FOLDER_URL}
    )
  `;
  console.log(`  ✅ ${invoiceNum}`);
}

// ──────────────────────────────────────────
// 5. Invoice Stub — SM#1
// ──────────────────────────────────────────
console.log("\n🧾 Creating SM#1 invoice stub...");
const smClientId = clientIdMap["SM"];
const smExists = await sql`SELECT id FROM invoices WHERE invoice_number = 'SM#1' LIMIT 1`;
if (smExists.length === 0) {
  await sql`
    INSERT INTO invoices (
      invoice_number, client_id, created_by, status,
      invoice_date, subtotal, tax_rate, tax_amount, total, notes, pdf_url
    ) VALUES (
      'SM#1', ${smClientId}, ${GRUDACHAIN_USER_ID}, 'paid',
      ${new Date("2026-02-05").toISOString()}, '0.00', '0.00', '0.00', '0.00',
      ${'Imported from TGE Google Drive. Update amounts from PDF: ' + TGEINVOICES_FOLDER_URL},
      ${TGEINVOICES_FOLDER_URL}
    )
  `;
  console.log("  ✅ SM#1");
} else {
  console.log("  ⏭  SM#1 exists");
}

// ──────────────────────────────────────────
// 6. Invoice Stubs — 8001 and 12010
// ──────────────────────────────────────────
console.log("\n🧾 Creating numbered invoice stubs...");
// Create a generic "TGE Client" placeholder for unknown-client invoices
const genExists = await sql`SELECT id FROM clients WHERE name = 'TGE General' LIMIT 1`;
let generalClientId;
if (genExists.length === 0) {
  const r = await sql`
    INSERT INTO clients (name, notes, status, city, state)
    VALUES ('TGE General', 'Placeholder for invoices where client name is unknown. Update as identified.', 'active', 'Houston', 'TX')
    RETURNING id
  `;
  generalClientId = r[0].id;
  console.log("  ✅ Created TGE General placeholder client");
} else {
  generalClientId = genExists[0].id;
}

for (const inv of [{ num: "8001-1", date: "2026-02-03" }, { num: "12010-1", date: "2026-02-05" }]) {
  const invoiceNum = inv.num;
  const exists = await sql`SELECT id FROM invoices WHERE invoice_number = ${invoiceNum} LIMIT 1`;
  if (exists.length > 0) { console.log(`  ⏭  ${invoiceNum} exists`); continue; }
  await sql`
    INSERT INTO invoices (
      invoice_number, client_id, created_by, status,
      invoice_date, subtotal, tax_rate, tax_amount, total, notes, pdf_url
    ) VALUES (
      ${invoiceNum}, ${generalClientId}, ${GRUDACHAIN_USER_ID}, 'paid',
      ${new Date(inv.date).toISOString()}, '0.00', '0.00', '0.00', '0.00',
      ${'Imported from TGE Google Drive. Update client and amounts from PDF: ' + TGEINVOICES_FOLDER_URL},
      ${TGEINVOICES_FOLDER_URL}
    )
  `;
  console.log(`  ✅ Invoice ${invoiceNum}`);
}

// ──────────────────────────────────────────
// 7. Job Stubs from Projects folder
// ──────────────────────────────────────────
console.log("\n🔧 Creating job stubs from Projects folder...");
const jobsToCreate = [
  { clientKey: "ELEANOR", title: "Eleanor Williams — Unit 9H Electrical", location: "2200 Willowick Rd, Unit 9H, Houston TX 77027", status: "completed" },
  { clientKey: "JB", title: "JB Bath Remodel", location: "Houston, TX", status: "completed" },
  { clientKey: "MARK_HALLAM", title: "Mark Hallam Remodel", location: "Houston, TX", status: "completed" },
];

for (const job of jobsToCreate) {
  const clientId = clientIdMap[job.clientKey];
  const existing = await sql`SELECT id FROM jobs WHERE title = ${job.title} LIMIT 1`;
  if (existing.length > 0) { console.log(`  ⏭  Job already exists: ${job.title}`); continue; }
  await sql`
    INSERT INTO jobs (client_id, title, location, status, notes)
    VALUES (
      ${clientId}, ${job.title}, ${job.location}, ${job.status},
      ${'Project folder: ' + PROJECTS_FOLDER_URL}
    )
  `;
  console.log(`  ✅ Job: ${job.title}`);
}

// ──────────────────────────────────────────
// 8. Willowick Quote Jobs
// ──────────────────────────────────────────
console.log("\n📄 Creating Willowick quote jobs...");
const wphClientId2 = clientIdMap["WPH"];
const willowickJobs = [
  { title: "1512 — Fiber Installation", notes: "Quote: The Willowick 1512 Fiber Installation. PDF in TGEINVOICES Drive folder." },
  { title: "1513 — Network Equipment Install/Config/Warranty", notes: "Quote: The Willowick 1513 Network Equipment Install, Configuration, Warranty Option, Managed Pricing. PDF in TGEINVOICES Drive folder." },
  { title: "1514 — Residential Installation Package", notes: "Quote: The Willowick 1514 Residential Installation Package. PDF in TGEINVOICES Drive folder." },
];
for (const job of willowickJobs) {
  const exists = await sql`SELECT id FROM jobs WHERE title = ${job.title} LIMIT 1`;
  if (exists.length > 0) { console.log(`  ⏭  ${job.title} exists`); continue; }
  await sql`
    INSERT INTO jobs (client_id, title, location, status, notes)
    VALUES (
      ${wphClientId2},
      ${job.title},
      '2200 Willowick Rd, Houston TX 77027',
      'completed',
      ${job.notes}
    )
  `;
  console.log(`  ✅ ${job.title}`);
}

// ──────────────────────────────────────────
// Summary
// ──────────────────────────────────────────
const clientCount = await sql`SELECT COUNT(*) AS c FROM clients`;
const invoiceCount = await sql`SELECT COUNT(*) AS c FROM invoices`;
const jobCount = await sql`SELECT COUNT(*) AS c FROM jobs`;
console.log(`
╔══════════════════════════════════╗
║        TGE SEED COMPLETE         ║
╠══════════════════════════════════╣
║  Clients  : ${String(clientCount[0].c).padEnd(22)}║
║  Invoices : ${String(invoiceCount[0].c).padEnd(22)}║
║  Jobs     : ${String(jobCount[0].c).padEnd(22)}║
╚══════════════════════════════════╝
NOTE: Invoice amounts are all $0 — open each invoice in the app
and update amounts from the PDFs in Google Drive:
${TGEINVOICES_FOLDER_URL}
`);
