import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVendorSchema, type Vendor, type InsertVendor } from "@shared/schema";
import { Building2, Wind, Wrench, Zap, Phone, Mail, Award, Plus, ExternalLink, Edit, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Vendors() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors'],
  });

  const vendorMutation = useMutation({
    mutationFn: async (data: InsertVendor) => {
      if (editingVendor) {
        return apiRequest(`/api/vendors/${editingVendor.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest('/api/vendors', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      setIsDialogOpen(false);
      setEditingVendor(null);
      toast({
        title: editingVendor ? "Vendor Updated" : "Vendor Added",
        description: editingVendor ? "The vendor has been updated successfully." : "The new vendor has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertVendor>({
    resolver: zodResolver(insertVendorSchema),
    defaultValues: {
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      service_category: "",
      description: "",
      certifications: [],
      services: [],
      website_url: "",
      bids_url: "",
      contracts_url: "",
      coi_url: "",
      rating: undefined,
      notes: "",
      is_active: true,
    },
  });

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      form.reset({
        name: vendor.name,
        contact_person: vendor.contact_person || "",
        email: vendor.email || "",
        phone: vendor.phone,
        address: vendor.address || "",
        service_category: vendor.service_category,
        description: vendor.description || "",
        certifications: vendor.certifications || [],
        services: vendor.services || [],
        website_url: vendor.website_url || "",
        bids_url: vendor.bids_url || "",
        contracts_url: vendor.contracts_url || "",
        coi_url: vendor.coi_url || "",
        rating: vendor.rating || undefined,
        notes: vendor.notes || "",
        is_active: vendor.is_active ?? true,
      });
    } else {
      setEditingVendor(null);
      form.reset({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        service_category: "",
        description: "",
        certifications: [],
        services: [],
        website_url: "",
        bids_url: "",
        contracts_url: "",
        coi_url: "",
        rating: undefined,
        notes: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: InsertVendor) => {
    // Convert comma-separated strings to arrays
    const formattedData = {
      ...data,
      certifications: typeof data.certifications === 'string' 
        ? data.certifications.split(',').map(s => s.trim()).filter(Boolean)
        : data.certifications || [],
      services: typeof data.services === 'string'
        ? data.services.split(',').map(s => s.trim()).filter(Boolean)
        : data.services || [],
    };
    vendorMutation.mutate(formattedData);
  };

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('hvac') || lower.includes('heating')) return Wind;
    if (lower.includes('electrical')) return Zap;
    return Wrench;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Our Trusted Vendors</h1>
            <p className="text-muted-foreground">
              Professional partners we work with to deliver exceptional service to our clients.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Our Trusted Vendors</h1>
          <p className="text-muted-foreground">
            Professional partners we work with to deliver exceptional service to our clients.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-vendor">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
              <DialogDescription>
                {editingVendor ? 'Update vendor information below.' : 'Add a new trusted vendor to your directory.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-vendor-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Category *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., HVAC, Plumbing" data-testid="input-service-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-contact-person" />
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
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
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
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifications (comma-separated)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="EPA Universal Approved, Licensed Professionals"
                          data-testid="input-certifications"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="services"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Services Offered (comma-separated)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Commercial HVAC, New Home Installation"
                          data-testid="input-services"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://" data-testid="input-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating (1-5)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="5" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-rating"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={vendorMutation.isPending} data-testid="button-save-vendor">
                    {vendorMutation.isPending ? "Saving..." : editingVendor ? "Update Vendor" : "Add Vendor"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => {
          const CategoryIcon = getCategoryIcon(vendor.service_category);
          return (
            <Card key={vendor.id} className="hover-elevate overflow-hidden" data-testid={`card-vendor-${vendor.id}`}>
              {/* Logo/Banner Header */}
              {vendor.logo_url && (
                <div className="h-24 bg-[#1a1a1a] flex items-center justify-center p-4 border-b border-border/50">
                  <img 
                    src={vendor.logo_url} 
                    alt={`${vendor.name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start gap-3 mb-2">
                  {!vendor.logo_url && (
                    <div className="p-3 rounded-lg bg-primary/10">
                      <CategoryIcon className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl mb-1">{vendor.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(vendor)}
                        data-testid={`button-edit-${vendor.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {vendor.service_category}
                    </CardDescription>
                    {vendor.tagline && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{vendor.tagline}"</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.description && (
                  <p className="text-sm text-muted-foreground">{vendor.description}</p>
                )}

                <div className="space-y-2">
                  {vendor.contact_person && (
                    <div className="text-sm">
                      <span className="font-medium">Contact:</span> {vendor.contact_person}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <a 
                      href={`tel:${vendor.phone}`} 
                      className="text-primary hover:underline"
                      data-testid={`link-phone-${vendor.id}`}
                    >
                      {vendor.phone}
                    </a>
                  </div>
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-primary" />
                      <a 
                        href={`mailto:${vendor.email}`} 
                        className="text-primary hover:underline truncate"
                        data-testid={`link-email-${vendor.id}`}
                      >
                        {vendor.email}
                      </a>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 mt-0.5 text-primary" />
                      <span>
                        {vendor.address}
                        {vendor.city && `, ${vendor.city}`}
                        {vendor.state && ` ${vendor.state}`}
                        {vendor.zip && ` ${vendor.zip}`}
                      </span>
                    </div>
                  )}
                  {vendor.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <a 
                        href={vendor.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                        data-testid={`link-website-${vendor.id}`}
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {vendor.certifications && vendor.certifications.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Certifications:</p>
                    {vendor.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <Award className="h-3 w-3 text-yellow-500" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                )}

                {vendor.rating && (
                  <div className="flex items-center gap-1 pt-2 border-t">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-medium">{vendor.rating}/5</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {vendors.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Vendors Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start building your trusted vendor directory by adding your first vendor.
            </p>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-first-vendor">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vendor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
