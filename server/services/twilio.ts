import twilio from 'twilio';

function getCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables must be set');
  }
  return { accountSid, authToken, phoneNumber };
}

export function getTwilioClient() {
  const { accountSid, authToken } = getCredentials();
  return twilio(accountSid, authToken);
}

export function getTwilioFromPhoneNumber() {
  const { phoneNumber } = getCredentials();
  return phoneNumber;
}

// Validate phone number format
function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Must be 10-11 digits (US format with optional country code)
  return cleaned.length >= 10 && cleaned.length <= 11;
}

// Format phone number to E.164 format (+1XXXXXXXXXX)
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return phone; // Return as-is if not standard US format
}

export async function sendSMS(to: string, message: string, retryCount: number = 0): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    // Validate phone number
    if (!validatePhoneNumber(to)) {
      console.error('Invalid phone number format:', to);
      return { success: false, error: 'Invalid phone number format' };
    }

    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    const formattedTo = formatPhoneNumber(to);
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedTo
    });
    
    console.log(`SMS sent successfully to ${formattedTo}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    
    // Retry on network errors (but not validation errors)
    if (retryCount < 2 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      console.log(`Retrying SMS send (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return sendSMS(to, message, retryCount + 1);
    }
    
    return { success: false, error: error.message || String(error) };
  }
}

export interface AppointmentReminderData {
  clientName: string;
  appointmentDate: Date;
  serviceName: string;
  technicianName?: string;
}

export async function sendAppointmentReminder(to: string, data: AppointmentReminderData) {
  const dateStr = data.appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  
  const message = `Hi ${data.clientName}! Reminder: Your ${data.serviceName} appointment${data.technicianName ? ` with ${data.technicianName}` : ''} is scheduled for ${dateStr}. T.G.E. Billing - We make power easy! Reply STOP to opt out.`;
  
  return sendSMS(to, message);
}

export interface BookingConfirmationData {
  clientName: string;
  appointmentDate: Date;
  serviceName: string;
  address: string;
}

export async function sendBookingConfirmation(to: string, data: BookingConfirmationData) {
  const dateStr = data.appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  
  const message = `Thanks ${data.clientName}! Your ${data.serviceName} appointment is confirmed for ${dateStr} at ${data.address}. T.G.E. Billing (TX License #750779). Questions? Text or call back! Reply STOP to opt out.`;
  
  return sendSMS(to, message);
}

export interface InvoiceNotificationData {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate?: Date;
  paymentUrl: string;
}

export async function sendInvoiceNotification(to: string, data: InvoiceNotificationData) {
  const dueDateStr = data.dueDate ? ` due ${data.dueDate.toLocaleDateString('en-US')}` : '';
  const message = `Hi ${data.clientName}, your invoice #${data.invoiceNumber} for $${data.amount}${dueDateStr} is ready. Pay online: ${data.paymentUrl} - T.G.E. Billing. Reply STOP to opt out.`;
  
  return sendSMS(to, message);
}

export interface FollowUpData {
  clientName: string;
  serviceName: string;
  completionDate: Date;
}

export async function sendFollowUp(to: string, data: FollowUpData) {
  const message = `Hi ${data.clientName}! Thank you for choosing T.G.E. Billing for your ${data.serviceName}. We hope everything is working perfectly! Any concerns or need additional work? Just reply to this message. We make power easy!`;
  
  return sendSMS(to, message);
}

export interface SalesLeadSMSData {
  leadName: string;
  serviceInterest: string;
}

export async function sendSalesLeadSMS(to: string, data: SalesLeadSMSData) {
  const message = `Hi ${data.leadName}! Thanks for your interest in ${data.serviceInterest}. We'll reach out within 24hrs with a free quote. Emergency? Text back now! T.G.E. Billing (TX #750779). Reply STOP to opt out.`;
  
  return sendSMS(to, message);
}

export interface QuoteFollowUpSMSData {
  clientName: string;
  serviceName: string;
  quoteAmount?: string;
}

export async function sendQuoteFollowUpSMS(to: string, data: QuoteFollowUpSMSData) {
  const amountText = data.quoteAmount ? ` for ${data.quoteAmount}` : '';
  const message = `Hi ${data.clientName}! Following up on your ${data.serviceName} quote${amountText}. Ready to schedule or have questions? Just reply! T.G.E. Billing - We make power easy. Reply STOP to opt out.`;
  
  return sendSMS(to, message);
}

export interface ReviewRequestSMSData {
  clientName: string;
  serviceName: string;
}

export async function sendReviewRequestSMS(to: string, data: ReviewRequestSMSData) {
  const message = `Hi ${data.clientName}! Thanks for choosing T.G.E. Billing for your ${data.serviceName}! Share your experience & get $25 off your next service: [review link]. We appreciate you! Reply STOP to opt out.`;
  
  return sendSMS(to, message);
}

export interface JobStatusUpdateData {
  clientName: string;
  jobTitle: string;
  status: string;
  technicianName?: string;
  notes?: string;
}

export async function sendJobStatusSMS(to: string, data: JobStatusUpdateData) {
  const statusMessages: Record<string, string> = {
    'scheduled': `Good news! Your ${data.jobTitle} has been scheduled. ${data.technicianName ? `${data.technicianName} will be your technician.` : ''} We'll send a reminder before the appointment.`,
    'in_progress': `Your ${data.jobTitle} is now in progress! ${data.technicianName ? `${data.technicianName} is on the job.` : ''} We'll update you when complete.`,
    'completed': `Great news! Your ${data.jobTitle} is complete! ${data.notes ? `Notes: ${data.notes}` : ''} Thank you for choosing T.G.E. Billing!`,
    'on_hold': `Update: Your ${data.jobTitle} is on hold. ${data.notes ? `Reason: ${data.notes}` : ''} We'll be in touch soon.`,
    'cancelled': `Your ${data.jobTitle} has been cancelled. ${data.notes ? `Note: ${data.notes}` : ''} Questions? Reply to this message.`
  };
  
  const message = `Hi ${data.clientName}, ${statusMessages[data.status] || `Update on your ${data.jobTitle}: Status is now ${data.status}.`} - T.G.E. Billing (TX #750779). Reply STOP to opt out.`;
  
  return sendSMS(to, message);
}

export interface WelcomeSMSData {
  clientName: string;
}

export async function sendClientWelcomeSMS(to: string, data: WelcomeSMSData) {
  const message = `Welcome to T.G.E. Billing, ${data.clientName}! You now have access to our client portal for invoices, scheduling & 24/7 AI support. Questions? Just text back! TX License #750779. Reply STOP to opt out.`;
  
  return sendSMS(to, message);
}
