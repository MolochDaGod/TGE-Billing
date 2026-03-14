import PDFDocument from 'pdfkit';
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
  const doc = new PDFDocument({ margin: 50 });
  const { invoice, items, client } = data;

  // Header with company branding
  doc.fontSize(28)
     .fillColor('#3b82f6')
     .text('T.G.E. Billing', 50, 50);
  
  doc.fontSize(10)
     .fillColor('#6b7280')
     .text('Texas Master Electrician License #750779', 50, 85);
  
  // Invoice title and number
  doc.fontSize(20)
     .fillColor('#1f2937')
     .text('INVOICE', 400, 50, { align: 'right' });
  
  doc.fontSize(12)
     .fillColor('#6b7280')
     .text(invoice.invoice_number, 400, 75, { align: 'right' });

  // Client information
  doc.fontSize(10)
     .fillColor('#6b7280')
     .text('BILL TO:', 50, 150);
  
  doc.fontSize(12)
     .fillColor('#1f2937')
     .text(client.name, 50, 170);
  
  if (client.email) {
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(client.email, 50, 190);
  }
  
  if (client.phone) {
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(client.phone, 50, 205);
  }
  
  if (client.address) {
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(client.address, 50, 220, { width: 200 });
  }

  // Invoice details (right side)
  const detailsX = 350;
  let detailsY = 150;
  
  doc.fontSize(10)
     .fillColor('#6b7280')
     .text('Work Date:', detailsX, detailsY);
  doc.fillColor('#1f2937')
     .text(new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString('en-US'), detailsX + 100, detailsY);
  
  detailsY += 20;
  
  if (invoice.due_date) {
    doc.fillColor('#6b7280')
       .text('Due Date:', detailsX, detailsY);
    doc.fillColor('#1f2937')
       .text(new Date(invoice.due_date).toLocaleDateString('en-US'), detailsX + 100, detailsY);
    detailsY += 20;
  }
  
  doc.fillColor('#6b7280')
     .text('Status:', detailsX, detailsY);
  doc.fillColor('#1f2937')
     .text(invoice.status.toUpperCase(), detailsX + 100, detailsY);

  // Line items table
  const tableTop = 280;
  const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Amount'];
  const columnWidths = [250, 60, 100, 100];
  const columnX = [50, 300, 360, 460];

  // Table header
  doc.fontSize(10)
     .fillColor('#ffffff')
     .rect(50, tableTop, 510, 25)
     .fillAndStroke('#3b82f6', '#3b82f6');
  
  tableHeaders.forEach((header, i) => {
    doc.fillColor('#ffffff')
       .text(header, columnX[i], tableTop + 8, {
         width: columnWidths[i],
         align: i === 0 ? 'left' : 'right'
       });
  });

  // Table rows
  let currentY = tableTop + 30;
  items.forEach((item, index) => {
    const rowColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
    doc.rect(50, currentY - 5, 510, 25)
       .fill(rowColor);
    
    doc.fontSize(10)
       .fillColor('#1f2937')
       .text(item.description, columnX[0], currentY, { width: columnWidths[0] });
    
    doc.text(parseFloat(item.quantity).toFixed(2), columnX[1], currentY, {
      width: columnWidths[1],
      align: 'right'
    });
    
    doc.text(`$${parseFloat(item.unit_price).toFixed(2)}`, columnX[2], currentY, {
      width: columnWidths[2],
      align: 'right'
    });
    
    doc.text(`$${parseFloat(item.amount).toFixed(2)}`, columnX[3], currentY, {
      width: columnWidths[3],
      align: 'right'
    });
    
    currentY += 25;
  });

  // Totals section
  currentY += 20;
  const totalsX = 360;
  
  doc.fontSize(10)
     .fillColor('#6b7280')
     .text('Subtotal:', totalsX, currentY);
  doc.fillColor('#1f2937')
     .text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, totalsX + 100, currentY, { align: 'right' });
  
  currentY += 20;
  
  if (parseFloat(invoice.tax_amount || '0') > 0) {
    doc.fillColor('#6b7280')
       .text(`Tax (${parseFloat(invoice.tax_rate || '0').toFixed(2)}%):`, totalsX, currentY);
    doc.fillColor('#1f2937')
       .text(`$${parseFloat(invoice.tax_amount || '0').toFixed(2)}`, totalsX + 100, currentY, { align: 'right' });
    currentY += 20;
  }
  
  // Total with highlight
  doc.rect(totalsX - 10, currentY - 5, 200, 30)
     .fillAndStroke('#eff6ff', '#3b82f6');
  
  doc.fontSize(14)
     .fillColor('#1f2937')
     .text('TOTAL:', totalsX, currentY + 5);
  doc.fontSize(16)
     .fillColor('#3b82f6')
     .text(`$${parseFloat(invoice.total).toFixed(2)}`, totalsX + 100, currentY + 5, { align: 'right' });

  // Notes section
  if (invoice.notes) {
    currentY += 60;
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('Notes:', 50, currentY);
    doc.fontSize(9)
       .fillColor('#1f2937')
       .text(invoice.notes, 50, currentY + 15, { width: 500 });
  }

  // Payment instructions section
  currentY += (invoice.notes ? 80 : 60);
  
  // Payment instructions box
  doc.rect(50, currentY, 510, 100)
     .fillAndStroke('#f9fafb', '#e5e7eb');
  
  doc.fontSize(12)
     .fillColor('#1f2937')
     .text('Payment Instructions', 60, currentY + 10);
  
  doc.fontSize(9)
     .fillColor('#6b7280')
     .text('Please make checks payable to:', 60, currentY + 35);
  
  doc.fontSize(11)
     .fillColor('#1f2937')
     .text('T.G.E.', 60, currentY + 50);
  
  // PayPal information
  doc.fontSize(9)
     .fillColor('#6b7280')
     .text('PayPal payments accepted at:', 300, currentY + 35);
  
  doc.fontSize(10)
     .fillColor('#3b82f6')
     .text('tgebilling@gmail.com', 300, currentY + 50);
  
  // Online payment option
  doc.fontSize(9)
     .fillColor('#6b7280')
     .text('Pay online with credit card or bank account at:', 60, currentY + 75);
  
  doc.fontSize(9)
     .fillColor('#3b82f6')
     .text('https://electrapro.app', 320, currentY + 75);

  // Footer
  const footerY = 720;
  doc.fontSize(9)
     .fillColor('#6b7280')
     .text('Thank you for your business!', 50, footerY, { align: 'center', width: 500 });
  
  doc.fontSize(8)
     .fillColor('#9ca3af')
     .text('For questions, contact us at info@tgebilling.pro', 50, footerY + 15, { align: 'center', width: 500 });

  return doc;
}
