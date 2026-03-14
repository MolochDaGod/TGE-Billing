import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Save, Phone, Mail, Globe, MapPin, Star, ExternalLink } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vendor } from "@shared/schema";
import { Link } from "wouter";

export default function VendorProfile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: vendor, isLoading: isLoadingVendor } = useQuery<Vendor>({
    queryKey: ["/api/vendor/my-profile"],
    retry: false,
    enabled: isAuthenticated,
  });

  const form = useForm({
    defaultValues: {
      name: "",
      legal_name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      service_category: "",
      description: "",
      tagline: "",
      website_url: "",
      license_number: "",
      years_in_business: "",
    },
  });

  useEffect(() => {
    if (vendor) {
      form.reset({
        name: vendor.name || "",
        legal_name: vendor.legal_name || "",
        contact_person: vendor.contact_person || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        city: vendor.city || "",
        state: vendor.state || "",
        zip: vendor.zip || "",
        service_category: vendor.service_category || "",
        description: vendor.description || "",
        tagline: vendor.tagline || "",
        website_url: vendor.website_url || "",
        license_number: vendor.license_number || "",
        years_in_business: vendor.years_in_business?.toString() || "",
      });
    }
  }, [vendor, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      const response = await apiRequest("PATCH", "/api/vendor/my-profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/my-profile"] });
      toast({
        title: "Profile Updated",
        description: "Your vendor profile has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      ...data,
      years_in_business: data.years_in_business ? parseInt(data.years_in_business) : null,
    });
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  if (isLoadingVendor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading your profile...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Vendor Profile Found</h3>
              <p className="text-muted-foreground mb-4">
                You don't have a vendor profile associated with your account yet.
              </p>
              <Link href="/vendor/register">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" data-testid="button-register-vendor">
                  Register as Vendor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="container-vendor-profile">
      <div data-testid="section-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">My Vendor Profile</h1>
              <p className="text-muted-foreground">Manage your business information and public profile</p>
            </div>
          </div>
          {vendor.website_slug && (
            <Link href={`/contractor/${vendor.website_slug}`}>
              <Button variant="outline" className="border-yellow-500/30 text-yellow-400" data-testid="button-view-public">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Website
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="border-yellow-500/20" data-testid="card-profile-stats">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400" data-testid="text-rating">{vendor.rating || '-'}</div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" data-testid="text-years">{vendor.years_in_business || '-'}</div>
              <div className="text-sm text-muted-foreground">Years in Business</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className={`text-sm ${vendor.is_active ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}`} data-testid="badge-status">
                {vendor.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Status</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className={`text-sm ${vendor.bonded ? 'text-blue-400 border-blue-500/30' : 'text-muted-foreground'}`} data-testid="badge-bonded">
                {vendor.bonded ? 'Bonded' : 'Not Bonded'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Insurance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="form-vendor-profile">
        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-business-info">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Your company details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Your Business Name"
                  data-testid="input-business-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input
                  id="legal_name"
                  {...form.register("legal_name")}
                  placeholder="Legal Entity Name"
                  data-testid="input-legal-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  {...form.register("tagline")}
                  placeholder="Your business tagline"
                  data-testid="input-tagline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_category">Service Category</Label>
                <Input
                  id="service_category"
                  {...form.register("service_category")}
                  placeholder="e.g., Electrical, HVAC, Plumbing"
                  data-testid="input-service-category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Describe your services..."
                  className="min-h-[100px]"
                  data-testid="input-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    {...form.register("license_number")}
                    placeholder="License #"
                    data-testid="input-license-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_in_business">Years in Business</Label>
                  <Input
                    id="years_in_business"
                    type="number"
                    {...form.register("years_in_business")}
                    placeholder="Years"
                    data-testid="input-years-business"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-contact-info">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How clients can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  {...form.register("contact_person")}
                  placeholder="Primary Contact Name"
                  data-testid="input-contact-person"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="contact@business.com"
                    className="pl-10"
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="(xxx) xxx-xxxx"
                    className="pl-10"
                    data-testid="input-phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website_url"
                    {...form.register("website_url")}
                    placeholder="https://yourwebsite.com"
                    className="pl-10"
                    data-testid="input-website-url"
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    {...form.register("address")}
                    placeholder="123 Business St"
                    className="pl-10"
                    data-testid="input-address"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    placeholder="City"
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...form.register("state")}
                    placeholder="TX"
                    data-testid="input-state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    {...form.register("zip")}
                    placeholder="12345"
                    data-testid="input-zip"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            type="submit" 
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            disabled={updateMutation.isPending}
            data-testid="button-save-profile"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
