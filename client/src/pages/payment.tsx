import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice, Client, InvoiceItem } from "@shared/schema";
import { format } from "date-fns";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

type InvoiceDetails = Invoice & {
  items?: InvoiceItem[];
  client?: Client;
};

function PaymentForm({ invoice }: { invoice: InvoiceDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/invoices/${invoice.id}/payment-intent`, {});
      return await res.json();
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: {
      invoice_id: string;
      stripe_payment_intent_id: string;
      amount: string;
      status: string;
      payment_method: string;
    }) => {
      const res = await apiRequest("POST", "/api/payments", data);
      return await res.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { clientSecret } = await createPaymentIntentMutation.mutateAsync();

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setPaymentError(error.message || "Payment failed");
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred while processing your payment",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        await createPaymentMutation.mutateAsync({
          invoice_id: invoice.id,
          stripe_payment_intent_id: paymentIntent.id,
          amount: invoice.total,
          status: "succeeded",
          payment_method: "card",
        });

        setPaymentSuccess(true);
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully",
        });

        setTimeout(() => {
          setLocation("/invoices");
        }, 2000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setPaymentError(message);
      toast({
        title: "Payment Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <Card data-testid="card-payment-success">
        <CardContent className="pt-6" data-testid="container-payment-success-content">
          <div className="flex flex-col items-center gap-4 py-8" data-testid="container-success-message">
            <CheckCircle2 className="h-16 w-16 text-green-600" data-testid="icon-success" />
            <h3 className="text-2xl font-semibold" data-testid="text-success-title">Payment Successful!</h3>
            <p className="text-muted-foreground text-center" data-testid="text-success-message">
              Your payment has been processed. Redirecting to invoices...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-payment-form">
      <CardHeader data-testid="container-payment-form-header">
        <CardTitle className="flex items-center gap-2" data-testid="text-payment-form-title">
          <CreditCard className="h-5 w-5" data-testid="icon-credit-card" />
          Payment Details
        </CardTitle>
        <CardDescription data-testid="text-payment-form-description">
          Enter your card information to complete the payment
        </CardDescription>
      </CardHeader>
      <CardContent data-testid="container-payment-form-content">
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-payment">
          <div className="rounded-lg border p-4" data-testid="container-card-element">
            <CardElement
              data-testid="input-card-element"
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "hsl(var(--foreground))",
                    "::placeholder": {
                      color: "hsl(var(--muted-foreground))",
                    },
                  },
                  invalid: {
                    color: "hsl(var(--destructive))",
                  },
                },
              }}
            />
          </div>

          {paymentError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive" data-testid="alert-payment-error">
              <AlertCircle className="h-5 w-5" data-testid="icon-error-alert" />
              <p className="text-sm" data-testid="text-error-message">{paymentError}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || isProcessing}
            data-testid="button-submit-payment"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="icon-processing" />
                <span data-testid="text-processing">Processing...</span>
              </>
            ) : (
              <span data-testid="text-pay-amount">Pay ${parseFloat(invoice.total).toFixed(2)}</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Payment() {
  const [match, params] = useRoute("/payment/:invoiceId");
  const { toast } = useToast();
  const invoiceId = params?.invoiceId;

  const { data: invoice, isLoading, error } = useQuery<InvoiceDetails>({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return await res.json();
    },
    enabled: !!invoiceId,
    retry: false,
  });

  if (!match || !invoiceId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="container-invalid-invoice">
        <Card data-testid="card-invalid-invoice">
          <CardContent className="pt-6">
            <p className="text-muted-foreground" data-testid="text-invalid-invoice">Invalid invoice ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" data-testid="container-loading">
        <Skeleton className="h-12 w-64" data-testid="skeleton-title" />
        <Skeleton className="h-96 w-full" data-testid="skeleton-content" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="container-invoice-error">
        <Card data-testid="card-invoice-error">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-16 w-16 text-destructive" data-testid="icon-error" />
              <h3 className="text-2xl font-semibold" data-testid="text-error-title">Invoice Not Found</h3>
              <p className="text-muted-foreground" data-testid="text-error-description">
                The invoice you're looking for doesn't exist or you don't have access to it.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="container-payment-page">
      <div data-testid="container-page-header">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Invoice Payment</h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Review and pay invoice {invoice.invoice_number}
        </p>
      </div>

      <Card data-testid="card-invoice-summary">
        <CardHeader data-testid="container-invoice-header">
          <div className="flex items-center justify-between" data-testid="container-invoice-title">
            <CardTitle data-testid="text-invoice-number">{invoice.invoice_number}</CardTitle>
            <Badge variant={isPaid ? "default" : "secondary"} data-testid="badge-payment-status">
              {isPaid ? "Paid" : invoice.status}
            </Badge>
          </div>
          <CardDescription data-testid="text-client-name">
            {invoice.client?.name || "Unknown Client"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6" data-testid="container-invoice-details">
          {invoice.due_date && (
            <div className="flex justify-between text-sm" data-testid="container-due-date">
              <span className="text-muted-foreground" data-testid="label-due-date">Due Date:</span>
              <span data-testid="text-due-date">{format(new Date(invoice.due_date), "MMM dd, yyyy")}</span>
            </div>
          )}

          <Separator data-testid="separator-due-date" />

          <div className="space-y-4" data-testid="container-items">
            <h3 className="font-semibold" data-testid="text-items-header">Items</h3>
            <div className="space-y-3" data-testid="container-items-list">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <div key={item.id} className="flex justify-between text-sm" data-testid={`item-${index}`}>
                    <div className="flex-1" data-testid={`container-item-details-${index}`}>
                      <p className="font-medium" data-testid={`text-item-description-${index}`}>{item.description}</p>
                      <p className="text-muted-foreground" data-testid={`text-item-quantity-${index}`}>
                        {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium" data-testid={`text-item-amount-${index}`}>
                      ${parseFloat(item.amount).toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm" data-testid="text-no-items">No items</p>
              )}
            </div>
          </div>

          <Separator data-testid="separator-items" />

          <div className="space-y-2" data-testid="container-totals">
            <div className="flex justify-between text-sm" data-testid="container-subtotal">
              <span className="text-muted-foreground" data-testid="label-subtotal">Subtotal:</span>
              <span data-testid="text-subtotal">${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(invoice.tax_amount || "0") > 0 && (
              <div className="flex justify-between text-sm" data-testid="container-tax">
                <span className="text-muted-foreground" data-testid="label-tax">
                  Tax (<span data-testid="text-tax-rate">{invoice.tax_rate}</span>%):
                </span>
                <span data-testid="text-tax">${parseFloat(invoice.tax_amount || "0").toFixed(2)}</span>
              </div>
            )}
            <Separator data-testid="separator-total" />
            <div className="flex justify-between text-lg font-bold" data-testid="container-total">
              <span data-testid="text-total-label">Total:</span>
              <span data-testid="text-total-amount">${parseFloat(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isPaid ? (
        <Card data-testid="card-already-paid">
          <CardContent className="pt-6" data-testid="container-already-paid-content">
            <div className="flex flex-col items-center gap-4 py-8" data-testid="container-already-paid-message">
              <CheckCircle2 className="h-16 w-16 text-green-600" data-testid="icon-paid" />
              <h3 className="text-2xl font-semibold" data-testid="text-already-paid-title">Already Paid</h3>
              <p className="text-muted-foreground text-center" data-testid="text-already-paid-message">
                This invoice has already been paid.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Elements stripe={stripePromise} data-testid="container-stripe-elements">
          <PaymentForm invoice={invoice} />
        </Elements>
      )}
    </div>
  );
}
