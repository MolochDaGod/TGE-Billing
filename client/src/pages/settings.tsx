import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { CompanySettings } from "@shared/schema";
import { insertCompanySettingsSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Upload, RefreshCw, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AppInstallCard } from "@/components/mobile-app-install-button";

const settingsFormSchema = insertCompanySettingsSchema.extend({
  company_name: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  license_number: z.string().optional(),
  years_in_business: z.coerce.number().int().min(0).optional(),
  tagline: z.string().optional(),
  about: z.string().optional(),
  logo_url: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: settings, isLoading: isSettingsLoading, error: settingsError } = useQuery<CompanySettings>({
    queryKey: ["/api/settings"],
    retry: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to update settings",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const updateSoftwareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/app/update", {});
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Update Started",
        description: data.message || "ElectraPro is updating. The app will refresh automatically in a few moments.",
        duration: 5000,
      });
      // Reload the page after 3 seconds to pick up new version
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update ElectraPro. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      company_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      license_number: "",
      years_in_business: 0,
      tagline: "",
      about: "",
      logo_url: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name || "",
        email: settings.email || "",
        phone: settings.phone || "",
        address: settings.address || "",
        city: settings.city || "",
        state: settings.state || "",
        zip: settings.zip || "",
        license_number: settings.license_number || "",
        years_in_business: settings.years_in_business || 0,
        tagline: settings.tagline || "",
        about: settings.about || "",
        logo_url: settings.logo_url || "",
      });
    }
  }, [settings, form]);

  const handleSubmit = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  if (isAuthLoading || isSettingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const isReadOnly = !isAdmin;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-settings-title">Company Settings</h1>
        <p className="text-muted-foreground">Manage your company information and preferences</p>
      </div>

      {!isAdmin && (
        <Card className="border-muted bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground" data-testid="text-readonly-notice">
              You are viewing settings in read-only mode. Only administrators can edit company settings.
            </p>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Company Logo</CardTitle>
              </div>
              <CardDescription>Upload and manage your company logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                  {settings?.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="Company logo"
                      className="h-full w-full object-contain rounded-lg"
                      data-testid="img-company-logo"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isReadOnly}
                    data-testid="button-upload-logo"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your company's primary contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Acme Electrical Services"
                        disabled={isReadOnly}
                        data-testid="input-company-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="info@acmeelectrical.com"
                          disabled={isReadOnly}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="(281) 416-4454"
                          disabled={isReadOnly}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123 Main Street"
                        disabled={isReadOnly}
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="San Francisco"
                          disabled={isReadOnly}
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
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="CA"
                          disabled={isReadOnly}
                          data-testid="input-state"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="94102"
                          disabled={isReadOnly}
                          data-testid="input-zip"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>Professional credentials and experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="EL-123456"
                          disabled={isReadOnly}
                          data-testid="input-license-number"
                        />
                      </FormControl>
                      <FormDescription>Your electrical contractor license number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="years_in_business"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years in Business</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="15"
                          disabled={isReadOnly}
                          data-testid="input-years-in-business"
                        />
                      </FormControl>
                      <FormDescription>How long you've been operating</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Powering homes and businesses since 2008"
                        disabled={isReadOnly}
                        data-testid="input-tagline"
                      />
                    </FormControl>
                    <FormDescription>A short, memorable phrase about your business</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell potential customers about your company, your expertise, and what makes you unique..."
                        rows={6}
                        disabled={isReadOnly}
                        data-testid="input-about"
                      />
                    </FormControl>
                    <FormDescription>
                      Describe your company's mission, values, and services
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {isAdmin && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          )}
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile App
          </CardTitle>
          <CardDescription>Install T.G.E. PROS on your phone for quick access</CardDescription>
        </CardHeader>
        <CardContent>
          <AppInstallCard />
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Software Updates
          </CardTitle>
          <CardDescription>Keep ElectraPro current with the latest features and security improvements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              ElectraPro automatically checks for updates regularly. You can also manually check for and install updates whenever new features become available.
            </p>
            <p className="text-xs text-muted-foreground">
              Updates are installed safely without interrupting your work. You'll be prompted to refresh when complete.
            </p>
          </div>
          <Button
            onClick={() => updateSoftwareMutation.mutate()}
            disabled={updateSoftwareMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-update-software"
          >
            {updateSoftwareMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking for Updates...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for Updates
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
