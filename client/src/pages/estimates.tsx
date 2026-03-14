import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Estimate, Client, EstimateItem, Company } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  Send,
  ArrowRightLeft,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type EstimateWithClient = Estimate & {
  client?: Client;
  items?: EstimateItem[];
};

const estimateFormSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  company_id: z.string().optional(),
  status: z
    .enum(["draft", "sent", "accepted", "rejected", "expired"])
    .default("draft"),
  valid_until: z.date().optional(),
  tax_rate: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.string().min(1, "Quantity is required"),
        unit_price: z.string().min(1, "Unit price is required"),
      })
    )
    .min(1, "At least one line item is required"),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

function getStatusColor(status: string) {
  switch (status) {
    case "accepted":
      return "default";
    case "sent":
      return "secondary";
    case "draft":
      return "outline";
    case "rejected":
      return "destructive";
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function Estimates() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] =
    useState<EstimateWithClient | null>(null);

  const {
    data: estimates,
    isLoading: isEstimatesLoading,
    error: estimatesError,
  } = useQuery<Estimate[]>({
    queryKey: ["/api/estimates"],
    retry: false,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    retry: false,
  });

  const clientsMap = useMemo(() => {
    if (!clients) return new Map();
    return new Map(clients.map((c) => [c.id, c]));
  }, [clients]);

  const estimatesWithClients = useMemo(() => {
    if (!estimates) return [];
    return estimates.map((est) => ({
      ...est,
      client: clientsMap.get(est.client_id),
    }));
  }, [estimates, clientsMap]);

  const filteredEstimates = useMemo(() => {
    let filtered = estimatesWithClients;

    if (statusFilter !== "all") {
      filtered = filtered.filter((est) => est.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (est) =>
          est.estimate_number.toLowerCase().includes(query) ||
          est.client?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [estimatesWithClients, statusFilter, searchQuery]);

  const createEstimateMutation = useMutation({
    mutationFn: async (data: EstimateFormValues) => {
      const items = data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: (
          parseFloat(item.quantity) * parseFloat(item.unit_price)
        ).toFixed(2),
      }));

      const subtotal = items.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );
      const taxRate = data.tax_rate ? parseFloat(data.tax_rate) : 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;

      const estimateData = {
        client_id: data.client_id,
        company_id: data.company_id || undefined,
        status: data.status,
        subtotal: subtotal.toFixed(2),
        tax_rate: taxRate.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes || "",
        valid_until: data.valid_until || null,
        items,
      };

      const res = await apiRequest("POST", "/api/estimates", estimateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      setCreateDialogOpen(false);
      toast({ title: "Success", description: "Estimate created successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to create estimates",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create estimate",
        variant: "destructive",
      });
    },
  });

  const updateEstimateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: EstimateFormValues;
    }) => {
      const items = data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: (
          parseFloat(item.quantity) * parseFloat(item.unit_price)
        ).toFixed(2),
      }));

      const subtotal = items.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );
      const taxRate = data.tax_rate ? parseFloat(data.tax_rate) : 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;

      const estimateData = {
        client_id: data.client_id,
        company_id: data.company_id || undefined,
        status: data.status,
        subtotal: subtotal.toFixed(2),
        tax_rate: taxRate.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes || "",
        valid_until: data.valid_until || null,
        items,
      };

      const res = await apiRequest(
        "PATCH",
        `/api/estimates/${id}`,
        estimateData
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      setEditDialogOpen(false);
      setSelectedEstimate(null);
      toast({ title: "Success", description: "Estimate updated successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to update estimates",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update estimate",
        variant: "destructive",
      });
    },
  });

  const deleteEstimateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/estimates/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({ title: "Success", description: "Estimate deleted successfully" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to delete estimates",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete estimate",
        variant: "destructive",
      });
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(
        "POST",
        `/api/estimates/${id}/convert-to-invoice`
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Converted to Invoice",
        description: `Estimate ${data.estimate_number} converted to invoice ${data.invoice?.invoice_number}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to convert estimate to invoice",
        variant: "destructive",
      });
    },
  });

  const handleViewEstimate = async (estimate: EstimateWithClient) => {
    try {
      const res = await fetch(`/api/estimates/${estimate.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch estimate details");
      const fullEstimate = await res.json();
      setSelectedEstimate(fullEstimate);
      setViewDialogOpen(true);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load estimate details",
        variant: "destructive",
      });
    }
  };

  const handleEditEstimate = async (estimate: EstimateWithClient) => {
    try {
      const res = await fetch(`/api/estimates/${estimate.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch estimate details");
      const fullEstimate = await res.json();
      setSelectedEstimate(fullEstimate);
      setEditDialogOpen(true);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load estimate details",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEstimate = (id: string) => {
    if (confirm("Are you sure you want to delete this estimate?")) {
      deleteEstimateMutation.mutate(id);
    }
  };

  if (isAuthLoading || isEstimatesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (estimatesError && isUnauthorizedError(estimatesError as Error)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>
            You don't have permission to view estimates.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const canManageEstimates =
    user?.role === "admin" ||
    user?.role === "pirate_king" ||
    user?.role === "employee" ||
    user?.role === "partner" ||
    user?.role === "vendor";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estimates</h1>
          <p className="text-muted-foreground">
            Create and manage project estimates
          </p>
        </div>
        {canManageEstimates && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Estimate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Estimate</DialogTitle>
                <DialogDescription>
                  Create a new estimate for a client
                </DialogDescription>
              </DialogHeader>
              <EstimateForm
                clients={clients || []}
                companies={companies || []}
                onSubmit={(data) => createEstimateMutation.mutate(data)}
                isSubmitting={createEstimateMutation.isPending}
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
                placeholder="Search by estimate number or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No estimates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEstimates.map((estimate) => (
                    <TableRow
                      key={estimate.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => handleViewEstimate(estimate)}
                    >
                      <TableCell className="font-medium">
                        {estimate.estimate_number}
                      </TableCell>
                      <TableCell>
                        {estimate.client?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(estimate.created_at),
                          "MMM dd, yyyy"
                        )}
                      </TableCell>
                      <TableCell>
                        {estimate.valid_until
                          ? format(
                              new Date(estimate.valid_until),
                              "MMM dd, yyyy"
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(estimate.status)}>
                          {estimate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${parseFloat(estimate.total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleViewEstimate(estimate)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageEstimates && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditEstimate(estimate)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!estimate.converted_to_invoice_id &&
                                estimate.status !== "rejected" &&
                                estimate.status !== "expired" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                      convertToInvoiceMutation.mutate(
                                        estimate.id
                                      )
                                    }
                                    disabled={
                                      convertToInvoiceMutation.isPending
                                    }
                                    title="Convert to Invoice"
                                  >
                                    <ArrowRightLeft className="h-4 w-4" />
                                  </Button>
                                )}
                              {user?.role === "admin" ||
                              user?.role === "pirate_king" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteEstimate(estimate.id)
                                  }
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
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

      {selectedEstimate && (
        <>
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Estimate Details</DialogTitle>
                <DialogDescription>
                  Estimate {selectedEstimate.estimate_number}
                </DialogDescription>
              </DialogHeader>
              <EstimateDetailView
                estimate={selectedEstimate}
                clientsMap={clientsMap}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Estimate</DialogTitle>
                <DialogDescription>
                  Update estimate {selectedEstimate.estimate_number}
                </DialogDescription>
              </DialogHeader>
              <EstimateForm
                clients={clients || []}
                companies={companies || []}
                estimate={selectedEstimate}
                onSubmit={(data) =>
                  updateEstimateMutation.mutate({
                    id: selectedEstimate.id,
                    data,
                  })
                }
                isSubmitting={updateEstimateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function EstimateForm({
  clients,
  companies,
  estimate,
  onSubmit,
  isSubmitting,
}: {
  clients: Client[];
  companies: Company[];
  estimate?: EstimateWithClient;
  onSubmit: (data: EstimateFormValues) => Promise<void> | void;
  isSubmitting: boolean;
}) {
  const [lineItems, setLineItems] = useState<
    Array<{ description: string; quantity: string; unit_price: string }>
  >(
    estimate?.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) || [{ description: "", quantity: "1", unit_price: "0" }]
  );

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      client_id: estimate?.client_id || "",
      company_id: estimate?.company_id || "",
      status: (estimate?.status || "draft") as any,
      tax_rate: estimate?.tax_rate || "0",
      notes: estimate?.notes || "",
      valid_until: estimate?.valid_until
        ? new Date(estimate.valid_until)
        : undefined,
      items: lineItems,
    },
  });

  const taxRate = parseFloat(form.watch("tax_rate") || "0");

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
    const newItems = [
      ...lineItems,
      { description: "", quantity: "1", unit_price: "0" },
    ];
    setLineItems(newItems);
    form.setValue("items", newItems);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    form.setValue("items", newItems);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => await onSubmit(data))}
        className="space-y-6"
      >
        {companies.length > 0 && (
          <FormField
            control={form.control as any}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
                  <SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="valid_until"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Until</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {lineItems.map((_, index) => (
            <div
              key={index}
              className="grid gap-4 md:grid-cols-12 items-start border p-4 rounded-md"
            >
              <FormField
                control={form.control as any}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="md:col-span-5">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Item description" {...field} />
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 flex flex-col">
                <FormLabel>Amount</FormLabel>
                <div className="h-9 flex items-center font-medium">
                  $
                  {(
                    (parseFloat(
                      form.watch(`items.${index}.quantity`) || "0"
                    ) || 0) *
                    (parseFloat(
                      form.watch(`items.${index}.unit_price`) || "0"
                    ) || 0)
                  ).toFixed(2)}
                </div>
              </div>

              <div className="md:col-span-1 flex items-end">
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Tax ({taxRate}%):
              </span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : estimate
                ? "Update Estimate"
                : "Create Estimate"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EstimateDetailView({
  estimate,
  clientsMap,
}: {
  estimate: EstimateWithClient;
  clientsMap: Map<string, Client>;
}) {
  const client = estimate.client || clientsMap.get(estimate.client_id);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="font-medium">{client?.name || "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge variant={getStatusColor(estimate.status)}>
            {estimate.status}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created Date</p>
          <p className="font-medium">
            {format(new Date(estimate.created_at), "PPP")}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Valid Until</p>
          <p className="font-medium">
            {estimate.valid_until
              ? format(new Date(estimate.valid_until), "PPP")
              : "—"}
          </p>
        </div>
        {estimate.converted_to_invoice_id && (
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">
              Converted to Invoice
            </p>
            <Badge variant="default">
              <FileText className="h-3 w-3 mr-1" />
              Converted
            </Badge>
          </div>
        )}
      </div>

      {estimate.items && estimate.items.length > 0 && (
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
                {estimate.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${parseFloat(item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${parseFloat(item.amount).toFixed(2)}
                    </TableCell>
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
          <span className="font-medium">
            ${parseFloat(estimate.subtotal || "0").toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Tax ({parseFloat(estimate.tax_rate || "0").toFixed(2)}%):
          </span>
          <span className="font-medium">
            ${parseFloat(estimate.tax_amount || "0").toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span>${parseFloat(estimate.total || "0").toFixed(2)}</span>
        </div>
      </div>

      {estimate.notes && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Notes</p>
          <p className="text-sm border p-3 rounded-md bg-muted/50">
            {estimate.notes}
          </p>
        </div>
      )}
    </div>
  );
}
