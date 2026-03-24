import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import type { Invoice, InvoiceItem, Client } from '@shared/schema';

interface InvoiceWithDetails {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client;
}

interface MemoData {
  clientName: string;
  projectAddress: string;
  date: string;
  preparedBy: string;
  sections: { title: string; content: string }[];
  estimateItems?: { area: string; time: string; materials: string; labor: string }[];
  estimateTotals?: { materials: string; labor: string; permitting: string; total: string };
  questions?: string[];
  notes?: string;
}

export function generateMemoPDF(data: MemoData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  const blue = '#3b82f6';
  const darkText = '#1f2937';
  const grayText = '#6b7280';
  const lightBg = '#f9fafb';

  doc.fontSize(28).fillColor(blue).text('T.G.E. PROS', 50, 50);
  doc.fontSize(10).fillColor(grayText).text('Texas Master Electrician License #750779', 50, 85);
  doc.fontSize(10).fillColor(grayText).text('Professional Electrical Services', 50, 100);

  doc.moveTo(50, 120).lineTo(562, 120).strokeColor('#e5e7eb').stroke();

  let y = 135;
  doc.fontSize(18).fillColor(darkText).text('PROJECT FOLLOW-UP MEMO & ESTIMATE', 50, y);
  y += 30;

  doc.fontSize(10).fillColor(grayText).text('Date:', 50, y);
  doc.fillColor(darkText).text(data.date, 130, y);
  y += 18;
  doc.fillColor(grayText).text('Client:', 50, y);
  doc.fillColor(darkText).text(data.clientName, 130, y);
  y += 18;
  doc.fillColor(grayText).text('Project:', 50, y);
  doc.fillColor(darkText).text(data.projectAddress, 130, y);
  y += 18;
  doc.fillColor(grayText).text('Prepared By:', 50, y);
  doc.fillColor(darkText).text(data.preparedBy, 130, y);
  y += 30;

  doc.moveTo(50, y).lineTo(562, y).strokeColor('#e5e7eb').stroke();
  y += 15;

  for (const section of data.sections) {
    if (y > 680) { doc.addPage(); y = 50; }
    doc.fontSize(13).fillColor(blue).text(section.title.toUpperCase(), 50, y);
    y += 20;
    doc.fontSize(10).fillColor(darkText).text(section.content, 50, y, { width: 510, lineGap: 4 });
    y = (doc as any).y + 20;
  }

  if (data.estimateItems && data.estimateItems.length > 0) {
    if (y > 500) { doc.addPage(); y = 50; }
    doc.fontSize(13).fillColor(blue).text('ELECTRICAL ESTIMATE BREAKDOWN', 50, y);
    y += 25;

    const colX = [50, 250, 330, 430];
    const colW = [195, 75, 95, 85];
    const headers = ['Area / Scope', 'Time', 'Materials', 'Labor'];

    doc.rect(50, y, 510, 22).fillAndStroke(blue, blue);
    headers.forEach((h, i) => {
      doc.fontSize(9).fillColor('#ffffff').text(h, colX[i], y + 6, { width: colW[i], align: i === 0 ? 'left' : 'right' });
    });
    y += 27;

    data.estimateItems.forEach((item, idx) => {
      if (y > 700) { doc.addPage(); y = 50; }
      const bg = idx % 2 === 0 ? lightBg : '#ffffff';
      doc.rect(50, y - 3, 510, 22).fill(bg);
      doc.fontSize(9).fillColor(darkText)
        .text(item.area, colX[0], y, { width: colW[0] })
        .text(item.time, colX[1], y, { width: colW[1], align: 'right' })
        .text(item.materials, colX[2], y, { width: colW[2], align: 'right' })
        .text(item.labor, colX[3], y, { width: colW[3], align: 'right' });
      y += 22;
    });

    if (data.estimateTotals) {
      y += 5;
      doc.moveTo(330, y).lineTo(562, y).strokeColor('#e5e7eb').stroke();
      y += 10;
      doc.fontSize(10).fillColor(grayText).text('Total Materials:', 330, y);
      doc.fillColor(darkText).text(data.estimateTotals.materials, 460, y, { width: 100, align: 'right' });
      y += 18;
      doc.fillColor(grayText).text('Total Labor:', 330, y);
      doc.fillColor(darkText).text(data.estimateTotals.labor, 460, y, { width: 100, align: 'right' });
      y += 18;
      doc.fillColor(grayText).text('Permitting:', 330, y);
      doc.fillColor(darkText).text(data.estimateTotals.permitting, 460, y, { width: 100, align: 'right' });
      y += 22;

      doc.rect(320, y - 5, 245, 28).fillAndStroke('#eff6ff', blue);
      doc.fontSize(12).fillColor(darkText).text('PROJECT TOTAL:', 330, y + 2);
      doc.fontSize(14).fillColor(blue).text(data.estimateTotals.total, 460, y, { width: 100, align: 'right' });
      y += 40;
    }
  }

  if (data.questions && data.questions.length > 0) {
    if (y > 500) { doc.addPage(); y = 50; }
    doc.fontSize(13).fillColor(blue).text('CLIENT DISCUSSION QUESTIONS', 50, y);
    y += 22;
    data.questions.forEach((q, i) => {
      if (y > 710) { doc.addPage(); y = 50; }
      doc.fontSize(10).fillColor(darkText).text(`${i + 1}. ${q}`, 60, y, { width: 490, lineGap: 3 });
      y = (doc as any).y + 10;
    });
  }

  if (data.notes) {
    if (y > 600) { doc.addPage(); y = 50; }
    y += 10;
    doc.rect(50, y, 510, 80).fillAndStroke(lightBg, '#e5e7eb');
    doc.fontSize(11).fillColor(darkText).text('Additional Notes', 60, y + 8);
    doc.fontSize(9).fillColor(grayText).text(data.notes, 60, y + 25, { width: 490, lineGap: 3 });
    y = (doc as any).y + 20;
  }

  const footerY = 730;
  doc.fontSize(9).fillColor(grayText).text('T.G.E. PROS - Professional Electrical Services', 50, footerY, { align: 'center', width: 500 });
  doc.fontSize(8).fillColor('#9ca3af').text('This document is confidential and intended for client discussion purposes.', 50, footerY + 15, { align: 'center', width: 500 });

  return doc;
}

export function generateInvoicePDF(data: InvoiceWithDetails): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  const { invoice, items, client } = data;

  const blue = '#3b82f6';
  const gold = '#C8A415';
  const darkText = '#1f2937';
  const grayText = '#6b7280';
  const lightGray = '#9ca3af';
  const lightBg = '#f9fafb';
  const borderColor = '#e5e7eb';

  // ═══════════════════════════════════════════
  // TOP ACCENT STRIPE — gold brand bar
  // ═══════════════════════════════════════════
  doc.rect(0, 0, 620, 6).fill(gold);

  // ═══════════════════════════════════════════
  // HEADER — Logo + Company info | Invoice #
  // ═══════════════════════════════════════════
  let logoUsed = false;
  try {
    const logoPath = path.resolve(process.cwd(), 'public', 'tge-logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 18, { width: 60 });
      logoUsed = true;
    }
  } catch {
    // logo not found — fall through to text-only header
  }

  const headerTextX = logoUsed ? 120 : 50;
  doc.fontSize(22).fillColor(gold).text('T.G.E. PROS', headerTextX, 22);
  doc.fontSize(9).fillColor(grayText).text('Professional Electrical & Contractor Services', headerTextX, 48);
  doc.fontSize(8).fillColor(lightGray).text('Texas Master Electrician License #750779', headerTextX, 62);
  doc.fontSize(8).fillColor(lightGray).text('Houston, TX  •  tgebilling@gmail.com  •  (832) 000-0000', headerTextX, 74);

  // INVOICE label (right side)
  doc.fontSize(28).fillColor(blue).text('INVOICE', 370, 22, { align: 'right', width: 190 });
  doc.fontSize(11).fillColor(darkText).text(invoice.invoice_number, 370, 55, { align: 'right', width: 190 });

  // Status badge
  const statusColors: Record<string, string> = {
    paid: '#16a34a', sent: '#2563eb', draft: '#6b7280', overdue: '#dc2626', cancelled: '#9ca3af',
  };
  const statusColor = statusColors[invoice.status] || grayText;
  const statusText = invoice.status.toUpperCase();
  doc.roundedRect(488, 70, 72, 18, 4).fillAndStroke(statusColor, statusColor);
  doc.fontSize(8).fillColor('#ffffff').text(statusText, 488, 75, { width: 72, align: 'center' });

  // Divider
  doc.moveTo(50, 95).lineTo(560, 95).strokeColor(borderColor).stroke();

  // ═══════════════════════════════════════════
  // BILL TO / INVOICE DETAILS
  // ═══════════════════════════════════════════
  let y = 108;

  // Bill To
  doc.fontSize(8).fillColor(gold).text('BILL TO', 50, y);
  y += 14;
  doc.fontSize(12).fillColor(darkText).text(client.name, 50, y);
  y += 18;
  if (client.email) { doc.fontSize(9).fillColor(grayText).text(client.email, 50, y); y += 14; }
  if (client.phone) { doc.fontSize(9).fillColor(grayText).text(client.phone, 50, y); y += 14; }
  if (client.address) {
    doc.fontSize(9).fillColor(grayText).text(client.address, 50, y, { width: 200 });
    y = (doc as any).y + 4;
  }
  if (client.city || client.state || client.zip) {
    const cityLine = [client.city, client.state].filter(Boolean).join(', ') + (client.zip ? ` ${client.zip}` : '');
    doc.fontSize(9).fillColor(grayText).text(cityLine, 50, y, { width: 200 });
  }

  // Invoice details (right column)
  const detX = 370;
  let detY = 108;
  doc.fontSize(8).fillColor(gold).text('INVOICE DETAILS', detX, detY);
  detY += 16;

  const addDetail = (label: string, value: string) => {
    doc.fontSize(9).fillColor(grayText).text(label, detX, detY);
    doc.fontSize(9).fillColor(darkText).text(value, detX + 90, detY, { width: 100, align: 'right' });
    detY += 16;
  };

  addDetail('Invoice Date:', new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-US'));
  if (invoice.due_date) addDetail('Due Date:', new Date(invoice.due_date).toLocaleDateString('en-US'));
  addDetail('Terms:', invoice.due_date ? 'Net 30' : 'Due on Receipt');

  // ═══════════════════════════════════════════
  // LINE ITEMS TABLE
  // ═══════════════════════════════════════════
  const tableTop = Math.max(y, detY) + 20;

  // Table header
  doc.rect(50, tableTop, 510, 24).fill(gold);
  const colX = [58, 340, 400, 475];
  const colW = [275, 55, 70, 80];
  const headers = ['Description', 'Qty', 'Unit Price', 'Amount'];
  headers.forEach((h, i) => {
    doc.fontSize(9).fillColor('#ffffff').text(h, colX[i], tableTop + 7, {
      width: colW[i], align: i === 0 ? 'left' : 'right',
    });
  });

  // Table rows
  let rowY = tableTop + 28;
  items.forEach((item, idx) => {
    if (rowY > 680) { doc.addPage(); rowY = 50; doc.rect(0, 0, 620, 4).fill(gold); }
    const bg = idx % 2 === 0 ? lightBg : '#ffffff';
    doc.rect(50, rowY - 3, 510, 24).fill(bg);
    doc.fontSize(9).fillColor(darkText)
       .text(item.description, colX[0], rowY + 2, { width: colW[0] })
       .text(parseFloat(item.quantity).toString(), colX[1], rowY + 2, { width: colW[1], align: 'right' })
       .text(`$${parseFloat(item.unit_price).toFixed(2)}`, colX[2], rowY + 2, { width: colW[2], align: 'right' })
       .text(`$${parseFloat(item.amount).toFixed(2)}`, colX[3], rowY + 2, { width: colW[3], align: 'right' });
    rowY += 24;
  });

  // Bottom border of table
  doc.moveTo(50, rowY).lineTo(560, rowY).strokeColor(borderColor).stroke();

  // ═══════════════════════════════════════════
  // TOTALS
  // ═══════════════════════════════════════════
  rowY += 12;
  const totX = 390;
  const totValX = 480;

  doc.fontSize(10).fillColor(grayText).text('Subtotal:', totX, rowY);
  doc.fillColor(darkText).text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, totValX, rowY, { width: 75, align: 'right' });
  rowY += 18;

  if (parseFloat(invoice.tax_amount || '0') > 0) {
    doc.fillColor(grayText).text(`Tax (${parseFloat(invoice.tax_rate || '0').toFixed(2)}%):`, totX, rowY);
    doc.fillColor(darkText).text(`$${parseFloat(invoice.tax_amount || '0').toFixed(2)}`, totValX, rowY, { width: 75, align: 'right' });
    rowY += 18;
  }

  // Grand total bar
  rowY += 4;
  doc.rect(totX - 10, rowY - 4, 175, 30).fillAndStroke(gold, gold);
  doc.fontSize(12).fillColor('#ffffff').text('TOTAL DUE:', totX, rowY + 4);
  doc.fontSize(14).fillColor('#ffffff').text(`$${parseFloat(invoice.total).toFixed(2)}`, totValX - 10, rowY + 2, { width: 85, align: 'right' });

  // ═══════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════
  if (invoice.notes) {
    rowY += 50;
    if (rowY > 640) { doc.addPage(); rowY = 50; doc.rect(0, 0, 620, 4).fill(gold); }
    doc.fontSize(9).fillColor(gold).text('NOTES', 50, rowY);
    rowY += 14;
    doc.fontSize(9).fillColor(darkText).text(invoice.notes, 50, rowY, { width: 500, lineGap: 3 });
    rowY = (doc as any).y + 10;
  }

  // ═══════════════════════════════════════════
  // PAYMENT INSTRUCTIONS
  // ═══════════════════════════════════════════
  rowY += 20;
  if (rowY > 600) { doc.addPage(); rowY = 50; doc.rect(0, 0, 620, 4).fill(gold); }

  doc.rect(50, rowY, 510, 85).fillAndStroke(lightBg, borderColor);
  doc.fontSize(10).fillColor(darkText).text('Payment Instructions', 60, rowY + 8);
  doc.moveTo(60, rowY + 22).lineTo(550, rowY + 22).strokeColor(borderColor).stroke();

  doc.fontSize(9).fillColor(grayText).text('Make checks payable to:', 60, rowY + 30);
  doc.fontSize(10).fillColor(darkText).text('T.G.E.', 60, rowY + 44);

  doc.fontSize(9).fillColor(grayText).text('PayPal / Zelle:', 280, rowY + 30);
  doc.fontSize(10).fillColor(blue).text('tgebilling@gmail.com', 280, rowY + 44);

  doc.fontSize(9).fillColor(grayText).text('Pay online:', 60, rowY + 65);
  doc.fillColor(blue).text('https://electrapro.app', 130, rowY + 65);

  // ═══════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════
  const footerY = 725;
  doc.moveTo(50, footerY - 8).lineTo(560, footerY - 8).strokeColor(gold).lineWidth(0.5).stroke();
  doc.fontSize(9).fillColor(gold).text('T.G.E. PROS', 50, footerY, { align: 'center', width: 510 });
  doc.fontSize(7).fillColor(lightGray).text('Professional Electrical & Contractor Services  •  Houston, TX  •  tgebilling@gmail.com', 50, footerY + 13, { align: 'center', width: 510 });
  doc.fontSize(7).fillColor(lightGray).text('Thank you for your business!', 50, footerY + 24, { align: 'center', width: 510 });

  return doc;
}
