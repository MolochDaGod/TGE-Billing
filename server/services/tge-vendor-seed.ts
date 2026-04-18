/**
 * server/services/tge-vendor-seed.ts
 * Seeds TGE (T.G.E. Electrical) as a vendor and ensures tgebilling@gmail.com
 * is an admin account. Idempotent — safe to run on every startup.
 */
import { db } from "../db";
import { users, vendors, clients, companies } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedTGEVendor() {
  try {
    // ── 0. TGE Company record ────────────────────────────────────
    let tgeCompanyId: string | undefined;
    const existingTGE = await db
      .select()
      .from(companies)
      .where(eq(companies.name, "T.G.E. Electrical"));

    if (existingTGE.length > 0) {
      tgeCompanyId = existingTGE[0].id;
      await db.update(companies).set({
        legal_name: "T.G.E. Electrical LLC",
        email: "tgebilling@gmail.com",
        phone: "(832) 000-0000",
        address: "Texas City",
        city: "Texas City",
        state: "TX",
        invoice_prefix: "TGE",
        primary_color: "#16a34a",
        tagline: "Powering Texas Forward",
        is_active: true,
        updated_at: new Date(),
      }).where(eq(companies.id, tgeCompanyId));
    } else {
      const result = await db.insert(companies).values({
        name: "T.G.E. Electrical",
        legal_name: "T.G.E. Electrical LLC",
        email: "tgebilling@gmail.com",
        phone: "(832) 000-0000",
        address: "Texas City",
        city: "Texas City",
        state: "TX",
        invoice_prefix: "TGE",
        primary_color: "#16a34a",
        tagline: "Powering Texas Forward",
        tax_rate: "8.25",
        is_active: true,
      }).returning();
      tgeCompanyId = result[0]?.id;
      console.log("[TGESeed] Created company: T.G.E. Electrical");
    }

    // ── 1. Admin account — tgebilling@gmail.com (Chris) ─────────
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "tgebilling@gmail.com"));

    let adminUserId: string;

    if (existingAdmin.length > 0) {
      adminUserId = existingAdmin[0].id;
      await db.update(users).set({
        role: "admin",
        company_id: tgeCompanyId,
        name: existingAdmin[0].name || "Chris — TGE Admin",
      }).where(eq(users.id, adminUserId));
      console.log("[TGESeed] Updated tgebilling@gmail.com → admin");
    } else {
      const hash = await bcrypt.hash("TGEbilling2025!", 10);
      const result = await db.insert(users).values({
        email: "tgebilling@gmail.com",
        name: "Chris — TGE Admin",
        username: "tge-admin",
        password_hash: hash,
        role: "admin",
        auth_provider: "local",
        company_id: tgeCompanyId,
      }).returning();
      adminUserId = result[0].id;
      console.log("[TGESeed] Created admin: tgebilling@gmail.com (username: tge-admin)");
    }

    // ── 2. TGE vendor user account ───────────────────────────────
    const existingVendorUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "tge-vendor"));

    let vendorUserId: string;

    if (existingVendorUser.length > 0) {
      vendorUserId = existingVendorUser[0].id;
      const hash = await bcrypt.hash("tgevendor", 10);
      await db.update(users).set({
        role: "vendor",
        password_hash: hash,
        company_id: tgeCompanyId,
      }).where(eq(users.id, vendorUserId));
    } else {
      const hash = await bcrypt.hash("tgevendor", 10);
      const result = await db.insert(users).values({
        email: "vendor@tgebilling.com",
        name: "T.G.E. Electrical",
        username: "tge-vendor",
        password_hash: hash,
        role: "vendor",
        auth_provider: "local",
        company_id: tgeCompanyId,
      }).returning();
      vendorUserId = result[0].id;
      console.log("[TGESeed] Created vendor user: tge-vendor");
    }

    // ── 3. TGE vendor profile ────────────────────────────────────
    const existingVendorProfile = await db
      .select()
      .from(vendors)
      .where(eq(vendors.user_id, vendorUserId));

    let tgeVendorId: string;

    if (existingVendorProfile.length > 0) {
      tgeVendorId = existingVendorProfile[0].id;
    } else {
      const result = await db.insert(vendors).values({
        user_id: vendorUserId,
        name: "T.G.E. Electrical",
        legal_name: "T.G.E. Electrical LLC",
        contact_person: "Chris",
        email: "tgebilling@gmail.com",
        phone: "(832) 000-0000",
        address: "Texas City",
        city: "Texas City",
        state: "TX",
        zip: "77590",
        service_category: "electrical",
        description: "Licensed electrical contractor serving Texas City and the greater Houston area. Commercial and residential electrical services, panel upgrades, and new construction wiring.",
        services: [
          "Commercial Electrical",
          "Residential Wiring",
          "Panel Upgrades",
          "New Construction",
          "Electrical Inspections",
          "LED Retrofits",
        ],
        service_areas: ["Texas City", "Houston", "Galveston", "League City", "La Marque"],
        primary_color: "#16a34a",
        secondary_color: "#15803d",
        tagline: "Powering Texas Forward",
        website_slug: "tge-electrical",
        website_enabled: true,
        onboarding_status: "approved",
        is_active: true,
        is_featured: true,
      }).returning();
      tgeVendorId = result[0].id;
      console.log("[TGESeed] Created vendor profile: T.G.E. Electrical");
    }

    // ── 4. Default client for TGE portal testing ─────────────────
    const existingTGEClient = await db
      .select()
      .from(clients)
      .where(eq(clients.vendor_id, tgeVendorId));

    if (existingTGEClient.length === 0) {
      await db.insert(clients).values({
        vendor_id: tgeVendorId,
        name: "T.G.E. Electrical — Internal",
        email: "tgebilling@gmail.com",
        phone: "(832) 000-0000",
        address: "Texas City",
        city: "Texas City",
        state: "TX",
        zip: "77590",
        status: "active",
        tags: ["tge", "internal"],
        source: "vendor-registration",
        notes: "TGE internal client record for portal operations",
      });
      console.log("[TGESeed] Created TGE default client record");
    }

    console.log("[TGESeed] ✅ T.G.E. Electrical vendor ready");
    console.log("[TGESeed]    Admin:  tgebilling@gmail.com  (username: tge-admin / TGEbilling2025!)");
    console.log("[TGESeed]    Vendor: tge-vendor / tgevendor  → /tge-portal");
  } catch (error) {
    console.error("[TGESeed] Error seeding TGE vendor:", error);
  }
}
