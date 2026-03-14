import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./auth";
import { StorageService } from "./storageService";
import Stripe from "stripe";
import OpenAI from "openai";
import multer from "multer";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { 
  sendAppointmentReminder, 
  sendBookingConfirmation, 
  sendInvoiceNotification,
  sendFollowUp,
  sendSMS
} from "./services/twilio";
import { sendInvoiceEmail, sendAppointmentEmail, verifyWebhookSignature } from "./services/agentmail";
import { 
  insertClientSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
  insertJobSchema,
  insertMarketingContentSchema,
  insertCompanySettingsSchema,
  insertAIAgentSchema,
  insertBookingSchema,
  insertSalesLeadSchema,
  insertSalesActivitySchema,
  insertAgentConversationSchema,
  insertFileSchema,
  insertOnboardingWorkflowSchema,
  insertDocumentTemplateSchema,
  insertOnboardingDocumentSchema,
  insertOnboardingChecklistSchema,
  insertVendorSchema,
} from "@shared/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Helper function to get default checklist items for each workflow type
function getDefaultChecklistItems(workflowType: string) {
  if (workflowType === 'vendor_to_employee') {
    return [
      { task_name: 'Collect employee information', task_description: 'Gather basic details: name, email, phone, role', task_order: 1, is_required: true },
      { task_name: 'Generate employment agreement', task_description: 'Create and send employment contract', task_order: 2, is_required: true, requires_document: true },
      { task_name: 'Set up user account', task_description: 'Create login credentials and assign permissions', task_order: 3, is_required: true },
      { task_name: 'Send welcome email', task_description: 'Send welcome message with onboarding information', task_order: 4, is_required: false },
      { task_name: 'Complete onboarding', task_description: 'Review all steps and mark as complete', task_order: 5, is_required: true },
    ];
  } else if (workflowType === 'employee_to_client') {
    return [
      { task_name: 'Collect client information', task_description: 'Gather contact and project details', task_order: 1, is_required: true },
      { task_name: 'Generate client contract', task_description: 'Create service agreement', task_order: 2, is_required: true, requires_document: true },
      { task_name: 'Send welcome packet', task_description: 'Send client welcome materials', task_order: 3, is_required: false },
      { task_name: 'Schedule kickoff meeting', task_description: 'Set up initial project meeting', task_order: 4, is_required: false },
      { task_name: 'Complete onboarding', task_description: 'Finalize client setup', task_order: 5, is_required: true },
    ];
  }
  return [];
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // New auth system stores the full user object in req.user
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================
  // User CRM Data & Preferences - Multi-Tenant Support
  // ============================================
  
  // Get complete user CRM data (their clients, invoices, jobs) for save/recall
  app.get('/api/user/crm-data', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let clients: any[] = [];
      let invoices: any[] = [];
      let jobs: any[] = [];

      // Get data based on user role
      if (user.role === 'vendor') {
        const vendor = await storage.getVendorByUserId(user.id);
        if (vendor) {
          clients = await storage.getClientsByVendorId(vendor.id);
          invoices = await storage.getInvoicesByVendorClients(vendor.id);
          jobs = await storage.getJobsByVendorClients(vendor.id);
        }
      } else if (user.role === 'client') {
        clients = await storage.getClientsByUserId(user.id);
        const clientIds = clients.map(c => c.id);
        const allInvoices = await Promise.all(
          clientIds.map(id => storage.getInvoicesByClientId(id))
        );
        invoices = allInvoices.flat();
        const allJobs = await Promise.all(
          clientIds.map(id => storage.getJobsByClientId(id))
        );
        jobs = allJobs.flat();
      } else if (user.role === 'employee' || user.role === 'staff') {
        // Staff see jobs assigned to them and invoices they created
        jobs = await storage.getJobsByAssignedUser(user.id);
        invoices = await storage.getInvoicesByCreator(user.id);
        // Get unique client IDs from jobs and invoices
        const clientIds = new Set([
          ...jobs.map(j => j.client_id),
          ...invoices.map(i => i.client_id)
        ]);
        clients = await Promise.all(
          Array.from(clientIds).filter(Boolean).map(id => storage.getClient(id))
        ).then(results => results.filter(Boolean) as any[]);
      } else {
        // Admin and other roles see all
        clients = await storage.getAllClients();
        invoices = await storage.getAllInvoices();
        jobs = await storage.getAllJobs();
      }

      // Get AI settings if any
      const aiSettings = await storage.getUserAISettings(user.id);

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar_url: user.avatar_url,
          sms_notifications_enabled: user.sms_notifications_enabled,
          email_notifications_enabled: user.email_notifications_enabled,
        },
        clients,
        invoices,
        jobs,
        settings: aiSettings,
        summary: {
          totalClients: clients.length,
          totalInvoices: invoices.length,
          totalJobs: jobs.length,
          pendingInvoices: invoices.filter((i: any) => i.status === 'pending' || i.status === 'sent').length,
          activeJobs: jobs.filter((j: any) => j.status === 'in_progress' || j.status === 'scheduled').length,
        }
      });
    } catch (error) {
      console.error("Error fetching user CRM data:", error);
      res.status(500).json({ message: "Failed to fetch user CRM data" });
    }
  });

  // Update user preferences (notifications, profile settings)
  app.patch('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const allowedUpdates = [
        'name', 'phone', 'avatar_url',
        'sms_notifications_enabled', 'email_notifications_enabled'
      ];

      const updates: Record<string, any> = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid updates provided" });
      }

      const updatedUser = await storage.updateUser(user.id, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Dashboard stats for admin
  app.get('/api/dashboard/stats', isAuthenticated, requireRole('admin'), async (req: any, res) => {
    try {
      const clients = await storage.getAllClients();
      const jobs = await storage.getAllJobs();
      const invoices = await storage.getAllInvoices();
      
      const activeJobs = jobs.filter(j => j.status === 'in_progress' || j.status === 'scheduled');
      const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent');
      
      // Calculate current month revenue
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenue = invoices
        .filter(i => i.status === 'paid' && new Date(i.updated_at) >= monthStart)
        .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

      res.json({
        totalClients: clients.length,
        activeJobs: activeJobs.length,
        pendingInvoices: pendingInvoices.length,
        monthlyRevenue: monthlyRevenue.toFixed(2),
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent invoices (admin only) - with client details
  app.get('/api/invoices/recent', isAuthenticated, requireRole('admin'), async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const allInvoices = await storage.getAllInvoices();
      const allClients = await storage.getAllClients();
      
      // Enrich invoices with client contact information
      const recentWithDetails = allInvoices.slice(0, limit).map(invoice => {
        const client = allClients.find(c => c.id === invoice.client_id);
        return {
          ...invoice,
          client_phone: client?.phone || null,
          client_email: client?.email || null
        };
      });
      
      res.json(recentWithDetails);
    } catch (error) {
      console.error("Error fetching recent invoices:", error);
      res.status(500).json({ message: "Failed to fetch recent invoices" });
    }
  });

  // Recent jobs (admin only)
  app.get('/api/jobs/recent', isAuthenticated, requireRole('admin'), async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const allJobs = await storage.getAllJobs();
      const recent = allJobs.slice(0, limit);
      res.json(recent);
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      res.status(500).json({ message: "Failed to fetch recent jobs" });
    }
  });

  // My jobs (for employees and clients)
  app.get('/api/jobs/my-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const allJobs = await storage.getAllJobs();
      
      if (user.role === 'client') {
        // For clients, find their client record first
        const clients = await storage.getAllClients();
        const userClient = clients.find(c => c.user_id === user.id);
        if (!userClient) {
          return res.json([]); // No client record yet
        }
        // Filter jobs for this client's client_id
        const myJobs = allJobs.filter(j => j.client_id === userClient.id);
        res.json(myJobs);
      } else if (user.role === 'employee') {
        // Filter jobs assigned to this employee
        const myJobs = allJobs.filter(j => j.assigned_to === user.id);
        res.json(myJobs);
      } else {
        // Admins see all jobs
        res.json(allJobs);
      }
    } catch (error) {
      console.error("Error fetching my jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Today's jobs
  app.get('/api/jobs/today', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const allJobs = await storage.getAllJobs();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let myJobs = allJobs;
      if (user.role === 'employee') {
        myJobs = allJobs.filter(j => j.assigned_to === user.id);
      }
      
      const todayJobs = myJobs.filter(j => {
        if (!j.scheduled_date) return false;
        const jobDate = new Date(j.scheduled_date);
        return jobDate >= today && jobDate < tomorrow;
      });
      
      res.json(todayJobs);
    } catch (error) {
      console.error("Error fetching today's jobs:", error);
      res.status(500).json({ message: "Failed to fetch today's jobs" });
    }
  });

  // My invoices (for clients)
  app.get('/api/invoices/my-invoices', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const allInvoices = await storage.getAllInvoices();
      
      if (user.role === 'client') {
        // For clients, find their client record first
        const clients = await storage.getAllClients();
        const userClient = clients.find(c => c.user_id === user.id);
        if (!userClient) {
          return res.json([]); // No client record yet
        }
        // Filter invoices for this client's client_id
        const myInvoices = allInvoices.filter(i => i.client_id === userClient.id);
        res.json(myInvoices);
      } else {
        // Admins and employees see all invoices
        res.json(allInvoices);
      }
    } catch (error) {
      console.error("Error fetching my invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/users', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const role = req.query.role as string;
      let users;
      if (role) {
        users = await storage.getAllUsersByRole(role);
      } else {
        const admins = await storage.getAllUsersByRole('admin');
        const employees = await storage.getAllUsersByRole('employee');
        const clients = await storage.getAllUsersByRole('client');
        users = [...admins, ...employees, ...clients];
      }
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let clients;
      if (user.role === 'client') {
        clients = await storage.getClientsByUserId(user.id);
      } else if (user.role === 'vendor') {
        const vendor = await storage.getVendorByUserId(user.id);
        if (vendor) {
          clients = await storage.getClientsByVendorId(vendor.id);
        } else {
          clients = [];
        }
      } else {
        clients = await storage.getAllClients();
      }
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post('/api/clients', isAuthenticated, requireRole('admin', 'employee', 'vendor'), async (req: any, res) => {
    try {
      const user = req.user;
      let clientData = { ...req.body };
      
      if (user.role === 'vendor') {
        const vendor = await storage.getVendorByUserId(user.id);
        if (vendor) {
          clientData.vendor_id = vendor.id;
        }
      }
      
      const validatedData = insertClientSchema.parse(clientData);
      const client = await storage.createClient(validatedData);
      
      // Send welcome email and SMS to new client
      if (client.email) {
        try {
          const { sendClientWelcomeEmail } = await import('./services/agentmail.js');
          await sendClientWelcomeEmail({
            clientName: client.name,
            clientEmail: client.email,
          });
        } catch (emailError) {
          console.error("Failed to send client welcome email:", emailError);
        }
      }
      
      if (client.phone) {
        try {
          const { sendClientWelcomeSMS } = await import('./services/twilio.js');
          await sendClientWelcomeSMS(client.phone, {
            clientName: client.name,
          });
        } catch (smsError) {
          console.error("Failed to send client welcome SMS:", smsError);
        }
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: "Failed to create client" });
    }
  });

  app.patch('/api/clients/:id', isAuthenticated, requireRole('admin', 'employee', 'vendor'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      if (user.role === 'vendor') {
        const existingClient = await storage.getClient(id);
        const vendor = await storage.getVendorByUserId(user.id);
        if (!existingClient || !vendor || existingClient.vendor_id !== vendor.id) {
          return res.status(403).json({ message: "You can only update your own clients" });
        }
      }
      
      const client = await storage.updateClient(id, req.body);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      // Check if client exists
      const existingClient = await storage.getClient(id);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Permission check: admin can delete any, vendors can delete their own clients
      const isAdmin = user.role === 'admin' || user.role === 'pirate_king';
      let isOwner = false;
      
      if (user.role === 'vendor') {
        const vendor = await storage.getVendorByUserId(user.id);
        isOwner = vendor && existingClient.vendor_id === vendor.id;
      }
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Not authorized to delete this client" });
      }
      
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Companies routes
  app.get('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // ============================================
  // Public Vendor Routes (No Auth Required)
  // ============================================
  
  // Public vendor registration
  app.post('/api/vendor/register', async (req, res) => {
    try {
      const { 
        name, legal_name, contact_person, email, phone, address, city, state, zip,
        service_category, description, services, service_areas, license_number,
        license_state, years_in_business, certifications, bonded, website_url,
        tagline, password
      } = req.body;

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Hash password
      const bcrypt = await import('bcrypt');
      const password_hash = await bcrypt.hash(password, 10);

      // Generate username from email
      const username = email.split('@')[0] + '_' + Date.now().toString(36);

      // Generate website slug from business name
      const website_slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);

      // Create user account with vendor role
      const newUser = await storage.createUser({
        email,
        name: contact_person,
        username,
        password_hash,
        role: 'vendor',
        phone,
        auth_provider: 'local',
      });

      // Create vendor profile linked to user
      const newVendor = await storage.createVendor({
        user_id: newUser.id,
        name,
        legal_name: legal_name || null,
        contact_person,
        email,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        service_category,
        description: description || null,
        services: services || [],
        service_areas: service_areas || [],
        certifications: certifications || [],
        license_number: license_number || null,
        license_state: license_state || null,
        years_in_business: years_in_business || null,
        bonded: bonded || false,
        website_url: website_url || null,
        tagline: tagline || null,
        website_slug,
        website_enabled: false,
        onboarding_status: 'pending',
      });

      res.status(201).json({
        success: true,
        message: "Registration submitted successfully",
        vendor_id: newVendor.id,
        website_slug,
      });
    } catch (error) {
      console.error("Error registering vendor:", error);
      res.status(500).json({ message: "Failed to register vendor" });
    }
  });

  // Public vendor website data
  app.get('/api/vendor/public/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const vendor = await storage.getVendorBySlug(slug);
      
      if (!vendor || !vendor.is_active) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // Get related data
      const services = await storage.getVendorServices(vendor.id);
      const testimonials = await storage.getVendorTestimonials(vendor.id);
      const portfolio = await storage.getVendorPortfolio(vendor.id);

      res.json({
        vendor,
        services,
        testimonials,
        portfolio,
      });
    } catch (error) {
      console.error("Error fetching public vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  // Vendors CRUD routes
  app.get('/api/vendors', isAuthenticated, async (req, res) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get('/api/vendors/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const vendor = await storage.getVendor(id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.post('/api/vendors', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(400).json({ message: "Failed to create vendor" });
    }
  });

  app.patch('/api/vendors/:id', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const vendor = await storage.updateVendor(id, req.body);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.get('/api/vendor/my-profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const vendor = await storage.getVendorByUserId(user.id);
      if (!vendor) {
        return res.status(404).json({ message: "No vendor profile found for this user" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor profile:", error);
      res.status(500).json({ message: "Failed to fetch vendor profile" });
    }
  });

  app.patch('/api/vendor/my-profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const vendor = await storage.getVendorByUserId(user.id);
      if (!vendor) {
        return res.status(404).json({ message: "No vendor profile found for this user" });
      }
      const updatedVendor = await storage.updateVendor(vendor.id, req.body);
      res.json(updatedVendor);
    } catch (error) {
      console.error("Error updating vendor profile:", error);
      res.status(500).json({ message: "Failed to update vendor profile" });
    }
  });

  app.delete('/api/vendors/:id', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteVendor(id);
      if (!success) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });

  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let invoices;
      if (user.role === 'client') {
        const clients = await storage.getClientsByUserId(user.id);
        const allInvoices = await Promise.all(
          clients.map(client => storage.getInvoicesByClientId(client.id))
        );
        invoices = allInvoices.flat();
      } else if (user.role === 'vendor') {
        invoices = await storage.getInvoicesByCreator(user.id);
      } else {
        invoices = await storage.getAllInvoices();
      }
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const items = await storage.getInvoiceItems(id);
      const payments = await storage.getPaymentsByInvoiceId(id);
      const client = await storage.getClient(invoice.client_id);
      res.json({ ...invoice, items, payments, client });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post('/api/invoices', isAuthenticated, requireRole('admin', 'employee', 'vendor'), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { items, ...invoiceData } = req.body;
      
      const allInvoices = await storage.getAllInvoices();
      const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(5, '0')}`;
      
      const validatedInvoice = insertInvoiceSchema.parse({
        ...invoiceData,
        invoice_number: invoiceNumber,
        created_by: user.id,
        company_id: invoiceData.company_id || user.company_id || null,
      });
      
      const invoice = await storage.createInvoice(validatedInvoice);

      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const validatedItem = insertInvoiceItemSchema.parse({
            ...items[i],
            invoice_id: invoice.id,
            order_index: i,
          });
          await storage.createInvoiceItem(validatedItem);
        }
      }

      const fullInvoice = await storage.getInvoice(invoice.id);
      const invoiceItems = await storage.getInvoiceItems(invoice.id);
      
      const client = await storage.getClient(invoice.client_id);
      if (client && client.phone) {
        const clientUser = client.user_id ? await storage.getUserById(client.user_id) : null;
        const shouldSendSMS = clientUser?.sms_notifications_enabled !== false;
        
        if (shouldSendSMS && invoice.status === 'sent') {
          const paymentUrl = `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/payment/${invoice.id}`;
          await sendInvoiceNotification(client.phone, {
            clientName: client.name,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.total,
            dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
            paymentUrl
          });
        }
      }
      
      res.json({ ...fullInvoice, items: invoiceItems });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  app.patch('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { items, ...invoiceData } = req.body;
      const user = req.user;
      
      // Check if invoice exists
      const existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Permission check: admin/employee can edit any, vendors can edit their own
      const isAdmin = user.role === 'admin' || user.role === 'pirate_king';
      const isEmployee = user.role === 'employee' || user.role === 'staff' || user.role === 'staff_captain' || user.role === 'partner';
      const isOwner = existingInvoice.created_by === user.id;
      
      if (!isAdmin && !isEmployee && !isOwner) {
        return res.status(403).json({ message: "Not authorized to edit this invoice" });
      }
      
      const invoice = await storage.updateInvoice(id, invoiceData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (items) {
        await storage.deleteInvoiceItems(id);
        for (let i = 0; i < items.length; i++) {
          const validatedItem = insertInvoiceItemSchema.parse({
            ...items[i],
            invoice_id: id,
            order_index: i,
          });
          await storage.createInvoiceItem(validatedItem);
        }
      }

      const invoiceItems = await storage.getInvoiceItems(id);
      res.json({ ...invoice, items: invoiceItems });
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      // Check if invoice exists
      const existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Permission check: admin can delete any, vendors can delete their own
      const isAdmin = user.role === 'admin' || user.role === 'pirate_king';
      const isOwner = existingInvoice.created_by === user.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Not authorized to delete this invoice" });
      }
      
      await storage.deleteInvoiceItems(id);
      const success = await storage.deleteInvoice(id);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  app.post('/api/invoices/:id/send', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const invoice = await storage.getInvoice(id);
      
      if (invoice) {
        // Permission check: admin/employee can send any, vendors can send their own
        const isAdmin = user.role === 'admin' || user.role === 'pirate_king';
        const isEmployee = user.role === 'employee' || user.role === 'staff' || user.role === 'staff_captain' || user.role === 'partner';
        const isOwner = invoice.created_by === user.id;
        
        if (!isAdmin && !isEmployee && !isOwner) {
          return res.status(403).json({ message: "Not authorized to send this invoice" });
        }
      }
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const client = await storage.getClient(invoice.client_id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const items = await storage.getInvoiceItems(id);
      const paymentUrl = `${process.env.APP_URL || 'http://localhost:5000'}/payment/${invoice.id}`;

      const results: {
        email: { success: boolean; error?: string };
        sms: { success: boolean; error?: string };
      } = {
        email: { success: false, error: undefined },
        sms: { success: false, error: undefined }
      };

      if (client.email) {
        const emailResult = await sendInvoiceEmail({
          clientName: client.name,
          clientEmail: client.email,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.total,
          dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount
          })),
          notes: invoice.notes || undefined,
          paymentUrl
        });
        results.email = { 
          success: emailResult.success, 
          error: emailResult.error 
        };
      }

      if (client.phone) {
        const clientUser = client.user_id ? await storage.getUserById(client.user_id) : null;
        const shouldSendSMS = clientUser?.sms_notifications_enabled !== false;
        
        if (shouldSendSMS) {
          const smsResult = await sendInvoiceNotification(client.phone, {
            clientName: client.name,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.total,
            dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
            paymentUrl
          });
          results.sms = { 
            success: smsResult.success, 
            error: smsResult.error 
          };
        }
      }

      if (invoice.status === 'draft') {
        await storage.updateInvoice(id, { status: 'sent' });
      }

      res.json({ 
        success: results.email.success || results.sms.success,
        results 
      });
    } catch (error) {
      console.error("Error sending invoice:", error);
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  app.get('/api/invoices/:id/pdf', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const client = await storage.getClient(invoice.client_id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const items = await storage.getInvoiceItems(id);
      
      const { generateInvoicePDF } = await import('./services/pdfGenerator.js');
      const pdfDoc = generateInvoicePDF({
        invoice,
        items,
        client
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
      
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Generate project memo PDF
  app.get('/api/memos/willowick-remodel', isAuthenticated, async (req: any, res) => {
    try {
      const { generateMemoPDF } = await import('./services/pdfGenerator.js');

      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const pdfDoc = generateMemoPDF({
        clientName: 'Eleanor Williams',
        projectAddress: '2200 Willowick Rd, Apt. 9 H - Full Remodel',
        date: today,
        preparedBy: 'Chris - T.G.E. PROS',
        sections: [
          {
            title: 'Project Summary',
            content: 'Full apartment remodel at 2200 Willowick Rd, Apt. 9 H for Eleanor Williams. The project involves complete electrical upgrades across four areas: Office & Hallway, Master Bedroom, Master Bathroom, and Guest Bathroom. Work includes LED conversions, new can light installations, circuit extensions for electric toilet, sconce installations, and switch box upgrades. T.G.E. PROS is providing all electrical services. Willer and team are handling general contracting including demolition, plumbing, structural work, sheetrock, painting, countertop/cabinet installation, tile work, and balcony resurfacing.'
          },
          {
            title: 'Scope of Electrical Work',
            content: 'Office & Hallway: Remove and inspect all receptacles, load test and replace if damaged. Retrofit 6 can lights to LED fixture kits with driver compatibility verification. Delete preexisting phone line. Convert 6 ft of kitchen lighting bars to LED-capable fixtures with new LED lamps. Verify neutral wire presence at all switch locations.\n\nMaster Bedroom: Remove and inspect all receptacles, load test and replace if damaged. Delete preexisting phone line. Install 4 new can lighting fixtures in ceiling with proper IC-rated housing. Convert 2-gang switch box to 3-gang switch box with 3rd switch to control added 6" can lights. Run new circuit wiring through existing wall cavities.\n\nMaster Bathroom: Replace 2 closet lighting fixtures with LED. Install 4 new LED can lighting fixtures in customer desired locations. Convert 3 existing can lighting fixtures to LED. Install sconce lighting fixtures in customer desired locations. Convert single-gang switch to 2-gang switch (ceiling lights + sconces). Extend bathroom circuit to required location for new electric toilet with dedicated 20A GFCI-protected circuit. Verify proper grounding and bonding for wet location.\n\nGuest Bathroom: Convert 3 existing can lighting fixtures to LED. Install sconce lighting fixtures in customer desired locations. Convert single-gang switch to 2-gang switch (ceiling lights + sconces). Install 2 new can lighting fixtures in bathroom ceiling with IC-rated housing.\n\nGFCI Compliance Upgrades: Install and upgrade GFCI protection in both bathrooms and kitchen per NEC 2023 requirements. Test all existing GFCI devices. Replace non-compliant receptacles in wet locations. Verify arc-fault protection where required by code.\n\nPanel Load Assessment & Breaker Upgrades: Perform full panel load calculation to verify capacity for added circuits (electric toilet, new lighting loads). Replace any worn or undersized breakers. Label all new circuits. Provide load calculation documentation for permit inspection.'
          },
          {
            title: 'General Contractor Scope (Willer & Team)',
            content: 'Demolition of both bathrooms, wallpaper removal, kitchen tile demo, balcony tile demo, and all pre-discussed demolitions. Debris removal to building-designated location.\n\nAll plumbing and structural additions including converting hallway closet into guest bathroom extension. Metal studs required per building code. Copper plumbing required per building code.\n\nSheetrock for new walls and patch work. Texture and painting per client specifications. Installation of countertops, sinks, faucets, and premade cabinets. Tile installation with cement and grout in both bathrooms and kitchen backsplash. Balcony prep and surface material installation.\n\nGC Labor: $21,650 (does not include materials)\nBuilding-required ventilation: 3 setups at $325 each = $975'
          },
          {
            title: 'Additional Trades Required (Not Yet Priced)',
            content: 'The following subcontractors need to be sourced and quoted:\n\n1. A/C Technician - Duct servicing or replacement\n2. Hardwood Floor Crew - Bedroom flooring installation\n3. Wallpaper Installer - New wallpaper installation (Willer demos existing, does not install new)\n4. Custom Woodwork Crew - Added custom woodwork per client design\n\nThese trades should provide separate bids. COI and license verification required before work begins.'
          },
          {
            title: 'Insurance & Compliance Requirements',
            content: 'Before starting work, verify the following:\n\n- General Liability Insurance: $1M per occurrence / $2M aggregate minimum\n- Workers Compensation: Required for all employees on site\n- Certificate of Insurance (COI): Must be submitted to building management\n- Building may require T.G.E. PROS and all subcontractors to be named as Additional Insured on policies\n- All subcontractors must provide their own COI before entering the building\n- Building ventilation requirements must be met ($975 budgeted for 3 setups)\n- Electrical permit: $1,000 budgeted - pull before work begins\n- Request building access hours and noise restriction schedule'
          },
          {
            title: 'Recommended Payment Schedule',
            content: 'Milestone-based payment structure for the electrical scope:\n\nDeposit (before work begins): 30% = $7,354\nAfter rough-in completion & inspection: 40% = $9,805\nAfter final trim-out & inspection: 30% = $7,353\n\nTotal: $24,512\n\nNote: Materials ($8,112) should be purchased before each phase. Confirm with client whether materials are paid upfront or included in milestone payments.'
          },
          {
            title: 'Important Exclusions & Clarifications',
            content: 'The following items are NOT included in the T.G.E. PROS electrical estimate and must be addressed:\n\n1. Sheetrock repair after electrical cuts - Needs to be coordinated with Willer\'s scope or quoted separately\n2. Any additional circuits or outlets discovered during demo that are not in the original scope\n3. Panel upgrades if the existing panel cannot support the new load\n4. Low voltage / data wiring unless added to scope\n5. Appliance hookups beyond the electric toilet circuit\n\nChange orders will be documented and approved by the client before any additional work is performed.'
          }
        ],
        estimateItems: [
          { area: 'Office & Hallway', time: '9 hrs', materials: '$430', labor: '$900' },
          { area: 'Master Bedroom', time: '13 hrs', materials: '$565', labor: '$1,350' },
          { area: 'Master Bathroom', time: '25 hrs', materials: '$1,525', labor: '$2,750' },
          { area: 'Guest Bathroom', time: '17 hrs', materials: '$995', labor: '$1,900' },
          { area: 'GFCI Compliance Upgrades', time: '4 hrs', materials: '$285', labor: '$450' },
          { area: 'Panel Load Assessment & Breaker Upgrades', time: '3.5 hrs', materials: '$312', labor: '$500' },
        ],
        estimateTotals: {
          materials: '$8,112',
          labor: '$15,400',
          permitting: '$1,000',
          total: '$24,512',
        },
        questions: [
          'What are the building\'s approved work hours and any noise restrictions? Some condos only allow work between 9am-5pm weekdays.',
          'Can we get the building engineer\'s contact information? We\'ll need to coordinate debris removal to their designated location.',
          'Has the building management provided their specific insurance requirements? We need to know if they require Additional Insured endorsement, Primary & Non-Contributory, or Waiver of Subrogation on our policy.',
          'For the electric toilet in the master bathroom - has the specific model been selected? We need the electrical specifications (voltage, amperage) to size the circuit correctly.',
          'What is the client\'s preference for can light color temperature? Warm white (2700K), neutral (3000K), or daylight (4000K)? This affects all 13+ new LED fixtures across the project.',
          'Has the client finalized the sconce fixture selections for both bathrooms? We need these in hand or ordered before rough-in so we can place the junction boxes at the correct height and spacing.',
          'Is the existing electrical panel adequate for the additional circuits (electric toilet, new lighting circuits)? If not, a panel upgrade should be discussed and quoted before we start.',
          'Who is responsible for the sheetrock repair after our electrical cuts? This is excluded from both our estimate and needs to be assigned to Willer\'s scope or quoted separately.',
          'What is the project timeline and sequencing with Willer\'s crew? We need walls open for rough-in before drywall, then return for trim-out after painting is complete.',
          'Are there any other electrical needs the client has been considering? (EV charger in parking garage, smart home systems, USB outlets, under-cabinet lighting, etc.) Better to include now than add later.',
          'Does the client want dimmer switches for any of the new lighting circuits? This would be a small add but needs to be specified before we purchase switches.',
          'Will the 3 ventilation setups ($975) be shared among all trades working in the building, or does each contractor need their own? This affects our project cost.',
          'Has the building approved our scope of work? Some condo associations require architectural review board approval before electrical modifications.',
          'What is the client\'s preferred payment method - check, bank transfer, credit card, or PayPal? And is the milestone payment schedule (30/40/30) acceptable?'
        ],
        notes: 'This is a multi-trade coordination project requiring careful scheduling. Recommend holding a pre-construction meeting with Willer, Eleanor, and all subcontractors to establish the project timeline and communication protocol. Total estimated project cost across all trades is $55,000 - $75,000+. Our electrical portion represents approximately 25-30% of the overall project.'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="TGE_Memo_Willowick_Remodel.pdf"');
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      console.error("Error generating memo PDF:", error);
      res.status(500).json({ message: "Failed to generate memo PDF" });
    }
  });

  app.post('/api/invoices/:id/payment-intent', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(invoice.total) * 100),
        currency: 'usd',
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // PayPal integration routes - from blueprint:javascript_paypal
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  app.post('/api/payments', isAuthenticated, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);

      if (payment.status === 'succeeded') {
        await storage.updateInvoice(payment.invoice_id, { status: 'paid' });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ message: "Failed to create payment" });
    }
  });

  app.get('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let jobs;
      if (user.role === 'employee' || user.role === 'staff') {
        jobs = await storage.getJobsByAssignedUser(user.id);
      } else if (user.role === 'client') {
        const clients = await storage.getClientsByUserId(user.id);
        const allJobs = await Promise.all(
          clients.map(client => storage.getJobsByClientId(client.id))
        );
        jobs = allJobs.flat();
      } else if (user.role === 'vendor') {
        // Vendors see jobs for their clients OR jobs they created
        const vendor = await storage.getVendorByUserId(user.id);
        if (vendor) {
          const vendorJobs = await storage.getJobsByVendorClients(vendor.id);
          const createdJobs = await storage.getJobsByCreator(user.id);
          // Combine and deduplicate
          const allJobIds = new Set(vendorJobs.map(j => j.id));
          jobs = [...vendorJobs, ...createdJobs.filter(j => !allJobIds.has(j.id))];
        } else {
          jobs = await storage.getJobsByCreator(user.id);
        }
      } else {
        // Admin and other roles see all jobs
        jobs = await storage.getAllJobs();
      }
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post('/api/jobs', isAuthenticated, requireRole('admin', 'employee', 'vendor', 'staff', 'staff_captain', 'partner'), async (req: any, res) => {
    try {
      const user = req.user;
      const validatedData = insertJobSchema.parse({
        ...req.body,
        created_by: user.id, // Track who created the job
      });
      const job = await storage.createJob(validatedData);
      res.json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ message: "Failed to create job" });
    }
  });

  app.patch('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingJob = await storage.getJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (user.role === 'client') {
        const clients = await storage.getClientsByUserId(user.id);
        const clientIds = clients.map(c => c.id);
        if (!clientIds.includes(existingJob.client_id)) {
          return res.status(403).json({ message: "Unauthorized to update this job" });
        }
      }

      const job = await storage.updateJob(id, req.body);
      
      // Send SMS notification if status changed
      if (req.body.status && req.body.status !== existingJob.status && job) {
        try {
          const client = await storage.getClient(existingJob.client_id);
          if (client?.phone) {
            const { sendJobStatusSMS } = await import('./services/twilio.js');
            await sendJobStatusSMS(client.phone, {
              clientName: client.name,
              jobTitle: existingJob.title,
              status: req.body.status,
              notes: req.body.notes,
            });
          }
        } catch (smsError) {
          console.error("Failed to send job status SMS:", smsError);
        }
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      // Check if job exists
      const existingJob = await storage.getJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Permission check: admin can delete any, vendors/staff can delete their own
      const isAdmin = user.role === 'admin' || user.role === 'pirate_king';
      const isOwner = existingJob.created_by === user.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Not authorized to delete this job" });
      }
      
      const success = await storage.deleteJob(id);
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  app.get('/api/marketing', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const content = await storage.getAllMarketingContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching marketing content:", error);
      res.status(500).json({ message: "Failed to fetch marketing content" });
    }
  });

  app.post('/api/marketing/generate', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const { description, platform } = req.body;
      
      if (!description || !platform) {
        return res.status(400).json({ message: "Description and platform are required" });
      }

      const platformGuidelines: Record<string, string> = {
        facebook: "Create an engaging Facebook post (1-2 paragraphs). Include relevant hashtags and a call-to-action.",
        instagram: "Create an Instagram caption (concise, engaging, 1-2 short paragraphs). Include 5-8 relevant hashtags.",
        linkedin: "Create a professional LinkedIn post (2-3 paragraphs). Focus on business value and expertise.",
        twitter: "Create a Twitter/X post (under 280 characters). Be concise and impactful with 2-3 hashtags."
      };

      const prompt = `You are a professional marketing content writer for an electrical services company. 
Create 3 different variations of a ${platform} post based on this service/promotion: "${description}"

${platformGuidelines[platform.toLowerCase()] || platformGuidelines.facebook}

Important guidelines:
- Each variation should have a different tone (professional, friendly, urgent)
- Focus on benefits and solutions for customers
- Include appropriate calls-to-action (Call now, Get a quote, Schedule service, etc.)
- Highlight safety, reliability, and expertise
- Use electrical industry-specific terms appropriately

Return ONLY a valid JSON object with this structure:
{
  "variations": [
    { "tone": "professional", "content": "post text here" },
    { "tone": "friendly", "content": "post text here" },
    { "tone": "urgent", "content": "post text here" }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content generated");
      }

      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (error) {
      console.error("Error generating marketing content:", error);
      res.status(500).json({ message: "Failed to generate marketing content" });
    }
  });

  app.post('/api/marketing', isAuthenticated, requireRole('admin', 'employee'), async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertMarketingContentSchema.parse({
        ...req.body,
        created_by: user.id,
      });
      const content = await storage.createMarketingContent(validatedData);
      res.json(content);
    } catch (error) {
      console.error("Error creating marketing content:", error);
      res.status(400).json({ message: "Failed to create marketing content" });
    }
  });

  app.delete('/api/marketing/:id', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMarketingContent(id);
      if (!success) {
        return res.status(404).json({ message: "Marketing content not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting marketing content:", error);
      res.status(500).json({ message: "Failed to delete marketing content" });
    }
  });

  // Sparky AI Assistant with function calling for creating clients and invoices
  app.post('/api/ai/assistant', isAuthenticated, async (req: any, res) => {
    try {
      const { messages, sessionId, pageName, context } = req.body;
      const user = req.user;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages array is required" });
      }

      console.log(`[AI Assistant] Processing request for user role: ${user?.role}`);
      console.log(`[AI Assistant] Message count: ${messages.length}`);

      // Create conversation for persistence if sessionId provided
      let conversationId: string | null = null;
      if (sessionId) {
        try {
          const conversation = await storage.createAgentConversation({
            agent_id: "sparky-general-contractor",
            user_id: user.id,
            session_id: sessionId,
            messages: [] as any, // Will be updated with full conversation later
            status: "active"
          });
          conversationId = conversation.id;
          console.log(`[AI Assistant] Created conversation ${conversationId}`);
        } catch (convError) {
          console.warn("[AI Assistant] Warning: Could not create conversation record:", convError);
        }
      }

      // Define tools/functions that Sparky can use
      const tools = [
        {
          type: "function" as const,
          function: {
            name: "create_client",
            description: "Create a new client in the system. Use this when the user wants to add a new client or customer.",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The client's full name or company name"
                },
                email: {
                  type: "string",
                  description: "The client's email address"
                },
                phone: {
                  type: "string",
                  description: "The client's phone number"
                },
                address: {
                  type: "string",
                  description: "The client's street address"
                },
                city: {
                  type: "string",
                  description: "The client's city"
                },
                state: {
                  type: "string",
                  description: "The client's state (e.g., TX)"
                },
                zip_code: {
                  type: "string",
                  description: "The client's ZIP code"
                },
                notes: {
                  type: "string",
                  description: "Additional notes about the client"
                }
              },
              required: ["name", "email", "phone"]
            }
          }
        },
        {
          type: "function" as const,
          function: {
            name: "create_invoice",
            description: "Create a new invoice for a client. Use this when the user wants to create an invoice or bill.",
            parameters: {
              type: "object",
              properties: {
                client_id: {
                  type: "string",
                  description: "The ID of the client to invoice"
                },
                client_name: {
                  type: "string",
                  description: "The name of the client (if client_id is not provided, will search by name)"
                },
                due_date: {
                  type: "string",
                  description: "The invoice due date in YYYY-MM-DD format"
                },
                items: {
                  type: "array",
                  description: "Line items for the invoice",
                  items: {
                    type: "object",
                    properties: {
                      description: {
                        type: "string",
                        description: "Description of the item/service"
                      },
                      quantity: {
                        type: "number",
                        description: "Quantity"
                      },
                      rate: {
                        type: "number",
                        description: "Price per unit"
                      }
                    },
                    required: ["description", "quantity", "rate"]
                  }
                },
                notes: {
                  type: "string",
                  description: "Additional notes for the invoice"
                }
              },
              required: ["items"]
            }
          }
        },
        {
          type: "function" as const,
          function: {
            name: "list_clients",
            description: "Get a list of all clients in the system. Use this when the user asks about existing clients or wants to see who the clients are.",
            parameters: {
              type: "object",
              properties: {}
            }
          }
        }
      ];

      let response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 2048,
        temperature: 0.7,
        tools: tools,
        tool_choice: "auto"
      });

      console.log(`[AI Assistant] Response received, choices: ${response.choices?.length}`);

      const responseMessage = response.choices[0]?.message;
      
      // Check if AI wants to call a function
      if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        console.log(`[AI Assistant] Function calls requested: ${responseMessage.tool_calls.length}`);
        
        // Add assistant's response with tool calls to messages
        const newMessages = [...messages, responseMessage];
        
        // Execute each function call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`[AI Assistant] Executing function: ${functionName}`, functionArgs);
          
          let functionResult: any;
          
          try {
            if (functionName === "create_client") {
              // Create client
              const clientData = insertClientSchema.parse({
                ...functionArgs,
                created_by: user.id
              });
              const client = await storage.createClient(clientData);
              functionResult = {
                success: true,
                client_id: client.id,
                client_name: client.name,
                message: `Client "${client.name}" created successfully with ID ${client.id}`
              };
            } else if (functionName === "create_invoice") {
              // Find or use client
              let clientId = functionArgs.client_id;
              
              if (!clientId && functionArgs.client_name) {
                const clients = await storage.getAllClients();
                const client = clients.find(c => 
                  c.name.toLowerCase().includes(functionArgs.client_name.toLowerCase())
                );
                if (client) {
                  clientId = client.id;
                } else {
                  functionResult = {
                    success: false,
                    error: `Client "${functionArgs.client_name}" not found. Please create the client first.`
                  };
                  newMessages.push({
                    role: "tool" as const,
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(functionResult)
                  });
                  continue;
                }
              }
              
              if (!clientId) {
                functionResult = {
                  success: false,
                  error: "No client specified. Please provide either client_id or client_name."
                };
                newMessages.push({
                  role: "tool" as const,
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(functionResult)
                });
                continue;
              }
              
              // Generate invoice number
              const allInvoices = await storage.getAllInvoices();
              const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(5, '0')}`;
              
              // Calculate total
              const subtotal = functionArgs.items.reduce((sum: number, item: any) => 
                sum + (item.quantity * item.rate), 0
              );
              const tax = subtotal * 0.0825; // 8.25% Texas tax
              const total = subtotal + tax;
              
              // Parse due date - convert string to Date object
              let dueDate: Date;
              if (functionArgs.due_date) {
                dueDate = new Date(functionArgs.due_date);
              } else {
                dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              }
              
              // Create invoice with company_id
              const invoiceData = insertInvoiceSchema.parse({
                client_id: clientId,
                company_id: user.company_id || null,
                invoice_number: invoiceNumber,
                due_date: dueDate,
                subtotal: subtotal.toFixed(2),
                tax_rate: "8.25",
                tax_amount: tax.toFixed(2),
                total: total.toFixed(2),
                status: 'draft',
                notes: functionArgs.notes || '',
                created_by: user.id
              });
              
              const invoice = await storage.createInvoice(invoiceData);
              
              // Create invoice items
              for (let i = 0; i < functionArgs.items.length; i++) {
                const item = functionArgs.items[i];
                await storage.createInvoiceItem({
                  invoice_id: invoice.id,
                  description: item.description,
                  quantity: item.quantity.toString(),
                  unit_price: item.rate.toFixed(2),
                  amount: (item.quantity * item.rate).toFixed(2),
                  order_index: i
                });
              }
              
              functionResult = {
                success: true,
                invoice_id: invoice.id,
                invoice_number: invoiceNumber,
                total: total.toFixed(2),
                message: `Invoice ${invoiceNumber} created successfully for $${total.toFixed(2)}`
              };
            } else if (functionName === "list_clients") {
              const clients = await storage.getAllClients();
              functionResult = {
                success: true,
                clients: clients.map(c => ({
                  id: c.id,
                  name: c.name,
                  email: c.email,
                  phone: c.phone
                })),
                count: clients.length
              };
            } else {
              functionResult = {
                success: false,
                error: `Unknown function: ${functionName}`
              };
            }
          } catch (error: any) {
            console.error(`[AI Assistant] Function error:`, error);
            functionResult = {
              success: false,
              error: error.message || "Failed to execute function"
            };
          }
          
          // Add function result to messages
          newMessages.push({
            role: "tool" as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult)
          });
        }
        
        // Get final response from AI after function calls
        const finalResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: newMessages,
          max_tokens: 2048,
          temperature: 0.7
        });
        
        const finalContent = finalResponse.choices[0]?.message?.content;
        if (!finalContent) {
          return res.status(500).json({ message: "AI did not generate a response after function calls." });
        }
        
        console.log(`[AI Assistant] Success with function calls - content length: ${finalContent.length} chars`);
        res.json({ 
          message: finalContent,
          conversationId: conversationId || undefined
        });
      } else {
        // No function calls, return regular response
        const content = responseMessage?.content;
        if (!content) {
          console.error("[AI Assistant] No content in response:", JSON.stringify(response));
          return res.status(500).json({ message: "AI did not generate a response. Please try again." });
        }

        console.log(`[AI Assistant] Success - content length: ${content.length} chars`);
        res.json({ 
          message: content,
          conversationId: conversationId || undefined
        });
      }
    } catch (error: any) {
      console.error("[AI Assistant] Error:", error.message || error);
      if (error.response) {
        console.error("[AI Assistant] API Error:", error.response.status, error.response.data);
      }
      res.status(500).json({ 
        message: error.message?.includes('API') 
          ? "AI service temporarily unavailable. Please try again." 
          : "Failed to get AI response. Please try again." 
      });
    }
  });

  // Save conversation to database for history/persistence
  app.post('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId, messages, context, pageName } = req.body;
      const user = req.user;

      if (!sessionId || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "sessionId and messages array are required" });
      }

      // Create conversation record with all messages
      const conversation = await storage.createAgentConversation({
        agent_id: "sparky-general-contractor", // Default agent ID
        user_id: user.id,
        session_id: sessionId,
        messages: messages as any, // Store full message history
        status: "active"
      });

      console.log(`[Conversations] Saved conversation ${conversation.id} for user ${user.id}`);
      res.json({ conversationId: conversation.id, success: true });
    } catch (error) {
      console.error("[Conversations] Error saving conversation:", error);
      res.status(500).json({ message: "Failed to save conversation" });
    }
  });

  // Update conversation with new messages
  app.post('/api/ai/conversations/:conversationId/save', isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { messages, lastActivity } = req.body;
      const user = req.user;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array is required" });
      }

      // Update conversation
      const updated = await storage.updateAgentConversation(conversationId, {
        messages: messages as any,
        updated_at: new Date()
      });

      if (!updated) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      console.log(`[Conversations] Updated conversation ${conversationId} with ${messages.length} messages`);
      res.json({ success: true, conversationId });
    } catch (error) {
      console.error("[Conversations] Error updating conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  // Get conversation history
  app.get('/api/ai/conversations/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const conversation = await storage.getAgentConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Verify user has access to this conversation
      if (conversation.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("[Conversations] Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.get('/api/ai-agents', isAuthenticated, async (req, res) => {
    try {
      const agents = await storage.getAllAIAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching AI agents:", error);
      res.status(500).json({ message: "Failed to fetch AI agents" });
    }
  });

  app.get('/api/ai-agents/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await storage.getAIAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "AI agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching AI agent:", error);
      res.status(500).json({ message: "Failed to fetch AI agent" });
    }
  });

  app.post('/api/ai-agents', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const agentData = insertAIAgentSchema.parse(req.body);
      const agent = await storage.createAIAgent(agentData);
      res.json(agent);
    } catch (error) {
      console.error("Error creating AI agent:", error);
      res.status(400).json({ message: "Failed to create AI agent" });
    }
  });

  app.patch('/api/ai-agents/:id', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await storage.updateAIAgent(id, req.body);
      res.json(agent);
    } catch (error) {
      console.error("Error updating AI agent:", error);
      res.status(400).json({ message: "Failed to update AI agent" });
    }
  });

  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let bookings;
      if (user.role === 'client') {
        const clients = await storage.getClientsByUserId(user.id);
        const allBookings = await Promise.all(
          clients.map(client => storage.getBookingsByClientId(client.id))
        );
        bookings = allBookings.flat();
      } else {
        bookings = await storage.getAllBookings();
      }
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      
      if (booking.client_id) {
        const client = await storage.getClient(booking.client_id);
        if (client && client.phone && booking.scheduled_date) {
          const clientUser = client.user_id ? await storage.getUserById(client.user_id) : null;
          const shouldSendSMS = clientUser?.sms_notifications_enabled !== false;
          
          if (shouldSendSMS) {
            await sendBookingConfirmation(client.phone, {
              clientName: client.name,
              appointmentDate: new Date(booking.scheduled_date),
              serviceName: booking.service_type || 'electrical service',
              address: booking.location || client.address || 'your location'
            });
          }
        }
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (user.role === 'client') {
        const clients = await storage.getClientsByUserId(user.id);
        const clientIds = clients.map(c => c.id);
        if (!existingBooking.client_id || !clientIds.includes(existingBooking.client_id)) {
          return res.status(403).json({ message: "Unauthorized to update this booking" });
        }
      }

      const booking = await storage.updateBooking(id, req.body);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(400).json({ message: "Failed to update booking" });
    }
  });

  app.get('/api/sales-leads', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const leads = await storage.getAllSalesLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching sales leads:", error);
      res.status(500).json({ message: "Failed to fetch sales leads" });
    }
  });

  // Public service request endpoint (no auth required for customer inquiries)
  app.post('/api/service-request', async (req, res) => {
    try {
      const { name, email, phone, serviceType, description, preferredDate, preferredTime } = req.body;
      
      if (!name || !email || !phone || !serviceType || !description) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const leadData = {
        name,
        email,
        phone,
        source: 'website',
        status: 'new',
        interest_level: 'hot',
        service_interest: serviceType,
        notes: `Service Request:\n${description}\n\nPreferred Date: ${preferredDate || 'Flexible'}\nPreferred Time: ${preferredTime || 'Flexible'}`,
      };
      
      const lead = await storage.createSalesLead(leadData);
      
      // Send welcome email
      if (lead.email) {
        try {
          const { sendSalesLeadWelcome } = await import('./services/agentmail.js');
          await sendSalesLeadWelcome({
            leadName: lead.name,
            leadEmail: lead.email,
            leadSource: 'Website Service Request',
            serviceInterest: lead.service_interest || undefined,
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }
      
      // Send SMS confirmation
      if (lead.phone) {
        try {
          const { sendSalesLeadSMS } = await import('./services/twilio.js');
          await sendSalesLeadSMS(lead.phone, {
            leadName: lead.name,
            serviceInterest: lead.service_interest || 'electrical service'
          });
        } catch (smsError) {
          console.error("Failed to send SMS:", smsError);
        }
      }
      
      res.json({ success: true, message: "Service request submitted successfully", lead });
    } catch (error) {
      console.error("Error creating service request:", error);
      res.status(400).json({ message: "Failed to submit service request" });
    }
  });

  app.post('/api/sales-leads', isAuthenticated, async (req, res) => {
    try {
      const leadData = insertSalesLeadSchema.parse(req.body);
      const lead = await storage.createSalesLead(leadData);
      
      // Send welcome email if email provided
      if (lead.email) {
        const { sendSalesLeadWelcome } = await import('./services/agentmail.js');
        await sendSalesLeadWelcome({
          leadName: lead.name,
          leadEmail: lead.email,
          leadSource: lead.source || undefined,
          serviceInterest: lead.service_interest || undefined,
          estimatedValue: lead.estimated_value || undefined
        });
      }
      
      // Send welcome SMS if phone provided
      if (lead.phone) {
        const { sendSalesLeadSMS } = await import('./services/twilio.js');
        await sendSalesLeadSMS(lead.phone, {
          leadName: lead.name,
          serviceInterest: lead.service_interest || 'electrical service'
        });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error creating sales lead:", error);
      res.status(400).json({ message: "Failed to create sales lead" });
    }
  });

  app.patch('/api/sales-leads/:id', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const { id } = req.params;
      const lead = await storage.updateSalesLead(id, req.body);
      res.json(lead);
    } catch (error) {
      console.error("Error updating sales lead:", error);
      res.status(400).json({ message: "Failed to update sales lead" });
    }
  });

  app.get('/api/sales-activities', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const leadId = req.query.lead_id as string;
      const activities = leadId 
        ? await storage.getSalesActivitiesByLeadId(leadId)
        : await storage.getAllSalesActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching sales activities:", error);
      res.status(500).json({ message: "Failed to fetch sales activities" });
    }
  });

  app.post('/api/sales-activities', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const activityData = insertSalesActivitySchema.parse(req.body);
      const activity = await storage.createSalesActivity(activityData);
      res.json(activity);
    } catch (error) {
      console.error("Error creating sales activity:", error);
      res.status(400).json({ message: "Failed to create sales activity" });
    }
  });

  app.post('/api/agent-conversations', isAuthenticated, async (req, res) => {
    try {
      const conversationData = insertAgentConversationSchema.parse(req.body);
      const conversation = await storage.createAgentConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating agent conversation:", error);
      res.status(400).json({ message: "Failed to create agent conversation" });
    }
  });

  app.post('/api/agent-conversations/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { messages, agentId } = req.body;
      
      const agent = await storage.getAIAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "AI agent not found" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: agent.system_prompt },
          ...messages,
        ],
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content generated");
      }

      await storage.updateAgentConversation(id, { 
        messages: [...messages, { role: "assistant", content }]
      });

      res.json({ message: content });
    } catch (error) {
      console.error("Error with agent conversation:", error);
      res.status(500).json({ message: "Failed to get agent response" });
    }
  });

  app.post('/api/notifications/sms', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }
      
      const result = await sendSMS(to, message);
      
      if (result.success) {
        res.json({ success: true, sid: result.sid });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ message: "Failed to send SMS" });
    }
  });

  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.post('/api/settings', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const existingSettings = await storage.getCompanySettings();
      let settings;
      
      if (existingSettings) {
        settings = await storage.updateCompanySettings(existingSettings.id, req.body);
      } else {
        const validatedData = insertCompanySettingsSchema.parse(req.body);
        settings = await storage.createCompanySettings(validatedData);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error saving company settings:", error);
      res.status(400).json({ message: "Failed to save company settings" });
    }
  });

  app.post('/api/webhooks/agentmail', async (req, res) => {
    try {
      const signature = req.headers['x-agentmail-signature'] as string;
      const webhookSecret = process.env.AGENTMAIL_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error('AGENTMAIL_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      const rawBody = JSON.stringify(req.body);
      
      if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      console.log(`AgentMail webhook received: ${event.type}`, {
        messageId: event.data?.message?.id,
        to: event.data?.message?.to,
        timestamp: event.timestamp
      });

      switch (event.type) {
        case 'message.sent':
          console.log('Email sent successfully:', event.data?.message?.id);
          break;
        
        case 'message.delivered':
          console.log('Email delivered:', event.data?.message?.id);
          break;
        
        case 'message.bounced':
          console.warn('Email bounced:', {
            messageId: event.data?.message?.id,
            reason: event.data?.bounce?.reason
          });
          break;
        
        case 'message.complained':
          console.warn('Email complaint (spam):', {
            messageId: event.data?.message?.id,
            complaintType: event.data?.complaint?.type
          });
          break;
        
        case 'message.rejected':
          console.error('Email rejected:', {
            messageId: event.data?.message?.id,
            reason: event.data?.rejection?.reason
          });
          break;
        
        case 'message.received':
          console.log('Reply received:', {
            messageId: event.data?.message?.id,
            from: event.data?.message?.from,
            subject: event.data?.message?.subject
          });
          break;
        
        default:
          console.log('Unknown webhook event type:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // File management routes
  const upload = multer({ storage: multer.memoryStorage() });

  // Initialize user's Drive folder (admin/employee only)
  app.post('/api/files/initialize-folder', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (user.role !== 'admin' && user.role !== 'employee') {
        return res.status(403).json({ message: "Only admin and employee users can have Drive folders" });
      }

      const folder = await StorageService.createUserDriveFolder(user);

      if (folder) {
        await storage.updateUser(user.id, {
          drive_folder_id: folder.folderId,
          drive_folder_url: folder.webViewLink,
        });

        res.json({
          folderId: folder.folderId,
          folderUrl: folder.webViewLink,
        });
      } else {
        res.status(400).json({ message: "Failed to create folder" });
      }
    } catch (error) {
      console.error("Error initializing user folder:", error);
      res.status(500).json({ message: "Failed to initialize folder" });
    }
  });

  // Upload file
  app.post('/api/files/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const user = req.user;
      const file = req.file;
      const { category, invoiceId, jobId, clientId, description, tags } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Validate user has folder if admin/employee
      if ((user.role === 'admin' || user.role === 'employee') && !user.drive_folder_id) {
        return res.status(400).json({ 
          message: "User folder not initialized. Please initialize folder first.",
          requiresInitialization: true,
        });
      }

      const metadata = await StorageService.uploadFileForUser(
        user,
        file.originalname,
        file.buffer,
        file.mimetype,
        category || 'other'
      );

      const fileRecord = await storage.createFile({
        uploaded_by: user.id,
        file_name: metadata.fileName,
        original_name: metadata.originalName,
        mime_type: metadata.mimeType,
        file_size: metadata.size,
        category: category || 'other',
        storage_provider: metadata.provider,
        drive_file_id: metadata.fileId,
        drive_folder_id: user.drive_folder_id,
        web_view_link: metadata.webViewLink,
        web_content_link: metadata.publicUrl,
        gcs_bucket_name: metadata.bucketName,
        gcs_file_path: metadata.fileName,
        gcs_public_url: metadata.publicUrl,
        invoice_id: invoiceId || null,
        job_id: jobId || null,
        client_id: clientId || null,
        description: description || null,
        tags: tags ? JSON.parse(tags) : null,
      });

      res.json(fileRecord);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get all files (admin/employee only)
  app.get('/api/files', isAuthenticated, requireRole(['admin', 'employee']), async (req: any, res) => {
    try {
      const files = await storage.getAllFiles();
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Get user's files
  app.get('/api/files/my-files', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const files = await storage.getFilesByUploadedBy(user.id);
      res.json(files);
    } catch (error) {
      console.error("Error fetching user files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Get files by invoice ID
  app.get('/api/files/invoice/:invoiceId', isAuthenticated, async (req: any, res) => {
    try {
      const files = await storage.getFilesByInvoiceId(req.params.invoiceId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching invoice files:", error);
      res.status(500).json({ message: "Failed to fetch invoice files" });
    }
  });

  // Get files by job ID
  app.get('/api/files/job/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const files = await storage.getFilesByJobId(req.params.jobId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching job files:", error);
      res.status(500).json({ message: "Failed to fetch job files" });
    }
  });

  // Delete file (soft delete)
  app.delete('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const file = await storage.getFile(req.params.id);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Only allow file owner or admin to delete
      if (file.uploaded_by !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to delete this file" });
      }

      await storage.deleteFile(req.params.id);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Parts Catalog Routes
  app.get('/api/parts', isAuthenticated, async (req, res) => {
    try {
      const parts = await storage.getAllParts();
      res.json(parts);
    } catch (error) {
      console.error("Error fetching parts:", error);
      res.status(500).json({ message: "Failed to fetch parts" });
    }
  });

  app.get('/api/parts/:id', isAuthenticated, async (req, res) => {
    try {
      const part = await storage.getPart(req.params.id);
      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }
      res.json(part);
    } catch (error) {
      console.error("Error fetching part:", error);
      res.status(500).json({ message: "Failed to fetch part" });
    }
  });

  app.post('/api/parts', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const partData = schema.insertPartSchema.parse(req.body);
      const part = await storage.createPart(partData);
      res.json(part);
    } catch (error) {
      console.error("Error creating part:", error);
      res.status(500).json({ message: "Failed to create part" });
    }
  });

  app.patch('/api/parts/:id', isAuthenticated, requireRole('admin', 'employee'), async (req, res) => {
    try {
      const part = await storage.updatePart(req.params.id, req.body);
      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }
      res.json(part);
    } catch (error) {
      console.error("Error updating part:", error);
      res.status(500).json({ message: "Failed to update part" });
    }
  });

  app.delete('/api/parts/:id', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      await storage.deletePart(req.params.id);
      res.json({ message: "Part deleted successfully" });
    } catch (error) {
      console.error("Error deleting part:", error);
      res.status(500).json({ message: "Failed to delete part" });
    }
  });

  // Auto-save invoice draft (upsert)
  app.post('/api/invoices/auto-save', isAuthenticated, requireRole('admin', 'employee'), async (req: any, res) => {
    try {
      const user = req.user;
      const { id, ...invoiceData } = req.body;

      if (id) {
        // Update existing draft
        const updated = await storage.updateInvoice(id, {
          ...invoiceData,
          status: 'draft',
        });
        return res.json(updated);
      } else {
        // Create new draft
        const invoice = await storage.createInvoice({
          ...invoiceData,
          status: 'draft',
          created_by: user.id,
        });
        return res.json(invoice);
      }
    } catch (error) {
      console.error("Error auto-saving invoice:", error);
      res.status(500).json({ message: "Failed to auto-save invoice" });
    }
  });

  // Upload invoice PDF to Google Drive (Shared Folder)
  app.post('/api/invoices/:id/upload-to-drive', isAuthenticated, requireRole('admin', 'employee'), async (req: any, res) => {
    try {
      const user = req.user;
      const invoiceId = req.params.id;

      // Get invoice details
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get invoice items
      const items = await storage.getInvoiceItems(invoiceId);

      // Import required functions
      const { generateInvoicePDF } = await import('./services/pdfGenerator.js');
      const { uploadToGoogleDrive, uploadInvoiceDataToDrive } = await import('./googleDrive.js');

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoice);

      // Upload PDF to appropriate Google Drive folder based on invoice status
      const fileName = `Invoice-${invoice.invoice_number}.pdf`;
      const metadata = await uploadToGoogleDrive(
        fileName,
        pdfBuffer,
        'application/pdf',
        undefined,
        invoice.status  // Route to folder based on status (draft → TGE FORMS, sent/paid/overdue → SENT folder)
      );

      // Also upload invoice data as JSON for backup/sync
      const invoiceData = {
        ...invoice,
        items: items,
        synced_at: new Date().toISOString(),
      };
      
      await uploadInvoiceDataToDrive(
        invoice.invoice_number,
        invoiceData,
        invoice.status
      );

      // Determine which folder was used based on status
      const folderUsed = invoice.status === 'draft' 
        ? '15eLIImIN3ugrwV5kBscM-pitNpg58TW5'  // TGE FORMS
        : '1GjX-A2GKs-2e98exDkUCjVQQnUkBGufz';  // SENT folder

      // Save file record
      await storage.createFile({
        uploaded_by: user.id,
        file_name: fileName,
        original_name: fileName,
        mime_type: 'application/pdf',
        file_size: pdfBuffer.length,
        category: 'invoice',
        storage_provider: 'google-drive',
        drive_file_id: metadata.fileId,
        drive_folder_id: folderUsed,
        web_view_link: metadata.webViewLink,
        web_content_link: metadata.webContentLink,
        invoice_id: invoiceId,
      });

      // Update invoice with PDF URL for in-app viewing
      await storage.updateInvoice(invoiceId, {
        pdf_url: metadata.webViewLink,
      });

      res.json({
        message: "Invoice and data uploaded to shared Drive folder successfully",
        fileUrl: metadata.webViewLink,
      });
    } catch (error) {
      console.error("Error uploading invoice to Drive:", error);
      res.status(500).json({ message: "Failed to upload invoice to Google Drive" });
    }
  });

  // Sync invoices FROM Google Drive
  app.post('/api/invoices/sync-from-drive', isAuthenticated, requireRole('admin'), async (req: any, res) => {
    try {
      const user = req.user;
      
      // Import sync function
      const { syncInvoicesFromDrive } = await import('./googleDrive.js');
      
      // Get invoices from Drive
      const driveInvoices = await syncInvoicesFromDrive();
      
      let created = 0;
      let updated = 0;
      let skipped = 0;
      
      // Sync each invoice
      for (const driveInvoice of driveInvoices) {
        try {
          // Check if invoice exists by invoice_number
          const existing = await storage.getInvoiceByNumber(driveInvoice.invoice_number);
          
          if (existing) {
            // Update existing invoice if Drive version is newer
            const driveDate = new Date(driveInvoice.synced_at || driveInvoice.created_at);
            const localDate = new Date(existing.created_at);
            
            if (driveDate > localDate) {
              const { items, synced_at, ...invoiceData } = driveInvoice;
              await storage.updateInvoice(existing.id, invoiceData);
              
              // Update items
              if (items && items.length > 0) {
                // Delete existing items
                const existingItems = await storage.getInvoiceItems(existing.id);
                for (const item of existingItems) {
                  await storage.deleteInvoiceItem(item.id);
                }
                
                // Add new items
                for (const item of items) {
                  await storage.createInvoiceItem({
                    ...item,
                    invoice_id: existing.id,
                  });
                }
              }
              
              updated++;
            } else {
              skipped++;
            }
          } else {
            // Create new invoice
            const { items, synced_at, id, ...invoiceData } = driveInvoice;
            const newInvoice = await storage.createInvoice({
              ...invoiceData,
              created_by: user.id,
            });
            
            // Add items
            if (items && items.length > 0) {
              for (const item of items) {
                await storage.createInvoiceItem({
                  ...item,
                  invoice_id: newInvoice.id,
                });
              }
            }
            
            created++;
          }
        } catch (error) {
          console.error(`Error syncing invoice ${driveInvoice.invoice_number}:`, error);
          skipped++;
        }
      }
      
      res.json({
        message: "Sync completed",
        stats: {
          total: driveInvoices.length,
          created,
          updated,
          skipped,
        },
      });
    } catch (error) {
      console.error("Error syncing invoices from Drive:", error);
      res.status(500).json({ message: "Failed to sync invoices from Google Drive" });
    }
  });

  // Software update endpoint - triggers app refresh
  app.post('/api/app/update', isAuthenticated, requireRole('admin'), async (req: any, res) => {
    try {
      console.log('[App Update] Update requested by user:', req.user.email);
      
      // This endpoint acknowledges the update request and signals the client to refresh
      res.json({
        message: "ElectraPro is updating to the latest version. Please refresh your browser in a moment.",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "current"
      });
      
      // Log update action
      console.log('[App Update] Update acknowledged at:', new Date().toISOString());
    } catch (error) {
      console.error("Error processing update request:", error);
      res.status(500).json({ message: "Failed to process update request" });
    }
  });

  // ========================================
  // ONBOARDING SYSTEM ROUTES
  // ========================================

  // Get all onboarding workflows
  app.get('/api/onboarding/workflows', isAuthenticated, async (req: any, res) => {
    try {
      const workflows = await storage.getAllOnboardingWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching onboarding workflows:", error);
      res.status(500).json({ message: "Failed to fetch onboarding workflows" });
    }
  });

  // Get workflows created by the current user
  app.get('/api/onboarding/my-workflows', isAuthenticated, async (req: any, res) => {
    try {
      const workflows = await storage.getOnboardingWorkflowsByInitiator(req.user.id);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching user workflows:", error);
      res.status(500).json({ message: "Failed to fetch your workflows" });
    }
  });

  // Get a single workflow by ID
  app.get('/api/onboarding/workflows/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workflow = await storage.getOnboardingWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  // Create a new onboarding workflow
  app.post('/api/onboarding/workflows', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertOnboardingWorkflowSchema.parse(req.body);
      const workflow = await storage.createOnboardingWorkflow({
        ...validatedData,
        initiated_by: req.user.id,
        company_id: req.user.company_id,
      });
      
      // Create default checklist items for the workflow
      const checklistItems = getDefaultChecklistItems(validatedData.workflow_type);
      for (const item of checklistItems) {
        await storage.createOnboardingChecklist({
          workflow_id: workflow.id,
          ...item,
        });
      }
      
      res.status(201).json(workflow);
    } catch (error) {
      console.error("Error creating onboarding workflow:", error);
      res.status(500).json({ message: "Failed to create onboarding workflow" });
    }
  });

  // Update workflow progress
  app.patch('/api/onboarding/workflows/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workflow = await storage.updateOnboardingWorkflow(req.params.id, req.body);
      res.json(workflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  // Complete a workflow
  app.post('/api/onboarding/workflows/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const workflow = await storage.updateOnboardingWorkflow(req.params.id, {
        status: 'completed',
        completed_at: new Date(),
      });
      res.json(workflow);
    } catch (error) {
      console.error("Error completing workflow:", error);
      res.status(500).json({ message: "Failed to complete workflow" });
    }
  });

  // Get checklist for a workflow
  app.get('/api/onboarding/workflows/:id/checklist', isAuthenticated, async (req: any, res) => {
    try {
      const checklist = await storage.getOnboardingChecklistByWorkflow(req.params.id);
      res.json(checklist);
    } catch (error) {
      console.error("Error fetching checklist:", error);
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  // Update checklist item
  app.patch('/api/onboarding/checklist/:id', isAuthenticated, async (req: any, res) => {
    try {
      const item = await storage.updateOnboardingChecklist(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating checklist item:", error);
      res.status(500).json({ message: "Failed to update checklist item" });
    }
  });

  // Get all document templates
  app.get('/api/onboarding/templates', isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getAllDocumentTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Create document template
  app.post('/api/onboarding/templates', isAuthenticated, requireRole('admin'), async (req: any, res) => {
    try {
      const validatedData = insertDocumentTemplateSchema.parse(req.body);
      const template = await storage.createDocumentTemplate({
        ...validatedData,
        company_id: req.user.company_id,
      });
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Generate document from template
  app.post('/api/onboarding/documents/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { template_id, workflow_id, user_id, variables } = req.body;
      
      // Get template
      const template = await storage.getDocumentTemplateById(template_id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Replace variables in template content
      let renderedContent = template.content;
      for (const [key, value] of Object.entries(variables)) {
        renderedContent = renderedContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
      
      // Create document record
      const document = await storage.createOnboardingDocument({
        workflow_id,
        template_id,
        user_id,
        generated_by: req.user.id,
        document_name: `${template.name} - ${variables.name || 'Document'}`,
        document_type: template.category,
        rendered_content: renderedContent,
        metadata: { variables },
        requires_signature: template.requires_signature,
        status: 'draft',
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error generating document:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  // Get documents for a workflow
  app.get('/api/onboarding/workflows/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const documents = await storage.getOnboardingDocumentsByWorkflow(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Notifications API
  // Get all notifications for current user
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notifications count
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotifications(userId);
      const unreadCount = notifications.filter(n => !n.is_read).length;
      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Dismiss notification
  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.dismissNotification(req.params.id);
      res.json({ message: "Notification dismissed" });
    } catch (error) {
      console.error("Error dismissing notification:", error);
      res.status(500).json({ message: "Failed to dismiss notification" });
    }
  });

  // AI Settings API
  // Get current user's AI settings
  app.get('/api/ai-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let settings = await storage.getUserAISettings(userId);
      
      // Create default settings if they don't exist
      if (!settings) {
        settings = await storage.createUserAISettings({ user_id: userId });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      res.status(500).json({ message: "Failed to fetch AI settings" });
    }
  });

  // Update current user's AI settings
  app.patch('/api/ai-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      // Ensure settings exist first
      let settings = await storage.getUserAISettings(userId);
      if (!settings) {
        settings = await storage.createUserAISettings({ user_id: userId, ...updates });
      } else {
        settings = await storage.updateUserAISettings(userId, updates);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating AI settings:", error);
      res.status(500).json({ message: "Failed to update AI settings" });
    }
  });

  // AI Chat History API
  // Get all chat sessions for current user
  app.get('/api/ai-chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessions = await storage.getAIChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  // Get specific chat session
  app.get('/api/ai-chat/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const session = await storage.getAIChatSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });

  // Create new chat session
  app.post('/api/ai-chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title, conversation_mode } = req.body;
      
      const session = await storage.createAIChatSession({
        user_id: userId,
        title: title || 'New Conversation',
        conversation_mode: conversation_mode || 'text',
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Update chat session
  app.patch('/api/ai-chat/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateAIChatSession(req.params.id, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating chat session:", error);
      res.status(500).json({ message: "Failed to update chat session" });
    }
  });

  // Get messages for a chat session
  app.get('/api/ai-chat/sessions/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getAIChatMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Create new chat message
  app.post('/api/ai-chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { session_id, role, content, content_type, metadata } = req.body;
      
      const message = await storage.createAIChatMessage({
        session_id,
        role,
        content,
        content_type: content_type || 'text',
        metadata,
      });
      
      // Update session's updated_at timestamp
      await storage.updateAIChatSession(session_id, { updated_at: new Date() });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
