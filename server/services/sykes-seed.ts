/**
 * server/services/sykes-seed.ts
 * Auto-seeds Sykes and Sons Logistics vendor account on server startup.
 * Idempotent — safe to run multiple times.
 */
import { db } from "../db";
import { users, vendors, clients } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedSykesPortal() {
  try {
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
        .set({ role: "vendor", password_hash: passwordHash, auth_provider: "local" })
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
      }).returning();
      userId = result[0].id;
      console.log("[SykesSeed] Created user: sykes");
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
        address: "1001 Logistics Blvd",
        city: "Texas City",
        state: "TX",
        zip: "77372",
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
        address: "1001 Logistics Blvd",
        city: "Texas City",
        state: "TX",
        zip: "77372",
        status: "active",
        tags: ["logistics", "vendor-client"],
        source: "vendor-registration",
        notes: "Sykes and Sons Logistics — primary client for portal invoicing",
      }).returning();
      console.log("[SykesSeed] Created client record for Sykes");
    }

    console.log("[SykesSeed] ✅ Sykes and Sons Logistics portal ready (login: sykes / sykes)");
  } catch (error) {
    console.error("[SykesSeed] Error seeding Sykes portal:", error);
  }
}
