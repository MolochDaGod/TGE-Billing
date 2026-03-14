import { db } from "../db";
import { 
  ai_automation_triggers, 
  ai_automation_logs, 
  invoices, 
  jobs, 
  bookings, 
  clients, 
  sales_leads,
  notifications,
  users 
} from "@shared/schema";
import { sql, eq, and, lt, gt } from "drizzle-orm";
import { sendSMS } from "./twilio";
import { getAgentMailClient } from "./agentmail";
import OpenAI from "openai";

const openai = new OpenAI();

export interface AutomationContext {
  entityType: string;
  entityId: string;
  entityData: any;
  userId?: string;
  triggerId: string;
}

export async function executeAutomation(
  trigger: any,
  context: AutomationContext
): Promise<{ success: boolean; result?: any; error?: string }> {
  const startTime = new Date();
  
  try {
    let result: any;
    
    switch (trigger.action_type) {
      case "send_sms":
        result = await executeSMSAction(trigger, context);
        break;
      case "send_email":
        result = await executeEmailAction(trigger, context);
        break;
      case "create_notification":
        result = await executeNotificationAction(trigger, context);
        break;
      case "ai_response":
        result = await executeAIResponseAction(trigger, context);
        break;
      case "update_status":
        result = await executeStatusUpdateAction(trigger, context);
        break;
      default:
        throw new Error(`Unknown action type: ${trigger.action_type}`);
    }
    
    // Log successful execution
    await logAutomationExecution(trigger.id, context, "success", startTime, result);
    
    // Update trigger statistics
    await updateTriggerStats(trigger.id, true);
    
    return { success: true, result };
  } catch (error: any) {
    console.error(`[AI Automation] Error executing trigger ${trigger.id}:`, error);
    
    // Log failed execution
    await logAutomationExecution(trigger.id, context, "failure", startTime, null, error.message);
    
    // Update trigger statistics
    await updateTriggerStats(trigger.id, false);
    
    return { success: false, error: error.message };
  }
}

async function executeSMSAction(trigger: any, context: AutomationContext): Promise<any> {
  const config = trigger.action_config as any;
  const template = trigger.message_template || config.message || "";
  
  // Get recipient phone
  let phone: string | undefined;
  
  if (context.entityData?.phone) {
    phone = context.entityData.phone;
  } else if (context.userId) {
    const user = await db.select().from(users).where(eq(users.id, context.userId)).limit(1);
    phone = user[0]?.phone || undefined;
  }
  
  if (!phone) {
    throw new Error("No phone number available for SMS");
  }
  
  // Replace template variables
  const message = replaceTemplateVariables(template, context.entityData);
  
  const result = await sendSMS(phone, message);
  return { type: "sms", phone, messageId: result?.sid };
}

async function executeEmailAction(trigger: any, context: AutomationContext): Promise<any> {
  const config = trigger.action_config as any;
  const template = trigger.message_template || config.body || "";
  
  // Get recipient email
  let email: string | undefined;
  
  if (context.entityData?.email) {
    email = context.entityData.email;
  } else if (context.userId) {
    const user = await db.select().from(users).where(eq(users.id, context.userId)).limit(1);
    email = user[0]?.email || undefined;
  }
  
  if (!email) {
    throw new Error("No email address available");
  }
  
  // Replace template variables
  const subject = replaceTemplateVariables(config.subject || "Notification from T.G.E. PROS", context.entityData);
  const body = replaceTemplateVariables(template, context.entityData);
  
  // Use AgentMail client for email sending
  try {
    const client = await getAgentMailClient();
    if (client) {
      const mailbox = await client.mailboxes.get("default");
      const result = await mailbox.send({
        to: email,
        subject,
        body: `<html><body>${body}</body></html>`
      });
      return { type: "email", email, messageId: result?.id || "sent" };
    } else {
      console.log(`[AI Automation] Email would be sent to ${email}: ${subject}`);
      return { type: "email", email, messageId: "simulated" };
    }
  } catch (error) {
    console.error("[AI Automation] Email send error:", error);
    return { type: "email", email, messageId: "error", error: String(error) };
  }
}

async function executeNotificationAction(trigger: any, context: AutomationContext): Promise<any> {
  const config = trigger.action_config as any;
  
  if (!context.userId) {
    throw new Error("No user ID available for notification");
  }
  
  const title = replaceTemplateVariables(config.title || "Notification", context.entityData);
  const message = replaceTemplateVariables(trigger.message_template || config.message || "", context.entityData);
  
  const [notification] = await db.insert(notifications).values({
    user_id: context.userId,
    type: config.notification_type || "system_alert",
    title,
    message,
    priority: config.priority || "normal",
    related_type: context.entityType,
    related_id: context.entityId,
    action_url: config.action_url
  }).returning();
  
  return { type: "notification", notificationId: notification.id };
}

async function executeAIResponseAction(trigger: any, context: AutomationContext): Promise<any> {
  const config = trigger.action_config as any;
  
  // Get AI agent system prompt
  let systemPrompt = config.system_prompt || `You are an AI assistant for T.G.E. PROS electrical services. 
Respond professionally and helpfully. Context: ${context.entityType}`;
  
  // Build context message
  const contextMessage = `
Context Information:
- Entity Type: ${context.entityType}
- Entity ID: ${context.entityId}
- Data: ${JSON.stringify(context.entityData, null, 2)}

${config.prompt || "Generate an appropriate response based on this context."}
`;
  
  const response = await openai.chat.completions.create({
    model: config.model || "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: contextMessage }
    ],
    temperature: config.temperature || 0.7,
    max_tokens: config.max_tokens || 500
  });
  
  const aiResponse = response.choices[0]?.message?.content || "";
  
  // Optionally send the response via SMS or email
  if (config.delivery_method === "sms") {
    await executeSMSAction({
      ...trigger,
      message_template: aiResponse,
      action_config: config
    }, context);
  } else if (config.delivery_method === "email") {
    await executeEmailAction({
      ...trigger,
      message_template: aiResponse,
      action_config: { ...config, body: aiResponse }
    }, context);
  }
  
  return { type: "ai_response", response: aiResponse };
}

async function executeStatusUpdateAction(trigger: any, context: AutomationContext): Promise<any> {
  const config = trigger.action_config as any;
  const newStatus = config.new_status;
  
  if (!newStatus) {
    throw new Error("No new status specified");
  }
  
  let updateResult: any;
  
  switch (context.entityType) {
    case "invoice":
      [updateResult] = await db
        .update(invoices)
        .set({ status: newStatus, updated_at: new Date() })
        .where(eq(invoices.id, context.entityId))
        .returning();
      break;
    case "job":
      [updateResult] = await db
        .update(jobs)
        .set({ status: newStatus, updated_at: new Date() })
        .where(eq(jobs.id, context.entityId))
        .returning();
      break;
    case "booking":
      [updateResult] = await db
        .update(bookings)
        .set({ status: newStatus, updated_at: new Date() })
        .where(eq(bookings.id, context.entityId))
        .returning();
      break;
    case "lead":
      [updateResult] = await db
        .update(sales_leads)
        .set({ status: newStatus, updated_at: new Date() })
        .where(eq(sales_leads.id, context.entityId))
        .returning();
      break;
    default:
      throw new Error(`Unknown entity type for status update: ${context.entityType}`);
  }
  
  return { type: "status_update", entityType: context.entityType, newStatus, entityId: context.entityId };
}

function replaceTemplateVariables(template: string, data: any): string {
  if (!template) return "";
  
  let result = template;
  
  // Replace {{variable}} patterns
  const matches = template.match(/\{\{([^}]+)\}\}/g);
  if (matches) {
    for (const match of matches) {
      const key = match.replace(/\{\{|\}\}/g, "").trim();
      const value = getNestedValue(data, key);
      result = result.replace(match, value !== undefined ? String(value) : "");
    }
  }
  
  // Also support {variable} patterns
  const simpleMatches = template.match(/\{([^}]+)\}/g);
  if (simpleMatches) {
    for (const match of simpleMatches) {
      const key = match.replace(/\{|\}/g, "").trim();
      const value = getNestedValue(data, key);
      result = result.replace(match, value !== undefined ? String(value) : "");
    }
  }
  
  return result;
}

function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  const keys = path.split(".");
  let value = obj;
  for (const key of keys) {
    if (value === undefined || value === null) return undefined;
    value = value[key];
  }
  return value;
}

async function logAutomationExecution(
  triggerId: string,
  context: AutomationContext,
  status: string,
  startTime: Date,
  result?: any,
  error?: string
): Promise<void> {
  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  
  await db.insert(ai_automation_logs).values({
    trigger_id: triggerId,
    execution_status: status,
    execution_start: startTime,
    execution_end: endTime,
    duration_ms: durationMs,
    target_user_id: context.userId || null,
    target_entity_type: context.entityType,
    target_entity_id: context.entityId,
    action_result: result || null,
    error_message: error || null,
    trigger_context: context.entityData
  });
}

async function updateTriggerStats(triggerId: string, success: boolean): Promise<void> {
  await db.execute(sql`
    UPDATE ai_automation_triggers
    SET 
      total_executions = COALESCE(total_executions, 0) + 1,
      ${success ? sql`success_count = COALESCE(success_count, 0) + 1` : sql`failure_count = COALESCE(failure_count, 0) + 1`},
      last_execution_at = NOW(),
      updated_at = NOW()
    WHERE id = ${triggerId}
  `);
}

// Event-based trigger execution
export async function triggerEventAutomation(
  eventType: string,
  entityType: string,
  entityId: string,
  entityData: any,
  userId?: string
): Promise<void> {
  console.log(`[AI Automation] Checking triggers for event: ${eventType}`);
  
  // Find active triggers for this event
  const triggers = await db
    .select()
    .from(ai_automation_triggers)
    .where(and(
      eq(ai_automation_triggers.trigger_type, "event"),
      eq(ai_automation_triggers.event_type, eventType),
      eq(ai_automation_triggers.is_active, true)
    ));
  
  for (const trigger of triggers) {
    // Check if conditions match
    if (trigger.event_conditions) {
      const conditions = trigger.event_conditions as any;
      if (!matchesConditions(entityData, conditions)) {
        continue;
      }
    }
    
    const context: AutomationContext = {
      entityType,
      entityId,
      entityData,
      userId,
      triggerId: trigger.id
    };
    
    // Execute automation asynchronously
    executeAutomation(trigger, context).catch(err => {
      console.error(`[AI Automation] Async execution error:`, err);
    });
  }
}

function matchesConditions(data: any, conditions: any): boolean {
  if (!conditions) return true;
  
  for (const [key, condition] of Object.entries(conditions)) {
    const value = getNestedValue(data, key);
    
    if (typeof condition === "object") {
      const cond = condition as any;
      if (cond.equals !== undefined && value !== cond.equals) return false;
      if (cond.not_equals !== undefined && value === cond.not_equals) return false;
      if (cond.gt !== undefined && !(value > cond.gt)) return false;
      if (cond.lt !== undefined && !(value < cond.lt)) return false;
      if (cond.contains !== undefined && !String(value).includes(cond.contains)) return false;
      if (cond.in !== undefined && !cond.in.includes(value)) return false;
    } else {
      if (value !== condition) return false;
    }
  }
  
  return true;
}

// Scheduled automation runner
export async function runScheduledAutomations(): Promise<void> {
  console.log("[AI Automation] Running scheduled automations check...");
  
  // Get all active scheduled triggers
  const triggers = await db
    .select()
    .from(ai_automation_triggers)
    .where(and(
      eq(ai_automation_triggers.trigger_type, "scheduled"),
      eq(ai_automation_triggers.is_active, true)
    ));
  
  for (const trigger of triggers) {
    if (!shouldRunScheduledTrigger(trigger)) {
      continue;
    }
    
    try {
      await runScheduledTrigger(trigger);
    } catch (error) {
      console.error(`[AI Automation] Error running scheduled trigger ${trigger.id}:`, error);
    }
  }
}

function shouldRunScheduledTrigger(trigger: any): boolean {
  // Simple implementation - check if enough time has passed since last execution
  // For production, implement proper cron parsing
  if (!trigger.last_execution_at) return true;
  
  const lastRun = new Date(trigger.last_execution_at);
  const now = new Date();
  const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
  
  // Default: run once per day
  return hoursSinceLastRun >= 24;
}

async function runScheduledTrigger(trigger: any): Promise<void> {
  const config = trigger.action_config as any;
  
  // Get entities to process based on trigger configuration
  switch (config.target_entity) {
    case "overdue_invoices":
      await processOverdueInvoices(trigger);
      break;
    case "upcoming_appointments":
      await processUpcomingAppointments(trigger);
      break;
    case "stale_leads":
      await processStaleLeads(trigger);
      break;
    case "follow_up_clients":
      await processFollowUpClients(trigger);
      break;
    default:
      console.log(`[AI Automation] No handler for target: ${config.target_entity}`);
  }
}

async function processOverdueInvoices(trigger: any): Promise<void> {
  const overdueInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.status, "sent"),
      lt(invoices.due_date, new Date())
    ));
  
  for (const invoice of overdueInvoices) {
    const context: AutomationContext = {
      entityType: "invoice",
      entityId: invoice.id,
      entityData: invoice,
      userId: invoice.user_id || undefined,
      triggerId: trigger.id
    };
    
    await executeAutomation(trigger, context);
  }
}

async function processUpcomingAppointments(trigger: any): Promise<void> {
  const config = trigger.action_config as any;
  const hoursAhead = config.hours_ahead || 24;
  
  const now = new Date();
  const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  
  const upcomingBookings = await db
    .select()
    .from(bookings)
    .where(and(
      eq(bookings.status, "confirmed"),
      gt(bookings.scheduled_date, now),
      lt(bookings.scheduled_date, futureTime)
    ));
  
  for (const booking of upcomingBookings) {
    const context: AutomationContext = {
      entityType: "booking",
      entityId: booking.id,
      entityData: booking,
      userId: booking.client_id || undefined,
      triggerId: trigger.id
    };
    
    await executeAutomation(trigger, context);
  }
}

async function processStaleLeads(trigger: any): Promise<void> {
  const config = trigger.action_config as any;
  const daysStale = config.days_stale || 7;
  
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - daysStale);
  
  const staleLeads = await db
    .select()
    .from(sales_leads)
    .where(and(
      eq(sales_leads.status, "new"),
      lt(sales_leads.created_at, staleDate)
    ));
  
  for (const lead of staleLeads) {
    const context: AutomationContext = {
      entityType: "lead",
      entityId: lead.id,
      entityData: lead,
      userId: lead.assigned_to || undefined,
      triggerId: trigger.id
    };
    
    await executeAutomation(trigger, context);
  }
}

async function processFollowUpClients(trigger: any): Promise<void> {
  const now = new Date();
  
  const clientsNeedingFollowUp = await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.status, "active"),
      lt(clients.next_follow_up, now)
    ));
  
  for (const client of clientsNeedingFollowUp) {
    const context: AutomationContext = {
      entityType: "client",
      entityId: client.id,
      entityData: client,
      userId: client.assigned_to || undefined,
      triggerId: trigger.id
    };
    
    await executeAutomation(trigger, context);
  }
}

// Default automation triggers to seed
export const DEFAULT_AUTOMATION_TRIGGERS = [
  {
    id: "trigger-invoice-reminder",
    name: "Invoice Payment Reminder",
    description: "Send SMS reminder for invoices due within 3 days",
    trigger_type: "scheduled",
    action_type: "send_sms",
    action_config: {
      target_entity: "overdue_invoices"
    },
    message_template: "Hi {{client_name}}, this is a friendly reminder that Invoice #{{invoice_number}} for ${{total}} is due soon. Pay online or call 281-416-4454. - T.G.E. PROS",
    is_active: true,
    max_executions_per_day: 50
  },
  {
    id: "trigger-appointment-reminder",
    name: "Appointment Reminder (24hr)",
    description: "Send SMS reminder 24 hours before scheduled appointments",
    trigger_type: "scheduled",
    action_type: "send_sms",
    action_config: {
      target_entity: "upcoming_appointments",
      hours_ahead: 24
    },
    message_template: "Reminder: Your electrical service appointment is scheduled for {{scheduled_date}}. Our technician will arrive between {{time_window}}. Questions? Call 281-416-4454. - T.G.E. PROS",
    is_active: true,
    max_executions_per_day: 100
  },
  {
    id: "trigger-new-lead-notification",
    name: "New Lead Alert",
    description: "Notify admin when a new lead is created",
    trigger_type: "event",
    event_type: "lead_created",
    action_type: "create_notification",
    action_config: {
      title: "New Lead: {{name}}",
      message: "A new lead has been submitted: {{name}} - {{service_requested}}",
      notification_type: "system_alert",
      priority: "high"
    },
    target_role: "admin",
    is_active: true
  },
  {
    id: "trigger-booking-confirmation",
    name: "Booking Confirmation",
    description: "Send confirmation SMS when a booking is created",
    trigger_type: "event",
    event_type: "booking_created",
    action_type: "send_sms",
    action_config: {},
    message_template: "Your appointment with T.G.E. PROS is confirmed for {{scheduled_date}}. Confirmation #{{id}}. Questions? Call 281-416-4454.",
    is_active: true
  },
  {
    id: "trigger-stale-lead-followup",
    name: "Stale Lead Follow-up",
    description: "AI-generated follow-up for leads not contacted in 5 days",
    trigger_type: "scheduled",
    action_type: "ai_response",
    action_config: {
      target_entity: "stale_leads",
      days_stale: 5,
      delivery_method: "sms",
      prompt: "Generate a friendly follow-up message for a potential electrical services customer who inquired {{days_ago}} days ago about {{service_requested}}. Keep it under 160 characters.",
      temperature: 0.7
    },
    is_active: false,
    max_executions_per_day: 20
  }
];

export async function seedDefaultAutomations(): Promise<void> {
  console.log("[AI Automation] Seeding default automations...");
  
  for (const trigger of DEFAULT_AUTOMATION_TRIGGERS) {
    try {
      const existing = await db
        .select()
        .from(ai_automation_triggers)
        .where(eq(ai_automation_triggers.id, trigger.id))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(ai_automation_triggers).values({
          ...trigger,
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log(`[AI Automation] Created trigger: ${trigger.name}`);
      }
    } catch (error) {
      console.error(`[AI Automation] Error seeding trigger ${trigger.name}:`, error);
    }
  }
}
