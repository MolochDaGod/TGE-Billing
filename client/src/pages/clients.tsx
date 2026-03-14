import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Client, Invoice, Job } from "@shared/schema";
import { insertClientSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Search, Pencil, Trash2, Eye, Mail, Phone, MapPin, FileText, Calendar, Tag, Star, Users, AlertCircle, DollarSign, Clock, UserPlus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ErrorState, EmptyState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

type ClientWithRelations = Client & { invoices?: Invoice[]; jobs?: Job[] };

const clientFormSchema = insertClientSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function Clients() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null);

  const { data: clients, isLoading: isClientsLoading, error: clientsError } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    retry: false,
  });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    let filtered = clients;
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(client => (client.status || "active") === statusFilter);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        client =>
          client.name.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query) ||
          client.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [clients, searchQuery, statusFilter]);

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to create clients",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientFormValues }) => {
      const res = await apiRequest("PATCH", `/api/clients/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setEditDialogOpen(false);
      setSelectedClient(null);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to update clients",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/clients/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to delete clients",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const handleViewClient = (client: Client) => {
    const clientInvoices = invoices?.filter(inv => inv.client_id === client.id) || [];
    const clientJobs = jobs?.filter(job => job.client_id === client.id) || [];
    setSelectedClient({ ...client, invoices: clientInvoices, jobs: clientJobs });
    setViewDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    if (confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      deleteClientMutation.mutate(id);
    }
  };

  const refetchClients = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
  };

  if (isAuthLoading || isClientsLoading) {
    return <LoadingState variant="table" rows={5} />;
  }

  if (clientsError) {
    if (isUnauthorizedError(clientsError as Error)) {
      return (
        <ErrorState
          variant="unauthorized"
          title="Access Denied"
          description="You don't have permission to view clients. Please contact your administrator."
        />
      );
    }
    return (
      <ErrorState
        title="Failed to Load Clients"
        description="We couldn't load the client list. Please try again."
        error={clientsError as Error}
        onRetry={refetchClients}
      />
    );
  }

  const canManageClients = user?.role === "admin" || user?.role === "employee";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-clients-title">Clients</h1>
          <p className="text-muted-foreground">Manage your client contacts and information</p>
        </div>
        {canManageClients && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-client">
                <Plus className="h-4 w-4 mr-2" />
                Create Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
                <DialogDescription>Add a new client to your database</DialogDescription>
              </DialogHeader>
              <ClientForm
                onSubmit={(data) => createClientMutation.mutate(data)}
                isSubmitting={createClientMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                data-testid="button-filter-all"
              >
                <Users className="h-3 w-3 mr-1" />
                All
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
                data-testid="button-filter-active"
              >
                <Star className="h-3 w-3 mr-1" />
                Active
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "vip" ? "default" : "outline"}
                onClick={() => setStatusFilter("vip")}
                data-testid="button-filter-vip"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                VIP
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "prospect" ? "default" : "outline"}
                onClick={() => setStatusFilter("prospect")}
                data-testid="button-filter-prospect"
              >
                <Clock className="h-3 w-3 mr-1" />
                Prospect
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "inactive" ? "default" : "outline"}
                onClick={() => setStatusFilter("inactive")}
                data-testid="button-filter-inactive"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Inactive
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-96"
                data-testid="input-search-clients"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        icon={Users}
                        title={searchQuery || statusFilter !== 'all' ? "No matching clients" : "No clients yet"}
                        description={
                          searchQuery || statusFilter !== 'all' 
                            ? "Try adjusting your search or filters"
                            : "Start building your client list by adding your first client"
                        }
                        action={canManageClients && !searchQuery ? {
                          label: "Add First Client",
                          onClick: () => setCreateDialogOpen(true),
                          icon: UserPlus
                        } : undefined}
                        secondaryAction={searchQuery || statusFilter !== 'all' ? {
                          label: "Clear Filters",
                          onClick: () => { setSearchQuery(''); setStatusFilter('all'); }
                        } : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => handleViewClient(client)}
                      data-testid={`row-client-${client.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-client-name-${client.id}`}>
                        <div className="space-y-1">
                          <div>{client.name}</div>
                          {client.tags && client.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {client.tags.slice(0, 2).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {client.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{client.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-client-status-${client.id}`}>
                        <Badge 
                          variant={
                            (client.status || "active") === "active" ? "default" :
                            (client.status || "active") === "vip" ? "default" :
                            (client.status || "active") === "prospect" ? "secondary" :
                            "outline"
                          }
                        >
                          {(client.status || "active").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-client-contact-${client.id}`}>
                        <div className="space-y-1 text-sm">
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {client.phone}
                            </div>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-client-location-${client.id}`}>
                        {client.city && client.state ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {client.city}, {client.state}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleViewClient(client)}
                            data-testid={`button-view-${client.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageClients && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditClient(client)}
                                data-testid={`button-edit-${client.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {user?.role === "admin" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteClient(client.id)}
                                  data-testid={`button-delete-${client.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <>
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Client Details</DialogTitle>
                <DialogDescription>View client information and history</DialogDescription>
              </DialogHeader>
              <ClientDetailView client={selectedClient} />
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Client</DialogTitle>
                <DialogDescription>Update client information</DialogDescription>
              </DialogHeader>
              <ClientForm
                client={selectedClient}
                onSubmit={(data) => updateClientMutation.mutate({ id: selectedClient.id, data })}
                isSubmitting={updateClientMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function ClientForm({
  client,
  onSubmit,
  isSubmitting,
}: {
  client?: Client;
  onSubmit: (data: ClientFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      address: client?.address || "",
      city: client?.city || "",
      state: client?.state || "",
      zip: client?.zip || "",
      notes: client?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="John Doe" data-testid="input-client-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="john@example.com" data-testid="input-client-email" />
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
                  <Input {...field} placeholder="(281) 416-4454" data-testid="input-client-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123 Main Street" data-testid="input-client-address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="San Francisco" data-testid="input-client-city" />
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
                  <Input {...field} placeholder="CA" data-testid="input-client-state" />
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
                  <Input {...field} placeholder="94102" data-testid="input-client-zip" />
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional notes about this client..."
                  rows={4}
                  data-testid="input-client-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} data-testid="button-submit-client">
            {isSubmitting ? "Saving..." : client ? "Update Client" : "Create Client"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function ClientDetailView({ client }: { client: ClientWithRelations }) {
  const totalInvoices = client.invoices?.length || 0;
  const totalRevenue = client.invoices?.reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;
  const totalJobs = client.jobs?.length || 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-client-total-invoices">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-client-total-revenue">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-client-total-jobs">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium" data-testid="text-detail-email">{client.email}</p>
              </div>
            </div>

            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium" data-testid="text-detail-phone">{client.phone}</p>
                </div>
              </div>
            )}

            {(client.address || client.city || client.state || client.zip) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <div className="font-medium" data-testid="text-detail-address">
                    {client.address && <p>{client.address}</p>}
                    {(client.city || client.state || client.zip) && (
                      <p>
                        {client.city}
                        {client.city && client.state && ", "}
                        {client.state} {client.zip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {client.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm" data-testid="text-detail-notes">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>
          {client.invoices && client.invoices.length > 0 ? (
            <div className="space-y-3">
              {client.invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                  data-testid={`invoice-item-${invoice.id}`}
                >
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${parseFloat(invoice.total).toFixed(2)}</p>
                    <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className="text-xs">
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
          {client.jobs && client.jobs.length > 0 ? (
            <div className="space-y-3">
              {client.jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                  data-testid={`job-item-${job.id}`}
                >
                  <div>
                    <p className="font-medium">{job.title}</p>
                    {job.scheduled_date && (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(job.scheduled_date), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge variant={job.status === "completed" ? "default" : "secondary"} className="text-xs">
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No jobs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
