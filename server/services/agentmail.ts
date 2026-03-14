import { AgentMailClient } from 'agentmail';
import crypto from 'crypto';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=agentmail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('AgentMail not connected');
  }
  return {apiKey: connectionSettings.settings.api_key};
}

export async function getAgentMailClient() {
  const {apiKey} = await getCredentials();
  return new AgentMailClient({
    environment: "https://api.agentmail.to" as any,
    apiKey: apiKey
  });
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const signatureWithoutPrefix = signature.startsWith('sha256=') 
      ? signature.slice(7) 
      : signature;
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signatureWithoutPrefix)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

export interface InvoiceEmailData {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  amount: string;
  dueDate?: Date;
  items?: Array<{ description: string; quantity: string; unit_price: string; amount: string }>;
  notes?: string;
  paymentUrl: string;
}

export interface EmployeeWelcomeEmailData {
  employeeName: string;
  employeeEmail: string;
  username: string;
  temporaryPassword: string;
  loginUrl: string;
}

// Validate email format
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function sendInvoiceEmail(data: InvoiceEmailData, retryCount: number = 0) {
  try {
    // Validate email
    if (!validateEmail(data.clientEmail)) {
      console.error('Invalid email format:', data.clientEmail);
      return { success: false, error: 'Invalid email format' };
    }

    const client = await getAgentMailClient();
    
    const dueDateStr = data.dueDate 
      ? data.dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'Upon receipt';

    const itemsHtml = data.items 
      ? data.items.map(item => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unit_price}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${item.amount}</td>
          </tr>
        `).join('')
      : '';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 24px; text-align: center;">
            <div style="display: inline-block; background-color: #fbbf24; color: #1e293b; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">⚡</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">T.G.E. Billing</h1>
            <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 14px;">Texas Master Electrician License #750779</p>
          </div>

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hi <strong>${data.clientName}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Your invoice is ready! Here are the details:
            </p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Invoice Number:</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${data.invoiceNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Total Amount:</span>
                <span style="color: #3b82f6; font-weight: 700; font-size: 20px;">$${data.amount}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Due Date:</span>
                <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${dueDateStr}</span>
              </div>
            </div>

            ${data.items && data.items.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Description</th>
                  <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Price</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            ` : ''}

            ${data.notes ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #fbbf24; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;"><strong>Note:</strong> ${data.notes}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 32px 0;">
              <a href="${data.paymentUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                Pay Now
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
              Questions? Reply to this email or call us directly.
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
              <strong>We make power easy</strong> • Lighting your life in any situation
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              T.G.E. Billing | Texas License #750779
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const plainTextBody = `
Hi ${data.clientName},

Your invoice is ready!

Invoice Number: ${data.invoiceNumber}
Total Amount: $${data.amount}
Due Date: ${dueDateStr}

${data.items && data.items.length > 0 ? `
Items:
${data.items.map(item => `- ${item.description}: ${item.quantity} x $${item.unit_price} = $${item.amount}`).join('\n')}
` : ''}

${data.notes ? `Note: ${data.notes}\n` : ''}

Pay online: ${data.paymentUrl}

Questions? Reply to this email or call us directly.

---
We make power easy • Lighting your life in any situation
T.G.E. Billing | Texas Master Electrician License #750779
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: "T.G.E. Billing - Invoices"
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: `Invoice ${data.invoiceNumber} from T.G.E. Billing`,
      body: htmlBody,
      plainTextBody: plainTextBody
    } as any);

    console.log(`Invoice email sent successfully to ${data.clientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('AgentMail send error:', error);
    
    // Retry on network/API errors
    if (retryCount < 2 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.statusCode === 429)) {
      console.log(`Retrying email send (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
      return sendInvoiceEmail(data, retryCount + 1);
    }
    
    return { success: false, error: error.message || String(error) };
  }
}

export interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  appointmentDate: Date;
  serviceName: string;
  technicianName?: string;
  address: string;
}

export async function sendAppointmentEmail(data: AppointmentEmailData) {
  try {
    const client = await getAgentMailClient();
    
    const dateStr = data.appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Appointment Confirmed</h1>
          </div>
          <div style="padding: 32px;">
            <p>Hi <strong>${data.clientName}</strong>,</p>
            <p>Your <strong>${data.serviceName}</strong> appointment is confirmed!</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0;">
              <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${dateStr}</p>
              <p style="margin: 8px 0;"><strong>Location:</strong> ${data.address}</p>
              ${data.technicianName ? `<p style="margin: 8px 0;"><strong>Technician:</strong> ${data.technicianName}</p>` : ''}
            </div>
            <p>We'll see you soon!</p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px;">T.G.E. Billing | Texas License #750779</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: "T.G.E. Billing - Appointments"
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: `Appointment Confirmed - ${data.serviceName}`,
      body: htmlBody
    } as any);

    return { success: true };
  } catch (error) {
    console.error('AgentMail send error:', error);
    return { success: false, error: String(error) };
  }
}

export interface SalesLeadEmailData {
  leadName: string;
  leadEmail: string;
  leadSource?: string;
  serviceInterest?: string;
  estimatedValue?: string;
}

export async function sendSalesLeadWelcome(data: SalesLeadEmailData) {
  try {
    const client = await getAgentMailClient();
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to T.G.E. Billing!</h1>
            <p style="color: #dbeafe; margin: 8px 0 0 0;">Texas Master Electrician License #750779</p>
          </div>

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${data.leadName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for your interest in our ${data.serviceInterest || 'electrical'} services! We're excited to help you with your project.
            </p>

            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e3a8a;">Why Choose T.G.E. Billing?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                <li>Licensed Texas Master Electrician (#750779)</li>
                <li>NEC 2023 Code Compliant</li>
                <li>Fully Insured & Bonded</li>
                <li>Transparent, Competitive Pricing</li>
                <li>Same-Day Emergency Service Available</li>
                <li>100% Satisfaction Guaranteed</li>
              </ul>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              <strong>What happens next?</strong>
            </p>
            <ol style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px;">
              <li>We'll reach out within 24 hours to discuss your specific needs</li>
              <li>Schedule a free consultation or site visit if needed</li>
              <li>Provide you with a detailed, no-obligation quote</li>
              <li>Get started on your project at your convenience</li>
            </ol>

            <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">NEED IMMEDIATE ASSISTANCE?</p>
              <p style="margin: 0; color: #92400e; font-size: 16px;">
                <strong>Call/Text:</strong> Reply to this email or text our main line<br/>
                <strong>Emergency Service:</strong> Available 24/7
              </p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Have questions before we connect? Just reply to this email - we're here to help!
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 32px;">
              Looking forward to working with you,<br/>
              <strong>The T.G.E. Billing Team</strong>
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
              <strong>We make power easy</strong> • Lighting your life in any situation
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              T.G.E. Billing | Texas Master Electrician License #750779
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: "T.G.E. Billing - Sales"
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.leadEmail],
      subject: "Welcome! Let's Power Your Project Together ⚡",
      body: htmlBody
    } as any);

    return { success: true };
  } catch (error) {
    console.error('AgentMail send error:', error);
    return { success: false, error: String(error) };
  }
}

export interface QuoteFollowUpData {
  clientName: string;
  clientEmail: string;
  quoteNumber?: string;
  serviceName: string;
  quoteAmount?: string;
}

export async function sendQuoteFollowUp(data: QuoteFollowUpData) {
  try {
    const client = await getAgentMailClient();
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Still Interested in Your ${data.serviceName}?</h1>
          </div>

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${data.clientName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              I wanted to follow up on the quote we sent you for ${data.serviceName}${data.quoteAmount ? ` (${data.quoteAmount})` : ''}.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Do you have any questions about:
            </p>
            <ul style="color: #374151; font-size: 15px; line-height: 1.8;">
              <li>The scope of work we outlined?</li>
              <li>Our pricing or payment options?</li>
              <li>Timeline or scheduling?</li>
              <li>Materials or equipment we'll use?</li>
            </ul>

            <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 16px; font-weight: 600;">Ready to Schedule?</p>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                Simply reply to this email or give us a call.<br/>
                We can often start within 2-3 business days!
              </p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              <strong>Not quite ready?</strong> No problem! I'm here whenever you need us. Feel free to reach out with questions anytime.
            </p>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">
              Best regards,<br/>
              <strong>T.G.E. Billing Team</strong><br/>
              Texas Master Electrician License #750779
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              We make power easy • Lighting your life in any situation
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: "T.G.E. Billing - Sales"
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: `Following Up: Your ${data.serviceName} Quote`,
      body: htmlBody
    } as any);

    return { success: true };
  } catch (error) {
    console.error('AgentMail send error:', error);
    return { success: false, error: String(error) };
  }
}

export interface ReviewRequestData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  completionDate: Date;
  technicianName?: string;
}

export async function sendReviewRequest(data: ReviewRequestData) {
  try {
    const client = await getAgentMailClient();
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 32px 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">⭐⭐⭐⭐⭐</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">How Did We Do?</h1>
          </div>

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${data.clientName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for choosing T.G.E. Billing for your ${data.serviceName}! ${data.technicianName ? `${data.technicianName} and our team` : 'Our team'} enjoyed working with you.
            </p>

            <div style="background-color: #dbeafe; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #1e3a8a; font-size: 18px; font-weight: 600;">
                Would you mind sharing your experience?
              </p>
              <p style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 14px;">
                Your review helps other Houston-area homeowners and businesses find reliable electrical services!
              </p>
              <div style="margin: 20px 0;">
                <a href="https://g.page/r/YOUR_GOOGLE_BUSINESS_ID/review" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 4px;">Leave Google Review</a>
              </div>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              <strong>As a thank you for your review, we'd like to offer you:</strong>
            </p>
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 16px 0;">
              <p style="margin: 0; color: #92400e; font-size: 16px; text-align: center;">
                <strong>$25 OFF</strong> your next service<br/>
                <span style="font-size: 13px;">Plus entry into our monthly $100 gift card drawing!</span>
              </p>
            </div>

            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 24px;">
              <strong>Need more electrical work?</strong> We're always here to help with:
            </p>
            <ul style="color: #374151; font-size: 14px; line-height: 1.6; margin: 8px 0;">
              <li>Panel upgrades & circuit additions</li>
              <li>Smart home installations</li>
              <li>EV charger setup</li>
              <li>Maintenance plans & annual inspections</li>
            </ul>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 32px;">
              Thanks again for your business!<br/>
              <strong>The T.G.E. Billing Team</strong><br/>
              Texas License #750779
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              We make power easy • Lighting your life in any situation
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: "T.G.E. Billing - Customer Success"
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: "⭐ Share Your T.G.E. Billing Experience + Get $25 Off!",
      body: htmlBody
    } as any);

    return { success: true };
  } catch (error) {
    console.error('AgentMail send error:', error);
    return { success: false, error: String(error) };
  }
}

export interface ClientWelcomeData {
  clientName: string;
  clientEmail: string;
  companyName?: string;
  portalUrl?: string;
}

export async function sendClientWelcomeEmail(data: ClientWelcomeData) {
  try {
    if (!validateEmail(data.clientEmail)) {
      console.error('Invalid email format:', data.clientEmail);
      return { success: false, error: 'Invalid email format' };
    }

    const client = await getAgentMailClient();
    const portalUrl = data.portalUrl || 'https://tgebilling.pro/client-dashboard';
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to the Family!</h1>
            <p style="color: #d1fae5; margin: 8px 0 0 0;">You're now a valued T.G.E. Billing client</p>
          </div>

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${data.clientName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Welcome aboard! We're thrilled to have you as a client. You now have full access to our client portal where you can manage your electrical service needs with ease.
            </p>

            <div style="background-color: #ecfdf5; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px;">Your Client Portal Access:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #047857;">
                <li style="margin-bottom: 8px;">View and pay invoices online</li>
                <li style="margin-bottom: 8px;">Track job progress in real-time</li>
                <li style="margin-bottom: 8px;">Request new services anytime</li>
                <li style="margin-bottom: 8px;">Access your service history</li>
                <li style="margin-bottom: 8px;">Chat with Sparky AI 24/7 for questions</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${portalUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Access Your Dashboard</a>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
              <h4 style="margin: 0 0 8px 0; color: #1e3a8a;">Quick Contact:</h4>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                <strong>Phone:</strong> (281) 416-4454<br/>
                <strong>Emergency:</strong> 24/7 Available<br/>
                <strong>AI Assistant:</strong> Sparky is always ready to help!
              </p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              We're committed to providing you with top-quality electrical services. If you have any questions, just reply to this email or use the chat feature in your dashboard.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 24px;">
              Welcome to the family!<br/>
              <strong>The T.G.E. Billing Team</strong><br/>
              <span style="font-size: 14px; color: #6b7280;">Texas Master Electrician License #750779</span>
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
              <strong>We make power easy</strong> • Lighting your life in any situation
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              T.G.E. Billing | Houston, TX | License #750779
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: "T.G.E. Billing - Client Success"
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: "Welcome to T.G.E. Billing! Your Client Portal is Ready",
      body: htmlBody
    } as any);

    return { success: true };
  } catch (error) {
    console.error('AgentMail client welcome send error:', error);
    return { success: false, error: String(error) };
  }
}
