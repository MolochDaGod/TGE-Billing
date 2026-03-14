import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { 
  Zap,
  Phone, 
  Mail, 
  MessageSquare,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  Star,
  Loader2
} from "lucide-react";

export default function CustomerPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const submitMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      serviceType: string;
      description: string;
      preferredDate?: string;
      preferredTime?: string;
    }) => {
      const response = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted!",
        description: "We'll contact you within 24 hours to schedule your service. Check your email and phone for confirmation!",
        duration: 5000,
      });
      setServiceType("");
      setDescription("");
      setContactPhone("");
      setPreferredDate("");
      setPreferredTime("");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or call us directly.",
        variant: "destructive",
      });
    },
  });

  const handleServiceRequest = async () => {
    if (!serviceType || !description || !contactName || !contactEmail || !contactPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields to submit your service request.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      serviceType,
      description,
      preferredDate,
      preferredTime,
    });
  };

  const serviceTypes = [
    "Panel Upgrade",
    "Outlet Installation",
    "Ceiling Fan Installation",
    "Lighting Installation",
    "Wiring Repair",
    "Circuit Breaker Issues",
    "EV Charger Installation",
    "Smart Home Setup",
    "Emergency Repair",
    "Electrical Inspection",
    "Commercial Wiring",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]" />
        <div className="relative container mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Texas Master Electrician License #750779</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome to T.G.E. Billing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Professional electrical services in Houston. Request a quote, schedule service, or chat with Sparky AI to learn about our services.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="gap-2" onClick={() => document.getElementById('service-request-form')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-scroll-to-request">
              <MessageSquare className="h-5 w-5" />
              Request Service
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild data-testid="button-call-now">
              <a href="tel:281-416-4454">
                <Phone className="h-5 w-5" />
                Call (281) 416-4454
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Services Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="hover-elevate" data-testid="card-service-residential">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Residential Services</CardTitle>
              <CardDescription>
                Panel upgrades, wiring, outlets, lighting, ceiling fans, and smart home installations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate" data-testid="card-service-commercial">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Commercial Services</CardTitle>
              <CardDescription>
                Office wiring, lighting systems, electrical maintenance, and code compliance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate" data-testid="card-service-emergency">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Emergency Repairs</CardTitle>
              <CardDescription>
                24/7 emergency electrical repairs, power outages, and urgent safety issues
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Service Request Form */}
        <Card className="mb-12" id="service-request-form" data-testid="card-service-request">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Request Electrical Service
            </CardTitle>
            <CardDescription>
              Tell us about your electrical needs and we'll get back to you within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Your Name *</Label>
                <Input
                  id="contact-name"
                  placeholder="John Smith"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  data-testid="input-contact-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Email Address *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="john@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  data-testid="input-contact-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone Number *</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="(281) 416-4454"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  data-testid="input-contact-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-type">Service Type *</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-date">Preferred Date (Optional)</Label>
                <Input
                  id="preferred-date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  data-testid="input-preferred-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-time">Preferred Time (Optional)</Label>
                <Select value={preferredTime} onValueChange={setPreferredTime}>
                  <SelectTrigger data-testid="select-preferred-time">
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                    <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Describe Your Electrical Needs *</Label>
              <Textarea
                id="service-description"
                placeholder="Please describe what electrical work you need done. Include details like location, timeline, and any specific requirements..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="textarea-service-description"
              />
            </div>

            <Button 
              size="lg" 
              className="w-full gap-2"
              onClick={handleServiceRequest}
              disabled={submitMutation.isPending}
              data-testid="button-submit-service-request"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Submit Service Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Why Choose Us */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose T.G.E. Billing?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Star className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Licensed & Insured</CardTitle>
                <CardDescription>
                  Texas Master Electrician with full licensing and insurance coverage
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Quality Work</CardTitle>
                <CardDescription>
                  Committed to excellence and NEC 2023 code compliance on every job
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Fast Response</CardTitle>
                <CardDescription>
                  24-hour response time for quotes and emergency service available
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">AI-Powered</CardTitle>
                <CardDescription>
                  Chat with Sparky AI anytime to learn about services and get instant answers
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Contact Info */}
        <Card data-testid="card-contact-info">
          <CardHeader>
            <CardTitle>Contact Us Directly</CardTitle>
            <CardDescription>
              We're available 7 days a week for your electrical needs
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Phone</p>
                <a href="tel:281-416-4454" className="text-muted-foreground hover:text-primary">(281) 416-4454</a>
                <p className="text-sm text-muted-foreground">Primary Line</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Email</p>
                <a href="mailto:info@tgebilling.pro" className="text-muted-foreground hover:text-primary">info@tgebilling.pro</a>
                <p className="text-sm text-muted-foreground">24-48hr response</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Sparky AI</p>
                <p className="text-muted-foreground">Available 24/7</p>
                <p className="text-sm text-muted-foreground">Click the Sparky button</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
