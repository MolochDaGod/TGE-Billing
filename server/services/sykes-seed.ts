/**
 * server/services/sykes-seed.ts
 * Auto-seeds Sykes and Sons Logistics vendor account on server startup.
 * Idempotent — safe to run multiple times.
 */
import { db } from "../db";
import { users, vendors, clients, companies } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedSykesPortal() {
  try {
    const sykesAddress = "77671 Highway 4";
    const sykesCity = "Texas City";
    const sykesState = "TX";
    const sykesZip = "77671";

    // ── 0. Company record ───────────────────────────────────────
    let companyId: string | undefined;
    const existingCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.name, "Sykes and Sons Logistics"));

    if (existingCompanies.length > 0) {
      companyId = existingCompanies[0].id;
      await db
        .update(companies)
        .set({
          legal_name: "Sykes and Sons Logistics LLC",
          email: "info@sykesandsonlogistics.com",
          phone: "(832) 555-0100",
          address: sykesAddress,
          city: sykesCity,
          state: sykesState,
          zip: sykesZip,
          tagline: "Moving Texas Forward",
          invoice_prefix: "SYS",
          primary_color: "#1e3a5f",
          is_active: true,
          updated_at: new Date(),
        })
        .where(eq(companies.id, companyId));
    } else {
      const companyResult = await db
        .insert(companies)
        .values({
          name: "Sykes and Sons Logistics",
          legal_name: "Sykes and Sons Logistics LLC",
          email: "info@sykesandsonlogistics.com",
          phone: "(832) 555-0100",
          address: sykesAddress,
          city: sykesCity,
          state: sykesState,
          zip: sykesZip,
          tagline: "Moving Texas Forward",
          invoice_prefix: "SYS",
          primary_color: "#1e3a5f",
          tax_rate: "0.00",
          is_active: true,
        })
        .returning();
      companyId = companyResult[0]?.id;
    }

    // ── 1. User account ─────────────────────────────────────────
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, "sykes"));

    let userId: string;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      // Refresh password hash to ensure sykes/sykes always works
      const passwordHash = await bcrypt.hash("sykes", 10);
      await db.update(users)
        .set({
          role: "vendor",
          password_hash: passwordHash,
          auth_provider: "local",
          company_id: companyId,
        })
        .where(eq(users.id, userId));
    } else {
      const passwordHash = await bcrypt.hash("sykes", 10);
      const result = await db.insert(users).values({
        email: "info@sykesandsonlogistics.com",
        name: "Sykes and Sons Logistics",
        username: "sykes",
        password_hash: passwordHash,
        role: "vendor",
        auth_provider: "local",
        company_id: companyId,
      }).returning();
      userId = result[0].id;
      console.log("[SykesSeed] Created user: sykes");
    }

    // ── 1b. Capital member / captain account ────────────────────
    const existingCaptains = await db
      .select()
      .from(users)
      .where(eq(users.username, "sykes-captain"));

    if (existingCaptains.length > 0) {
      await db
        .update(users)
        .set({ role: "staff_captain", company_id: companyId })
        .where(eq(users.id, existingCaptains[0].id));
    } else {
      const captainPasswordHash = await bcrypt.hash("sykescaptain", 10);
      await db.insert(users).values({
        email: "captain@sykesandsonlogistics.com",
        name: "Sykes Capital Member",
        username: "sykes-captain",
        password_hash: captainPasswordHash,
        role: "staff_captain",
        auth_provider: "local",
        company_id: companyId,
      });
      console.log("[SykesSeed] Created user: sykes-captain");
    }

    // ── 1c. Ensure TGE billing account is admin ─────────────────
    const tgeAdmins = await db
      .select()
      .from(users)
      .where(eq(users.email, "tgebilling@gmail.com"));

    if (tgeAdmins.length > 0) {
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.id, tgeAdmins[0].id));
    }

    // ── 2. Vendor profile ────────────────────────────────────────
    const existingVendors = await db
      .select()
      .from(vendors)
      .where(eq(vendors.user_id, userId));

    let vendorId: string;

    if (existingVendors.length > 0) {
      vendorId = existingVendors[0].id;
    } else {
      const result = await db.insert(vendors).values({
        user_id: userId,
        name: "Sykes and Sons Logistics",
        legal_name: "Sykes and Sons Logistics LLC",
        contact_person: "Joshua Sykes",
        email: "info@sykesandsonlogistics.com",
        phone: "(832) 555-0100",
        address: sykesAddress,
        city: sykesCity,
        state: sykesState,
        zip: sykesZip,
        service_category: "logistics",
        description:
          "Professional logistics and security services — freight management, camera installation, lock systems, and unit processing.",
        services: [
          "Freight Logistics",
          "Camera Installation",
          "Lock Systems",
          "Unit Processing",
          "Security Consulting",
        ],
        service_areas: ["Texas City", "Houston", "Galveston", "League City"],
        primary_color: "#1e3a5f",
        tagline: "Moving Texas Forward",
        website_slug: "sykes-and-sons-logistics",
        website_enabled: true,
        onboarding_status: "approved",
        is_active: true,
      }).returning();
      vendorId = result[0].id;
      console.log("[SykesSeed] Created vendor: Sykes and Sons Logistics");
    }

    // ── 3. Client record ─────────────────────────────────────────
    const existingClients = await db
      .select()
      .from(clients)
      .where(eq(clients.vendor_id, vendorId));

    if (existingClients.length === 0) {
      await db.insert(clients).values({
        vendor_id: vendorId,
        name: "Sykes and Sons Logistics",
        email: "info@sykesandsonlogistics.com",
        phone: "(832) 555-0100",
        address: sykesAddress,
        city: sykesCity,
        state: sykesState,
        zip: sykesZip,
        status: "active",
        tags: ["logistics", "vendor-client"],
        source: "vendor-registration",
        notes: "Sykes and Sons Logistics — primary client for portal invoicing",
      }).returning();
      console.log("[SykesSeed] Created client record for Sykes");
    }

    console.log("[SykesSeed] ✅ Sykes and Sons Logistics portal ready (login: sykes / sykes, captain: sykes-captain / sykescaptain)");
  } catch (error) {
    console.error("[SykesSeed] Error seeding Sykes portal:", error);
  }
}
