import { AgentMailClient } from 'agentmail';
import crypto from 'crypto';

// Dynamic branding config resolved from company_settings
export interface BrandingConfig {
  companyName: string;
  tagline?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'TGE Operations',
  tagline: 'Professional Contractor Services',
};

/** Merge company_settings row into a BrandingConfig */
export function buildBranding(settings?: { company_name?: string; tagline?: string; license_number?: string; email?: string; phone?: string } | null): BrandingConfig {
  if (!settings) return DEFAULT_BRANDING;
  return {
    companyName: settings.company_name || DEFAULT_BRANDING.companyName,
    tagline: settings.tagline || DEFAULT_BRANDING.tagline,
    licenseNumber: settings.license_number || undefined,
    email: settings.email || undefined,
    phone: settings.phone || undefined,
  };
}

async function getCredentials() {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  if (!apiKey) {
    throw new Error('AGENTMAIL_API_KEY environment variable is not set');
  }
  return { apiKey };
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

/** Build a consistent email header block from branding */
function brandedHeader(brand: BrandingConfig): string {
  const license = brand.licenseNumber ? `<p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 14px;">${brand.licenseNumber}</p>` : '';
  return `
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${brand.companyName}</h1>
      ${license}
    </div>`;
}

/** Build a consistent email footer block from branding */
function brandedFooter(brand: BrandingConfig): string {
  const tagline = brand.tagline ? `<p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;"><strong>${brand.tagline}</strong></p>` : '';
  const license = brand.licenseNumber ? ` | ${brand.licenseNumber}` : '';
  return `
    <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      ${tagline}
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">${brand.companyName}${license}</p>
    </div>`;
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
  branding?: BrandingConfig;
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
    if (!validateEmail(data.clientEmail)) {
      console.error('Invalid email format:', data.clientEmail);
      return { success: false, error: 'Invalid email format' };
    }

    const brand = data.branding || DEFAULT_BRANDING;
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
          ${brandedHeader(brand)}

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hi <strong>${data.clientName}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Your invoice is ready. Here are the details:
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
              Questions? Reply to this email or contact us directly.
            </p>
          </div>

          ${brandedFooter(brand)}
        </div>
      </body>
      </html>
    `;

    const plainTextBody = `
Hi ${data.clientName},

Your invoice is ready.

Invoice Number: ${data.invoiceNumber}
Total Amount: $${data.amount}
Due Date: ${dueDateStr}

${data.items && data.items.length > 0 ? `
Items:
${data.items.map(item => `- ${item.description}: ${item.quantity} x $${item.unit_price} = $${item.amount}`).join('\n')}
` : ''}

${data.notes ? `Note: ${data.notes}\n` : ''}

Pay online: ${data.paymentUrl}

Questions? Reply to this email or contact us directly.

---
${brand.tagline || ''}
${brand.companyName}${brand.licenseNumber ? ' | ' + brand.licenseNumber : ''}
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: `${brand.companyName} - Invoices`
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: `Invoice ${data.invoiceNumber} from ${brand.companyName}`,
      body: htmlBody,
      plainTextBody: plainTextBody
    } as any);

    console.log(`Invoice email sent successfully to ${data.clientEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('AgentMail send error:', error);
    
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
  branding?: BrandingConfig;
}

export async function sendAppointmentEmail(data: AppointmentEmailData) {
  try {
    const brand = data.branding || DEFAULT_BRANDING;
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
            <p>Your <strong>${data.serviceName}</strong> appointment is confirmed.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0;">
              <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${dateStr}</p>
              <p style="margin: 8px 0;"><strong>Location:</strong> ${data.address}</p>
              ${data.technicianName ? `<p style="margin: 8px 0;"><strong>Assigned To:</strong> ${data.technicianName}</p>` : ''}
            </div>
            <p>We look forward to seeing you.</p>
          </div>
          ${brandedFooter(brand)}
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: `${brand.companyName} - Appointments`
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
  branding?: BrandingConfig;
}

export async function sendSalesLeadWelcome(data: SalesLeadEmailData) {
  try {
    const brand = data.branding || DEFAULT_BRANDING;
    const client = await getAgentMailClient();
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${brandedHeader(brand)}

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${data.leadName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for your interest in our ${data.serviceInterest || 'contractor'} services. We look forward to helping you with your project.
            </p>

            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e3a8a;">Why Choose ${brand.companyName}?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                <li>Licensed & Fully Insured</li>
                <li>Transparent, Competitive Pricing</li>
                <li>Reliable Scheduling & Communication</li>
                <li>100% Satisfaction Guaranteed</li>
              </ul>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              <strong>What happens next?</strong>
            </p>
            <ol style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px;">
              <li>We'll reach out within 24 hours to discuss your needs</li>
              <li>Schedule a consultation if needed</li>
              <li>Provide a detailed, no-obligation estimate</li>
              <li>Get started at your convenience</li>
            </ol>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Questions? Reply to this email — we're here to help.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 32px;">
              Looking forward to working with you,<br/>
              <strong>The ${brand.companyName} Team</strong>
            </p>
          </div>

          ${brandedFooter(brand)}
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: `${brand.companyName} - Sales`
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.leadEmail],
      subject: `Welcome to ${brand.companyName}!`,
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
  branding?: BrandingConfig;
}

export async function sendQuoteFollowUp(data: QuoteFollowUpData) {
  try {
    const brand = data.branding || DEFAULT_BRANDING;
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
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Following Up on Your ${data.serviceName} Estimate</h1>
          </div>

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${data.clientName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              We wanted to follow up on the estimate we sent for ${data.serviceName}${data.quoteAmount ? ` (${data.quoteAmount})` : ''}.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Do you have any questions about:
            </p>
            <ul style="color: #374151; font-size: 15px; line-height: 1.8;">
              <li>The scope of work?</li>
              <li>Pricing or payment options?</li>
              <li>Timeline or scheduling?</li>
            </ul>

            <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 16px; font-weight: 600;">Ready to Move Forward?</p>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                Reply to this email or contact us directly.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">
              Best regards,<br/>
              <strong>${brand.companyName} Team</strong>
            </p>
          </div>

          ${brandedFooter(brand)}
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: `${brand.companyName} - Sales`
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: `Following Up: Your ${data.serviceName} Estimate`,
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
  branding?: BrandingConfig;
}

export async function sendReviewRequest(data: ReviewRequestData) {
  try {
    const brand = data.branding || DEFAULT_BRANDING;
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
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">How Was Your Experience?</h1>
          </div>

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${data.clientName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for choosing ${brand.companyName} for your ${data.serviceName}. ${data.technicianName ? `${data.technicianName} and our team` : 'Our team'} appreciated working with you.
            </p>

            <div style="background-color: #dbeafe; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #1e3a8a; font-size: 18px; font-weight: 600;">
                Would you share your experience?
              </p>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                Your feedback helps us improve and helps others find quality service.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 32px;">
              Thanks again,<br/>
              <strong>The ${brand.companyName} Team</strong>
            </p>
          </div>

          ${brandedFooter(brand)}
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: `${brand.companyName} - Customer Success`
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: `Share Your ${brand.companyName} Experience`,
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
  branding?: BrandingConfig;
}

export async function sendClientWelcomeEmail(data: ClientWelcomeData) {
  try {
    if (!validateEmail(data.clientEmail)) {
      console.error('Invalid email format:', data.clientEmail);
      return { success: false, error: 'Invalid email format' };
    }

    const brand = data.branding || DEFAULT_BRANDING;
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
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome!</h1>
            <p style="color: #d1fae5; margin: 8px 0 0 0;">You're now a valued ${brand.companyName} client</p>
          </div>

          <div style="padding: 32px 24px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${data.clientName}</strong>,</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Welcome aboard! You now have full access to your client portal where you can manage your service needs.
            </p>

            <div style="background-color: #ecfdf5; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px;">Your Client Portal:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #047857;">
                <li style="margin-bottom: 8px;">View and pay invoices online</li>
                <li style="margin-bottom: 8px;">Track job progress in real-time</li>
                <li style="margin-bottom: 8px;">Request new services anytime</li>
                <li style="margin-bottom: 8px;">Access your service history</li>
                <li style="margin-bottom: 8px;">Use the AI Assistant for questions</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${portalUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Access Your Dashboard</a>
            </div>

            ${brand.phone ? `
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
              <h4 style="margin: 0 0 8px 0; color: #1e3a8a;">Contact Us:</h4>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                <strong>Phone:</strong> ${brand.phone}<br/>
                Or reply directly to this email.
              </p>
            </div>
            ` : ''}

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              If you have any questions, reply to this email or use the chat in your dashboard.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 24px;">
              Welcome aboard,<br/>
              <strong>The ${brand.companyName} Team</strong>
            </p>
          </div>

          ${brandedFooter(brand)}
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: `${brand.companyName} - Client Success`
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.clientEmail],
      subject: `Welcome to ${brand.companyName}! Your Portal is Ready`,
      body: htmlBody
    } as any);

    return { success: true };
  } catch (error) {
    console.error('AgentMail client welcome send error:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Generic email sender for custom messages
// ============================================
export interface GenericEmailData {
  to: string;
  subject: string;
  body: string;
  branding?: BrandingConfig;
}

export async function sendGenericEmail(data: GenericEmailData) {
  try {
    if (!validateEmail(data.to)) {
      return { success: false, error: 'Invalid email format' };
    }

    const brand = data.branding || DEFAULT_BRANDING;
    const client = await getAgentMailClient();

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${brandedHeader(brand)}
          <div style="padding: 32px 24px; color: #374151; font-size: 16px; line-height: 1.6;">
            ${data.body}
          </div>
          ${brandedFooter(brand)}
        </div>
      </body>
      </html>
    `;

    const inboxes = await client.inboxes.list() as any;
    let inboxId = inboxes.items?.[0]?.id;

    if (!inboxId) {
      const newInbox = await client.inboxes.create({
        name: `${brand.companyName} - General`
      } as any) as any;
      inboxId = newInbox.id;
    }

    await client.inboxes.messages.send(inboxId, {
      to: [data.to],
      subject: data.subject,
      body: htmlBody,
    } as any);

    return { success: true };
  } catch (error) {
    console.error('AgentMail generic send error:', error);
    return { success: false, error: String(error) };
  }
}
