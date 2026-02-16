/**
 * Invoice PDF Generator
 * Server-side PDF generation using jsPDF + jspdf-autotable
 * Theme: Terracotta (#D97757) / Warm Brown (#C4694D)
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

// Terracotta theme RGB values
const BRAND = { r: 217, g: 119, b: 87 };     // #D97757
const BRAND_DARK = { r: 196, g: 105, b: 77 }; // #C4694D
const BRAND_LIGHT_BG = { r: 254, g: 244, b: 240 }; // #FEF4F0
const WARM_GRAY = { r: 250, g: 249, b: 247 };  // #FAF9F7
const TEXT_PRIMARY = { r: 26, g: 25, b: 21 };   // #1A1915
const TEXT_SECONDARY = { r: 92, g: 87, b: 82 }; // #5C5752
const TEXT_TERTIARY = { r: 120, g: 115, b: 109 }; // #78736D
const BORDER = { r: 232, g: 229, b: 222 };      // #E8E5DE

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
  return `${sym}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateInvoicePDF(invoice: InvoiceData, company: CompanyData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // ---- TOP ACCENT BAR ----
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageWidth, 4, 'F');
  y = 20;

  // ---- HEADER ----
  // Company name (left)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
  doc.text(company.name, margin, y);

  // "INVOICE" label (right)
  doc.setFontSize(28);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Company details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_TERTIARY.r, TEXT_TERTIARY.g, TEXT_TERTIARY.b);
  if (company.address) { doc.text(company.address, margin, y); y += 4; }
  if (company.email) { doc.text(company.email, margin, y); y += 4; }
  if (company.phone) { doc.text(company.phone, margin, y); y += 4; }
  if (company.taxId) { doc.text(`Tax ID: ${company.taxId}`, margin, y); y += 4; }
  y += 4;

  // Divider line
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ---- INVOICE META + CUSTOMER ----
  const metaStartY = y;

  // Left side: Bill To
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.text('BILL TO', margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
  doc.text(invoice.customerName, margin, y);
  y += 5;
  if (invoice.customerEmail) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY.r, TEXT_SECONDARY.g, TEXT_SECONDARY.b);
    doc.text(invoice.customerEmail, margin, y);
  }

  // Right side: Invoice details
  const rightX = pageWidth - margin;
  let metaY = metaStartY;
  const metaLabel = (label: string, value: string, highlight = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_TERTIARY.r, TEXT_TERTIARY.g, TEXT_TERTIARY.b);
    doc.text(label, rightX - 60, metaY);
    doc.setFont('helvetica', 'normal');
    if (highlight) {
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    } else {
      doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
    }
    doc.text(value, rightX, metaY, { align: 'right' });
    metaY += 6;
  };

  metaLabel('Invoice #:', invoice.invoiceNumber);
  metaLabel('Issue Date:', formatDate(invoice.issueDate));
  metaLabel('Due Date:', formatDate(invoice.dueDate));
  metaLabel('Status:', invoice.status.toUpperCase(), true);

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
      fillColor: [BRAND.r, BRAND.g, BRAND.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b],
    },
    alternateRowStyles: {
      fillColor: [WARM_GRAY.r, WARM_GRAY.g, WARM_GRAY.b],
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
    if (bold) {
      doc.setTextColor(TEXT_PRIMARY.r, TEXT_PRIMARY.g, TEXT_PRIMARY.b);
    } else {
      doc.setTextColor(TEXT_SECONDARY.r, TEXT_SECONDARY.g, TEXT_SECONDARY.b);
    }
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

  // Total line with terracotta background
  y += 2;
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
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
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    doc.text('Notes:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY.r, TEXT_SECONDARY.g, TEXT_SECONDARY.b);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 4;
  }

  if (invoice.terms) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    doc.text('Terms:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY.r, TEXT_SECONDARY.g, TEXT_SECONDARY.b);
    const termLines = doc.splitTextToSize(invoice.terms, pageWidth - 2 * margin);
    doc.text(termLines, margin, y);
    y += termLines.length * 4 + 4;
  }

  // ---- FOOTER ----
  const footerY = pageHeight - 15;
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

  if (company.invoiceFooter) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_TERTIARY.r, TEXT_TERTIARY.g, TEXT_TERTIARY.b);
    doc.text(company.invoiceFooter, pageWidth / 2, footerY - 2, { align: 'center' });
  }

  // "Powered by Flowbooks" at bottom
  doc.setFontSize(7);
  doc.setTextColor(TEXT_TERTIARY.r, TEXT_TERTIARY.g, TEXT_TERTIARY.b);
  doc.text('Powered by Flowbooks', pageWidth / 2, footerY + 4, { align: 'center' });

  // Bottom accent bar
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
