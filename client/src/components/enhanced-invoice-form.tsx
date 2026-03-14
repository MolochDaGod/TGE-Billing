import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Invoice, Client, Part } from "@shared/schema";
import { insertInvoiceSchema } from "@shared/schema";
import { debounce } from "lodash-es";
import { Plus, X, Calendar as CalendarIcon, Upload, Zap, CloudUpload, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const invoiceFormSchema = insertInvoiceSchema
  .omit({ invoice_number: true, created_by: true })
  .extend({
    client_id: z.string().min(1, "Client is required"),
    invoice_date: z.date().optional(),
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
    logo_url: z.string().optional(),
    images: z.array(z.string()).optional(),
  });

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface EnhancedInvoiceFormProps {
  invoice?: Invoice;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EnhancedInvoiceForm({ invoice, onSuccess, onCancel }: EnhancedInvoiceFormProps) {
  const { toast } = useToast();
  const [savedDraftId, setSavedDraftId] = useState<string | null>(invoice?.id || null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showPartsDialog, setShowPartsDialog] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch clients
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch parts catalog
  const { data: parts } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
  });

  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: string; unit_price: string }>>(
    invoice?.items?.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) || [{ description: "", quantity: "1", unit_price: "0" }]
  );

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client_id: invoice?.client_id || "",
      status: (invoice?.status || "draft") as any,
      invoice_date: invoice?.invoice_date ? new Date(invoice.invoice_date) : new Date(),
      tax_rate: invoice?.tax_rate || "8.25",
      notes: invoice?.notes || "",
      due_date: invoice?.due_date ? new Date(invoice.due_date) : undefined,
      items: lineItems,
      logo_url: "",
      images: [],
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

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const items = data.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2),
      }));

      const invoiceData = {
        id: savedDraftId,
        client_id: data.client_id,
        status: 'draft',
        invoice_date: data.invoice_date || new Date(),
        subtotal: subtotal.toFixed(2),
        tax_rate: taxRate.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes || "",
        due_date: data.due_date || null,
        items,
      };

      const res = await apiRequest("POST", "/api/invoices/auto-save", invoiceData);
      return await res.json();
    },
    onSuccess: (data) => {
      setSavedDraftId(data.id);
      setLastSaved(new Date());
    },
  });

  // Debounced auto-save
  const debouncedAutoSave = useCallback(
    debounce((values: InvoiceFormValues) => {
      if (values.client_id && values.items.length > 0) {
        autoSaveMutation.mutate(values);
      }
    }, 2000),
    [savedDraftId, subtotal, taxAmount, total]
  );

  // Watch form changes for auto-save
  useEffect(() => {
    const subscription = form.watch((values) => {
      debouncedAutoSave(values as InvoiceFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedAutoSave]);

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "invoice");
      if (savedDraftId) {
        formData.append("invoice_id", savedDraftId);
      }

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  // Upload to Google Drive mutation
  const uploadToDriveMutation = useMutation({
    mutationFn: async () => {
      if (!savedDraftId) {
        throw new Error("Save invoice first");
      }
      const res = await apiRequest("POST", `/api/invoices/${savedDraftId}/upload-to-drive`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Invoice PDF uploaded to Google Drive",
      });
      window.open(data.fileUrl, "_blank");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload to Google Drive",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingFile(true);
      try {
        await uploadFileMutation.mutateAsync(file);
      } finally {
        setUploadingFile(false);
      }
    }
  };

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

  const addPartToLineItem = (part: Part) => {
    if (selectedLineIndex !== null) {
      const newItems = [...lineItems];
      newItems[selectedLineIndex] = {
        description: `${part.name} - ${part.description || ''}`,
        quantity: "1",
        unit_price: part.unit_price,
      };
      setLineItems(newItems);
      form.setValue("items", newItems);
      setShowPartsDialog(false);
      setSelectedLineIndex(null);
    }
  };

  const handleSparkyAssist = () => {
    toast({
      title: "Sparky AI",
      description: "Click the AI assistant button in the bottom right corner for help with this invoice!",
    });
  };

  const finalSubmit = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const items = data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2),
      }));

      const invoiceData = {
        client_id: data.client_id,
        status: data.status,
        invoice_date: data.invoice_date || new Date(),
        subtotal: subtotal.toFixed(2),
        tax_rate: taxRate.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes || "",
        due_date: data.due_date || null,
        items,
      };

      if (savedDraftId) {
        const res = await apiRequest("PATCH", `/api/invoices/${savedDraftId}`, invoiceData);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/invoices", invoiceData);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice saved successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => finalSubmit.mutate(data))} className="space-y-6">
        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Draft auto-saved at {format(lastSaved, "h:mm a")}
            </Badge>
          </div>
        )}

        {/* Client Selection */}
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
                  {clients?.map((client) => (
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

        {/* Invoice Date and Status Row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="invoice_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Date (Invoice Date)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-invoice-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : "Pick work date"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Due Date */}
        <FormField
          control={form.control as any}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      data-testid="button-due-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Pick due date"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Line Items with Parts Catalog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Line Items</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
              data-testid="button-add-line-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {lineItems.map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-2">
                      <FormField
                        control={form.control as any}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Description"
                                data-testid={`input-description-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLineIndex(index);
                          setShowPartsDialog(true);
                        }}
                        data-testid={`button-select-part-${index}`}
                      >
                        Parts
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="1"
                                min="1"
                                placeholder="Quantity"
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
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Unit Price"
                                data-testid={`input-unit-price-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    data-testid={`button-remove-item-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tax Rate and Totals */}
        <div className="space-y-4">
          <FormField
            control={form.control as any}
            name="tax_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="8.25"
                    data-testid="input-tax-rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold" data-testid="text-subtotal">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%):</span>
                <span className="font-semibold" data-testid="text-tax">
                  ${taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span data-testid="text-total">${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <FormField
          control={form.control as any}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional notes..."
                  rows={3}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload Section */}
        <div className="space-y-4">
          <FormLabel>Attachments</FormLabel>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("logo-upload")?.click()}
              disabled={uploadingFile}
              data-testid="button-upload-logo"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Upload Logo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={uploadingFile}
              data-testid="button-upload-image"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSparkyAssist}
              data-testid="button-sparky-assist"
            >
              <Zap className="h-4 w-4 mr-2" />
              Ask Sparky
            </Button>
            {savedDraftId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => uploadToDriveMutation.mutate()}
                disabled={uploadToDriveMutation.isPending}
                data-testid="button-upload-drive"
              >
                <CloudUpload className="h-4 w-4 mr-2" />
                {uploadToDriveMutation.isPending ? "Uploading..." : "Upload to Drive"}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={finalSubmit.isPending}
              data-testid="button-submit"
            >
              {finalSubmit.isPending ? "Saving..." : "Save Invoice"}
            </Button>
          </div>
        </div>
      </form>

      {/* Parts Catalog Dialog */}
      <Dialog open={showPartsDialog} onOpenChange={setShowPartsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Part</DialogTitle>
            <DialogDescription>
              Choose a part from your catalog to add to this line item
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {parts?.map((part) => (
              <Card
                key={part.id}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => addPartToLineItem(part)}
                data-testid={`card-part-${part.id}`}
              >
                <CardContent className="p-4 flex gap-4">
                  {part.image_url && (
                    <img
                      src={part.image_url}
                      alt={part.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{part.name}</h4>
                    <p className="text-sm text-muted-foreground">{part.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="secondary">{part.category}</Badge>
                      <span className="font-semibold">${parseFloat(part.unit_price).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
