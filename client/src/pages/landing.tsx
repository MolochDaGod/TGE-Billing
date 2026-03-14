import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Clock, Users, DollarSign, ArrowRight, Phone, MapPin, MessageSquare, ClipboardList, BarChart3, Mail } from "lucide-react";
import sparkyLogo from "@assets/19a3d6b3030bf_1763861033350.png";
import { DownloadAppButton } from "@/components/download-app-button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-testid="header-main">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-3" data-testid="logo-brand">
            <div className="flex items-center justify-center w-10 h-10">
              <img src={sparkyLogo} alt="TGE Logo" className="h-10 w-10 object-contain" data-testid="icon-logo" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground" data-testid="text-brand-name">TGE Operations</span>
              <span className="text-xs text-muted-foreground">Contractor Management Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DownloadAppButton variant="outline" size="sm" showOnDesktop={true} />
            <Button asChild data-testid="button-login">
              <a href="/auth">Log In</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:py-28" data-testid="section-hero">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground" data-testid="text-hero-title">
              Run Your Contracting Business
              <span className="block text-primary mt-2" data-testid="text-hero-subtitle">From One Platform</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg md:text-xl text-muted-foreground" data-testid="text-hero-description">
              Invoices, estimates, clients, vendors, scheduling, and team communication &mdash; all in one place. Built for contractor teams that need to move fast.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4" data-testid="group-hero-cta">
              <Button size="lg" asChild className="font-semibold" data-testid="button-get-started">
                <a href="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <DownloadAppButton variant="landing" size="lg" showOnDesktop={true} />
              <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                <a href="#features">
                  See Features
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/20" data-testid="section-features">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl md:text-4xl font-bold text-foreground" data-testid="text-features-heading">
              Everything Your Team Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage operations end-to-end &mdash; from first client contact through invoicing and payment.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-features">
            <Card className="hover-elevate border-border" data-testid="card-feature-invoice">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Invoices &amp; Estimates</CardTitle>
                <CardDescription>
                  Create, edit, save, and send professional invoices and estimates. Convert accepted estimates to invoices with one click.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate border-border" data-testid="card-feature-payments">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Payment Processing</CardTitle>
                <CardDescription>
                  Accept credit card payments via Stripe. Automatic tracking, reminders, and payment status updates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate border-border" data-testid="card-feature-scheduling">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Job Scheduling</CardTitle>
                <CardDescription>
                  Assign jobs, manage appointments, and coordinate your team. Automatic SMS and email confirmations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate border-border" data-testid="card-feature-clients">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Client &amp; Vendor CRM</CardTitle>
                <CardDescription>
                  Shared access to contacts, clients, and vendors. Activity tracking, follow-ups, and lifetime value metrics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate border-border" data-testid="card-feature-comms">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Team Communication</CardTitle>
                <CardDescription>
                  Built-in messaging with role-based channels. Email and SMS notifications powered by Twilio and AgentMail.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate border-border" data-testid="card-feature-compliance">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Compliance Tracking</CardTitle>
                <CardDescription>
                  Permits, inspections, work orders, and compliance checklists. Stay audit-ready with digital documentation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate border-border" data-testid="card-feature-email">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Email Integration</CardTitle>
                <CardDescription>
                  Send invoices and estimates directly from the platform. Professional email templates with your company branding.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate border-border" data-testid="card-feature-pipeline">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Sales Pipeline</CardTitle>
                <CardDescription>
                  Track leads from first contact to closed deal. AI-powered lead scoring and automated follow-up sequences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate border-border" data-testid="card-feature-roles">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Role-Based Access</CardTitle>
                <CardDescription>
                  Multi-tier permissions for owners, partners, team leads, staff, vendors, and clients. Everyone sees only what they need.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4" data-testid="section-benefits">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6 text-3xl md:text-4xl font-bold text-foreground" data-testid="text-benefits-heading">
                Built for Contractor Teams
              </h2>
              <div className="space-y-5">
                {[
                  { title: "Shared Operations", desc: "Your entire team accesses invoices, clients, and jobs from one platform — no duplicate spreadsheets." },
                  { title: "Estimates to Invoices", desc: "Generate estimates, send for approval, and convert accepted estimates to invoices instantly." },
                  { title: "Multi-Channel Notifications", desc: "Send invoices and reminders via email and SMS. Clients pay online with one click." },
                  { title: "AI Operations Assistant", desc: "Built-in assistant helps with invoicing, scheduling, client management, and business analytics." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="mt-1 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-border p-6">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Digital Operations</div>
              </Card>
              <Card className="border-border p-6">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">AI Assistant</div>
              </Card>
              <Card className="border-border p-6">
                <div className="text-3xl font-bold text-primary mb-2">Instant</div>
                <div className="text-sm text-muted-foreground">Notifications</div>
              </Card>
              <Card className="border-border p-6">
                <div className="text-3xl font-bold text-primary mb-2">Secure</div>
                <div className="text-sm text-muted-foreground">Payments</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/20" data-testid="section-cta">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl md:text-4xl font-bold text-foreground" data-testid="text-cta-heading">
            Ready to Streamline Your Operations?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground" data-testid="text-cta-description">
            Get your team on one platform. Invoices, estimates, clients, and communication &mdash; handled.
          </p>
          <Button size="lg" asChild className="font-semibold" data-testid="button-cta-signup">
            <a href="/auth">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4" data-testid="footer-main">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10">
                  <img src={sparkyLogo} alt="TGE Logo" className="h-10 w-10 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">TGE Operations</span>
                  <span className="text-xs text-muted-foreground">Contractor Management Platform</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional operations management for contractor teams. Invoicing, estimates, CRM, and team coordination.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Texas License #750779</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Serving Texas</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>&bull; Invoices &amp; Estimates</li>
                <li>&bull; Client &amp; Vendor Management</li>
                <li>&bull; Team Scheduling &amp; Communication</li>
                <li>&bull; Compliance &amp; Documentation</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p data-testid="text-copyright">&copy; {new Date().getFullYear()} T.G.E. Billing &mdash; TGE Operations. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
