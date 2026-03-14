import { db } from "../db";
import { ai_workflow_templates } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

export const DEFAULT_WORKFLOW_TEMPLATES = [
  {
    id: "workflow-client-onboarding",
    name: "New Client Onboarding",
    description: "Automated workflow for welcoming and onboarding new clients",
    category: "onboarding",
    steps: [
      {
        order: 1,
        name: "Welcome SMS",
        action_type: "send_sms",
        delay_minutes: 0,
        template: "Welcome to T.G.E. PROS! We're excited to work with you. Your account is now active. Questions? Call 281-416-4454."
      },
      {
        order: 2,
        name: "Welcome Email",
        action_type: "send_email",
        delay_minutes: 5,
        template: {
          subject: "Welcome to T.G.E. PROS Electrical Services",
          body: "Thank you for choosing T.G.E. PROS. We look forward to providing you with excellent electrical services."
        }
      },
      {
        order: 3,
        name: "Create Welcome Notification",
        action_type: "create_notification",
        delay_minutes: 0,
        config: {
          title: "Welcome aboard!",
          message: "Your client account has been set up. Explore our services and schedule your first appointment.",
          priority: "normal"
        }
      },
      {
        order: 4,
        name: "Follow-up Check-in",
        action_type: "send_sms",
        delay_minutes: 1440, // 24 hours
        template: "Hi {{name}}! It's T.G.E. PROS. Just checking in - do you have any electrical projects we can help with? Reply or call 281-416-4454."
      }
    ],
    variables: {
      name: { type: "string", source: "client.name" },
      email: { type: "string", source: "client.email" },
      phone: { type: "string", source: "client.phone" }
    },
    is_system_template: true,
    is_active: true
  },
  {
    id: "workflow-lead-nurturing",
    name: "Lead Nurturing Sequence",
    description: "Multi-touch nurturing sequence for new leads",
    category: "sales",
    steps: [
      {
        order: 1,
        name: "Immediate Response",
        action_type: "send_sms",
        delay_minutes: 0,
        template: "Thanks for reaching out to T.G.E. PROS! We received your inquiry about {{service_type}}. A specialist will contact you within 2 hours. - Texas Master Electrician #750779"
      },
      {
        order: 2,
        name: "Score Lead",
        action_type: "ai_score_lead",
        delay_minutes: 1,
        config: {}
      },
      {
        order: 3,
        name: "Assign to Sales",
        action_type: "create_notification",
        delay_minutes: 2,
        config: {
          title: "New Lead: {{name}}",
          message: "Lead scored and ready for follow-up. Service: {{service_type}}",
          priority: "high",
          target_role: "admin"
        }
      },
      {
        order: 4,
        name: "Follow-up Day 1",
        action_type: "send_sms",
        delay_minutes: 1440,
        template: "Hi {{name}}, following up on your electrical service inquiry. We'd love to schedule a free estimate. What time works for you? Call/text 281-416-4454."
      },
      {
        order: 5,
        name: "Follow-up Day 3",
        action_type: "send_email",
        delay_minutes: 4320, // 3 days
        template: {
          subject: "Your Electrical Project - Free Estimate Available",
          body: "We noticed you inquired about electrical services. T.G.E. PROS offers free estimates for most projects. Ready when you are!"
        }
      },
      {
        order: 6,
        name: "Final Follow-up Day 7",
        action_type: "ai_response",
        delay_minutes: 10080, // 7 days
        config: {
          prompt: "Generate a friendly final follow-up message for a lead who hasn't responded. Mention we're still available to help with their {{service_type}} project. Keep under 160 characters for SMS.",
          delivery_method: "sms"
        }
      }
    ],
    variables: {
      name: { type: "string", source: "lead.name" },
      email: { type: "string", source: "lead.email" },
      phone: { type: "string", source: "lead.phone" },
      service_type: { type: "string", source: "lead.service_type" }
    },
    is_system_template: true,
    is_active: true
  },
  {
    id: "workflow-appointment-lifecycle",
    name: "Appointment Lifecycle",
    description: "Manage the full appointment lifecycle from booking to follow-up",
    category: "support",
    steps: [
      {
        order: 1,
        name: "Booking Confirmation",
        action_type: "send_sms",
        delay_minutes: 0,
        template: "Your T.G.E. PROS appointment is confirmed for {{scheduled_date}}. Confirmation #{{id}}. We'll send a reminder 24 hours before. Call 281-416-4454 to reschedule."
      },
      {
        order: 2,
        name: "24-Hour Reminder",
        action_type: "send_sms",
        delay_minutes: -1440, // 24 hours before
        trigger_relative_to: "scheduled_date",
        template: "Reminder: Your electrical service appointment is tomorrow, {{scheduled_date}}. Our technician will arrive during your scheduled window. See you soon! - T.G.E. PROS"
      },
      {
        order: 3,
        name: "Day-of Confirmation",
        action_type: "send_sms",
        delay_minutes: -120, // 2 hours before
        trigger_relative_to: "scheduled_date",
        template: "T.G.E. PROS technician is scheduled to arrive soon. If you need to make any changes, please call 281-416-4454 immediately."
      },
      {
        order: 4,
        name: "Service Complete Follow-up",
        action_type: "send_sms",
        delay_minutes: 60, // 1 hour after completion
        trigger_relative_to: "completed_at",
        template: "Thank you for choosing T.G.E. PROS! We hope you're satisfied with our service. We'd love your feedback - reply to this message or leave a review. Questions? Call 281-416-4454."
      },
      {
        order: 5,
        name: "Request Review",
        action_type: "send_email",
        delay_minutes: 1440, // 24 hours after completion
        trigger_relative_to: "completed_at",
        template: {
          subject: "How was your T.G.E. PROS experience?",
          body: "We value your feedback! Please take a moment to share your experience with our electrical services. Your review helps us serve you better."
        }
      }
    ],
    variables: {
      scheduled_date: { type: "date", source: "booking.scheduled_date" },
      id: { type: "string", source: "booking.id" },
      completed_at: { type: "date", source: "booking.completed_at" }
    },
    is_system_template: true,
    is_active: true
  },
  {
    id: "workflow-invoice-collection",
    name: "Invoice Collection Sequence",
    description: "Automated payment reminder sequence for outstanding invoices",
    category: "billing",
    steps: [
      {
        order: 1,
        name: "Invoice Sent Notification",
        action_type: "send_sms",
        delay_minutes: 0,
        template: "Invoice #{{invoice_number}} for ${{total}} has been sent to your email. Pay online or call 281-416-4454. Due: {{due_date}}. - T.G.E. PROS"
      },
      {
        order: 2,
        name: "7-Day Reminder",
        action_type: "send_email",
        delay_minutes: 10080, // 7 days
        condition: "status != 'paid'",
        template: {
          subject: "Reminder: Invoice #{{invoice_number}} Due Soon",
          body: "This is a friendly reminder that Invoice #{{invoice_number}} for ${{total}} is due on {{due_date}}. Please submit payment at your earliest convenience."
        }
      },
      {
        order: 3,
        name: "Due Date Reminder",
        action_type: "send_sms",
        delay_minutes: 0,
        trigger_relative_to: "due_date",
        condition: "status != 'paid'",
        template: "Invoice #{{invoice_number}} for ${{total}} is due today. Pay online or call 281-416-4454 to discuss payment options. - T.G.E. PROS"
      },
      {
        order: 4,
        name: "3-Day Past Due",
        action_type: "send_sms",
        delay_minutes: 4320, // 3 days after due
        trigger_relative_to: "due_date",
        condition: "status != 'paid'",
        template: "Invoice #{{invoice_number}} is now past due. Please submit payment of ${{total}} to avoid late fees. Call 281-416-4454 if you need assistance. - T.G.E. PROS"
      },
      {
        order: 5,
        name: "7-Day Past Due - Final",
        action_type: "ai_response",
        delay_minutes: 10080, // 7 days after due
        trigger_relative_to: "due_date",
        condition: "status != 'paid'",
        config: {
          prompt: "Generate a firm but professional payment reminder for an invoice that is 7 days past due. Amount: ${{total}}, Invoice #{{invoice_number}}. Mention we're here to help if they're experiencing difficulties. Keep professional tone.",
          delivery_method: "sms"
        }
      }
    ],
    variables: {
      invoice_number: { type: "string", source: "invoice.invoice_number" },
      total: { type: "number", source: "invoice.total" },
      due_date: { type: "date", source: "invoice.due_date" },
      status: { type: "string", source: "invoice.status" }
    },
    is_system_template: true,
    is_active: true
  },
  {
    id: "workflow-vendor-onboarding",
    name: "Vendor/Contractor Onboarding",
    description: "Onboarding workflow for new vendor partners",
    category: "onboarding",
    steps: [
      {
        order: 1,
        name: "Welcome to Network",
        action_type: "send_email",
        delay_minutes: 0,
        template: {
          subject: "Welcome to the T.G.E. PROS Partner Network",
          body: "Thank you for joining our contractor network. Your application is being reviewed. We'll notify you once approved."
        }
      },
      {
        order: 2,
        name: "SMS Confirmation",
        action_type: "send_sms",
        delay_minutes: 5,
        template: "Welcome to T.G.E. PROS! Your vendor application is received. We're reviewing your credentials. Questions? Call 346-671-3975."
      },
      {
        order: 3,
        name: "Document Reminder (Day 2)",
        action_type: "send_email",
        delay_minutes: 2880, // 2 days
        condition: "onboarding_status == 'documents_required'",
        template: {
          subject: "Action Required: Complete Your T.G.E. PROS Registration",
          body: "We're missing some documents to complete your vendor registration. Please log in and upload your insurance certificate and W-9 form."
        }
      },
      {
        order: 4,
        name: "Approval Notification",
        action_type: "send_sms",
        delay_minutes: 0,
        trigger_on: "status_change_to_approved",
        template: "Congratulations! You're now an approved T.G.E. PROS partner. Log in to view available jobs and start earning. Welcome aboard!"
      }
    ],
    variables: {
      name: { type: "string", source: "vendor.name" },
      email: { type: "string", source: "vendor.email" },
      onboarding_status: { type: "string", source: "vendor.onboarding_status" }
    },
    is_system_template: true,
    is_active: true
  },
  {
    id: "workflow-marketing-campaign",
    name: "Seasonal Marketing Campaign",
    description: "Template for seasonal promotional campaigns",
    category: "marketing",
    steps: [
      {
        order: 1,
        name: "Campaign Launch Email",
        action_type: "send_email",
        delay_minutes: 0,
        template: {
          subject: "{{campaign_subject}}",
          body: "{{campaign_body}}"
        }
      },
      {
        order: 2,
        name: "SMS Reminder",
        action_type: "send_sms",
        delay_minutes: 1440, // 1 day later
        template: "{{sms_reminder}}"
      },
      {
        order: 3,
        name: "Mid-Campaign Check",
        action_type: "ai_response",
        delay_minutes: 4320, // 3 days
        config: {
          prompt: "Generate a mid-campaign reminder for our {{campaign_name}} promotion. Mention the offer is still available and encourage action. Keep under 160 characters.",
          delivery_method: "sms"
        }
      },
      {
        order: 4,
        name: "Last Chance",
        action_type: "send_sms",
        delay_minutes: 10080, // 7 days
        template: "Last chance! Our {{campaign_name}} ends tomorrow. Don't miss out on {{offer_details}}. Book now: 281-416-4454. - T.G.E. PROS"
      }
    ],
    variables: {
      campaign_name: { type: "string", required: true },
      campaign_subject: { type: "string", required: true },
      campaign_body: { type: "string", required: true },
      sms_reminder: { type: "string", required: true },
      offer_details: { type: "string", required: true }
    },
    is_system_template: true,
    is_active: true
  }
];

export async function seedWorkflowTemplates(): Promise<void> {
  console.log("[AI Workflows] Seeding default workflow templates...");
  
  for (const template of DEFAULT_WORKFLOW_TEMPLATES) {
    try {
      const existing = await db
        .select()
        .from(ai_workflow_templates)
        .where(eq(ai_workflow_templates.id, template.id))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(ai_workflow_templates).values({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          steps: template.steps,
          variables: template.variables,
          is_system_template: template.is_system_template,
          is_active: template.is_active,
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log(`[AI Workflows] Created template: ${template.name}`);
      } else {
        // Update existing template
        await db
          .update(ai_workflow_templates)
          .set({
            name: template.name,
            description: template.description,
            steps: template.steps,
            variables: template.variables,
            updated_at: new Date()
          })
          .where(eq(ai_workflow_templates.id, template.id));
        console.log(`[AI Workflows] Updated template: ${template.name}`);
      }
    } catch (error) {
      console.error(`[AI Workflows] Error seeding template ${template.name}:`, error);
    }
  }
  
  console.log("[AI Workflows] Workflow template seeding completed!");
}

export async function getWorkflowTemplates(category?: string): Promise<any[]> {
  if (category) {
    return db
      .select()
      .from(ai_workflow_templates)
      .where(eq(ai_workflow_templates.category, category));
  }
  return db.select().from(ai_workflow_templates);
}

export async function getWorkflowTemplate(id: string): Promise<any | null> {
  const templates = await db
    .select()
    .from(ai_workflow_templates)
    .where(eq(ai_workflow_templates.id, id))
    .limit(1);
  
  return templates[0] || null;
}
