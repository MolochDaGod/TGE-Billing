import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, FileText, CreditCard, Briefcase, Sparkles, Shield } from "lucide-react";

export default function AdminGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-admin-guide-title">
          Administrator Guide
        </h1>
        <p className="text-muted-foreground" data-testid="text-admin-guide-subtitle">
          Complete guide for platform administrators
        </p>
      </div>

      <Separator />

      <Card data-testid="card-admin-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Role Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            As an administrator, you have full access to all platform features. You're responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>Managing company settings and branding</li>
            <li>Creating and managing user accounts (employees and clients)</li>
            <li>Overseeing all invoices, payments, and jobs</li>
            <li>Generating marketing content for social media</li>
            <li>Configuring system-wide settings</li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Core Features</h2>

        <Card data-testid="card-company-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Company Settings
            </CardTitle>
            <CardDescription>Configure your business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Navigate to <strong>Settings</strong> to configure:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Company name, email, and phone number</li>
              <li>Business address (street, city, state, zip)</li>
              <li>License number and years in business</li>
              <li>Company tagline and about description</li>
              <li>Upload company logo (displayed on invoices and website)</li>
            </ul>
            <p className="text-sm mt-3">
              <strong>Note:</strong> Only administrators can modify company settings. Other users can view but not edit.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-user-management">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>Manage employees and clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Access <strong>User Management</strong> to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>View all users (admins, employees, and clients)</li>
              <li>Filter users by role</li>
              <li>Search for users by name or email</li>
              <li>Change user roles (promote employees to admin, etc.)</li>
              <li>View detailed user information</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Role Permissions:</p>
              <ul className="text-xs space-y-1 mt-2 text-muted-foreground">
                <li><strong>Admin:</strong> Full access to all features</li>
                <li><strong>Employee:</strong> Can create invoices, jobs, and manage clients</li>
                <li><strong>Client:</strong> View-only access to their invoices and jobs</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-invoice-management">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Management
            </CardTitle>
            <CardDescription>Create and track invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Use the <strong>Invoices</strong> page to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Create new invoices with auto-generated invoice numbers (INV-00001, INV-00002, etc.)</li>
              <li>Add multiple line items with descriptions, quantities, and unit prices</li>
              <li>Apply tax rates and calculate totals automatically</li>
              <li>Set due dates and track payment status</li>
              <li>Filter invoices by status (draft, sent, paid, overdue)</li>
              <li>Search invoices by number or client name</li>
              <li>Edit or delete invoices (only admins can delete)</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Creating an Invoice:</p>
              <ol className="text-xs space-y-1 mt-2 text-muted-foreground list-decimal list-inside">
                <li>Click "Create Invoice" button</li>
                <li>Select a client from the dropdown</li>
                <li>Add line items (services provided)</li>
                <li>Enter tax rate percentage</li>
                <li>Set due date and add notes</li>
                <li>Review totals and click "Create Invoice"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-payment-tracking">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Tracking
            </CardTitle>
            <CardDescription>Monitor and process payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Payment features:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>View all payments received through the platform</li>
              <li>Track which invoices have been paid</li>
              <li>Monitor payment methods (Stripe transactions)</li>
              <li>Send payment links to clients directly</li>
            </ul>
            <p className="text-sm mt-3">
              Clients can pay invoices by clicking the "Pay" button on any unpaid invoice, 
              which redirects them to a secure Stripe payment form.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-job-scheduling">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Job Scheduling
            </CardTitle>
            <CardDescription>Manage electrical service jobs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Navigate to <strong>Jobs</strong> to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Create new job entries</li>
              <li>Assign jobs to specific employees</li>
              <li>Set job status (scheduled, in progress, completed, cancelled)</li>
              <li>Track scheduled dates and locations</li>
              <li>Add detailed job descriptions and notes</li>
              <li>Filter and search jobs by status or location</li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-marketing-tools">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Marketing Tools
            </CardTitle>
            <CardDescription>Generate social media content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Access the <strong>Marketing</strong> page to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Generate AI-powered social media posts</li>
              <li>Choose target platform (Facebook, Instagram, LinkedIn, Twitter)</li>
              <li>Describe your service or promotion</li>
              <li>Get 3 content variations with different tones</li>
              <li>Copy content to clipboard with one click</li>
              <li>Save favorite posts to your library</li>
              <li>Manage saved marketing content</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold">Example Use Case:</p>
              <p className="text-xs mt-2 text-muted-foreground">
                Input: "Offering 10% off electrical panel upgrades this month"
                <br />
                Platform: Instagram
                <br />
                Result: AI generates 3 engaging Instagram posts ready to publish
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-best-practices">
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><strong>1. Keep company settings up to date</strong> - Ensure contact information is current</li>
            <li><strong>2. Regularly review user roles</strong> - Audit user permissions quarterly</li>
            <li><strong>3. Track invoice status</strong> - Follow up on overdue invoices promptly</li>
            <li><strong>4. Assign jobs clearly</strong> - Communicate job assignments with employees</li>
            <li><strong>5. Use marketing tools consistently</strong> - Maintain regular social media presence</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
