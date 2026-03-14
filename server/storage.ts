import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Client,
  InsertClient,
  Invoice,
  InsertInvoice,
  InvoiceItem,
  InsertInvoiceItem,
  Payment,
  InsertPayment,
  Job,
  InsertJob,
  MarketingContent,
  InsertMarketingContent,
  CompanySettings,
  InsertCompanySettings,
  AIAgent,
  InsertAIAgent,
  Booking,
  InsertBooking,
  SalesLead,
  InsertSalesLead,
  SalesActivity,
  InsertSalesActivity,
  AgentConversation,
  InsertAgentConversation,
  File,
  InsertFile,
  Part,
  InsertPart,
  Notification,
  InsertNotification,
  UserAISettings,
  InsertUserAISettings,
  AIChatSession,
  InsertAIChatSession,
  AIChatMessage,
  InsertAIChatMessage,
  Vendor,
  InsertVendor,
  AIAutomationTrigger,
  InsertAIAutomationTrigger,
  AIAutomationLog,
  InsertAIAutomationLog,
  AILeadScore,
  InsertAILeadScore,
  AIWorkflowTemplate,
  InsertAIWorkflowTemplate,
  TeamMessage,
  InsertTeamMessage,
  Estimate,
  InsertEstimate,
  EstimateItem,
  InsertEstimateItem,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByReplitId(replitUserId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByPuterUsername(puterUsername: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsersByRole(role: string): Promise<User[]>;
  
  getClient(id: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getClientsByUserId(userId: string): Promise<Client[]>;
  getClientsByVendorId(vendorId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorBySlug(slug: string): Promise<Vendor | undefined>;
  getVendorByUserId(userId: string): Promise<Vendor | undefined>;
  getAllVendors(): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;
  
  getVendorServices(vendorId: string): Promise<any[]>;
  getVendorTestimonials(vendorId: string): Promise<any[]>;
  getVendorPortfolio(vendorId: string): Promise<any[]>;
  
  getAllCompanies(): Promise<any[]>;
  
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getAllInvoices(): Promise<Invoice[]>;
  getInvoicesByClientId(clientId: string): Promise<Invoice[]>;
  getInvoicesByCreator(userId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItems(invoiceId: string): Promise<boolean>;
  
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined>;
  
  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getJobsByClientId(clientId: string): Promise<Job[]>;
  getJobsByAssignedUser(userId: string): Promise<Job[]>;
  getJobsByCreator(userId: string): Promise<Job[]>;
  getJobsByVendorClients(vendorId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;
  
  getInvoicesByVendorClients(vendorId: string): Promise<Invoice[]>;
  
  getMarketingContent(id: string): Promise<MarketingContent | undefined>;
  getAllMarketingContent(): Promise<MarketingContent[]>;
  createMarketingContent(content: InsertMarketingContent): Promise<MarketingContent>;
  deleteMarketingContent(id: string): Promise<boolean>;
  
  getCompanySettings(): Promise<CompanySettings | undefined>;
  createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  updateCompanySettings(id: string, updates: Partial<InsertCompanySettings>): Promise<CompanySettings | undefined>;
  
  getAIAgent(id: string): Promise<AIAgent | undefined>;
  getAllAIAgents(): Promise<AIAgent[]>;
  createAIAgent(agent: InsertAIAgent): Promise<AIAgent>;
  updateAIAgent(id: string, updates: Partial<InsertAIAgent>): Promise<AIAgent | undefined>;
  
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByClientId(clientId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  
  getSalesLead(id: string): Promise<SalesLead | undefined>;
  getAllSalesLeads(): Promise<SalesLead[]>;
  createSalesLead(lead: InsertSalesLead): Promise<SalesLead>;
  updateSalesLead(id: string, updates: Partial<InsertSalesLead>): Promise<SalesLead | undefined>;
  
  getSalesActivity(id: string): Promise<SalesActivity | undefined>;
  getAllSalesActivities(): Promise<SalesActivity[]>;
  getSalesActivitiesByLeadId(leadId: string): Promise<SalesActivity[]>;
  createSalesActivity(activity: InsertSalesActivity): Promise<SalesActivity>;
  
  getAgentConversation(id: string): Promise<AgentConversation | undefined>;
  createAgentConversation(conversation: InsertAgentConversation): Promise<AgentConversation>;
  updateAgentConversation(id: string, updates: Partial<InsertAgentConversation>): Promise<AgentConversation | undefined>;
  
  getFile(id: string): Promise<File | undefined>;
  getAllFiles(): Promise<File[]>;
  getFilesByUploadedBy(userId: string): Promise<File[]>;
  getFilesByInvoiceId(invoiceId: string): Promise<File[]>;
  getFilesByJobId(jobId: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: string): Promise<boolean>;
  
  getPart(id: string): Promise<Part | undefined>;
  getAllParts(): Promise<Part[]>;
  createPart(part: InsertPart): Promise<Part>;
  updatePart(id: string, updates: Partial<InsertPart>): Promise<Part | undefined>;
  deletePart(id: string): Promise<boolean>;
  
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  dismissNotification(id: string): Promise<boolean>;
  
  getUserAISettings(userId: string): Promise<UserAISettings | undefined>;
  createUserAISettings(settings: InsertUserAISettings): Promise<UserAISettings>;
  updateUserAISettings(userId: string, updates: Partial<InsertUserAISettings>): Promise<UserAISettings | undefined>;
  
  getAIChatSessions(userId: string): Promise<AIChatSession[]>;
  getAIChatSession(id: string): Promise<AIChatSession | undefined>;
  createAIChatSession(session: InsertAIChatSession): Promise<AIChatSession>;
  updateAIChatSession(id: string, updates: Partial<InsertAIChatSession>): Promise<AIChatSession | undefined>;
  
  getAIChatMessages(sessionId: string): Promise<AIChatMessage[]>;
  createAIChatMessage(message: InsertAIChatMessage): Promise<AIChatMessage>;
  
  // AI Automation
  getAIAutomationTriggers(): Promise<AIAutomationTrigger[]>;
  getAIAutomationTrigger(id: string): Promise<AIAutomationTrigger | undefined>;
  createAIAutomationTrigger(trigger: InsertAIAutomationTrigger): Promise<AIAutomationTrigger>;
  updateAIAutomationTrigger(id: string, updates: Partial<InsertAIAutomationTrigger>): Promise<AIAutomationTrigger | undefined>;
  deleteAIAutomationTrigger(id: string): Promise<boolean>;
  
  getAIAutomationLogs(triggerId: string): Promise<AIAutomationLog[]>;
  createAIAutomationLog(log: InsertAIAutomationLog): Promise<AIAutomationLog>;
  
  getAILeadScores(): Promise<AILeadScore[]>;
  getAILeadScore(leadId: string): Promise<AILeadScore | undefined>;
  createAILeadScore(score: InsertAILeadScore): Promise<AILeadScore>;
  updateAILeadScore(id: string, updates: Partial<InsertAILeadScore>): Promise<AILeadScore | undefined>;
  
  getAIWorkflowTemplates(category?: string): Promise<AIWorkflowTemplate[]>;
  getAIWorkflowTemplate(id: string): Promise<AIWorkflowTemplate | undefined>;
  createAIWorkflowTemplate(template: InsertAIWorkflowTemplate): Promise<AIWorkflowTemplate>;
  updateAIWorkflowTemplate(id: string, updates: Partial<InsertAIWorkflowTemplate>): Promise<AIWorkflowTemplate | undefined>;

  // Estimates
  getEstimate(id: string): Promise<Estimate | undefined>;
  getEstimateByNumber(estimateNumber: string): Promise<Estimate | undefined>;
  getAllEstimates(): Promise<Estimate[]>;
  getEstimatesByClientId(clientId: string): Promise<Estimate[]>;
  getEstimatesByCreator(userId: string): Promise<Estimate[]>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate | undefined>;
  deleteEstimate(id: string): Promise<boolean>;
  getEstimateItems(estimateId: string): Promise<EstimateItem[]>;
  createEstimateItem(item: InsertEstimateItem): Promise<EstimateItem>;
  deleteEstimateItems(estimateId: string): Promise<boolean>;

  // Team Messages
  getTeamMessages(channel: string, limit?: number): Promise<TeamMessage[]>;
  createTeamMessage(msg: InsertTeamMessage): Promise<TeamMessage>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByReplitId(replitUserId: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.replit_user_id, replitUserId));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.google_id, googleId));
    return result[0];
  }

  async getUserByPuterUsername(puterUsername: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.puter_username, puterUsername));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.role, role));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
    return result[0];
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(schema.clients).orderBy(desc(schema.clients.created_at));
  }

  async getClientsByUserId(userId: string): Promise<Client[]> {
    return await db.select().from(schema.clients).where(eq(schema.clients.user_id, userId));
  }

  async getClientsByVendorId(vendorId: string): Promise<Client[]> {
    return await db.select().from(schema.clients).where(eq(schema.clients.vendor_id, vendorId)).orderBy(desc(schema.clients.created_at));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(schema.clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db
      .update(schema.clients)
      .set(updates)
      .where(eq(schema.clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(schema.clients).where(eq(schema.clients.id, id)).returning();
    return result.length > 0;
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const result = await db.select().from(schema.vendors).where(eq(schema.vendors.id, id));
    return result[0];
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await db.select().from(schema.vendors).where(eq(schema.vendors.is_active, true)).orderBy(schema.vendors.name);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const result = await db.insert(schema.vendors).values(vendor).returning();
    return result[0];
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.vendors)
      .set(updatedData)
      .where(eq(schema.vendors.id, id))
      .returning();
    return result[0];
  }

  async deleteVendor(id: string): Promise<boolean> {
    const result = await db.delete(schema.vendors).where(eq(schema.vendors.id, id)).returning();
    return result.length > 0;
  }

  async getVendorBySlug(slug: string): Promise<Vendor | undefined> {
    const result = await db.select().from(schema.vendors).where(eq(schema.vendors.website_slug, slug));
    return result[0];
  }

  async getVendorByUserId(userId: string): Promise<Vendor | undefined> {
    const result = await db.select().from(schema.vendors).where(eq(schema.vendors.user_id, userId));
    return result[0];
  }

  async getVendorServices(vendorId: string): Promise<any[]> {
    return await db.select().from(schema.vendor_services)
      .where(eq(schema.vendor_services.vendor_id, vendorId))
      .orderBy(schema.vendor_services.display_order);
  }

  async getVendorTestimonials(vendorId: string): Promise<any[]> {
    return await db.select().from(schema.vendor_testimonials)
      .where(eq(schema.vendor_testimonials.vendor_id, vendorId));
  }

  async getVendorPortfolio(vendorId: string): Promise<any[]> {
    return await db.select().from(schema.vendor_portfolio)
      .where(eq(schema.vendor_portfolio.vendor_id, vendorId))
      .orderBy(schema.vendor_portfolio.display_order);
  }

  async getAllCompanies(): Promise<any[]> {
    return await db.select().from(schema.companies).where(eq(schema.companies.is_active, true)).orderBy(schema.companies.name);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
    return result[0];
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const result = await db.select().from(schema.invoices).where(eq(schema.invoices.invoice_number, invoiceNumber));
    return result[0];
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(schema.invoices).orderBy(desc(schema.invoices.created_at));
  }

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    return await db.select().from(schema.invoices).where(eq(schema.invoices.client_id, clientId)).orderBy(desc(schema.invoices.created_at));
  }

  async getInvoicesByCreator(userId: string): Promise<Invoice[]> {
    return await db.select().from(schema.invoices).where(eq(schema.invoices.created_by, userId)).orderBy(desc(schema.invoices.created_at));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(schema.invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.invoices)
      .set(updatedData)
      .where(eq(schema.invoices.id, id))
      .returning();
    return result[0];
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(schema.invoices).where(eq(schema.invoices.id, id)).returning();
    return result.length > 0;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db.select().from(schema.invoice_items).where(eq(schema.invoice_items.invoice_id, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(schema.invoice_items).values(item).returning();
    return result[0];
  }

  async deleteInvoiceItems(invoiceId: string): Promise<boolean> {
    const result = await db.delete(schema.invoice_items).where(eq(schema.invoice_items.invoice_id, invoiceId)).returning();
    return result.length > 0;
  }

  async getInvoicesByVendorClients(vendorId: string): Promise<Invoice[]> {
    const clients = await this.getClientsByVendorId(vendorId);
    const clientIds = clients.map(c => c.id);
    if (clientIds.length === 0) return [];
    const allInvoices = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.created_at));
    return allInvoices.filter(invoice => clientIds.includes(invoice.client_id));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(schema.payments).where(eq(schema.payments.id, id));
    return result[0];
  }

  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return await db.select().from(schema.payments).where(eq(schema.payments.invoice_id, invoiceId)).orderBy(desc(schema.payments.created_at));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(schema.payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const result = await db
      .update(schema.payments)
      .set(updates)
      .where(eq(schema.payments.id, id))
      .returning();
    return result[0];
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id));
    return result[0];
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(schema.jobs).orderBy(desc(schema.jobs.created_at));
  }

  async getJobsByClientId(clientId: string): Promise<Job[]> {
    return await db.select().from(schema.jobs).where(eq(schema.jobs.client_id, clientId)).orderBy(desc(schema.jobs.created_at));
  }

  async getJobsByAssignedUser(userId: string): Promise<Job[]> {
    return await db.select().from(schema.jobs).where(eq(schema.jobs.assigned_to, userId)).orderBy(desc(schema.jobs.created_at));
  }

  async getJobsByCreator(userId: string): Promise<Job[]> {
    return await db.select().from(schema.jobs).where(eq(schema.jobs.created_by, userId)).orderBy(desc(schema.jobs.created_at));
  }

  async getJobsByVendorClients(vendorId: string): Promise<Job[]> {
    const clients = await this.getClientsByVendorId(vendorId);
    const clientIds = clients.map(c => c.id);
    if (clientIds.length === 0) return [];
    const allJobs = await db.select().from(schema.jobs).orderBy(desc(schema.jobs.created_at));
    return allJobs.filter(job => clientIds.includes(job.client_id));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(schema.jobs).values(job).returning();
    return result[0];
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.jobs)
      .set(updatedData)
      .where(eq(schema.jobs.id, id))
      .returning();
    return result[0];
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(schema.jobs).where(eq(schema.jobs.id, id)).returning();
    return result.length > 0;
  }

  async getMarketingContent(id: string): Promise<MarketingContent | undefined> {
    const result = await db.select().from(schema.marketing_content).where(eq(schema.marketing_content.id, id));
    return result[0];
  }

  async getAllMarketingContent(): Promise<MarketingContent[]> {
    return await db.select().from(schema.marketing_content).orderBy(desc(schema.marketing_content.created_at));
  }

  async createMarketingContent(content: InsertMarketingContent): Promise<MarketingContent> {
    const result = await db.insert(schema.marketing_content).values(content).returning();
    return result[0];
  }

  async deleteMarketingContent(id: string): Promise<boolean> {
    const result = await db.delete(schema.marketing_content).where(eq(schema.marketing_content.id, id)).returning();
    return result.length > 0;
  }

  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const result = await db.select().from(schema.company_settings).limit(1);
    return result[0];
  }

  async createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const result = await db.insert(schema.company_settings).values(settings).returning();
    return result[0];
  }

  async updateCompanySettings(id: string, updates: Partial<InsertCompanySettings>): Promise<CompanySettings | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.company_settings)
      .set(updatedData)
      .where(eq(schema.company_settings.id, id))
      .returning();
    return result[0];
  }

  async getAIAgent(id: string): Promise<AIAgent | undefined> {
    const result = await db.select().from(schema.ai_agents).where(eq(schema.ai_agents.id, id));
    return result[0];
  }

  async getAllAIAgents(): Promise<AIAgent[]> {
    return await db.select().from(schema.ai_agents).orderBy(schema.ai_agents.agent_type);
  }

  async createAIAgent(agent: InsertAIAgent): Promise<AIAgent> {
    const result = await db.insert(schema.ai_agents).values(agent).returning();
    return result[0];
  }

  async updateAIAgent(id: string, updates: Partial<InsertAIAgent>): Promise<AIAgent | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.ai_agents)
      .set(updatedData)
      .where(eq(schema.ai_agents.id, id))
      .returning();
    return result[0];
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
    return result[0];
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(schema.bookings).orderBy(desc(schema.bookings.scheduled_date));
  }

  async getBookingsByClientId(clientId: string): Promise<Booking[]> {
    return await db.select().from(schema.bookings).where(eq(schema.bookings.client_id, clientId));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(schema.bookings).values(booking).returning();
    return result[0];
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.bookings)
      .set(updatedData)
      .where(eq(schema.bookings.id, id))
      .returning();
    return result[0];
  }

  async getSalesLead(id: string): Promise<SalesLead | undefined> {
    const result = await db.select().from(schema.sales_leads).where(eq(schema.sales_leads.id, id));
    return result[0];
  }

  async getAllSalesLeads(): Promise<SalesLead[]> {
    return await db.select().from(schema.sales_leads).orderBy(desc(schema.sales_leads.created_at));
  }

  async createSalesLead(lead: InsertSalesLead): Promise<SalesLead> {
    const result = await db.insert(schema.sales_leads).values(lead).returning();
    return result[0];
  }

  async updateSalesLead(id: string, updates: Partial<InsertSalesLead>): Promise<SalesLead | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.sales_leads)
      .set(updatedData)
      .where(eq(schema.sales_leads.id, id))
      .returning();
    return result[0];
  }

  async getSalesActivity(id: string): Promise<SalesActivity | undefined> {
    const result = await db.select().from(schema.sales_activities).where(eq(schema.sales_activities.id, id));
    return result[0];
  }

  async getAllSalesActivities(): Promise<SalesActivity[]> {
    return await db.select().from(schema.sales_activities).orderBy(desc(schema.sales_activities.created_at));
  }

  async getSalesActivitiesByLeadId(leadId: string): Promise<SalesActivity[]> {
    return await db.select().from(schema.sales_activities).where(eq(schema.sales_activities.lead_id, leadId));
  }

  async createSalesActivity(activity: InsertSalesActivity): Promise<SalesActivity> {
    const result = await db.insert(schema.sales_activities).values(activity).returning();
    return result[0];
  }

  async getAgentConversation(id: string): Promise<AgentConversation | undefined> {
    const result = await db.select().from(schema.agent_conversations).where(eq(schema.agent_conversations.id, id));
    return result[0];
  }

  async createAgentConversation(conversation: InsertAgentConversation): Promise<AgentConversation> {
    const result = await db.insert(schema.agent_conversations).values(conversation).returning();
    return result[0];
  }

  async updateAgentConversation(id: string, updates: Partial<InsertAgentConversation>): Promise<AgentConversation | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.agent_conversations)
      .set(updatedData)
      .where(eq(schema.agent_conversations.id, id))
      .returning();
    return result[0];
  }

  async getFile(id: string): Promise<File | undefined> {
    const result = await db.select().from(schema.files).where(eq(schema.files.id, id));
    return result[0];
  }

  async getAllFiles(): Promise<File[]> {
    return await db.select().from(schema.files).orderBy(desc(schema.files.created_at));
  }

  async getFilesByUploadedBy(userId: string): Promise<File[]> {
    return await db.select().from(schema.files).where(eq(schema.files.uploaded_by, userId));
  }

  async getFilesByInvoiceId(invoiceId: string): Promise<File[]> {
    return await db.select().from(schema.files).where(eq(schema.files.invoice_id, invoiceId));
  }

  async getFilesByJobId(jobId: string): Promise<File[]> {
    return await db.select().from(schema.files).where(eq(schema.files.job_id, jobId));
  }

  async createFile(file: InsertFile): Promise<File> {
    const result = await db.insert(schema.files).values(file).returning();
    return result[0];
  }

  async updateFile(id: string, updates: Partial<InsertFile>): Promise<File | undefined> {
    const updatedData = { ...updates, updated_at: new Date() };
    const result = await db
      .update(schema.files)
      .set(updatedData)
      .where(eq(schema.files.id, id))
      .returning();
    return result[0];
  }

  async deleteFile(id: string): Promise<boolean> {
    const result = await db
      .update(schema.files)
      .set({ is_deleted: true, updated_at: new Date() })
      .where(eq(schema.files.id, id))
      .returning();
    return result.length > 0;
  }

  async getPart(id: string): Promise<Part | undefined> {
    const result = await db.select().from(schema.parts).where(eq(schema.parts.id, id));
    return result[0];
  }

  async getAllParts(): Promise<Part[]> {
    return await db.select().from(schema.parts)
      .where(eq(schema.parts.is_active, true))
      .orderBy(schema.parts.name);
  }

  async createPart(part: InsertPart): Promise<Part> {
    const result = await db.insert(schema.parts).values(part).returning();
    return result[0];
  }

  async updatePart(id: string, updates: Partial<InsertPart>): Promise<Part | undefined> {
    const result = await db.update(schema.parts)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(schema.parts.id, id))
      .returning();
    return result[0];
  }

  async deletePart(id: string): Promise<boolean> {
    await db.update(schema.parts)
      .set({ is_active: false })
      .where(eq(schema.parts.id, id));
    return true;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.user_id, userId),
          eq(schema.notifications.is_dismissed, false)
        )
      )
      .orderBy(desc(schema.notifications.created_at));
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(schema.notifications)
      .set({ is_read: true })
      .where(eq(schema.notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(schema.notifications)
      .set({ is_read: true })
      .where(eq(schema.notifications.user_id, userId));
  }

  async dismissNotification(id: string): Promise<boolean> {
    await db.update(schema.notifications)
      .set({ is_dismissed: true })
      .where(eq(schema.notifications.id, id));
    return true;
  }

  async getUserAISettings(userId: string): Promise<UserAISettings | undefined> {
    const result = await db.select().from(schema.user_ai_settings)
      .where(eq(schema.user_ai_settings.user_id, userId));
    return result[0];
  }

  async createUserAISettings(settings: InsertUserAISettings): Promise<UserAISettings> {
    const result = await db.insert(schema.user_ai_settings).values(settings).returning();
    return result[0];
  }

  async updateUserAISettings(userId: string, updates: Partial<InsertUserAISettings>): Promise<UserAISettings | undefined> {
    const result = await db.update(schema.user_ai_settings)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(schema.user_ai_settings.user_id, userId))
      .returning();
    return result[0];
  }

  async getAIChatSessions(userId: string): Promise<AIChatSession[]> {
    return await db.select().from(schema.ai_chat_sessions)
      .where(eq(schema.ai_chat_sessions.user_id, userId))
      .orderBy(desc(schema.ai_chat_sessions.updated_at));
  }

  async getAIChatSession(id: string): Promise<AIChatSession | undefined> {
    const result = await db.select().from(schema.ai_chat_sessions)
      .where(eq(schema.ai_chat_sessions.id, id));
    return result[0];
  }

  async createAIChatSession(session: InsertAIChatSession): Promise<AIChatSession> {
    const result = await db.insert(schema.ai_chat_sessions).values(session).returning();
    return result[0];
  }

  async updateAIChatSession(id: string, updates: Partial<InsertAIChatSession>): Promise<AIChatSession | undefined> {
    const result = await db.update(schema.ai_chat_sessions)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(schema.ai_chat_sessions.id, id))
      .returning();
    return result[0];
  }

  async getAIChatMessages(sessionId: string): Promise<AIChatMessage[]> {
    return await db.select().from(schema.ai_chat_messages)
      .where(eq(schema.ai_chat_messages.session_id, sessionId))
      .orderBy(schema.ai_chat_messages.created_at);
  }

  async createAIChatMessage(message: InsertAIChatMessage): Promise<AIChatMessage> {
    const result = await db.insert(schema.ai_chat_messages).values(message).returning();
    return result[0];
  }

  // AI Automation Triggers
  async getAIAutomationTriggers(): Promise<AIAutomationTrigger[]> {
    return await db.select().from(schema.ai_automation_triggers)
      .orderBy(desc(schema.ai_automation_triggers.created_at));
  }

  async getAIAutomationTrigger(id: string): Promise<AIAutomationTrigger | undefined> {
    const result = await db.select().from(schema.ai_automation_triggers)
      .where(eq(schema.ai_automation_triggers.id, id));
    return result[0];
  }

  async createAIAutomationTrigger(trigger: InsertAIAutomationTrigger): Promise<AIAutomationTrigger> {
    const result = await db.insert(schema.ai_automation_triggers).values(trigger).returning();
    return result[0];
  }

  async updateAIAutomationTrigger(id: string, updates: Partial<InsertAIAutomationTrigger>): Promise<AIAutomationTrigger | undefined> {
    const result = await db.update(schema.ai_automation_triggers)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(schema.ai_automation_triggers.id, id))
      .returning();
    return result[0];
  }

  async deleteAIAutomationTrigger(id: string): Promise<boolean> {
    const result = await db.delete(schema.ai_automation_triggers)
      .where(eq(schema.ai_automation_triggers.id, id))
      .returning();
    return result.length > 0;
  }

  // AI Automation Logs
  async getAIAutomationLogs(triggerId: string): Promise<AIAutomationLog[]> {
    return await db.select().from(schema.ai_automation_logs)
      .where(eq(schema.ai_automation_logs.trigger_id, triggerId))
      .orderBy(desc(schema.ai_automation_logs.created_at));
  }

  async createAIAutomationLog(log: InsertAIAutomationLog): Promise<AIAutomationLog> {
    const result = await db.insert(schema.ai_automation_logs).values(log).returning();
    return result[0];
  }

  // AI Lead Scores
  async getAILeadScores(): Promise<AILeadScore[]> {
    return await db.select().from(schema.ai_lead_scores)
      .orderBy(desc(schema.ai_lead_scores.overall_score));
  }

  async getAILeadScore(leadId: string): Promise<AILeadScore | undefined> {
    const result = await db.select().from(schema.ai_lead_scores)
      .where(eq(schema.ai_lead_scores.lead_id, leadId));
    return result[0];
  }

  async createAILeadScore(score: InsertAILeadScore): Promise<AILeadScore> {
    const result = await db.insert(schema.ai_lead_scores).values(score).returning();
    return result[0];
  }

  async updateAILeadScore(id: string, updates: Partial<InsertAILeadScore>): Promise<AILeadScore | undefined> {
    const result = await db.update(schema.ai_lead_scores)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(schema.ai_lead_scores.id, id))
      .returning();
    return result[0];
  }

  // AI Workflow Templates
  async getAIWorkflowTemplates(category?: string): Promise<AIWorkflowTemplate[]> {
    if (category) {
      return await db.select().from(schema.ai_workflow_templates)
        .where(eq(schema.ai_workflow_templates.category, category))
        .orderBy(schema.ai_workflow_templates.name);
    }
    return await db.select().from(schema.ai_workflow_templates)
      .orderBy(schema.ai_workflow_templates.name);
  }

  async getAIWorkflowTemplate(id: string): Promise<AIWorkflowTemplate | undefined> {
    const result = await db.select().from(schema.ai_workflow_templates)
      .where(eq(schema.ai_workflow_templates.id, id));
    return result[0];
  }

  async createAIWorkflowTemplate(template: InsertAIWorkflowTemplate): Promise<AIWorkflowTemplate> {
    const result = await db.insert(schema.ai_workflow_templates).values(template).returning();
    return result[0];
  }

  async updateAIWorkflowTemplate(id: string, updates: Partial<InsertAIWorkflowTemplate>): Promise<AIWorkflowTemplate | undefined> {
    const result = await db.update(schema.ai_workflow_templates)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(schema.ai_workflow_templates.id, id))
      .returning();
    return result[0];
  }

  // Estimates
  async getEstimate(id: string): Promise<Estimate | undefined> {
    const result = await db.select().from(schema.estimates).where(eq(schema.estimates.id, id));
    return result[0];
  }

  async getEstimateByNumber(estimateNumber: string): Promise<Estimate | undefined> {
    const result = await db.select().from(schema.estimates).where(eq(schema.estimates.estimate_number, estimateNumber));
    return result[0];
  }

  async getAllEstimates(): Promise<Estimate[]> {
    return await db.select().from(schema.estimates).orderBy(desc(schema.estimates.created_at));
  }

  async getEstimatesByClientId(clientId: string): Promise<Estimate[]> {
    return await db.select().from(schema.estimates).where(eq(schema.estimates.client_id, clientId)).orderBy(desc(schema.estimates.created_at));
  }

  async getEstimatesByCreator(userId: string): Promise<Estimate[]> {
    return await db.select().from(schema.estimates).where(eq(schema.estimates.created_by, userId)).orderBy(desc(schema.estimates.created_at));
  }

  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const result = await db.insert(schema.estimates).values(estimate).returning();
    return result[0];
  }

  async updateEstimate(id: string, updates: Partial<InsertEstimate>): Promise<Estimate | undefined> {
    const result = await db.update(schema.estimates)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(schema.estimates.id, id))
      .returning();
    return result[0];
  }

  async deleteEstimate(id: string): Promise<boolean> {
    await db.delete(schema.estimate_items).where(eq(schema.estimate_items.estimate_id, id));
    const result = await db.delete(schema.estimates).where(eq(schema.estimates.id, id)).returning();
    return result.length > 0;
  }

  async getEstimateItems(estimateId: string): Promise<EstimateItem[]> {
    return await db.select().from(schema.estimate_items).where(eq(schema.estimate_items.estimate_id, estimateId)).orderBy(schema.estimate_items.order_index);
  }

  async createEstimateItem(item: InsertEstimateItem): Promise<EstimateItem> {
    const result = await db.insert(schema.estimate_items).values(item).returning();
    return result[0];
  }

  async deleteEstimateItems(estimateId: string): Promise<boolean> {
    const result = await db.delete(schema.estimate_items).where(eq(schema.estimate_items.estimate_id, estimateId)).returning();
    return result.length >= 0;
  }

  // Team Messages
  async getTeamMessages(channel: string, limit: number = 60): Promise<TeamMessage[]> {
    return await db.select().from(schema.team_messages)
      .where(eq(schema.team_messages.channel, channel))
      .orderBy(desc(schema.team_messages.created_at))
      .limit(limit)
      .then(rows => rows.reverse());
  }

  async createTeamMessage(msg: InsertTeamMessage): Promise<TeamMessage> {
    const result = await db.insert(schema.team_messages).values(msg).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
