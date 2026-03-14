import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, CreditCard, Eye, Shield } from "lucide-react";

export default function ClientGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-client-guide-title">
          Client Guide
        </h1>
        <p className="text-muted-foreground" data-testid="text-client-guide-subtitle">
          Guide for viewing invoices and making payments
        </p>
      </div>

      <Separator />

      <Card data-testid="card-client-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Client Account Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Welcome to ElectraPro! Your client account provides access to view your electrical service 
            records and pay invoices online. You can:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>View all invoices for electrical work performed</li>
            <li>Check payment status and history</li>
            <li>Pay outstanding invoices securely with credit/debit card</li>
            <li>Track scheduled and completed jobs</li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Using Your Account</h2>

        <Card data-testid="card-viewing-invoices">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Viewing Your Invoices
            </CardTitle>
            <CardDescription>Access your billing information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">To view your invoices:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Navigate to the <strong>Invoices</strong> page from the sidebar</li>
              <li>You'll see a list of all invoices for work performed at your property</li>
              <li>Click on any invoice to view full details including:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Invoice number and date</li>
                  <li>Detailed list of services provided</li>
                  <li>Cost breakdown with tax</li>
                  <li>Total amount due</li>
                  <li>Due date</li>
                  <li>Payment status</li>
                </ul>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Understanding Invoice Status:</p>
              <ul className="text-xs space-y-1 mt-2 text-muted-foreground">
                <li><strong>Sent:</strong> Invoice has been issued and is awaiting payment</li>
                <li><strong>Paid:</strong> Your payment has been received and processed</li>
                <li><strong>Overdue:</strong> Invoice is past the due date and needs attention</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-making-payments">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Making Payments
            </CardTitle>
            <CardDescription>Pay invoices securely online</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">To pay an invoice online:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Go to the <strong>Invoices</strong> page</li>
              <li>Find the unpaid invoice you want to pay</li>
              <li>Click the <strong>"Pay"</strong> button next to the invoice</li>
              <li>You'll be redirected to a secure payment page showing:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Invoice summary with total amount</li>
                  <li>Secure card payment form</li>
                </ul>
              </li>
              <li>Enter your credit or debit card information</li>
              <li>Click <strong>"Process Payment"</strong></li>
              <li>Wait for confirmation (you'll see a success message)</li>
              <li>You'll be redirected back to your invoices page</li>
            </ol>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Payment Security:</p>
              <p className="text-xs mt-2 text-muted-foreground">
                All payments are processed securely through Stripe, a leading payment processor. 
                Your card information is encrypted and never stored on our servers. We never see 
                your complete card number.
              </p>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Accepted Payment Methods:</p>
              <ul className="text-xs space-y-1 mt-2 text-muted-foreground">
                <li>Visa, Mastercard, American Express, Discover</li>
                <li>Debit cards with Visa or Mastercard logo</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-tracking-jobs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Tracking Your Jobs
            </CardTitle>
            <CardDescription>View scheduled and completed electrical work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">On the <strong>Jobs</strong> page, you can:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>See upcoming scheduled electrical work</li>
              <li>View assigned technician for each job</li>
              <li>Check job status (scheduled, in progress, completed)</li>
              <li>Review job descriptions and notes</li>
              <li>See service location and scheduled date/time</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Job Statuses:</p>
              <ul className="text-xs space-y-1 mt-2 text-muted-foreground">
                <li><strong>Scheduled:</strong> Work is scheduled for a future date</li>
                <li><strong>In Progress:</strong> Technician is currently on-site working</li>
                <li><strong>Completed:</strong> Work has been finished</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-dashboard">
          <CardHeader>
            <CardTitle>Dashboard Overview</CardTitle>
            <CardDescription>Your account summary at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">The <strong>Home</strong> dashboard shows:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Total number of invoices</li>
              <li>Number of unpaid invoices</li>
              <li>Total amount owed</li>
              <li>Recent invoice activity</li>
              <li>Upcoming job schedule</li>
            </ul>
            <p className="text-sm mt-3">
              This gives you a quick overview of your account status without navigating to individual pages.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-payment-tips">
        <CardHeader>
          <CardTitle>Payment Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><strong>Pay promptly:</strong> Avoid late fees by paying before the due date</li>
            <li><strong>Save confirmation:</strong> Take a screenshot of the success page for your records</li>
            <li><strong>Check status:</strong> Payment status updates immediately after processing</li>
            <li><strong>Payment issues?</strong> Contact the electrical company directly if you experience any problems</li>
          </ul>
        </CardContent>
      </Card>

      <Card data-testid="card-account-security">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Your account is protected by:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
            <li>Secure Replit authentication</li>
            <li>Encrypted data transmission (HTTPS)</li>
            <li>PCI-compliant payment processing through Stripe</li>
            <li>Role-based access controls (you only see your own data)</li>
          </ul>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-semibold">Privacy Note:</p>
            <p className="text-xs mt-2 text-muted-foreground">
              You can only view invoices and jobs associated with your account. Other clients' 
              information is not visible to you. Company employees and administrators have access 
              to manage your account for billing and service purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-questions">
        <CardHeader>
          <CardTitle>Questions or Issues?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            If you have questions about an invoice, need to discuss payment arrangements, 
            or have concerns about electrical work performed, please contact the electrical 
            company directly using the contact information found in the Settings page.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            For technical issues with the website or payment system, ask your electrician 
            to contact their platform administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
