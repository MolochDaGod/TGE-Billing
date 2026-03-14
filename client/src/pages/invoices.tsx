import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Invoice, Client, InvoiceItem, Company } from "@shared/schema";
import { insertInvoiceSchema, insertInvoiceItemSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Search, Pencil, Trash2, Eye, DollarSign, X, Send, Download, Zap, ClipboardCheck, Stethoscope, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type InvoiceWithClient = Invoice & { client?: Client; items?: InvoiceItem[] };

const invoiceFormSchema = insertInvoiceSchema
  .omit({ invoice_number: true, created_by: true })
  .extend({
    client_id: z.string().min(1, "Client is required"),
    due_date: z.date().optional(),
    tax_rate: z.string().optional(),
    status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
    items: z.array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.string().min(1, "Quantity is required"),
        unit_price: z.string().min(1, "Unit price is required"),
      })
    ).min(1, "At least one line item is required"),
  });

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

function getStatusColor(status: string) {
  switch (status) {
    case "paid":
      return "default";
    case "sent":
      return "secondary";
    case "draft":
      return "outline";
    case "overdue":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function Invoices() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithClient | null>(null);

  const { data: invoices, isLoading: isInvoicesLoading, error: invoicesError } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const { data: clients, isLoading: isClientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    retry: false,
  });

  const clientsMap = useMemo(() => {
    if (!clients) return new Map();
    return new Map(clients.map(c => [c.id, c]));
  }, [clients]);

  const invoicesWithClients = useMemo(() => {
    if (!invoices) return [];
    return invoices.map(invoice => ({
      ...invoice,
      client: clientsMap.get(invoice.client_id),
    }));
  }, [invoices, clientsMap]);

  const filteredInvoices = useMemo(() => {
    let filtered = invoicesWithClients;

    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        inv =>
          inv.invoice_number.toLowerCase().includes(query) ||
          inv.client?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [invoicesWithClients, statusFilter, searchQuery]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const items = data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2),
      }));

      const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const taxRate = data.tax_rate ? parseFloat(data.tax_rate) : 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;

      const invoiceData = {
        client_id: data.client_id,
        status: data.status,
        subtotal: subtotal.toFixed(2),
        tax_rate: taxRate.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes || "",
        due_date: data.due_date || null,
        items,
      };

      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to create invoices",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InvoiceFormValues }) => {
      const items = data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2),
      }));

      const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const taxRate = data.tax_rate ? parseFloat(data.tax_rate) : 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;

      const invoiceData = {
        client_id: data.client_id,
        status: data.status,
        subtotal: subtotal.toFixed(2),
        tax_rate: taxRate.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes || "",
        due_date: data.due_date || null,
        items,
      };

      const res = await apiRequest("PATCH", `/api/invoices/${id}`, invoiceData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setEditDialogOpen(false);
      setSelectedInvoice(null);
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to update invoices",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/invoices/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to delete invoices",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/invoices/${id}/send`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      const sentVia = [];
      if (data.results?.email?.success) sentVia.push('email');
      if (data.results?.sms?.success) sentVia.push('SMS');
      
      toast({
        title: "Invoice Sent",
        description: sentVia.length > 0 
          ? `Invoice sent via ${sentVia.join(' and ')}`
          : "Invoice sent successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to send invoices",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    },
  });

  const handleViewInvoice = async (invoice: InvoiceWithClient) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoice details");
      const fullInvoice = await res.json();
      setSelectedInvoice(fullInvoice);
      setViewDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    }
  };

  const handleEditInvoice = async (invoice: InvoiceWithClient) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoice details");
      const fullInvoice = await res.json();
      setSelectedInvoice(fullInvoice);
      setEditDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteInvoiceMutation.mutate(id);
    }
  };

  if (isAuthLoading || isInvoicesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (invoicesError && isUnauthorizedError(invoicesError as Error)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>You don't have permission to view invoices.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const canManageInvoices = user?.role === "admin" || user?.role === "employee";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-invoices-title">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices and payments</p>
        </div>
        {canManageInvoices && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-invoice">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Create a new invoice for a client</DialogDescription>
              </DialogHeader>
              <InvoiceForm
                clients={clients || []}
                companies={companies || []}
                onSubmit={(data) => createInvoiceMutation.mutate(data)}
                isSubmitting={createInvoiceMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64"
                data-testid="input-search-invoices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => handleViewInvoice(invoice)}
                      data-testid={`row-invoice-${invoice.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-invoice-number-${invoice.id}`}>
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell data-testid={`text-client-name-${invoice.id}`}>
                        {invoice.client?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)} data-testid={`badge-status-${invoice.id}`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium" data-testid={`text-amount-${invoice.id}`}>
                        ${parseFloat(invoice.total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleViewInvoice(invoice)}
                            data-testid={`button-view-${invoice.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                            data-testid={`button-download-${invoice.id}`}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canManageInvoices && (
                            <>
                              {invoice.status !== 'paid' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                                  disabled={sendInvoiceMutation.isPending}
                                  data-testid={`button-send-${invoice.id}`}
                                  title="Send via Email & SMS"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditInvoice(invoice)}
                                data-testid={`button-edit-${invoice.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {user?.role === "admin" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  data-testid={`button-delete-${invoice.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {invoice.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => window.location.href = `/payment/${invoice.id}`}
                              data-testid={`button-pay-${invoice.id}`}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
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

      {selectedInvoice && (
        <>
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Invoice Details</DialogTitle>
                <DialogDescription>
                  Invoice {selectedInvoice.invoice_number}
                </DialogDescription>
              </DialogHeader>
              <InvoiceDetailView invoice={selectedInvoice} />
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Invoice</DialogTitle>
                <DialogDescription>
                  Update invoice {selectedInvoice.invoice_number}
                </DialogDescription>
              </DialogHeader>
              <InvoiceForm
                clients={clients || []}
                companies={companies || []}
                invoice={selectedInvoice}
                onSubmit={(data) => updateInvoiceMutation.mutate({ id: selectedInvoice.id, data })}
                isSubmitting={updateInvoiceMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function InvoiceForm({
  clients,
  companies,
  invoice,
  onSubmit,
  isSubmitting,
}: {
  clients: Client[];
  companies: Company[];
  invoice?: InvoiceWithClient;
  onSubmit: (data: InvoiceFormValues) => Promise<void> | void;
  isSubmitting: boolean;
}) {
  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: string; unit_price: string }>>(
    invoice?.items?.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) || [{ description: "", quantity: "1", unit_price: "0" }]
  );

  // Quick-start templates
  const applyTemplate = (templateType: 'service_call' | 'inspection' | 'diagnostic') => {
    let newItems: Array<{ description: string; quantity: string; unit_price: string }> = [];
    
    switch (templateType) {
      case 'service_call':
        newItems = [{
          description: "Standard Service Call - Labor",
          quantity: "1",
          unit_price: "190" // Default mid-range hourly rate
        }];
        break;
      case 'inspection':
        newItems = [{
          description: "Electrical Inspection",
          quantity: "1",
          unit_price: "560"
        }];
        break;
      case 'diagnostic':
        newItems = [{
          description: "Diagnostic Service",
          quantity: "1",
          unit_price: "225"
        }];
        break;
    }
    
    setLineItems(newItems);
    form.setValue("items", newItems);
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client_id: invoice?.client_id || "",
      status: (invoice?.status || "draft") as "draft" | "sent" | "paid" | "overdue" | "cancelled",
      tax_rate: invoice?.tax_rate || "0",
      notes: invoice?.notes || "",
      due_date: invoice?.due_date ? new Date(invoice.due_date) : undefined,
      items: lineItems,
    },
  });

  const taxRate = parseFloat(form.watch("tax_rate") || "0");
  
  // Watch all item fields individually to ensure reactivity
  const watchedItems = lineItems.map((_, index) => ({
    quantity: form.watch(`items.${index}.quantity`),
    unit_price: form.watch(`items.${index}.unit_price`),
  }));

  const subtotal = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  }, [watchedItems]);

  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const addLineItem = () => {
    const newItems = [...lineItems, { description: "", quantity: "1", unit_price: "0" }];
    setLineItems(newItems);
    form.setValue("items", newItems);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    form.setValue("items", newItems);
  };

  const handleFormSubmit = async (data: InvoiceFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {!invoice && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Quick Start Templates
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Start with a pre-configured service template
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('service_call')}
                className="flex flex-col items-center gap-1 h-auto py-3"
                data-testid="button-template-service-call"
              >
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Service Call</span>
                <span className="text-[10px] text-muted-foreground">$95-$285/hr</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('inspection')}
                className="flex flex-col items-center gap-1 h-auto py-3"
                data-testid="button-template-inspection"
              >
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Inspection</span>
                <span className="text-[10px] text-muted-foreground">$560</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('diagnostic')}
                className="flex flex-col items-center gap-1 h-auto py-3"
                data-testid="button-template-diagnostic"
              >
                <Stethoscope className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Diagnostic</span>
                <span className="text-[10px] text-muted-foreground">$225</span>
              </Button>
            </div>
          </div>
        )}

        {companies.length > 0 && (
          <FormField
            control={form.control as any}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company (Invoice For)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-company">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control as any}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control as any}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-invoice-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-due-date"
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Line Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem} data-testid="button-add-line-item">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {lineItems.map((_, index) => (
            <div key={index} className="grid gap-4 md:grid-cols-12 items-start border p-4 rounded-md">
              <FormField
                control={form.control as any}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="md:col-span-5">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Item description"
                        {...field}
                        data-testid={`input-description-${index}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Qty</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1"
                        {...field}
                        data-testid={`input-quantity-${index}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name={`items.${index}.unit_price`}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid={`input-unit-price-${index}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 flex flex-col">
                <FormLabel>Amount</FormLabel>
                <div className="h-9 flex items-center font-medium" data-testid={`text-line-amount-${index}`}>
                  ${((parseFloat(form.watch(`items.${index}.quantity`) || "0") * parseFloat(form.watch(`items.${index}.unit_price`) || "0")).toFixed(2))}
                </div>
              </div>

              <div className="md:col-span-1 flex items-end">
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    data-testid={`button-remove-item-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control as any}
            name="tax_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...field}
                    data-testid="input-tax-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium" data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({taxRate}%):</span>
              <span className="font-medium" data-testid="text-tax-amount">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span data-testid="text-total">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <FormField
          control={form.control as any}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes..."
                  {...field}
                  value={field.value || ""}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} data-testid="button-submit-invoice">
            {isSubmitting ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function InvoiceDetailView({ invoice }: { invoice: InvoiceWithClient }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="font-medium">{invoice.client?.name || "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge variant={getStatusColor(invoice.status)}>{invoice.status}</Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created Date</p>
          <p className="font-medium">{format(new Date(invoice.created_at), "PPP")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Due Date</p>
          <p className="font-medium">
            {invoice.due_date ? format(new Date(invoice.due_date), "PPP") : "—"}
          </p>
        </div>
      </div>

      {invoice.items && invoice.items.length > 0 && (
        <div>
          <h3 className="font-medium mb-4">Line Items</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{parseFloat(item.quantity).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${parseFloat(item.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">${parseFloat(invoice.subtotal || "0").toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax ({parseFloat(invoice.tax_rate || "0").toFixed(2)}%):</span>
          <span className="font-medium">${parseFloat(invoice.tax_amount || "0").toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span>${parseFloat(invoice.total || "0").toFixed(2)}</span>
        </div>
      </div>

      {invoice.notes && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Notes</p>
          <p className="text-sm border p-3 rounded-md bg-muted/50">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
