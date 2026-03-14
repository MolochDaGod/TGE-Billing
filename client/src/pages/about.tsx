import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Zap, Shield, Sparkles, CreditCard, Users, FileText } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Invoice Management",
      description: "Create, send, and track professional electrical service invoices with ease. Auto-generate invoice numbers and manage payment status."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      title: "Stripe Payments",
      description: "Accept secure online payments directly through the platform. Clients can pay invoices instantly with credit/debit cards."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Role-Based Access",
      description: "Manage your team with Admin, Employee, and Client roles. Each role has specific permissions and customized views."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Secure Authentication",
      description: "Secure authentication with Puter.js and Google OAuth. Sign in with your Puter account, Google, or email/password."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "AI Marketing Tools",
      description: "Generate professional social media content for Facebook, Instagram, LinkedIn, and Twitter using AI."
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Job Tracking",
      description: "Schedule and track electrical jobs. Assign employees, manage status, and keep detailed records of all work."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold" data-testid="text-about-title">
          About ElectraPro
        </h1>
        <div className="space-y-1">
          <p className="text-xl font-semibold text-primary" data-testid="text-about-subtitle">
            We Make Power Easy
          </p>
          <p className="text-lg text-muted-foreground italic">
            Lighting your life in any situation
          </p>
        </div>
      </div>

      <Separator />

      <Card data-testid="card-platform-overview">
        <CardHeader>
          <CardTitle>Our Mission: Building Business That Builds Business</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            ElectraPro is a comprehensive business management platform designed specifically for master electricians 
            and electrical service companies. We're on a mission to transform how electrical professionals manage their 
            operations—making power easy for those who deliver it.
          </p>
          <p>
            Built with modern web technologies and integrated with industry-leading services like Stripe for payments 
            and OpenAI for AI-powered assistance and marketing, ElectraPro empowers electrical businesses to operate more 
            efficiently and professionally. We're not just building software—we're building a business that will build business.
          </p>
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
            <p className="font-semibold text-primary mb-2">Our Promise:</p>
            <p className="text-sm">
              Whether you're responding to an emergency call at midnight or planning next quarter's growth strategy, 
              ElectraPro is here to light your path—in any situation.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Key Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} data-testid={`card-feature-${index}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {feature.icon}
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card data-testid="card-user-roles">
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Admin</h3>
            <p className="text-sm text-muted-foreground">
              Full access to all features including user management, company settings, invoices, payments, 
              jobs, clients, and marketing tools. Admins can manage employee accounts and assign roles.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Employee</h3>
            <p className="text-sm text-muted-foreground">
              Access to create and manage invoices, jobs, and clients. Employees can track their assigned 
              jobs and generate marketing content but cannot modify company settings or manage users.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Client</h3>
            <p className="text-sm text-muted-foreground">
              View-only access to their own invoices and jobs. Clients can pay invoices online through 
              the integrated Stripe payment system.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-getting-started">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            New to the platform? Here's how to get started based on your role:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li><strong>Admins:</strong> Configure company settings, add employees, and start creating invoices</li>
            <li><strong>Employees:</strong> Review your assigned jobs and create invoices for completed work</li>
            <li><strong>Clients:</strong> Check your invoices and make payments securely online</li>
          </ul>
          <p className="text-sm mt-4">
            For detailed guides specific to your role, please refer to the documentation pages in the sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
