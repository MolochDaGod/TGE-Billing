import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  FileCheck, 
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap
} from "lucide-react";
import tgeLogo from "@assets/tgelogo_1763888346781.webp";

const SERVICE_CATEGORIES = [
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC & Heating" },
  { value: "plumbing", label: "Plumbing" },
  { value: "roofing", label: "Roofing" },
  { value: "general_contractor", label: "General Contractor" },
  { value: "painting", label: "Painting" },
  { value: "flooring", label: "Flooring" },
  { value: "landscaping", label: "Landscaping" },
  { value: "security", label: "Security Systems" },
  { value: "solar", label: "Solar Installation" },
  { value: "other", label: "Other" },
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const vendorRegistrationSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  legal_name: z.string().optional(),
  contact_person: z.string().min(2, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  service_category: z.string().min(1, "Service category is required"),
  description: z.string().min(20, "Please provide a brief description of your services"),
  services: z.array(z.string()).min(1, "At least one service is required"),
  service_areas: z.array(z.string()).optional(),
  license_number: z.string().optional(),
  license_state: z.string().optional(),
  years_in_business: z.number().min(0).optional(),
  certifications: z.array(z.string()).optional(),
  bonded: z.boolean().default(false),
  website_url: z.string().url().optional().or(z.literal("")),
  tagline: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
  terms_accepted: z.boolean().refine(val => val === true, "You must accept the terms"),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type VendorRegistrationData = z.infer<typeof vendorRegistrationSchema>;

const STEPS = [
  { id: 1, title: "Business Info", icon: Building2 },
  { id: 2, title: "Services", icon: Briefcase },
  { id: 3, title: "Credentials", icon: Shield },
  { id: 4, title: "Account", icon: User },
];

export default function VendorRegister() {
  const [currentStep, setCurrentStep] = useState(1);
  const [servicesInput, setServicesInput] = useState("");
  const [areasInput, setAreasInput] = useState("");
  const [certsInput, setCertsInput] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<VendorRegistrationData>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      name: "",
      legal_name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "Texas",
      zip: "",
      service_category: "",
      description: "",
      services: [],
      service_areas: [],
      license_number: "",
      license_state: "Texas",
      years_in_business: 0,
      certifications: [],
      bonded: false,
      website_url: "",
      tagline: "",
      password: "",
      confirm_password: "",
      terms_accepted: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: VendorRegistrationData) => {
      const response = await apiRequest("POST", "/api/vendor/register", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted!",
        description: "Your application is under review. We'll contact you within 24-48 hours.",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const addService = () => {
    if (servicesInput.trim()) {
      const current = form.getValues("services") || [];
      form.setValue("services", [...current, servicesInput.trim()]);
      setServicesInput("");
    }
  };

  const removeService = (index: number) => {
    const current = form.getValues("services") || [];
    form.setValue("services", current.filter((_, i) => i !== index));
  };

  const addArea = () => {
    if (areasInput.trim()) {
      const current = form.getValues("service_areas") || [];
      form.setValue("service_areas", [...current, areasInput.trim()]);
      setAreasInput("");
    }
  };

  const removeArea = (index: number) => {
    const current = form.getValues("service_areas") || [];
    form.setValue("service_areas", current.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    if (certsInput.trim()) {
      const current = form.getValues("certifications") || [];
      form.setValue("certifications", [...current, certsInput.trim()]);
      setCertsInput("");
    }
  };

  const removeCertification = (index: number) => {
    const current = form.getValues("certifications") || [];
    form.setValue("certifications", current.filter((_, i) => i !== index));
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof VendorRegistrationData)[] => {
    switch (step) {
      case 1:
        return ["name", "contact_person", "email", "phone", "address", "city", "state", "zip"];
      case 2:
        return ["service_category", "description", "services"];
      case 3:
        return [];
      case 4:
        return ["password", "confirm_password", "terms_accepted"];
      default:
        return [];
    }
  };

  const onSubmit = (data: VendorRegistrationData) => {
    registerMutation.mutate(data);
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-yellow-400 bg-clip-text text-transparent">
                T.G.E. PROS
              </h1>
              <p className="text-muted-foreground">Contractor Network</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Join Our Network</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Register as a trusted contractor and get access to our CRM tools, 
            client management, and your own professional website.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step) => (
              <div 
                key={step.id}
                className={`flex flex-col items-center gap-2 flex-1 ${
                  step.id === currentStep 
                    ? "text-primary" 
                    : step.id < currentStep 
                    ? "text-primary/60" 
                    : "text-muted-foreground"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step.id === currentStep 
                    ? "border-primary bg-primary/10" 
                    : step.id < currentStep 
                    ? "border-primary/60 bg-primary/20" 
                    : "border-muted"
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <Building2 className="h-5 w-5 text-primary" />}
              {currentStep === 2 && <Briefcase className="h-5 w-5 text-primary" />}
              {currentStep === 3 && <Shield className="h-5 w-5 text-primary" />}
              {currentStep === 4 && <User className="h-5 w-5 text-primary" />}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your business"}
              {currentStep === 2 && "What services do you offer?"}
              {currentStep === 3 && "Your professional credentials"}
              {currentStep === 4 && "Create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ABC Electrical Services" 
                                {...field} 
                                data-testid="input-business-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="legal_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Business Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ABC Electrical Services LLC" 
                                {...field} 
                                data-testid="input-legal-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contact_person"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Smith" 
                                {...field} 
                                data-testid="input-contact-person"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="contact@abcelectrical.com" 
                                {...field} 
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="(281) 416-4454" 
                              {...field} 
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123 Main Street" 
                              {...field} 
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Houston" 
                                {...field} 
                                data-testid="input-city"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>State *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-state">
                                  <SelectValue placeholder="State" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {US_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>ZIP *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="77001" 
                                {...field} 
                                data-testid="input-zip"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="service_category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Service Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select your main service type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SERVICE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about your business, experience, and what makes you stand out..."
                              className="min-h-[100px]"
                              {...field} 
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormDescription>
                            This will appear on your public profile
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tagline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tagline</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Quality work, every time" 
                              {...field} 
                              data-testid="input-tagline"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <Label>Services Offered *</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="e.g., Panel Upgrades, Rewiring, Inspections"
                          value={servicesInput}
                          onChange={(e) => setServicesInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                          data-testid="input-service"
                        />
                        <Button type="button" onClick={addService} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(form.watch("services") || []).map((service, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {service}
                            <button
                              type="button"
                              onClick={() => removeService(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      {form.formState.errors.services && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.services.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Service Areas</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="e.g., Houston, Katy, Sugar Land"
                          value={areasInput}
                          onChange={(e) => setAreasInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addArea())}
                          data-testid="input-area"
                        />
                        <Button type="button" onClick={addArea} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(form.watch("service_areas") || []).map((area, index) => (
                          <Badge key={index} variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {area}
                            <button
                              type="button"
                              onClick={() => removeArea(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="license_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., TECL12345" 
                                {...field} 
                                data-testid="input-license"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="license_state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License State</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-license-state">
                                  <SelectValue placeholder="State" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {US_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="years_in_business"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years in Business</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="5" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-years"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <Label>Certifications</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="e.g., Master Electrician, EPA Certified"
                          value={certsInput}
                          onChange={(e) => setCertsInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                          data-testid="input-certification"
                        />
                        <Button type="button" onClick={addCertification} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(form.watch("certifications") || []).map((cert, index) => (
                          <Badge key={index} className="gap-1 bg-primary/10 text-primary border-primary/20">
                            <FileCheck className="h-3 w-3" />
                            {cert}
                            <button
                              type="button"
                              onClick={() => removeCertification(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="bonded"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-bonded"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Bonded & Insured</FormLabel>
                            <FormDescription>
                              Check if your business is bonded and insured
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Website (if any)</FormLabel>
                          <FormControl>
                            <Input 
                              type="url"
                              placeholder="https://www.yourwebsite.com" 
                              {...field} 
                              data-testid="input-website"
                            />
                          </FormControl>
                          <FormDescription>
                            We'll create a professional profile page for you in our network
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">What You'll Get</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Professional contractor profile page
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Client management CRM tools
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Invoice and job tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Access to T.G.E. PROS network
                        </li>
                      </ul>
                    </div>

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a secure password" 
                              {...field} 
                              data-testid="input-password"
                            />
                          </FormControl>
                          <FormDescription>
                            At least 8 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm your password" 
                              {...field} 
                              data-testid="input-confirm-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms_accepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-terms"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the Terms of Service and Privacy Policy *
                            </FormLabel>
                            <FormDescription>
                              By registering, you agree to our contractor network terms
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    data-testid="button-prev-step"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      data-testid="button-next-step"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="button-submit-registration"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already registered?{" "}
          <a href="/auth" className="text-primary hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
