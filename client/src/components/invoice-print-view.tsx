import { useRef } from 'react';
import type { Invoice, InvoiceItem, Client } from '@shared/schema';
import { TGELogo } from './tge-logo';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface InvoicePrintViewProps {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client;
}

const statusStyles: Record<string, string> = {
  paid: 'bg-green-600',
  sent: 'bg-blue-600',
  draft: 'bg-gray-500',
  overdue: 'bg-red-600',
  cancelled: 'bg-gray-400',
};

export function InvoicePrintView({ invoice, items, client }: InvoicePrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1f2937; background: #fff; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const subtotal = parseFloat(invoice.subtotal);
  const taxRate = parseFloat(invoice.tax_rate || '0');
  const taxAmount = parseFloat(invoice.tax_amount || '0');
  const total = parseFloat(invoice.total);

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </Button>
      </div>

      <div ref={printRef}>
        <div style={{
          maxWidth: 780,
          margin: '0 auto',
          padding: 40,
          background: '#fff',
          color: '#1f2937',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 13,
        }}>
          {/* Gold accent stripe */}
          <div style={{ height: 5, background: '#C8A415', borderRadius: 3, marginBottom: 20 }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <TGELogo variant="invoice" size={56} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6', letterSpacing: 1 }}>INVOICE</div>
              <div style={{ fontSize: 14, color: '#1f2937', marginTop: 2 }}>{invoice.invoice_number}</div>
              <span
                className={`${statusStyles[invoice.status] || 'bg-gray-500'} inline-block mt-2 px-3 py-0.5 rounded text-white text-xs font-semibold tracking-wide`}
              >
                {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#e5e7eb', marginBottom: 20 }} />

          {/* Bill To + Invoice Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 10, color: '#C8A415', fontWeight: 600, letterSpacing: 1.5, marginBottom: 6 }}>BILL TO</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{client.name}</div>
              {client.email && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{client.email}</div>}
              {client.phone && <div style={{ color: '#6b7280', fontSize: 12 }}>{client.phone}</div>}
              {client.address && <div style={{ color: '#6b7280', fontSize: 12 }}>{client.address}</div>}
              {(client.city || client.state || client.zip) && (
                <div style={{ color: '#6b7280', fontSize: 12 }}>
                  {[client.city, client.state].filter(Boolean).join(', ')} {client.zip}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#C8A415', fontWeight: 600, letterSpacing: 1.5, marginBottom: 6 }}>INVOICE DETAILS</div>
              <table style={{ fontSize: 12, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: 16, paddingBottom: 4 }}>Invoice Date:</td>
                    <td style={{ fontWeight: 500, paddingBottom: 4 }}>
                      {new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-US')}
                    </td>
                  </tr>
                  {invoice.due_date && (
                    <tr>
                      <td style={{ color: '#6b7280', paddingRight: 16, paddingBottom: 4 }}>Due Date:</td>
                      <td style={{ fontWeight: 500, paddingBottom: 4 }}>
                        {new Date(invoice.due_date).toLocaleDateString('en-US')}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: 16 }}>Terms:</td>
                    <td style={{ fontWeight: 500 }}>{invoice.due_date ? 'Net 30' : 'Due on Receipt'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#C8A415' }}>
                <th style={{ color: '#fff', textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600 }}>Description</th>
                <th style={{ color: '#fff', textAlign: 'right', padding: '8px 12px', fontSize: 11, fontWeight: 600, width: 60 }}>Qty</th>
                <th style={{ color: '#fff', textAlign: 'right', padding: '8px 12px', fontSize: 11, fontWeight: 600, width: 100 }}>Unit Price</th>
                <th style={{ color: '#fff', textAlign: 'right', padding: '8px 12px', fontSize: 11, fontWeight: 600, width: 100 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>{item.description}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                    {parseFloat(item.quantity)}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                    ${parseFloat(item.unit_price).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 500 }}>
                    ${parseFloat(item.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
            <div style={{ width: 260 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>Tax ({taxRate.toFixed(2)}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', marginTop: 8,
                background: '#C8A415', borderRadius: 6, color: '#fff',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>TOTAL DUE:</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#C8A415', fontWeight: 600, letterSpacing: 1.5, marginBottom: 6 }}>NOTES</div>
              <div style={{ fontSize: 12, color: '#1f2937', lineHeight: 1.6 }}>{invoice.notes}</div>
            </div>
          )}

          {/* Payment Instructions */}
          <div style={{
            padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 8, marginBottom: 28,
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
              Payment Instructions
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <div>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>Make checks payable to:</div>
                <div style={{ fontWeight: 600 }}>T.G.E.</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>PayPal / Zelle:</div>
                <div style={{ color: '#3b82f6', fontWeight: 500 }}>tgebilling@gmail.com</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: 4 }}>Pay online:</div>
                <div style={{ color: '#3b82f6', fontWeight: 500 }}>electrapro.app</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #C8A415', paddingTop: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#C8A415', fontWeight: 600, letterSpacing: 1 }}>T.G.E. PROS</div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>
              Professional Electrical & Contractor Services &bull; Houston, TX &bull; tgebilling@gmail.com
            </div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>Thank you for your business!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
