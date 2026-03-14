import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Users, Briefcase, Sparkles, CheckCircle2 } from "lucide-react";

export default function EmployeeGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-employee-guide-title">
          Employee Guide
        </h1>
        <p className="text-muted-foreground" data-testid="text-employee-guide-subtitle">
          Guide for field technicians and office staff
        </p>
      </div>

      <Separator />

      <Card data-testid="card-employee-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Employee Role Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            As an employee, you have access to core business features needed for daily operations. Your responsibilities include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>Creating and managing invoices for completed work</li>
            <li>Tracking your assigned jobs</li>
            <li>Managing client information</li>
            <li>Generating marketing content for social media</li>
          </ul>
          <p className="text-sm mt-3">
            <strong>Note:</strong> You cannot access user management or company settings. Contact your administrator for any changes needed in those areas.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Daily Tasks</h2>

        <Card data-testid="card-creating-invoices">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Creating Invoices
            </CardTitle>
            <CardDescription>Bill clients for completed electrical work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">To create a new invoice:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Navigate to the <strong>Invoices</strong> page</li>
              <li>Click the <strong>"Create Invoice"</strong> button</li>
              <li>Select the client from the dropdown menu</li>
              <li>Add line items for each service provided:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Enter service description (e.g., "Panel upgrade", "Outlet installation")</li>
                  <li>Specify quantity and unit price</li>
                  <li>Amount is calculated automatically</li>
                </ul>
              </li>
              <li>Apply the appropriate tax rate percentage</li>
              <li>Set the due date (typically 30 days from invoice date)</li>
              <li>Add any relevant notes for the client</li>
              <li>Review the total and click <strong>"Create Invoice"</strong></li>
            </ol>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Invoice Numbers:</p>
              <p className="text-xs mt-2 text-muted-foreground">
                Invoice numbers are auto-generated in sequential order (INV-00001, INV-00002, etc.). 
                You don't need to manually enter invoice numbers.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-managing-invoices">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Managing Invoices
            </CardTitle>
            <CardDescription>Track and update invoice status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">On the Invoices page, you can:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>View all invoices in a sortable table</li>
              <li>Filter by status: Draft, Sent, Paid, or Overdue</li>
              <li>Search for specific invoices by number or client name</li>
              <li>Click on any invoice to view full details</li>
              <li>Edit existing invoices (before they're paid)</li>
              <li>View payment status and history</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Invoice Statuses:</p>
              <ul className="text-xs space-y-1 mt-2 text-muted-foreground">
                <li><strong>Draft:</strong> Invoice created but not finalized</li>
                <li><strong>Sent:</strong> Invoice has been sent to client</li>
                <li><strong>Paid:</strong> Payment received and processed</li>
                <li><strong>Overdue:</strong> Past due date and unpaid</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-managing-jobs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Job Management
            </CardTitle>
            <CardDescription>Track your scheduled work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Use the <strong>Jobs</strong> page to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>View jobs assigned to you by administrators</li>
              <li>Check job details: location, scheduled date, and client info</li>
              <li>Update job status as work progresses</li>
              <li>Add notes and descriptions during the job</li>
              <li>Create new job entries for walk-in or emergency work</li>
              <li>Filter jobs by status (scheduled, in progress, completed)</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Updating Job Status:</p>
              <ol className="text-xs space-y-1 mt-2 text-muted-foreground list-decimal list-inside">
                <li>Click on the job you're working on</li>
                <li>Click "Edit" in the job details dialog</li>
                <li>Change status to "In Progress" when you arrive</li>
                <li>Change to "Completed" when finished</li>
                <li>Add any final notes about the work performed</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-client-information">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Client Information
            </CardTitle>
            <CardDescription>Maintain accurate client records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Navigate to <strong>Clients</strong> to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Add new clients to the system</li>
              <li>Update client contact information</li>
              <li>View client history (past invoices and jobs)</li>
              <li>Search for clients by name, email, or phone</li>
              <li>Add notes about client preferences or site details</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Adding a New Client:</p>
              <ol className="text-xs space-y-1 mt-2 text-muted-foreground list-decimal list-inside">
                <li>Click "Create Client" button</li>
                <li>Enter client name, email, and phone</li>
                <li>Add full service address (street, city, state, zip)</li>
                <li>Include any relevant notes</li>
                <li>Click "Create Client" to save</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-marketing-content">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Marketing Content
            </CardTitle>
            <CardDescription>Create social media posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Use the <strong>Marketing</strong> page to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Generate AI-powered social media posts</li>
              <li>Promote services and special offers</li>
              <li>Choose platform: Facebook, Instagram, LinkedIn, or Twitter</li>
              <li>Get 3 content variations with different tones</li>
              <li>Copy content directly to clipboard</li>
              <li>Save your favorite posts to the library</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Example Workflow:</p>
              <p className="text-xs mt-2 text-muted-foreground">
                1. Describe your service: "Emergency electrical repairs available 24/7"
                <br />
                2. Select platform: Instagram
                <br />
                3. Click "Generate Content"
                <br />
                4. Choose your favorite variation
                <br />
                5. Click "Copy" and paste into Instagram
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-workflow-tips">
        <CardHeader>
          <CardTitle>Workflow Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><strong>Start your day:</strong> Check Jobs page for your schedule</li>
            <li><strong>During service calls:</strong> Update job status and add notes</li>
            <li><strong>After completing work:</strong> Create invoice immediately while details are fresh</li>
            <li><strong>New clients:</strong> Add them to the system before creating their first invoice</li>
            <li><strong>End of day:</strong> Verify all jobs are updated and invoices are sent</li>
          </ul>
        </CardContent>
      </Card>

      <Card data-testid="card-need-help">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            If you need to change your account information, update company settings, 
            or access features not available to employees, please contact your administrator.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions about using specific features? Check the About page for an overview 
            of all platform capabilities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
