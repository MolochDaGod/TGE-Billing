/**
 * server/services/seed-contractor-invoices.ts
 *
 * Seeds professional weekly-contract invoices for four vendors:
 *
 *  1. RBG PROs        — Full year (Jan–Dec 2026), 4/month, past = paid, future = sent
 *  2. Sykes and Sons  — Future only (Apr 13 – Dec 29), $1,850-2,200/wk units + $1,000-7,000 concrete
 *  3. RPG PROs        — Future only, weekly $800 – $2,000
 *  4. JZ Nation        — Future only, weekly $600 – $1,440
 *
 * Run:  npx tsx server/services/seed-contractor-invoices.ts
 * Idempotent — skips invoices whose number already exists.
 */

import { db } from "../db";
import { users, clients, invoices, invoice_items } from "@shared/schema";
import { eq } from "drizzle-orm";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function randBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/** 4 dates per month (≈ weekly) for every month of the given year */
function get4PerMonthDates(year: number): Date[] {
  const dates: Date[] = [];
  for (let month = 0; month < 12; month++) {
    dates.push(new Date(year, month, 6));
    dates.push(new Date(year, month, 13));
    dates.push(new Date(year, month, 20));
    dates.push(new Date(year, month, 27));
  }
  return dates;
}

/** Weekly dates from startDate through endDate (inclusive) */
function getWeeklyDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return dates;
}

// Today's date for past/future split
const TODAY = new Date(2026, 3, 6); // April 6, 2026

// ────────────────────────────────────────────────────────────────
// Line-item description pools
// ────────────────────────────────────────────────────────────────

const RBG_ITEMS = [
  "Weekly property maintenance — electrical systems",
  "HVAC service and inspection",
  "General building maintenance and repair",
  "Electrical panel servicing",
  "Lighting installation and wiring",
  "Emergency electrical call-out",
  "Preventive maintenance — common areas",
  "Fire alarm system inspection and testing",
  "Generator maintenance and load testing",
  "Security system servicing and upgrade",
  "Breaker replacement and circuit work",
  "Outlet and switch installation",
];

const SYKES_UNIT_ITEMS = [
  "Unit 101 — Lock rekey and camera install",
  "Unit 205 — Camera installation and security setup",
  "Unit 312 — Full unit processing and turnover",
  "Unit 408 — Lock system replacement",
  "Unit 110 — Security camera network setup",
  "Unit 503 — Unit clearance and camera install",
  "Unit 215 — Complete lock and access system",
  "Unit 607 — Full turnover processing",
  "Unit 301 — Camera system upgrade",
  "Unit 420 — Access control installation",
  "Unit 515 — Rekey and alarm programming",
  "Unit 709 — Full security package install",
];

const SYKES_CONCRETE_ITEMS = [
  "Concrete repair — parking area Section A",
  "Sidewalk replacement — Building 2 entrance",
  "Concrete pour — loading dock repair",
  "Foundation repair — utility room",
  "Concrete leveling — entrance walkway",
  "Curb replacement — front lot",
  "Concrete patching — garage floor Level 1",
  "Driveway repair — emergency access lane",
  "Retaining wall concrete restoration",
  "Concrete slab pour — equipment pad",
  "Parking bumper replacement — Lot B",
  "Ramp repair and ADA compliance pour",
];

const RPG_ITEMS = [
  "Weekly maintenance services — general labor",
  "Equipment repair and servicing",
  "Site inspection and condition reporting",
  "Preventive maintenance rounds",
  "Tool and equipment maintenance",
  "Facility upkeep — weekly contract",
  "Minor repair and touch-up work",
  "Grounds maintenance support",
  "Weekly labor — maintenance crew",
  "Building systems check and service",
  "Plumbing minor repair",
  "Paint and drywall touch-up",
];

const JZ_ITEMS = [
  "Weekly subcontractor labor",
  "Labor support — project site",
  "Material handling and staging",
  "Site cleanup and daily prep",
  "General labor — weekly contract",
  "Equipment operation support",
  "Demolition support — weekly allocation",
  "Construction labor — ongoing project",
  "Warehouse operations support",
  "Logistics coordination and transport",
  "Trash-out and debris hauling",
  "Flooring removal and prep labor",
];

// ────────────────────────────────────────────────────────────────
// Main seed function
// ────────────────────────────────────────────────────────────────

async function seedContractorInvoices() {
  console.log("🧾  Seeding contractor invoices …\n");

  // ── 1. Resolve a created_by user ──────────────────────────────
  let adminUser =
    (await db.select().from(users).where(eq(users.role, "pirate_king")))[0] ??
    (await db.select().from(users).where(eq(users.role, "admin")))[0];

  if (!adminUser) {
    const result = await db
      .insert(users)
      .values({
        email: "admin@tgebilling.com",
        name: "TGE Admin",
        role: "admin",
        auth_provider: "local",
        username: "tge_admin",
      })
      .returning();
    adminUser = result[0];
    console.log("[Seed] Created admin user for invoice attribution");
  }
  const createdBy = adminUser.id;

  // ── 2. Ensure client records exist ────────────────────────────
  const clientCfg = [
    {
      name: "RBG PROs",
      email: "billing@rbgpros.com",
      phone: "(832) 555-0200",
      tags: ["contractor", "weekly-contract", "property-maintenance"],
    },
    {
      name: "Sykes and Sons",
      email: "invoices@sykesandsons.com",
      phone: "(832) 555-0300",
      tags: ["logistics", "concrete", "weekly-contract", "security"],
    },
    {
      name: "RPG PROs",
      email: "billing@rpgpros.com",
      phone: "(832) 555-0400",
      tags: ["maintenance", "weekly-contract", "labor"],
    },
    {
      name: "JZ Nation",
      email: "accounts@jznation.com",
      phone: "(832) 555-0500",
      tags: ["subcontractor", "weekly-contract", "labor"],
    },
  ];

  const cid: Record<string, string> = {};

  for (const c of clientCfg) {
    const existing = await db
      .select()
      .from(clients)
      .where(eq(clients.name, c.name));

    if (existing.length > 0) {
      cid[c.name] = existing[0].id;
      console.log(`  ✓ Client "${c.name}" exists  (${existing[0].id})`);
    } else {
      const r = await db
        .insert(clients)
        .values({
          name: c.name,
          email: c.email,
          phone: c.phone,
          status: "active",
          tags: c.tags,
          source: "contract",
          notes: `${c.name} — weekly contract invoicing`,
        })
        .returning();
      cid[c.name] = r[0].id;
      console.log(`  + Created client: ${c.name}`);
    }
  }

  // helper to insert one invoice + its line items
  async function insertInvoice(opts: {
    invNum: string;
    clientId: string;
    status: string;
    invDate: Date;
    items: { description: string; amount: number }[];
    notes: string;
  }) {
    const existing = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoice_number, opts.invNum));
    if (existing.length > 0) return false; // skip duplicate

    const subtotal = opts.items.reduce((s, i) => s + i.amount, 0);
    const dueDate = new Date(opts.invDate);
    dueDate.setDate(dueDate.getDate() + 7);

    const inv = await db
      .insert(invoices)
      .values({
        invoice_number: opts.invNum,
        client_id: opts.clientId,
        created_by: createdBy,
        status: opts.status,
        invoice_date: opts.invDate,
        due_date: dueDate,
        subtotal: subtotal.toFixed(2),
        tax_rate: "0",
        tax_amount: "0",
        total: subtotal.toFixed(2),
        notes: opts.notes,
      })
      .returning();

    for (let idx = 0; idx < opts.items.length; idx++) {
      const li = opts.items[idx];
      await db.insert(invoice_items).values({
        invoice_id: inv[0].id,
        description: li.description,
        quantity: "1",
        unit_price: li.amount.toFixed(2),
        amount: li.amount.toFixed(2),
        order_index: idx,
      });
    }
    return true;
  }

  // ── 3. RBG PROs — full year, 4/month ──────────────────────────
  console.log("\n📋 RBG PROs  (Jan – Dec 2026, 4/month)");
  const rgbDates = get4PerMonthDates(2026);
  let rgbN = 0;

  for (let i = 0; i < rgbDates.length; i++) {
    const d = rgbDates[i];
    const isPast = d <= TODAY;
    const amt = randBetween(2000, 5500);
    const ok = await insertInvoice({
      invNum: `RBG#${i + 1}`,
      clientId: cid["RBG PROs"],
      status: isPast ? "paid" : "sent",
      invDate: d,
      items: [
        { description: RBG_ITEMS[i % RBG_ITEMS.length], amount: amt },
      ],
      notes: `RBG PROs — Week ${i + 1} contract services`,
    });
    if (ok) rgbN++;
  }
  console.log(`   ✅ ${rgbN} invoices created  (past → paid, future → sent)`);

  // ── 4. Sykes and Sons — future only, units + concrete ─────────
  console.log("\n📋 Sykes and Sons  (Apr 13 – Dec 29, weekly)");
  const futureStart = new Date(2026, 3, 13); // Apr 13
  const yearEnd = new Date(2026, 11, 29); // Dec 29
  const sykesDates = getWeeklyDates(futureStart, yearEnd);
  let sykN = 0;

  for (let i = 0; i < sykesDates.length; i++) {
    const unitAmt = randBetween(1850, 2200);
    const concreteAmt = randBetween(1000, 7000);
    const ok = await insertInvoice({
      invNum: `SS#${i + 1}`,
      clientId: cid["Sykes and Sons"],
      status: "sent",
      invDate: sykesDates[i],
      items: [
        { description: SYKES_UNIT_ITEMS[i % SYKES_UNIT_ITEMS.length], amount: unitAmt },
        { description: SYKES_CONCRETE_ITEMS[i % SYKES_CONCRETE_ITEMS.length], amount: concreteAmt },
      ],
      notes: `Sykes and Sons — Week ${i + 1} unit processing + concrete`,
    });
    if (ok) sykN++;
  }
  console.log(`   ✅ ${sykN} invoices created  ($1,850-2,200 units + $1,000-7,000 concrete)`);

  // ── 5. RPG PROs — future only, $800-2,000/wk ─────────────────
  console.log("\n📋 RPG PROs  (Apr 13 – Dec 29, weekly $800-$2,000)");
  const rpgDates = getWeeklyDates(futureStart, yearEnd);
  let rpgN = 0;

  for (let i = 0; i < rpgDates.length; i++) {
    const amt = randBetween(800, 2000);
    const ok = await insertInvoice({
      invNum: `RPGP#${i + 1}`,
      clientId: cid["RPG PROs"],
      status: "sent",
      invDate: rpgDates[i],
      items: [
        { description: RPG_ITEMS[i % RPG_ITEMS.length], amount: amt },
      ],
      notes: `RPG PROs — Week ${i + 1} maintenance contract`,
    });
    if (ok) rpgN++;
  }
  console.log(`   ✅ ${rpgN} invoices created`);

  // ── 6. JZ Nation — future only, $600-1,440/wk ────────────────
  console.log("\n📋 JZ Nation  (Apr 13 – Dec 29, weekly $600-$1,440)");
  const jzDates = getWeeklyDates(futureStart, yearEnd);
  let jzN = 0;

  for (let i = 0; i < jzDates.length; i++) {
    const amt = randBetween(600, 1440);
    const ok = await insertInvoice({
      invNum: `JZ#${i + 1}`,
      clientId: cid["JZ Nation"],
      status: "sent",
      invDate: jzDates[i],
      items: [
        { description: JZ_ITEMS[i % JZ_ITEMS.length], amount: amt },
      ],
      notes: `JZ Nation — Week ${i + 1} subcontractor services`,
    });
    if (ok) jzN++;
  }
  console.log(`   ✅ ${jzN} invoices created`);

  // ── Summary ───────────────────────────────────────────────────
  const total = rgbN + sykN + rpgN + jzN;
  console.log("\n" + "═".repeat(55));
  console.log("  🧾  CONTRACTOR INVOICE SEED COMPLETE");
  console.log("═".repeat(55));
  console.log(`   RBG PROs ......... ${rgbN} invoices  (full year, past=paid)`);
  console.log(`   Sykes and Sons ... ${sykN} invoices  (future, units+concrete)`);
  console.log(`   RPG PROs ......... ${rpgN} invoices  (future, $800-$2,000/wk)`);
  console.log(`   JZ Nation ........ ${jzN} invoices  (future, $600-$1,440/wk)`);
  console.log(`   TOTAL ............ ${total} invoices`);
  console.log("═".repeat(55));
}

// ── Run standalone ──────────────────────────────────────────────
seedContractorInvoices()
  .then(() => {
    console.log("\n✅ Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Seed failed:", err);
    process.exit(1);
  });
