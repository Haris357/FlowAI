/**
 * Invoice PDF Generator
 * Server-side PDF generation using jsPDF + jspdf-autotable
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  issueDate: any;
  dueDate: any;
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  notes?: string;
  terms?: string;
}

interface CompanyData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  currency: string;
  invoiceFooter?: string;
}

function formatDate(date: any): string {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', PKR: 'Rs',
    AED: 'AED ', SAR: 'SAR ', AUD: 'A$', CAD: 'C$',
    SGD: 'S$', MYR: 'RM', JPY: '¥', CNY: '¥',
  };
  const sym = symbols[currency] || `${currency} `;
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateInvoicePDF(invoice: InvoiceData, company: CompanyData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // ---- HEADER ----
  // Company name (left)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text(company.name, margin, y);

  // "INVOICE" label (right)
  doc.setFontSize(28);
  doc.setTextColor(59, 130, 246); // Blue
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Company details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (company.address) { doc.text(company.address, margin, y); y += 4; }
  if (company.email) { doc.text(company.email, margin, y); y += 4; }
  if (company.phone) { doc.text(company.phone, margin, y); y += 4; }
  if (company.taxId) { doc.text(`Tax ID: ${company.taxId}`, margin, y); y += 4; }
  y += 4;

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ---- INVOICE META + CUSTOMER ----
  const metaStartY = y;

  // Left side: Bill To
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('BILL TO', margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text(invoice.customerName, margin, y);
  y += 5;
  if (invoice.customerEmail) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(invoice.customerEmail, margin, y);
  }

  // Right side: Invoice details
  const rightX = pageWidth - margin;
  let metaY = metaStartY;
  const metaLabel = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(label, rightX - 60, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);
    doc.text(value, rightX, metaY, { align: 'right' });
    metaY += 6;
  };

  metaLabel('Invoice #:', invoice.invoiceNumber);
  metaLabel('Issue Date:', formatDate(invoice.issueDate));
  metaLabel('Due Date:', formatDate(invoice.dueDate));
  metaLabel('Status:', invoice.status.toUpperCase());

  y = Math.max(y, metaY) + 12;

  // ---- ITEMS TABLE ----
  const tableBody = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.rate, company.currency),
    formatCurrency(item.quantity * item.rate, company.currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 40 },
    },
    theme: 'striped',
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ---- TOTALS ----
  const totalsX = pageWidth - margin - 80;
  const totalsValX = pageWidth - margin;

  const drawTotalLine = (label: string, value: string, bold = false) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? 33 : 80, bold ? 33 : 80, bold ? 33 : 80);
    doc.text(label, totalsX, y);
    doc.text(value, totalsValX, y, { align: 'right' });
    y += 6;
  };

  drawTotalLine('Subtotal:', formatCurrency(invoice.subtotal, company.currency));
  if (invoice.taxRate > 0) {
    drawTotalLine(`Tax (${invoice.taxRate}%):`, formatCurrency(invoice.taxAmount, company.currency));
  }
  if (invoice.discount > 0) {
    drawTotalLine('Discount:', `-${formatCurrency(invoice.discount, company.currency)}`);
  }

  // Total line with background
  y += 2;
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(totalsX - 5, y - 5, pageWidth - margin - totalsX + 5, 10, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL:', totalsX, y + 1);
  doc.text(formatCurrency(invoice.total, company.currency), totalsValX, y + 1, { align: 'right' });
  y += 14;

  if (invoice.amountPaid > 0) {
    drawTotalLine('Amount Paid:', formatCurrency(invoice.amountPaid, company.currency));
    drawTotalLine('Amount Due:', formatCurrency(invoice.amountDue, company.currency), true);
  }

  // ---- NOTES & TERMS ----
  y += 8;
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Notes:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 4;
  }

  if (invoice.terms) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Terms:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const termLines = doc.splitTextToSize(invoice.terms, pageWidth - 2 * margin);
    doc.text(termLines, margin, y);
    y += termLines.length * 4 + 4;
  }

  // ---- FOOTER ----
  if (company.invoiceFooter) {
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(company.invoiceFooter, pageWidth / 2, footerY, { align: 'center' });
  }

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
