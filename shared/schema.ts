import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Companies/Partners table - for multi-company support
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "T.G.E. Billing", "Notable Solution"
  legal_name: text("legal_name"), // Full legal business name
  owner_id: varchar("owner_id"), // References users.id - the Partner/Pirate King who owns this company
  
  // Business info
  license_number: text("license_number"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  
  // Branding
  logo_url: text("logo_url"),
  tagline: text("tagline"),
  primary_color: text("primary_color"), // Brand color
  
  // Settings
  tax_rate: decimal("tax_rate", { precision: 5, scale: 2 }).default("8.25"), // Default tax rate
  invoice_prefix: text("invoice_prefix").default("INV"), // Invoice number prefix
  
  // Status
  is_active: boolean("is_active").default(true),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Trusted Vendors - External service providers we partner with (and registered contractors)
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Link to user account (for vendor login/portal access)
  user_id: varchar("user_id").references(() => users.id),
  
  // Business info
  name: text("name").notNull(), // Business name
  legal_name: text("legal_name"), // Full legal business name
  contact_person: text("contact_person"),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  
  // Business credentials
  license_number: text("license_number"),
  license_state: text("license_state"),
  license_expiry: timestamp("license_expiry"),
  ein_number: text("ein_number"), // Federal Tax ID (encrypted/partial)
  insurance_policy_number: text("insurance_policy_number"),
  insurance_expiry: timestamp("insurance_expiry"),
  bonded: boolean("bonded").default(false),
  bond_amount: decimal("bond_amount", { precision: 12, scale: 2 }),
  
  // Service details
  service_category: text("service_category").notNull(), // e.g., "hvac", "plumbing", "electrical"
  description: text("description"),
  certifications: text("certifications").array(), // e.g., ["EPA Universal Approved", "Licensed Professionals"]
  services: text("services").array(), // e.g., ["Commercial HVAC", "New Home HVAC Installation"]
  service_areas: text("service_areas").array(), // e.g., ["Houston", "Katy", "Sugar Land"]
  years_in_business: integer("years_in_business"),
  
  // Branding for vendor website
  logo_url: text("logo_url"),
  banner_url: text("banner_url"),
  primary_color: text("primary_color").default("#e5fa00"), // Default electric yellow
  secondary_color: text("secondary_color"),
  tagline: text("tagline"),
  about_text: text("about_text"),
  
  // Website settings
  website_slug: text("website_slug").unique(), // e.g., "bori-mex" for /vendor/bori-mex
  website_enabled: boolean("website_enabled").default(false),
  show_pricing: boolean("show_pricing").default(false),
  accept_bookings: boolean("accept_bookings").default(true),
  
  // Social & contact
  facebook_url: text("facebook_url"),
  instagram_url: text("instagram_url"),
  twitter_url: text("twitter_url"),
  linkedin_url: text("linkedin_url"),
  google_business_url: text("google_business_url"),
  yelp_url: text("yelp_url"),
  
  // Links & documents
  website_url: text("website_url"),
  bids_url: text("bids_url"),
  contracts_url: text("contracts_url"),
  coi_url: text("coi_url"), // Certificate of Insurance
  w9_url: text("w9_url"),
  
  // Ratings & reviews
  rating: integer("rating"), // 1-5 internal rating
  total_reviews: integer("total_reviews").default(0),
  average_rating: decimal("average_rating", { precision: 3, scale: 2 }),
  notes: text("notes"), // Internal notes
  
  // Onboarding & status
  onboarding_status: text("onboarding_status").default("pending"), // pending, documents_required, under_review, approved, rejected
  onboarding_completed_at: timestamp("onboarding_completed_at"),
  approved_by: varchar("approved_by").references(() => users.id),
  approved_at: timestamp("approved_at"),
  rejection_reason: text("rejection_reason"),
  
  // Status
  is_active: boolean("is_active").default(true),
  is_featured: boolean("is_featured").default(false), // Show on main site
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Vendor Service Pricing - Services offered by vendors with pricing
export const vendor_services = pgTable("vendor_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendor_id: varchar("vendor_id").references(() => vendors.id).notNull(),
  
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // e.g., "installation", "repair", "maintenance"
  
  // Pricing
  price_type: text("price_type").notNull().default("fixed"), // fixed, hourly, quote, range
  price: decimal("price", { precision: 10, scale: 2 }),
  price_min: decimal("price_min", { precision: 10, scale: 2 }),
  price_max: decimal("price_max", { precision: 10, scale: 2 }),
  price_unit: text("price_unit"), // per_hour, per_job, per_sqft, etc.
  
  // Duration
  estimated_duration: integer("estimated_duration"), // in minutes
  
  // Display
  is_featured: boolean("is_featured").default(false),
  display_order: integer("display_order").default(0),
  is_active: boolean("is_active").default(true),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Vendor Testimonials - Reviews/testimonials for vendor websites
export const vendor_testimonials = pgTable("vendor_testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendor_id: varchar("vendor_id").references(() => vendors.id).notNull(),
  client_id: varchar("client_id").references(() => clients.id),
  
  client_name: text("client_name").notNull(),
  client_company: text("client_company"),
  client_photo_url: text("client_photo_url"),
  
  rating: integer("rating").notNull(), // 1-5
  testimonial_text: text("testimonial_text").notNull(),
  service_provided: text("service_provided"),
  
  // Moderation
  is_approved: boolean("is_approved").default(false),
  is_featured: boolean("is_featured").default(false),
  approved_by: varchar("approved_by").references(() => users.id),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Vendor Portfolio - Work samples/photos for vendor websites
export const vendor_portfolio = pgTable("vendor_portfolio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendor_id: varchar("vendor_id").references(() => vendors.id).notNull(),
  
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  
  // Media
  image_url: text("image_url").notNull(),
  before_image_url: text("before_image_url"),
  after_image_url: text("after_image_url"),
  
  // Details
  project_date: timestamp("project_date"),
  project_value: decimal("project_value", { precision: 10, scale: 2 }),
  location: text("location"),
  
  // Display
  display_order: integer("display_order").default(0),
  is_featured: boolean("is_featured").default(false),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Company association - for Partners, Staff Captains, and Staff
  company_id: varchar("company_id").references(() => companies.id), // Which company they belong to
  
  // Auth provider fields - support multiple login methods
  auth_provider: text("auth_provider").notNull().default("local"), // local, google, web3, replit
  replit_user_id: text("replit_user_id").unique(), // Legacy Replit Auth (keep for migration)
  google_id: text("google_id").unique(), // Google OAuth ID
  wallet_address: text("wallet_address").unique(), // Web3 wallet address
  puter_username: text("puter_username").unique(), // Puter auth username
  username: text("username").unique(), // For local auth
  password_hash: text("password_hash"), // For local auth
  
  // User profile
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // Role hierarchy: pirate_king > admin > partner > staff_captain > staff > sparky_ai > sparky > client
  role: text("role").notNull().default("client"), 
  phone: text("phone"),
  avatar_url: text("avatar_url"),
  
  // Department management (for Staff Captains)
  department: text("department"), // e.g., "Installation", "Maintenance", "Residential"
  reports_to: varchar("reports_to").references(() => users.id), // Staff reports to Staff Captain
  
  // Google Drive integration (for admin/employee only)
  drive_folder_id: text("drive_folder_id"), // Personal Google Drive folder for documents
  drive_folder_url: text("drive_folder_url"), // Direct link to their folder
  
  // Social & preferences
  referral_code: text("referral_code").unique(),
  referred_by: varchar("referred_by"),
  sms_notifications_enabled: boolean("sms_notifications_enabled").default(true),
  email_notifications_enabled: boolean("email_notifications_enabled").default(true),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const company_settings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company_name: text("company_name").notNull(),
  logo_url: text("logo_url"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  license_number: text("license_number"),
  years_in_business: integer("years_in_business"),
  tagline: text("tagline"),
  about: text("about"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id),
  vendor_id: varchar("vendor_id").references(() => vendors.id), // Which vendor owns this client (for vendor CRM)
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  notes: text("notes"),
  
  // CRM Enhancement Fields
  status: text("status").notNull().default("active"), // active, inactive, prospect, vip
  tags: text("tags").array(), // Categories for organizing clients
  last_contact: timestamp("last_contact"), // Last interaction date
  next_follow_up: timestamp("next_follow_up"), // Reminder for next contact
  lifetime_value: decimal("lifetime_value", { precision: 10, scale: 2 }).default("0"), // Total revenue from client
  preferred_contact_method: text("preferred_contact_method"), // email, phone, sms
  source: text("source"), // referral, website, walk-in, etc.
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company_id: varchar("company_id").references(() => companies.id), // Which company issued this invoice
  invoice_number: text("invoice_number").notNull().unique(),
  client_id: varchar("client_id").references(() => clients.id).notNull(),
  created_by: varchar("created_by").references(() => users.id).notNull(),
  status: text("status").notNull().default("draft"),
  invoice_date: timestamp("invoice_date").defaultNow().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax_rate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  due_date: timestamp("due_date"),
  pdf_url: text("pdf_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const invoice_items = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoice_id: varchar("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  order_index: integer("order_index").notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoice_id: varchar("invoice_id").references(() => invoices.id).notNull(),
  stripe_payment_intent_id: text("stripe_payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  payment_method: text("payment_method"),
  paid_at: timestamp("paid_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").references(() => clients.id).notNull(),
  assigned_to: varchar("assigned_to").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("scheduled"),
  scheduled_date: timestamp("scheduled_date"),
  completed_date: timestamp("completed_date"),
  location: text("location"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const marketing_content = pgTable("marketing_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  created_by: varchar("created_by").references(() => users.id).notNull(),
  platform: text("platform").notNull(),
  content_type: text("content_type").notNull(),
  title: text("title"),
  body: text("body").notNull(),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const permits = pgTable("permits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  job_id: varchar("job_id").references(() => jobs.id),
  permit_number: text("permit_number"),
  permit_type: text("permit_type").notNull(),
  status: text("status").notNull().default("pending"),
  application_date: timestamp("application_date").defaultNow().notNull(),
  approval_date: timestamp("approval_date"),
  expiration_date: timestamp("expiration_date"),
  issued_by: text("issued_by"),
  jurisdiction: text("jurisdiction"),
  project_address: text("project_address").notNull(),
  project_description: text("project_description"),
  estimated_cost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  voltage: text("voltage"),
  amperage: text("amperage"),
  num_circuits: integer("num_circuits"),
  service_size: text("service_size"),
  notes: text("notes"),
  created_by: varchar("created_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  permit_id: varchar("permit_id").references(() => permits.id),
  job_id: varchar("job_id").references(() => jobs.id),
  inspection_type: text("inspection_type").notNull(),
  status: text("status").notNull().default("scheduled"),
  scheduled_date: timestamp("scheduled_date"),
  completed_date: timestamp("completed_date"),
  inspector_name: text("inspector_name"),
  inspector_license: text("inspector_license"),
  result: text("result"),
  nec_articles_checked: text("nec_articles_checked").array(),
  deficiencies: text("deficiencies"),
  corrections_required: text("corrections_required"),
  re_inspection_required: boolean("re_inspection_required").default(false),
  notes: text("notes"),
  photos: text("photos").array(),
  created_by: varchar("created_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const work_orders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  job_id: varchar("job_id").references(() => jobs.id).notNull(),
  permit_id: varchar("permit_id").references(() => permits.id),
  work_order_number: text("work_order_number").notNull().unique(),
  scope_of_work: text("scope_of_work").notNull(),
  nec_compliance_notes: text("nec_compliance_notes"),
  materials_used: jsonb("materials_used"),
  labor_hours: decimal("labor_hours", { precision: 10, scale: 2 }),
  safety_measures: text("safety_measures"),
  code_references: text("code_references").array(),
  test_results: jsonb("test_results"),
  completion_photos: text("completion_photos").array(),
  customer_signature: text("customer_signature"),
  technician_signature: text("technician_signature"),
  completed_by: varchar("completed_by").references(() => users.id),
  status: text("status").notNull().default("in_progress"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const compliance_checklists = pgTable("compliance_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  work_order_id: varchar("work_order_id").references(() => work_orders.id),
  inspection_id: varchar("inspection_id").references(() => inspections.id),
  checklist_type: text("checklist_type").notNull(),
  nec_version: text("nec_version").default("2023"),
  items: jsonb("items").notNull(),
  overall_compliance: boolean("overall_compliance").default(false),
  completed_by: varchar("completed_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const ai_agents = pgTable("ai_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agent_type: text("agent_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  system_prompt: text("system_prompt").notNull(),
  is_active: boolean("is_active").default(true),
  capabilities: text("capabilities").array(),
  config: jsonb("config"),
  total_conversations: integer("total_conversations").default(0),
  avg_response_time: decimal("avg_response_time", { precision: 10, scale: 2 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").references(() => clients.id),
  service_type: text("service_type").notNull(),
  scheduled_date: timestamp("scheduled_date").notNull(),
  duration_minutes: integer("duration_minutes").default(60),
  status: text("status").notNull().default("pending"),
  location: text("location"),
  notes: text("notes"),
  reminder_sent: boolean("reminder_sent").default(false),
  confirmation_sent: boolean("confirmation_sent").default(false),
  assigned_to: varchar("assigned_to").references(() => users.id),
  source: text("source"),
  created_by_agent: boolean("created_by_agent").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const sales_leads = pgTable("sales_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").references(() => clients.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source"),
  status: text("status").notNull().default("new"),
  interest_level: text("interest_level"),
  service_interest: text("service_interest"),
  estimated_value: decimal("estimated_value", { precision: 10, scale: 2 }),
  notes: text("notes"),
  last_contact: timestamp("last_contact"),
  next_follow_up: timestamp("next_follow_up"),
  assigned_to: varchar("assigned_to").references(() => users.id),
  converted_to_client: boolean("converted_to_client").default(false),
  conversion_date: timestamp("conversion_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const sales_activities = pgTable("sales_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lead_id: varchar("lead_id").references(() => sales_leads.id),
  activity_type: text("activity_type").notNull(),
  subject: text("subject"),
  description: text("description"),
  outcome: text("outcome"),
  performed_by: varchar("performed_by").references(() => users.id),
  performed_by_agent: boolean("performed_by_agent").default(false),
  scheduled_date: timestamp("scheduled_date"),
  completed_date: timestamp("completed_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const agent_conversations = pgTable("agent_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agent_id: varchar("agent_id").references(() => ai_agents.id).notNull(),
  user_id: varchar("user_id").references(() => users.id),
  session_id: text("session_id").notNull(),
  messages: jsonb("messages").notNull(),
  status: text("status").notNull().default("active"),
  lead_generated: boolean("lead_generated").default(false),
  booking_created: boolean("booking_created").default(false),
  satisfaction_rating: integer("satisfaction_rating"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uploaded_by: varchar("uploaded_by").references(() => users.id).notNull(),
  file_name: text("file_name").notNull(),
  original_name: text("original_name").notNull(),
  mime_type: text("mime_type").notNull(),
  file_size: integer("file_size").notNull(),
  category: text("category").notNull().default("other"),
  storage_provider: text("storage_provider").notNull().default("google-drive"),
  
  // Google Drive fields
  drive_file_id: text("drive_file_id"),
  drive_folder_id: text("drive_folder_id"),
  web_view_link: text("web_view_link"),
  web_content_link: text("web_content_link"),
  
  // Google Cloud Storage fields
  gcs_bucket_name: text("gcs_bucket_name"),
  gcs_file_path: text("gcs_file_path"),
  gcs_public_url: text("gcs_public_url"),
  
  // Related entities
  invoice_id: varchar("invoice_id").references(() => invoices.id),
  job_id: varchar("job_id").references(() => jobs.id),
  client_id: varchar("client_id").references(() => clients.id),
  part_id: varchar("part_id").references(() => parts.id),
  
  // Metadata
  description: text("description"),
  tags: text("tags").array(),
  is_deleted: boolean("is_deleted").default(false),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const parts = pgTable("parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  manufacturer: text("manufacturer"),
  part_number: text("part_number"),
  unit_price: text("unit_price").notNull().default("0"),
  quantity_in_stock: integer("quantity_in_stock").default(0),
  reorder_level: integer("reorder_level").default(0),
  image_url: text("image_url"),
  tags: text("tags").array(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const client_activities = pgTable("client_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").references(() => clients.id).notNull(),
  activity_type: text("activity_type").notNull(), // call, email, meeting, note, sms, invoice, job, payment
  subject: text("subject"),
  description: text("description"),
  outcome: text("outcome"), // successful, unsuccessful, pending, follow_up_needed
  performed_by: varchar("performed_by").references(() => users.id),
  related_invoice_id: varchar("related_invoice_id").references(() => invoices.id),
  related_job_id: varchar("related_job_id").references(() => jobs.id),
  scheduled_date: timestamp("scheduled_date"),
  completed_date: timestamp("completed_date"),
  duration_minutes: integer("duration_minutes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Onboarding System - Multi-tier workflow for Vendors → Employees → Clients
export const onboarding_workflows = pgTable("onboarding_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Workflow tracking
  workflow_type: text("workflow_type").notNull(), // vendor_to_employee, employee_to_client
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  
  // Relationships
  initiated_by: varchar("initiated_by").references(() => users.id).notNull(), // Who started the onboarding
  target_user_id: varchar("target_user_id").references(() => users.id), // The user being onboarded (once created)
  company_id: varchar("company_id").references(() => companies.id), // Company context
  
  // Onboarding data
  onboarding_data: jsonb("onboarding_data"), // Collected information during onboarding
  target_role: text("target_role").notNull(), // staff, vendor, client - role they'll have after onboarding
  
  // Progress tracking
  current_step: integer("current_step").default(1),
  total_steps: integer("total_steps").default(5),
  steps_completed: text("steps_completed").array().default(sql`ARRAY[]::text[]`),
  
  // Completion
  completed_at: timestamp("completed_at"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Document Templates - For generating contracts, agreements, etc.
export const document_templates = pgTable("document_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(), // e.g., "Employee Agreement", "Client Contract"
  description: text("description"),
  category: text("category").notNull(), // employee_onboarding, client_onboarding, general
  
  // Template content
  template_type: text("template_type").notNull(), // pdf, html, docx
  content: text("content").notNull(), // Template with placeholders like {{name}}, {{date}}, etc.
  variables: text("variables").array(), // List of available variables
  
  // Settings
  is_active: boolean("is_active").default(true),
  requires_signature: boolean("requires_signature").default(false),
  company_id: varchar("company_id").references(() => companies.id),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Generated Documents - Actual documents created from templates
export const onboarding_documents = pgTable("onboarding_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Relationships
  workflow_id: varchar("workflow_id").references(() => onboarding_workflows.id),
  template_id: varchar("template_id").references(() => document_templates.id),
  user_id: varchar("user_id").references(() => users.id), // Person the document is for
  generated_by: varchar("generated_by").references(() => users.id), // Who generated it
  
  // Document details
  document_name: text("document_name").notNull(),
  document_type: text("document_type").notNull(), // contract, agreement, welcome_packet, etc.
  file_url: text("file_url"), // Storage URL (Google Drive, object storage, etc.)
  drive_file_id: text("drive_file_id"), // Google Drive file ID if using Drive
  
  // Content
  rendered_content: text("rendered_content"), // Final rendered content
  metadata: jsonb("metadata"), // Additional info like filled variables
  
  // Signature tracking
  requires_signature: boolean("requires_signature").default(false),
  signed_at: timestamp("signed_at"),
  signature_data: jsonb("signature_data"), // Signature image/data
  signed_by: varchar("signed_by").references(() => users.id),
  
  // Status
  status: text("status").notNull().default("draft"), // draft, sent, signed, archived
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Onboarding Checklists - Track individual tasks in onboarding process
export const onboarding_checklists = pgTable("onboarding_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  workflow_id: varchar("workflow_id").references(() => onboarding_workflows.id).notNull(),
  
  // Task details
  task_name: text("task_name").notNull(),
  task_description: text("task_description"),
  task_order: integer("task_order").notNull(),
  
  // Status
  is_completed: boolean("is_completed").default(false),
  completed_at: timestamp("completed_at"),
  completed_by: varchar("completed_by").references(() => users.id),
  
  // Requirements
  is_required: boolean("is_required").default(true),
  requires_document: boolean("requires_document").default(false),
  related_document_id: varchar("related_document_id").references(() => onboarding_documents.id),
  
  notes: text("notes"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// AI Chat Sessions - Enhanced chat with multimodal support
export const ai_chat_sessions = pgTable("ai_chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User and agent
  user_id: varchar("user_id").references(() => users.id).notNull(),
  agent_type: text("agent_type").notNull().default("sparky"), // sparky, sales, support
  
  // Session details
  title: text("title"), // Auto-generated or user-defined title
  session_mode: text("session_mode").notNull().default("text"), // text, voice, multimodal
  
  // Voice settings (if using voice mode)
  voice_personality: text("voice_personality").default("alloy"), // alloy, echo, shimmer, ash, ballad, coral, sage, verse
  
  // Status
  status: text("status").notNull().default("active"), // active, archived
  is_pinned: boolean("is_pinned").default(false),
  
  // Metrics
  message_count: integer("message_count").default(0),
  total_duration_seconds: integer("total_duration_seconds").default(0),
  
  // Metadata
  tags: text("tags").array(),
  metadata: jsonb("metadata"), // Custom data
  
  // Last activity
  last_message_at: timestamp("last_message_at"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// AI Chat Messages - Individual messages with multimodal content
export const ai_chat_messages = pgTable("ai_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  session_id: varchar("session_id").references(() => ai_chat_sessions.id).notNull(),
  
  // Message details
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  
  // Multimodal content
  content_type: text("content_type").notNull().default("text"), // text, image, audio, file
  file_attachments: text("file_attachments").array(), // File IDs from files table
  image_urls: text("image_urls").array(), // Captured/uploaded image URLs
  audio_url: text("audio_url"), // Voice recording URL
  
  // Voice conversation metadata
  transcript: text("transcript"), // For audio messages
  audio_duration_seconds: integer("audio_duration_seconds"),
  
  // Function calls (for AI responses)
  function_calls: jsonb("function_calls"), // Track function invocations
  
  // Metadata
  metadata: jsonb("metadata"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User AI Settings - Personalized AI preferences
export const user_ai_settings = pgTable("user_ai_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  user_id: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Voice settings
  voice_enabled: boolean("voice_enabled").default(true),
  preferred_voice: text("preferred_voice").default("alloy"), // alloy, echo, shimmer, ash, ballad, coral, sage, verse
  voice_speed: decimal("voice_speed", { precision: 3, scale: 2 }).default("1.0"), // 0.5 to 2.0
  auto_play_responses: boolean("auto_play_responses").default(true),
  
  // Camera/upload settings
  camera_enabled: boolean("camera_enabled").default(true),
  file_upload_enabled: boolean("file_upload_enabled").default(true),
  max_file_size_mb: integer("max_file_size_mb").default(10),
  
  // Conversation settings
  show_timestamps: boolean("show_timestamps").default(true),
  send_typing_indicators: boolean("send_typing_indicators").default(true),
  message_sound_enabled: boolean("message_sound_enabled").default(false),
  
  // AI behavior
  proactive_suggestions: boolean("proactive_suggestions").default(true),
  auto_save_conversations: boolean("auto_save_conversations").default(true),
  context_window_size: integer("context_window_size").default(10), // Number of messages to keep in context
  
  // Notification preferences
  notify_on_ai_response: boolean("notify_on_ai_response").default(false),
  
  // Privacy
  save_voice_recordings: boolean("save_voice_recordings").default(false),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications - System notifications for users
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  user_id: varchar("user_id").references(() => users.id).notNull(),
  
  // Notification content
  type: text("type").notNull(), // upcoming_event, unread_message, job_reminder, invoice_due, system_alert
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  // Related entities
  related_type: text("related_type"), // booking, job, invoice, message
  related_id: varchar("related_id"), // ID of the related entity
  
  // Status
  is_read: boolean("is_read").default(false),
  is_dismissed: boolean("is_dismissed").default(false),
  
  // Priority
  priority: text("priority").default("normal"), // low, normal, high, urgent
  
  // Action link (optional)
  action_url: text("action_url"), // URL to navigate to when clicked
  
  // Metadata
  metadata: jsonb("metadata"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at"), // Optional expiration for time-sensitive notifications
});

// AI Automation Triggers - Scheduled tasks and event-based automations
export const ai_automation_triggers = pgTable("ai_automation_triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Trigger configuration
  name: text("name").notNull(),
  description: text("description"),
  trigger_type: text("trigger_type").notNull(), // scheduled, event, condition
  
  // For scheduled triggers
  schedule_cron: text("schedule_cron"), // Cron expression (e.g., "0 9 * * *" for 9 AM daily)
  schedule_timezone: text("schedule_timezone").default("America/Chicago"),
  
  // For event-based triggers
  event_type: text("event_type"), // invoice_created, invoice_overdue, booking_created, lead_created, etc.
  event_conditions: jsonb("event_conditions"), // JSON conditions for filtering events
  
  // Action configuration
  action_type: text("action_type").notNull(), // send_sms, send_email, create_notification, ai_response, update_status
  action_config: jsonb("action_config").notNull(), // Configuration for the action
  
  // AI Agent association (optional)
  agent_id: varchar("agent_id").references(() => ai_agents.id),
  
  // Template for messages
  message_template: text("message_template"),
  
  // Target audience
  target_role: text("target_role"), // admin, staff, vendor, client, or null for all
  target_user_ids: text("target_user_ids").array(), // Specific user IDs
  
  // Status and limits
  is_active: boolean("is_active").default(true),
  max_executions_per_day: integer("max_executions_per_day").default(100),
  cooldown_minutes: integer("cooldown_minutes").default(0), // Minimum time between executions for same target
  
  // Statistics
  total_executions: integer("total_executions").default(0),
  last_execution_at: timestamp("last_execution_at"),
  success_count: integer("success_count").default(0),
  failure_count: integer("failure_count").default(0),
  
  // Ownership
  created_by: varchar("created_by").references(() => users.id),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// AI Automation Logs - Execution history for automation triggers
export const ai_automation_logs = pgTable("ai_automation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  trigger_id: varchar("trigger_id").references(() => ai_automation_triggers.id).notNull(),
  
  // Execution details
  execution_status: text("execution_status").notNull(), // success, failure, skipped, pending
  execution_start: timestamp("execution_start").notNull(),
  execution_end: timestamp("execution_end"),
  duration_ms: integer("duration_ms"),
  
  // Target and result
  target_user_id: varchar("target_user_id").references(() => users.id),
  target_entity_type: text("target_entity_type"), // invoice, job, client, booking
  target_entity_id: varchar("target_entity_id"),
  
  // Action result
  action_result: jsonb("action_result"), // Result data from the action
  error_message: text("error_message"),
  
  // Context
  trigger_context: jsonb("trigger_context"), // Data that triggered the automation
  
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// AI Lead Scores - AI-powered lead qualification and scoring
export const ai_lead_scores = pgTable("ai_lead_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Lead reference
  lead_id: varchar("lead_id").references(() => sales_leads.id),
  client_id: varchar("client_id").references(() => clients.id),
  
  // Scoring
  overall_score: integer("overall_score").notNull(), // 0-100
  engagement_score: integer("engagement_score").default(0), // Based on interactions
  fit_score: integer("fit_score").default(0), // Based on project type/budget match
  urgency_score: integer("urgency_score").default(0), // Based on timeline indicators
  
  // Qualification
  qualification_status: text("qualification_status").notNull().default("unqualified"), // unqualified, mql, sql, opportunity
  qualification_reason: text("qualification_reason"),
  
  // AI Analysis
  ai_summary: text("ai_summary"), // AI-generated summary of the lead
  ai_recommendations: text("ai_recommendations").array(), // Suggested next actions
  ai_risk_factors: text("ai_risk_factors").array(), // Potential concerns
  
  // Scoring factors (for transparency)
  scoring_factors: jsonb("scoring_factors"), // Breakdown of score components
  
  // History
  score_history: jsonb("score_history"), // Array of {date, score, change_reason}
  
  // Metadata
  scored_by_agent: varchar("scored_by_agent").references(() => ai_agents.id),
  last_scored_at: timestamp("last_scored_at").defaultNow(),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// AI Workflow Templates - Pre-built automation workflows
export const ai_workflow_templates = pgTable("ai_workflow_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // onboarding, sales, support, billing, marketing
  
  // Workflow definition
  steps: jsonb("steps").notNull(), // Array of workflow steps
  
  // Template variables
  variables: jsonb("variables"), // Variables that can be customized
  
  // Usage
  is_system_template: boolean("is_system_template").default(false), // Built-in vs custom
  is_active: boolean("is_active").default(true),
  usage_count: integer("usage_count").default(0),
  
  created_by: varchar("created_by").references(() => users.id),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Proposal Templates - Reusable project proposal templates
export const proposal_templates = pgTable("proposal_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // bathroom_remodel, electrical_upgrade, panel_install, etc.
  
  // Template content
  scope_of_work: text("scope_of_work").notNull(),
  materials_template: jsonb("materials_template"), // Array of material line items
  labor_template: jsonb("labor_template"), // Array of labor line items
  services_template: jsonb("services_template"), // Array of service line items
  
  // Pricing
  base_price_min: decimal("base_price_min", { precision: 10, scale: 2 }),
  base_price_max: decimal("base_price_max", { precision: 10, scale: 2 }),
  markup_percentage: decimal("markup_percentage", { precision: 5, scale: 2 }).default("30"),
  
  // Terms
  warranty_terms: text("warranty_terms"),
  payment_terms: text("payment_terms"),
  timeline_estimate: text("timeline_estimate"),
  
  // Usage
  is_active: boolean("is_active").default(true),
  usage_count: integer("usage_count").default(0),
  
  created_by: varchar("created_by").references(() => users.id),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Sales Pipeline Stages - Customizable sales process stages
export const sales_pipeline_stages = pgTable("sales_pipeline_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  description: text("description"),
  order_index: integer("order_index").notNull(),
  
  // Stage configuration
  color: text("color").default("#3b82f6"), // Visual indicator
  icon: text("icon"), // Icon name from lucide-react
  
  // Actions and requirements
  required_actions: text("required_actions").array(), // Actions to complete before moving to next stage
  automated_actions: jsonb("automated_actions"), // Actions triggered when entering this stage
  
  // Pipeline assignment
  pipeline_type: text("pipeline_type").notNull().default("general"), // general, bathroom_remodel, electrical, etc.
  
  // Metrics
  average_days_in_stage: integer("average_days_in_stage"),
  conversion_rate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  
  is_active: boolean("is_active").default(true),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Training Tooltips - Contextual help for employee onboarding
export const training_tooltips = pgTable("training_tooltips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Targeting
  page: text("page").notNull(), // Page where tooltip appears (invoices, clients, jobs, etc.)
  element_selector: text("element_selector"), // CSS selector or data-testid for the target element
  
  // Content
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // billing, sales, client_management, job_tracking, etc.
  
  // Display settings
  position: text("position").default("bottom"), // top, bottom, left, right
  order_index: integer("order_index").notNull().default(0), // Order in tooltip tour
  
  // Role targeting
  target_roles: text("target_roles").array(), // Roles that should see this tooltip
  
  // Tracking
  is_required: boolean("is_required").default(false), // Must be viewed before continuing
  is_active: boolean("is_active").default(true),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Vendor name is required"),
  phone: z.string().min(1, "Phone number is required"),
  service_category: z.string().min(1, "Service category is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  rating: z.number().min(1).max(5).optional(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export const insertCompanySettingsSchema = createInsertSchema(company_settings).omit({
  id: true,
  updated_at: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional().refine((val) => !val || val === "" || /^[\d\s\-\+\(\)]+$/.test(val), {
    message: "Phone number must contain only digits, spaces, and basic punctuation"
  }),
  status: z.enum(["active", "inactive", "prospect", "vip"]).default("active").optional(),
  tags: z.array(z.string()).optional(),
  last_contact: z.coerce.date().optional(),
  next_follow_up: z.coerce.date().optional(),
  lifetime_value: z.string().optional(),
  preferred_contact_method: z.enum(["email", "phone", "sms"]).optional(),
});

export const insertClientActivitySchema = createInsertSchema(client_activities).omit({
  id: true,
  created_at: true,
}).extend({
  activity_type: z.enum(["call", "email", "meeting", "note", "sms", "invoice", "job", "payment"]),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  outcome: z.enum(["successful", "unsuccessful", "pending", "follow_up_needed"]).optional(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  invoice_date: z.coerce.date().optional(),
  subtotal: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Subtotal must be a positive number"
  }),
  tax_rate: z.string().optional().refine((val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 100), {
    message: "Tax rate must be between 0 and 100"
  }),
  tax_amount: z.string().optional().refine((val) => !val || parseFloat(val) >= 0, {
    message: "Tax amount must be a positive number"
  }),
  total: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Total must be a positive number"
  }),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
});

export const insertInvoiceItemSchema = createInsertSchema(invoice_items).omit({
  id: true,
}).extend({
  quantity: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Quantity must be greater than 0"
  }),
  unit_price: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Unit price must be a positive number"
  }),
  amount: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Amount must be a positive number"
  }),
  description: z.string().min(1, "Description is required"),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  created_at: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertMarketingContentSchema = createInsertSchema(marketing_content).omit({
  id: true,
  created_at: true,
});

export const insertPermitSchema = createInsertSchema(permits).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertWorkOrderSchema = createInsertSchema(work_orders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertComplianceChecklistSchema = createInsertSchema(compliance_checklists).omit({
  id: true,
  created_at: true,
});

export const insertAIAgentSchema = createInsertSchema(ai_agents).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  scheduled_date: z.coerce.date(),
});

export const insertSalesLeadSchema = createInsertSchema(sales_leads).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSalesActivitySchema = createInsertSchema(sales_activities).omit({
  id: true,
  created_at: true,
});

export const insertAgentConversationSchema = createInsertSchema(agent_conversations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPartSchema = createInsertSchema(parts).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Part name is required"),
  unit_price: z.string().refine((val) => parseFloat(val) >= 0, {
    message: "Unit price must be a positive number"
  }),
});

export const insertVendorServiceSchema = createInsertSchema(vendor_services).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Service name is required"),
  price_type: z.enum(["fixed", "hourly", "quote", "range"]).default("fixed"),
});

export const insertVendorTestimonialSchema = createInsertSchema(vendor_testimonials).omit({
  id: true,
  created_at: true,
}).extend({
  client_name: z.string().min(1, "Client name is required"),
  rating: z.number().min(1).max(5),
  testimonial_text: z.string().min(10, "Testimonial must be at least 10 characters"),
});

export const insertVendorPortfolioSchema = createInsertSchema(vendor_portfolio).omit({
  id: true,
  created_at: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  image_url: z.string().url("Invalid image URL"),
});

export const insertOnboardingWorkflowSchema = createInsertSchema(onboarding_workflows).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  workflow_type: z.enum(["vendor_to_employee", "employee_to_client"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  target_role: z.enum(["staff", "vendor", "client"]),
});

export const insertDocumentTemplateSchema = createInsertSchema(document_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Template name is required"),
  category: z.enum(["employee_onboarding", "client_onboarding", "general"]),
  template_type: z.enum(["pdf", "html", "docx"]),
  content: z.string().min(1, "Template content is required"),
});

export const insertOnboardingDocumentSchema = createInsertSchema(onboarding_documents).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  document_name: z.string().min(1, "Document name is required"),
  document_type: z.string().min(1, "Document type is required"),
  status: z.enum(["draft", "sent", "signed", "archived"]).default("draft"),
});

export const insertOnboardingChecklistSchema = createInsertSchema(onboarding_checklists).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  task_name: z.string().min(1, "Task name is required"),
});

export const insertAIChatSessionSchema = createInsertSchema(ai_chat_sessions).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  agent_type: z.enum(["sparky", "sales", "support"]).default("sparky"),
  session_mode: z.enum(["text", "voice", "multimodal"]).default("text"),
  voice_personality: z.enum(["alloy", "echo", "shimmer", "ash", "ballad", "coral", "sage", "verse"]).default("alloy").optional(),
  status: z.enum(["active", "archived"]).default("active"),
});

export const insertAIChatMessageSchema = createInsertSchema(ai_chat_messages).omit({
  id: true,
  created_at: true,
}).extend({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content is required"),
  content_type: z.enum(["text", "image", "audio", "file"]).default("text"),
});

export const insertUserAISettingsSchema = createInsertSchema(user_ai_settings).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  preferred_voice: z.enum(["alloy", "echo", "shimmer", "ash", "ballad", "coral", "sage", "verse"]).default("alloy"),
  voice_speed: z.string().refine((val) => {
    const num = parseFloat(val);
    return num >= 0.5 && num <= 2.0;
  }, { message: "Voice speed must be between 0.5 and 2.0" }).optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true,
}).extend({
  type: z.enum(["upcoming_event", "unread_message", "job_reminder", "invoice_due", "system_alert"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal").optional(),
});

export const insertAIAutomationTriggerSchema = createInsertSchema(ai_automation_triggers).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Trigger name is required"),
  trigger_type: z.enum(["scheduled", "event", "condition"]),
  action_type: z.enum(["send_sms", "send_email", "create_notification", "ai_response", "update_status"]),
  action_config: z.record(z.any()),
});

export const insertAIAutomationLogSchema = createInsertSchema(ai_automation_logs).omit({
  id: true,
  created_at: true,
}).extend({
  execution_status: z.enum(["success", "failure", "skipped", "pending"]),
});

export const insertAILeadScoreSchema = createInsertSchema(ai_lead_scores).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  overall_score: z.number().min(0).max(100),
  qualification_status: z.enum(["unqualified", "mql", "sql", "opportunity"]).default("unqualified"),
});

// Estimates — Quotes sent to clients before invoicing
export const estimates = pgTable("estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company_id: varchar("company_id").references(() => companies.id),
  estimate_number: text("estimate_number").notNull().unique(),
  client_id: varchar("client_id").references(() => clients.id).notNull(),
  created_by: varchar("created_by").references(() => users.id).notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, accepted, rejected, expired
  estimate_date: timestamp("estimate_date").defaultNow().notNull(),
  valid_until: timestamp("valid_until"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax_rate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  converted_to_invoice_id: varchar("converted_to_invoice_id").references(() => invoices.id),
  pdf_url: text("pdf_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const estimate_items = pgTable("estimate_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  estimate_id: varchar("estimate_id").references(() => estimates.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  order_index: integer("order_index").notNull(),
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  estimate_date: z.coerce.date().optional(),
  valid_until: z.coerce.date().optional(),
  subtotal: z.string().refine((val) => parseFloat(val) >= 0, { message: "Subtotal must be positive" }),
  tax_rate: z.string().optional(),
  tax_amount: z.string().optional(),
  total: z.string().refine((val) => parseFloat(val) >= 0, { message: "Total must be positive" }),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).default("draft"),
});

export const insertEstimateItemSchema = createInsertSchema(estimate_items).omit({
  id: true,
}).extend({
  quantity: z.string().refine((val) => parseFloat(val) > 0, { message: "Quantity must be > 0" }),
  unit_price: z.string().refine((val) => parseFloat(val) >= 0, { message: "Unit price must be positive" }),
  amount: z.string().refine((val) => parseFloat(val) >= 0, { message: "Amount must be positive" }),
  description: z.string().min(1, "Description is required"),
});

export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimateItem = z.infer<typeof insertEstimateItemSchema>;
export type EstimateItem = typeof estimate_items.$inferSelect;

// Team Messages — In-app team / group chat
export const team_messages = pgTable("team_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channel: text("channel").notNull().default("general"), // general | crew | admin | dm_<userId>
  sender_id: varchar("sender_id").references(() => users.id).notNull(),
  sender_name: text("sender_name").notNull(),
  sender_role: text("sender_role").notNull().default("client"),
  content: text("content").notNull(),
  is_ai_message: boolean("is_ai_message").default(false),
  ai_trigger: text("ai_trigger"), // What prompted the AI response
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeamMessageSchema = createInsertSchema(team_messages).omit({
  id: true,
  created_at: true,
}).extend({
  content: z.string().min(1).max(2000),
  channel: z.string().default("general"),
});

export type InsertTeamMessage = z.infer<typeof insertTeamMessageSchema>;
export type TeamMessage = typeof team_messages.$inferSelect;

export const insertAIWorkflowTemplateSchema = createInsertSchema(ai_workflow_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Template name is required"),
  category: z.enum(["onboarding", "sales", "support", "billing", "marketing"]),
  steps: z.array(z.record(z.any())),
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

export type InsertVendorService = z.infer<typeof insertVendorServiceSchema>;
export type VendorService = typeof vendor_services.$inferSelect;

export type InsertVendorTestimonial = z.infer<typeof insertVendorTestimonialSchema>;
export type VendorTestimonial = typeof vendor_testimonials.$inferSelect;

export type InsertVendorPortfolio = z.infer<typeof insertVendorPortfolioSchema>;
export type VendorPortfolio = typeof vendor_portfolio.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof company_settings.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoice_items.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertMarketingContent = z.infer<typeof insertMarketingContentSchema>;
export type MarketingContent = typeof marketing_content.$inferSelect;

export type InsertPermit = z.infer<typeof insertPermitSchema>;
export type Permit = typeof permits.$inferSelect;

export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;

export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof work_orders.$inferSelect;

export type InsertComplianceChecklist = z.infer<typeof insertComplianceChecklistSchema>;
export type ComplianceChecklist = typeof compliance_checklists.$inferSelect;

export type InsertAIAgent = z.infer<typeof insertAIAgentSchema>;
export type AIAgent = typeof ai_agents.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertSalesLead = z.infer<typeof insertSalesLeadSchema>;
export type SalesLead = typeof sales_leads.$inferSelect;

export type InsertSalesActivity = z.infer<typeof insertSalesActivitySchema>;
export type SalesActivity = typeof sales_activities.$inferSelect;

export type InsertAgentConversation = z.infer<typeof insertAgentConversationSchema>;
export type AgentConversation = typeof agent_conversations.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertPart = z.infer<typeof insertPartSchema>;
export type Part = typeof parts.$inferSelect;

export type InsertClientActivity = z.infer<typeof insertClientActivitySchema>;
export type ClientActivity = typeof client_activities.$inferSelect;

export type InsertOnboardingWorkflow = z.infer<typeof insertOnboardingWorkflowSchema>;
export type OnboardingWorkflow = typeof onboarding_workflows.$inferSelect;

export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;
export type DocumentTemplate = typeof document_templates.$inferSelect;

export type InsertOnboardingDocument = z.infer<typeof insertOnboardingDocumentSchema>;
export type OnboardingDocument = typeof onboarding_documents.$inferSelect;

export type InsertOnboardingChecklist = z.infer<typeof insertOnboardingChecklistSchema>;
export type OnboardingChecklist = typeof onboarding_checklists.$inferSelect;

export type InsertAIChatSession = z.infer<typeof insertAIChatSessionSchema>;
export type AIChatSession = typeof ai_chat_sessions.$inferSelect;

export type InsertAIChatMessage = z.infer<typeof insertAIChatMessageSchema>;
export type AIChatMessage = typeof ai_chat_messages.$inferSelect;

export type InsertUserAISettings = z.infer<typeof insertUserAISettingsSchema>;
export type UserAISettings = typeof user_ai_settings.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertAIAutomationTrigger = z.infer<typeof insertAIAutomationTriggerSchema>;
export type AIAutomationTrigger = typeof ai_automation_triggers.$inferSelect;

export type InsertAIAutomationLog = z.infer<typeof insertAIAutomationLogSchema>;
export type AIAutomationLog = typeof ai_automation_logs.$inferSelect;

export type InsertAILeadScore = z.infer<typeof insertAILeadScoreSchema>;
export type AILeadScore = typeof ai_lead_scores.$inferSelect;

export type InsertAIWorkflowTemplate = z.infer<typeof insertAIWorkflowTemplateSchema>;
export type AIWorkflowTemplate = typeof ai_workflow_templates.$inferSelect;
