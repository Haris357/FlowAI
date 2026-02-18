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

// Color palette
const C = {
  brand:     [217, 119, 87] as const,   // #D97757
  brandDark: [196, 105, 77] as const,   // #C4694D
  brandBg:   [254, 244, 240] as const,  // #FEF4F0
  text:      [30, 30, 30] as const,     // #1E1E1E
  textMid:   [100, 100, 100] as const,  // #646464
  textLight: [140, 140, 140] as const,  // #8C8C8C
  border:    [220, 220, 220] as const,  // #DCDCDC
  rowAlt:    [248, 248, 248] as const,  // #F8F8F8
  white:     [255, 255, 255] as const,
};

function formatDate(date: any): string {
  if (!date) return '-';
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '-';
  }
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', PKR: 'Rs ',
    AED: 'AED ', SAR: 'SAR ', AUD: 'A$', CAD: 'C$',
    SGD: 'S$', MYR: 'RM ', JPY: '¥', CNY: '¥',
  };
  const sym = symbols[currency] || `${currency} `;
  return `${sym}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateInvoicePDF(invoice: InvoiceData, company: CompanyData): Buffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();   // 297
  const ml = 20;  // margin left
  const mr = 20;  // margin right
  const contentW = pw - ml - mr;
  let y = 0;

  // ── Top accent bar ──
  doc.setFillColor(...C.brand);
  doc.rect(0, 0, pw, 3, 'F');
  y = 18;

  // ══════════════════════════════════════════
  //  HEADER: Company name + INVOICE label
  // ══════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...C.text);
  doc.text(company.name || 'Company', ml, y);

  doc.setFontSize(26);
  doc.setTextColor(...C.brand);
  doc.text('INVOICE', pw - mr, y, { align: 'right' });

  y += 6;

  // Company details (small, below company name)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.textLight);
  const companyDetails: string[] = [];
  if (company.address) companyDetails.push(company.address);
  if (company.email) companyDetails.push(company.email);
  if (company.phone) companyDetails.push(company.phone);
  if (company.taxId) companyDetails.push(`Tax ID: ${company.taxId}`);

  companyDetails.forEach(line => {
    doc.text(line, ml, y);
    y += 3.5;
  });

  y = Math.max(y, 32) + 6;

  // Divider
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(ml, y, pw - mr, y);
  y += 10;

  // ══════════════════════════════════════════
  //  BILL TO + INVOICE META (two columns)
  // ══════════════════════════════════════════
  const metaStartY = y;

  // Left column: Bill To
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.brand);
  doc.text('BILL TO', ml, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.text);
  doc.text(invoice.customerName || '-', ml, y);
  y += 4.5;

  if (invoice.customerEmail) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMid);
    doc.text(invoice.customerEmail, ml, y);
    y += 4;
  }

  // Right column: Invoice meta (as a mini table for clean alignment)
  const metaRightEdge = pw - mr;
  const metaLabelX = metaRightEdge - 55;
  let metaY = metaStartY;

  const metaRows: [string, string, boolean][] = [
    ['Invoice #', invoice.invoiceNumber || '-', false],
    ['Issue Date', formatDate(invoice.issueDate), false],
    ['Due Date', formatDate(invoice.dueDate), false],
    ['Status', (invoice.status || 'draft').toUpperCase(), true],
  ];

  metaRows.forEach(([label, value, highlight]) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textLight);
    doc.text(`${label}:`, metaLabelX, metaY, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    const metaColor = highlight ? C.brand : C.text;
    doc.setTextColor(metaColor[0], metaColor[1], metaColor[2]);
    doc.text(value, metaRightEdge, metaY, { align: 'right' });
    metaY += 5.5;
  });

  y = Math.max(y, metaY) + 10;

  // ══════════════════════════════════════════
  //  LINE ITEMS TABLE
  // ══════════════════════════════════════════
  const tableBody = (invoice.items || []).map(item => [
    item.description || '',
    (item.quantity ?? 0).toString(),
    formatCurrency(item.rate ?? 0, company.currency),
    formatCurrency((item.quantity ?? 0) * (item.rate ?? 0), company.currency),
  ]);

  // Fallback if no items
  if (tableBody.length === 0) {
    tableBody.push(['-', '0', formatCurrency(0, company.currency), formatCurrency(0, company.currency)]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    margin: { left: ml, right: mr },
    headStyles: {
      fillColor: [C.brand[0], C.brand[1], C.brand[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [C.text[0], C.text[1], C.text[2]],
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: [C.border[0], C.border[1], C.border[2]],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [C.rowAlt[0], C.rowAlt[1], C.rowAlt[2]],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      overflow: 'linebreak',
    },
    theme: 'grid',
    tableLineColor: [C.border[0], C.border[1], C.border[2]],
    tableLineWidth: 0.2,
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ══════════════════════════════════════════
  //  TOTALS — pixel-aligned with Amount column
  // ══════════════════════════════════════════
  // Table: Description(auto) | Qty(20) | Rate(35) | Amount(38)
  // Cell padding = 4mm each side. Table right edge = 190.
  // Amount column text (right-aligned) ends at 190 - 4 = 186.
  const tableEdge = pw - mr;            // 190 — table grid right edge
  const valX = tableEdge - 4;           // 186 — matches Amount column text
  const lblX = tableEdge - 55;          // 135 — labels start here

  const drawTotalRow = (label: string, value: string, opts?: { bold?: boolean; color?: readonly [number, number, number]; size?: number }) => {
    const { bold = false, color = C.textMid, size = 9 } = opts || {};
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(label, lblX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += 6;
  };

  drawTotalRow('Subtotal', formatCurrency(invoice.subtotal, company.currency));

  if (invoice.taxRate > 0 || invoice.taxAmount > 0) {
    const taxLabel = invoice.taxRate > 0 ? `Tax (${invoice.taxRate}%)` : 'Tax';
    drawTotalRow(taxLabel, formatCurrency(invoice.taxAmount, company.currency));
  }

  if (invoice.discount > 0) {
    drawTotalRow('Discount', `- ${formatCurrency(invoice.discount, company.currency)}`);
  }

  // Total highlight box — ends exactly at table edge
  const totalBoxH = 8;
  const totalBoxL = lblX - 3;                      // 132
  const totalBoxW = tableEdge - totalBoxL;          // 58, ends at exactly 190
  doc.setFillColor(...C.brand);
  doc.roundedRect(totalBoxL, y - 4, totalBoxW, totalBoxH, 1.5, 1.5, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('Total', lblX, y);
  doc.text(formatCurrency(invoice.total, company.currency), valX, y, { align: 'right' });
  y += totalBoxH + 4;

  if (invoice.amountPaid > 0) {
    drawTotalRow('Amount Paid', formatCurrency(invoice.amountPaid, company.currency), { color: [34, 139, 34] });
  }
  if (invoice.amountDue > 0 && invoice.amountPaid > 0) {
    drawTotalRow('Amount Due', formatCurrency(invoice.amountDue, company.currency), { bold: true, color: C.brand, size: 10 });
  }

  // ══════════════════════════════════════════
  //  NOTES & TERMS
  // ══════════════════════════════════════════
  y += 6;

  if (invoice.notes) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.brand);
    doc.text('NOTES', ml, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMid);
    const noteLines = doc.splitTextToSize(invoice.notes, contentW);
    doc.text(noteLines, ml, y);
    y += noteLines.length * 3.5 + 4;
  }

  if (invoice.terms) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.brand);
    doc.text('TERMS & CONDITIONS', ml, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMid);
    const termLines = doc.splitTextToSize(invoice.terms, contentW);
    doc.text(termLines, ml, y);
    y += termLines.length * 3.5 + 4;
  }

  // ══════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════
  const footerY = ph - 14;

  // Divider line
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(ml, footerY - 4, pw - mr, footerY - 4);

  // Custom footer text
  if (company.invoiceFooter) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textLight);
    doc.text(company.invoiceFooter, pw / 2, footerY + 1, { align: 'center' });
  }

  // "Powered by Flowbooks"
  doc.setFontSize(6.5);
  doc.setTextColor(...C.textLight);
  doc.text('Powered by Flowbooks', pw / 2, footerY + (company.invoiceFooter ? 5 : 1), { align: 'center' });

  // Bottom accent bar
  doc.setFillColor(...C.brand);
  doc.rect(0, ph - 3, pw, 3, 'F');

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
