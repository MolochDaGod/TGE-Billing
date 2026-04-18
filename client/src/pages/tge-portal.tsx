import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, Client, InvoiceItem } from "@shared/schema";
import {
  Zap, MapPin, Plus, FileText, Printer, LogOut, DollarSign,
  ClipboardList, CheckCircle2, Clock, X, Loader2, Trash2, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── TGE Branding ─────────────────────────────────────────────────
const BRAND = { green: "#16a34a", light: "#f0fdf4", muted: "#64748b", dark: "#052e16", lime: "#4ade80" };

type InvoiceWithExtras = Invoice & { client?: Client; items?: InvoiceItem[] };
interface LineItem { description: string; quantity: string; unit_price: string }

function statusColor(s: string) {
  const m: Record<string, string> = { paid: "#16a34a", sent: "#2563eb", draft: "#64748b", overdue: "#dc2626", cancelled: "#9ca3af" };
  return m[s] ?? "#64748b";
}

function printTGEInvoice(invoice: InvoiceWithExtras) {
  const client = invoice.client;
  const items = invoice.items ?? [];
  const subtotal = parseFloat(invoice.subtotal);
  const taxAmt = parseFloat(invoice.tax_amount ?? "0");
  const total = parseFloat(invoice.total);

  const rows = items.map((it, i) => `
    <tr style="background:${i % 2 === 0 ? "#f0fdf4" : "#fff"}">
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${it.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${parseFloat(it.quantity)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">$${parseFloat(it.unit_price).toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">$${parseFloat(it.amount).toFixed(2)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;color:#1e293b;background:#fff}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head>
  <body><div style="max-width:760px;margin:0 auto;padding:40px">
    <div style="height:5px;background:linear-gradient(90deg,#16a34a,#4ade80,#16a34a);border-radius:3px;margin-bottom:24px"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <div style="width:48px;height:48px;border-radius:50%;background:#052e16;display:flex;align-items:center;justify-content:center">
            <span style="color:#4ade80;font-weight:900;font-size:14px">TGE</span>
          </div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#052e16">T.G.E. Electrical</div>
            <div style="font-size:12px;color:#64748b">Texas City, TX &bull; tgebilling@gmail.com</div>
          </div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:30px;font-weight:800;color:#16a34a;letter-spacing:2px">INVOICE</div>
        <div style="font-size:14px;color:#1e293b;margin-top:2px">${invoice.invoice_number}</div>
        <div style="margin-top:6px;padding:3px 10px;background:${statusColor(invoice.status)};color:#fff;border-radius:4px;font-size:11px;font-weight:700;display:inline-block">${invoice.status.toUpperCase()}</div>
      </div>
    </div>
    <div style="height:1px;background:#e2e8f0;margin-bottom:24px"></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:28px">
      <div>
        <div style="font-size:10px;color:#16a34a;font-weight:700;letter-spacing:1.5px;margin-bottom:6px">BILL TO</div>
        <div style="font-size:15px;font-weight:700">${client?.name ?? "—"}</div>
        ${client?.email ? `<div style="color:#64748b;font-size:12px;margin-top:2px">${client.email}</div>` : ""}
        ${client?.phone ? `<div style="color:#64748b;font-size:12px">${client.phone}</div>` : ""}
        ${client?.address ? `<div style="color:#64748b;font-size:12px">${client.address}</div>` : ""}
        ${(client?.city || client?.state) ? `<div style="color:#64748b;font-size:12px">${[client?.city, client?.state].filter(Boolean).join(", ")} ${client?.zip ?? ""}</div>` : ""}
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;color:#16a34a;font-weight:700;letter-spacing:1.5px;margin-bottom:6px">INVOICE DETAILS</div>
        <div style="font-size:12px;color:#64748b">Date: <strong style="color:#1e293b">${new Date(invoice.invoice_date ?? invoice.created_at).toLocaleDateString("en-US")}</strong></div>
        ${invoice.due_date ? `<div style="font-size:12px;color:#64748b;margin-top:4px">Due: <strong style="color:#1e293b">${new Date(invoice.due_date).toLocaleDateString("en-US")}</strong></div>` : ""}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead><tr style="background:#052e16">
        <th style="color:#fff;text-align:left;padding:10px 12px;font-size:11px;font-weight:700">Description</th>
        <th style="color:#fff;text-align:right;padding:10px 12px;font-size:11px;font-weight:700;width:60px">Qty</th>
        <th style="color:#fff;text-align:right;padding:10px 12px;font-size:11px;font-weight:700;width:110px">Unit Price</th>
        <th style="color:#fff;text-align:right;padding:10px 12px;font-size:11px;font-weight:700;width:110px">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-bottom:28px">
      <div style="width:260px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:#64748b">Subtotal:</span><span>$${subtotal.toFixed(2)}</span>
        </div>
        ${taxAmt > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:#64748b">Tax:</span><span>$${taxAmt.toFixed(2)}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;margin-top:8px;background:#16a34a;border-radius:6px;color:#fff">
          <span style="font-size:14px;font-weight:700">TOTAL DUE:</span>
          <span style="font-size:20px;font-weight:800">$${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
    ${invoice.notes ? `<div style="margin-bottom:20px"><div style="font-size:10px;color:#16a34a;font-weight:700;letter-spacing:1.5px;margin-bottom:6px">NOTES</div><div style="font-size:12px;color:#1e293b;line-height:1.6">${invoice.notes}</div></div>` : ""}
    <div style="border-top:2px solid #16a34a;padding-top:14px;text-align:center">
      <div style="font-size:12px;font-weight:800;color:#052e16">T.G.E. ELECTRICAL LLC</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px">Texas City, TX &bull; tgebilling@gmail.com &bull; Powering Texas Forward</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:2px">Thank you for your business!</div>
    </div>
  </div></body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 400);
}

export default function TGEPortal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<InvoiceWithExtras | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: "1", unit_price: "" }]);
  const [formData, setFormData] = useState({ client_id: "", notes: "", status: "draft", tax_rate: "8.25" });

  const { data: user, isLoading: authLoading } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/tge");
  }, [user, authLoading, navigate]);

  const { data: invoices = [], isLoading: invLoading } = useQuery<InvoiceWithExtras[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => apiRequest("POST", "/api/invoices", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setShowCreate(false);
      resetForm();
      toast({ title: "Invoice created!", description: "Your invoice has been saved." });
    },
    onError: () => toast({ title: "Error", description: "Could not create invoice.", variant: "destructive" }),
  });

  const resetForm = () => {
    setLineItems([{ description: "", quantity: "1", unit_price: "" }]);
    setFormData({ client_id: "", notes: "", status: "draft", tax_rate: "8.25" });
  };

  const updateLine = (i: number, field: keyof LineItem, val: string) =>
    setLineItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const calcTotals = () => {
    const subtotal = lineItems.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0);
    const taxRate = parseFloat(formData.tax_rate) || 0;
    const taxAmt = subtotal * (taxRate / 100);
    return { subtotal: subtotal.toFixed(2), taxAmount: taxAmt.toFixed(2), total: (subtotal + taxAmt).toFixed(2) };
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) { toast({ title: "Select a client", variant: "destructive" }); return; }
    const { subtotal, taxAmount, total } = calcTotals();
    createMutation.mutate({
      client_id: formData.client_id,
      status: formData.status,
      notes: formData.notes,
      subtotal,
      tax_rate: formData.tax_rate || "8.25",
      tax_amount: taxAmount,
      total,
      items: lineItems.map((it, i) => ({
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        amount: ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0)).toFixed(2),
        order_index: i,
      })),
    });
  };

  const paid = invoices.filter(i => i.status === "paid").length;
  const outstanding = invoices.filter(i => ["sent", "overdue"].includes(i.status)).length;
  const totalRev = invoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.total), 0);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    navigate("/tge");
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={48} color={BRAND.green} className="animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin" || user?.role === "pirate_king";

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: BRAND.dark, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(74,222,128,0.15)", border: "2px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={20} color="#4ade80" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>T.G.E. Electrical</div>
            <div style={{ color: "#86efac", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={10} /><span>Texas City, TX</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAdmin && (
            <button onClick={() => navigate("/")}
              style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", cursor: "pointer", color: "#4ade80", display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 12px", borderRadius: 6, fontWeight: 600 }}>
              <Settings size={14} />Admin Dashboard
            </button>
          )}
          <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, background: "rgba(74,222,128,0.1)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(74,222,128,0.3)" }}>
            Vendor Portal
          </span>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "#86efac", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <LogOut size={16} />Sign Out
          </button>
        </div>
      </header>
      <div style={{ height: 4, background: "linear-gradient(90deg,#16a34a,#4ade80,#16a34a)" }} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: BRAND.dark }}>Invoice Dashboard</h1>
          <p style={{ color: BRAND.muted, fontSize: 14, marginTop: 4 }}>Create, manage, and print invoices for T.G.E. Electrical services.</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { icon: <ClipboardList size={22} color={BRAND.green} />, label: "Total Invoices", value: invoices.length },
            { icon: <CheckCircle2 size={22} color="#16a34a" />, label: "Paid", value: paid },
            { icon: <Clock size={22} color="#2563eb" />, label: "Outstanding", value: outstanding },
            { icon: <DollarSign size={22} color={BRAND.green} />, label: "Revenue Collected", value: `$${totalRev.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #d1fae5", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark }}>{s.value}</div>
                <div style={{ fontSize: 12, color: BRAND.muted }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Invoice table */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #d1fae5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: BRAND.dark }}>Invoices</h2>
              <p style={{ fontSize: 13, color: BRAND.muted, marginTop: 2 }}>{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} on file</p>
            </div>
            <Button onClick={() => setShowCreate(true)} style={{ background: BRAND.green, color: "#fff", border: "none", fontWeight: 700 }}>
              <Plus size={16} className="mr-2" />New Invoice
            </Button>
          </div>

          {invLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: BRAND.muted }}>
              <Loader2 size={32} className="animate-spin mx-auto" />
              <p style={{ marginTop: 12 }}>Loading invoices…</p>
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <FileText size={48} color="#bbf7d0" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: BRAND.muted, fontSize: 15 }}>No invoices yet. Create your first one!</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f0fdf4" }}>
                    {["Invoice #", "Client", "Date", "Total", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={inv.id} style={{ borderTop: "1px solid #f0fdf4", background: i % 2 === 0 ? "#fff" : "#fafffe" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: BRAND.dark, fontSize: 14 }}>{inv.invoice_number}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#334155" }}>{inv.client?.name ?? "—"}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: BRAND.muted }}>{new Date(inv.invoice_date ?? inv.created_at).toLocaleDateString("en-US")}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: BRAND.dark }}>${parseFloat(inv.total).toFixed(2)}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: statusColor(inv.status) + "22", color: statusColor(inv.status), padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setViewInvoice(inv)}
                            style={{ background: BRAND.dark, color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <FileText size={13} />View
                          </button>
                          <button onClick={() => printTGEInvoice(inv)}
                            style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Printer size={13} />Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #d1fae5", display: "flex", alignItems: "center", justifyContent: "space-between", background: BRAND.dark, borderRadius: "16px 16px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Plus size={20} color={BRAND.lime} />
                <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>New T.G.E. Invoice</h3>
              </div>
              <button onClick={() => { setShowCreate(false); resetForm(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#86efac" }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <Label style={{ color: BRAND.dark, fontWeight: 600 }}>Client *</Label>
                  <Select value={formData.client_id} onValueChange={(v) => setFormData(p => ({ ...p, client_id: v }))}>
                    <SelectTrigger style={{ marginTop: 6 }}><SelectValue placeholder="Select client…" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ color: BRAND.dark, fontWeight: 600 }}>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                    <SelectTrigger style={{ marginTop: 6 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["draft","sent","paid","overdue","cancelled"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <Label style={{ color: BRAND.dark, fontWeight: 600 }}>Line Items</Label>
                  <button type="button" onClick={() => setLineItems(p => [...p, { description: "", quantity: "1", unit_price: "" }])}
                    style={{ background: BRAND.dark, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={13} />Add Line
                  </button>
                </div>
                <div style={{ border: "1px solid #d1fae5", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 40px", gap: 0, background: "#f0fdf4", padding: "10px 14px" }}>
                    {["Description", "Qty", "Unit Price", ""].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: "uppercase" }}>{h}</div>)}
                  </div>
                  {lineItems.map((it, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 40px", gap: 8, padding: "10px 14px", borderTop: "1px solid #f0fdf4", alignItems: "center" }}>
                      <Input value={it.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Service description…" required />
                      <Input value={it.quantity} onChange={e => updateLine(i, "quantity", e.target.value)} type="number" min="1" step="0.01" required />
                      <Input value={it.unit_price} onChange={e => updateLine(i, "unit_price", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" required />
                      <button type="button" onClick={() => setLineItems(p => p.filter((_, idx) => idx !== i))} disabled={lineItems.length === 1}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {(() => { const { subtotal, taxAmount, total } = calcTotals(); return (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                  <div style={{ width: 240, padding: "12px 16px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #d1fae5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: BRAND.muted }}>Subtotal:</span><span style={{ fontWeight: 600 }}>${subtotal}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ color: BRAND.muted, fontSize: 13 }}>Tax %:</span>
                      <Input value={formData.tax_rate} onChange={e => setFormData(p => ({ ...p, tax_rate: e.target.value }))} type="number" min="0" max="100" style={{ width: 80, height: 28, fontSize: 12 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: BRAND.green, borderRadius: 8, color: "#fff" }}>
                      <span style={{ fontWeight: 700 }}>TOTAL:</span><span style={{ fontWeight: 800, fontSize: 16 }}>${total}</span>
                    </div>
                  </div>
                </div>
              ); })()}

              <div style={{ marginBottom: 20 }}>
                <Label style={{ color: BRAND.dark, fontWeight: 600 }}>Notes (optional)</Label>
                <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Job details, permit numbers, special instructions…" style={{ marginTop: 6, resize: "vertical" }} rows={3} />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} style={{ background: BRAND.green, color: "#fff", border: "none", fontWeight: 700 }}>
                  {createMutation.isPending ? <><Loader2 size={16} className="animate-spin mr-2" />Creating…</> : <><CheckCircle2 size={16} className="mr-2" />Create Invoice</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #d1fae5", display: "flex", alignItems: "center", justifyContent: "space-between", background: BRAND.dark, borderRadius: "16px 16px 0 0" }}>
              <h3 style={{ color: "#fff", fontWeight: 700 }}>Invoice {viewInvoice.invoice_number}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => printTGEInvoice(viewInvoice)}
                  style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Printer size={15} />Print / Save PDF
                </button>
                <button onClick={() => setViewInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#86efac" }}>
                  <X size={22} />
                </button>
              </div>
            </div>
            <div style={{ padding: 28, color: "#1e293b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: BRAND.dark }}>T.G.E. Electrical</div>
                  <div style={{ color: BRAND.muted, fontSize: 12, marginTop: 2 }}>Texas City, TX</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: BRAND.muted }}>Invoice #: <strong style={{ color: BRAND.dark }}>{viewInvoice.invoice_number}</strong></div>
                  <div style={{ fontSize: 13, color: BRAND.muted, marginTop: 4 }}>Date: <strong style={{ color: BRAND.dark }}>{new Date(viewInvoice.invoice_date ?? viewInvoice.created_at).toLocaleDateString("en-US")}</strong></div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ background: statusColor(viewInvoice.status) + "22", color: statusColor(viewInvoice.status), padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {viewInvoice.status.charAt(0).toUpperCase() + viewInvoice.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: BRAND.green, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>BILL TO</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{viewInvoice.client?.name ?? "—"}</div>
                {viewInvoice.client?.email && <div style={{ color: BRAND.muted, fontSize: 13 }}>{viewInvoice.client.email}</div>}
                {viewInvoice.client?.phone && <div style={{ color: BRAND.muted, fontSize: 13 }}>{viewInvoice.client.phone}</div>}
              </div>
              {(viewInvoice.items ?? []).length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <thead><tr style={{ background: BRAND.dark }}>
                    {["Description","Qty","Unit Price","Amount"].map(h => <th key={h} style={{ color: "#fff", padding: "8px 12px", fontSize: 11, fontWeight: 700, textAlign: h === "Description" ? "left" : "right" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(viewInvoice.items ?? []).map((it, i) => (
                      <tr key={it.id} style={{ background: i % 2 === 0 ? "#f0fdf4" : "#fff" }}>
                        <td style={{ padding: "8px 12px", fontSize: 13, borderBottom: "1px solid #f0fdf4" }}>{it.description}</td>
                        <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0fdf4" }}>{parseFloat(it.quantity)}</td>
                        <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0fdf4" }}>${parseFloat(it.unit_price).toFixed(2)}</td>
                        <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0fdf4", fontWeight: 700 }}>${parseFloat(it.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: 240 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                    <span style={{ color: BRAND.muted }}>Subtotal:</span><span>${parseFloat(viewInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: BRAND.green, borderRadius: 8, color: "#fff", marginTop: 8 }}>
                    <span style={{ fontWeight: 700 }}>TOTAL DUE:</span>
                    <span style={{ fontWeight: 800, fontSize: 17 }}>${parseFloat(viewInvoice.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {viewInvoice.notes && (
                <div style={{ marginTop: 16, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: 13, color: BRAND.muted }}>
                  <strong style={{ color: BRAND.dark }}>Notes:</strong> {viewInvoice.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
