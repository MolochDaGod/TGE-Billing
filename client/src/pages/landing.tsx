import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Clock, Users, DollarSign, Sparkles, CheckCircle2, ArrowRight, Phone, MapPin, MessageSquare } from "lucide-react";
import sparkyLogo from "@assets/19a3d6b3030bf_1763861033350.png";
import { MaintenanceMan } from "@/components/MaintenanceMan";
import { DownloadAppButton } from "@/components/download-app-button";

/** Animated SVG circuit-board background — pure CSS/SVG, no external library */
function CircuitBackground() {
  return (
    <div className="electrical-background" aria-hidden>
      <svg
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.12 }}
      >
        {/* Horizontal traces */}
        {[60, 140, 220, 300, 380, 460, 540].map((y, i) => (
          <line key={`h${i}`} x1="0" y1={y} x2="1200" y2={y}
            stroke="#e5fa00" strokeWidth="1" strokeDasharray="40 20" />
        ))}
        {/* Vertical traces */}
        {[80, 200, 320, 440, 560, 680, 800, 920, 1040, 1160].map((x, i) => (
          <line key={`v${i}`} x1={x} y1="0" x2={x} y2="600"
            stroke="#38bdf8" strokeWidth="1" strokeDasharray="30 25" />
        ))}
        {/* Junction dots */}
        {[[80,60],[200,140],[320,60],[440,220],[560,140],[680,300],[800,60],[920,220],[1040,140],[1160,300],
          [80,300],[200,380],[440,460],[680,60],[800,380],[320,460],[560,380],[1040,380]].map(([cx,cy], i) => (
          <circle key={`d${i}`} cx={cx} cy={cy} r="5" fill="#e5fa00" opacity="0.8" />
        ))}
        {/* Animated pulse dots */}
        <circle cx="200" cy="140" r="4" fill="#e5fa00">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="800" cy="380" r="4" fill="#38bdf8">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="r" values="4;9;4" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="560" cy="140" r="4" fill="#e5fa00">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="r" values="4;7;4" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="1040" cy="300" r="4" fill="#38bdf8">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="r" values="4;8;4" dur="3.2s" repeatCount="indefinite" />
        </circle>
        {/* Moving signal along horizontal trace */}
        <circle cx="0" cy="300" r="6" fill="#e5fa00" opacity="0.9">
          <animate attributeName="cx" values="0;1200" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.9;0" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="140" r="5" fill="#38bdf8" opacity="0.9">
          <animate attributeName="cx" values="1200;0" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0" dur="5s" repeatCount="indefinite" />
        </circle>
        {/* IC chip outlines */}
        {[[100,240],[600,320],[950,100]].map(([x,y], i) => (
          <g key={`ic${i}`}>
            <rect x={x} y={y} width="60" height="40" rx="4" fill="none" stroke="#e5fa00" strokeWidth="1.5" opacity="0.6" />
            <line x1={x+10} y1={y} x2={x+10} y2={y-10} stroke="#e5fa00" strokeWidth="1" opacity="0.5" />
            <line x1={x+30} y1={y} x2={x+30} y2={y-10} stroke="#e5fa00" strokeWidth="1" opacity="0.5" />
            <line x1={x+50} y1={y} x2={x+50} y2={y-10} stroke="#e5fa00" strokeWidth="1" opacity="0.5" />
            <line x1={x+10} y1={y+40} x2={x+10} y2={y+50} stroke="#e5fa00" strokeWidth="1" opacity="0.5" />
            <line x1={x+30} y1={y+40} x2={x+30} y2={y+50} stroke="#e5fa00" strokeWidth="1" opacity="0.5" />
            <line x1={x+50} y1={y+40} x2={x+50} y2={y+50} stroke="#e5fa00" strokeWidth="1" opacity="0.5" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative">
      <CircuitBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-testid="header-main">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-3" data-testid="logo-brand">
            <div className="flex items-center justify-center w-10 h-10">
              <img src={sparkyLogo} alt="T.G.E. Logo" className="h-10 w-10 object-contain" data-testid="icon-logo" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground" data-testid="text-brand-name">ElectraPro</span>
              <span className="text-xs text-muted-foreground">by T.G.E. Billing</span>
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
      <section className="relative overflow-hidden px-4 py-20 md:py-32" data-testid="section-hero">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Texas Master Electrician License #750779</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground" data-testid="text-hero-title">
              We Make Power
              <span className="block text-primary mt-2" data-testid="text-hero-subtitle">Easy</span>
            </h1>
            
            {/* Subheading */}
            <p className="mx-auto mb-4 max-w-2xl text-xl md:text-2xl text-foreground/90" data-testid="text-hero-description">
              Lighting your life in any situation
            </p>
            
            {/* Description */}
            <p className="mx-auto mb-10 max-w-2xl text-base md:text-lg text-muted-foreground" data-testid="text-hero-tagline">
              Professional electrical services management platform. We are building a business that will build business.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4" data-testid="group-hero-cta">
              <Button size="lg" asChild className="bg-accent hover:bg-accent/90 font-semibold text-[#00ff00]" data-testid="button-get-started">
                <a href="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <DownloadAppButton variant="landing" size="lg" showOnDesktop={true} />
              <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                <a href="#features">
                  Discover Features
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
              Everything You Need to Run Your Business
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamline operations from client contact to payment with our comprehensive platform
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-features">
            {/* Invoice Management */}
            <Card className="hover-elevate border-border" data-testid="card-feature-invoice">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <Zap className="h-6 w-6 text-primary" data-testid="icon-feature-invoice" />
                </div>
                <CardTitle className="text-foreground" data-testid="text-feature-invoice-title">Fast Invoice Creation</CardTitle>
                <CardDescription data-testid="text-feature-invoice-description">
                  Create professional invoices in seconds with our intuitive interface and send via email or SMS
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Secure Payments */}
            <Card className="hover-elevate border-border" data-testid="card-feature-payments">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 mb-4">
                  <DollarSign className="h-6 w-6 text-accent" data-testid="icon-feature-payments" />
                </div>
                <CardTitle className="text-foreground" data-testid="text-feature-payments-title">Secure Payments</CardTitle>
                <CardDescription data-testid="text-feature-payments-description">
                  Accept credit card payments securely with Stripe integration and automatic payment tracking
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Job Scheduling */}
            <Card className="hover-elevate border-border" data-testid="card-feature-scheduling">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <Clock className="h-6 w-6 text-primary" data-testid="icon-feature-scheduling" />
                </div>
                <CardTitle className="text-foreground" data-testid="text-feature-scheduling-title">Job Scheduling</CardTitle>
                <CardDescription data-testid="text-feature-scheduling-description">
                  Manage appointments, assign jobs to your team, and send SMS confirmations automatically
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Client Management */}
            <Card className="hover-elevate border-border" data-testid="card-feature-clients">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 mb-4">
                  <Users className="h-6 w-6 text-accent" data-testid="icon-feature-clients" />
                </div>
                <CardTitle className="text-foreground" data-testid="text-feature-clients-title">Client Management</CardTitle>
                <CardDescription data-testid="text-feature-clients-description">
                  Keep track of all your clients, project history, and service records in one place
                </CardDescription>
              </CardHeader>
            </Card>

            {/* AI Assistant */}
            <Card className="hover-elevate border-border" data-testid="card-feature-ai">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" data-testid="icon-feature-ai" />
                </div>
                <CardTitle className="text-foreground" data-testid="text-feature-ai-title">Sparky AI Business Coach</CardTitle>
                <CardDescription data-testid="text-feature-ai-description">
                  Get business advice, marketing ideas, and technical support from your AI assistant
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Compliance */}
            <Card className="hover-elevate border-border" data-testid="card-feature-compliance">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 mb-4">
                  <Shield className="h-6 w-6 text-accent" data-testid="icon-feature-compliance" />
                </div>
                <CardTitle className="text-foreground" data-testid="text-feature-compliance-title">TDLR &amp; NEC Compliance</CardTitle>
                <CardDescription data-testid="text-feature-compliance-description">
                  Stay compliant with Texas regulations and NEC 2023 standards with automated tracking
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Team Communications */}
            <Card className="hover-elevate border-border" data-testid="card-feature-comms">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <MessageSquare className="h-6 w-6 text-cyan-400" data-testid="icon-feature-comms" />
                </div>
                <CardTitle className="text-foreground" data-testid="text-feature-comms-title">Team Communications</CardTitle>
                <CardDescription data-testid="text-feature-comms-description">
                  Built-in team chat with role-gated channels, Sparky AI assistant, and real-time messaging
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
                Built for Electrical Contractors
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Multi-Channel Notifications</h3>
                    <p className="text-muted-foreground">Send invoices and appointment reminders via email and SMS with Twilio integration</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Role-Based Access Control</h3>
                    <p className="text-muted-foreground">9-tier role hierarchy (Pirate King → Client) with channel-gated team communications</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">PWA Installation</h3>
                    <p className="text-muted-foreground">Install on phones and computers for easy access like a native app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Social Referrals</h3>
                    <p className="text-muted-foreground">Grow your business with built-in referral codes and social sharing</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-border p-6">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Texas Compliant</div>
              </Card>
              <Card className="border-border p-6">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">AI Support</div>
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
            Ready to Streamline Your Electrical Business?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground" data-testid="text-cta-description">
            Join electrical contractors who trust our platform to manage their operations
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 font-semibold text-[#e5fa00]" data-testid="button-cta-signup">
            <a href="/auth">
              Start Free Trial
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
                  <img src={sparkyLogo} alt="T.G.E. Logo" className="h-10 w-10 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">ElectraPro</span>
                  <span className="text-xs text-muted-foreground">by T.G.E. Billing</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional electrical services management platform for Texas Master Electricians
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Licensed Electrician #750779</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Serving Texas</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Our Commitment</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• We make power easy</li>
                <li>• Lighting your life in any situation</li>
                <li>• Building a business that will build business</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p data-testid="text-copyright">&copy; 2024 T.G.E. Billing - ElectraPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Animated Maintenance Man with AI Pathfinding */}
      <MaintenanceMan enabled={true} />
    </div>
  );
}
