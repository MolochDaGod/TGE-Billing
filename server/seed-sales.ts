import { storage } from "./storage";

async function seedSalesLeads() {
  console.log("🌱 Seeding real sales leads...");

  const leads = [
    {
      name: "Wilcrest Park Townhomes",
      email: "wilcrestparktoa@gmail.com",
      phone: "832-885-1659",
      source: "existing_contract",
      status: "active",
      service_interest: "Annual Maintenance Contract",
      estimated_value: "60000",
      notes: "$60,000 per year paid weekly. Active maintenance contract.",
      interest_level: "high",
    },
    {
      name: "Willowick High Rise",
      email: "jb@jzmine.com",
      phone: null,
      source: "existing_contract",
      status: "active",
      service_interest: "Commercial High-Rise Services",
      estimated_value: null,
      notes: "2200 Willowick Rd, Houston TX 77027. High-rise electrical services.",
      interest_level: "high",
    },
    {
      name: "Notable Solutions Contracts",
      email: "info@tgebilling.com",
      phone: null,
      source: "existing_contract",
      status: "active",
      service_interest: "Commercial Contract",
      estimated_value: null,
      notes: "8405 Wilcrest Dr, Houston TX 77072. Commercial electrical contractor.",
      interest_level: "high",
    },
  ];

  try {
    for (const lead of leads) {
      await storage.createSalesLead(lead);
      console.log(`✅ Created lead: ${lead.name}`);
    }
    console.log("✨ Sales leads seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding sales leads:", error);
    throw error;
  }
}

seedSalesLeads()
  .then(() => {
    console.log("✅ Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
