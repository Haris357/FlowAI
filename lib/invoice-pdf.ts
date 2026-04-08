/**
 * Invoice PDF Generator
 * Server-side PDF generation using jsPDF + jspdf-autotable
 * Supports 3 templates: Classic, Modern, Minimal
 * Color theme and visibility preferences are configurable per company
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ══════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════

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
  currency?: string;
  exchangeRate?: number;
  totalInBaseCurrency?: number;
}

interface CompanyData {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  taxId?: string;
  currency: string;
  invoiceFooter?: string;
  invoiceTemplate?: 'classic' | 'modern' | 'minimal';
  invoiceColorTheme?: string;
  invoiceShowCompanyName?: boolean;
  invoiceShowCompanyAddress?: boolean;
  invoiceShowCompanyEmail?: boolean;
  invoiceShowCompanyPhone?: boolean;
  invoiceShowTaxId?: boolean;
  invoiceShowFooter?: boolean;
  invoiceShowPoweredBy?: boolean;
}

type TemplateType = 'classic' | 'modern' | 'minimal';
type RGB = readonly [number, number, number];

interface ColorPalette {
  brand: RGB;
  brandDark: RGB;
  brandBg: RGB;
  text: RGB;
  textMid: RGB;
  textLight: RGB;
  border: RGB;
  rowAlt: RGB;
  white: RGB;
}

// ══════════════════════════════════════════
//  COLOR UTILITIES
// ══════════════════════════════════════════

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return [r, g, b] as const;
}

function lighten(rgb: RGB, amount: number): RGB {
  return [
    Math.min(255, Math.round(rgb[0] + (255 - rgb[0]) * amount)),
    Math.min(255, Math.round(rgb[1] + (255 - rgb[1]) * amount)),
    Math.min(255, Math.round(rgb[2] + (255 - rgb[2]) * amount)),
  ] as const;
}

function darken(rgb: RGB, amount: number): RGB {
  return [
    Math.max(0, Math.round(rgb[0] * (1 - amount))),
    Math.max(0, Math.round(rgb[1] * (1 - amount))),
    Math.max(0, Math.round(rgb[2] * (1 - amount))),
  ] as const;
}

function buildPalette(hex: string): ColorPalette {
  const brand = hexToRgb(hex);
  return {
    brand,
    brandDark: darken(brand, 0.15),
    brandBg: lighten(brand, 0.88),
    text: [30, 30, 30] as const,
    textMid: [100, 100, 100] as const,
    textLight: [140, 140, 140] as const,
    border: [220, 220, 220] as const,
    rowAlt: [248, 248, 248] as const,
    white: [255, 255, 255] as const,
  };
}

// ══════════════════════════════════════════
//  SHARED HELPERS
// ══════════════════════════════════════════

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
    USD: '$', EUR: '\u20AC', GBP: '\u00A3', INR: '\u20B9', PKR: 'Rs ',
    AED: 'AED ', SAR: 'SAR ', AUD: 'A$', CAD: 'C$',
    SGD: 'S$', MYR: 'RM ', JPY: '\u00A5', CNY: '\u00A5',
  };
  const sym = symbols[currency] || `${currency} `;
  return `${sym}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCompanyDetails(company: CompanyData): string[] {
  const details: string[] = [];
  if (company.contactName) details.push(company.contactName);
  if (company.invoiceShowCompanyAddress !== false && company.address) {
    const addr = company.city ? `${company.address}, ${company.city}` : company.address;
    details.push(addr);
  }
  if (company.invoiceShowCompanyEmail !== false && company.email) details.push(company.email);
  if (company.invoiceShowCompanyPhone !== false && company.phone) details.push(company.phone);
  if (company.invoiceShowTaxId !== false && company.taxId) details.push(`Tax ID: ${company.taxId}`);
  return details;
}

function getTableBody(invoice: InvoiceData, currency: string): string[][] {
  const body = (invoice.items || []).map(item => [
    item.description || '',
    (item.quantity ?? 0).toString(),
    formatCurrency(item.rate ?? 0, currency),
    formatCurrency((item.quantity ?? 0) * (item.rate ?? 0), currency),
  ]);
  if (body.length === 0) {
    body.push(['-', '0', formatCurrency(0, currency), formatCurrency(0, currency)]);
  }
  return body;
}

// Page constants
const PW = 210;  // A4 width
const PH = 297;  // A4 height
const ML = 20;   // margin left
const MR = 20;   // margin right
const CONTENT_W = PW - ML - MR;

// ══════════════════════════════════════════
//  TEMPLATE: CLASSIC
// ══════════════════════════════════════════

function renderClassic(doc: jsPDF, invoice: InvoiceData, company: CompanyData, P: ColorPalette): void {
  let y = 0;

  // ── Top accent bar ──
  doc.setFillColor(...P.brand);
  doc.rect(0, 0, PW, 3, 'F');
  y = 18;

  // ── Header ──
  if (company.invoiceShowCompanyName !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...P.text);
    doc.text(company.name || 'Company', ML, y);
  }

  doc.setFontSize(26);
  doc.setTextColor(...P.brand);
  doc.text('INVOICE', PW - MR, y, { align: 'right' });
  y += 6;

  // Company details
  const details = getCompanyDetails(company);
  if (details.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...P.textLight);
    details.forEach(line => {
      doc.text(line, ML, y);
      y += 3.5;
    });
  }

  y = Math.max(y, 32) + 6;

  // Divider
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
  y += 10;

  // ── Bill To + Invoice Meta ──
  const metaStartY = y;

  // Left: Bill To
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...P.brand);
  doc.text('BILL TO', ML, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...P.text);
  doc.text(invoice.customerName || '-', ML, y);
  y += 4.5;

  if (invoice.customerEmail) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.textMid);
    doc.text(invoice.customerEmail, ML, y);
    y += 4;
  }

  // Right: Invoice meta
  const metaRightEdge = PW - MR;
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
    doc.setTextColor(...P.textLight);
    doc.text(`${label}:`, metaLabelX, metaY, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    const metaColor = highlight ? P.brand : P.text;
    doc.setTextColor(metaColor[0], metaColor[1], metaColor[2]);
    doc.text(value, metaRightEdge, metaY, { align: 'right' });
    metaY += 5.5;
  });

  y = Math.max(y, metaY) + 10;

  // ── Line Items Table ──
  const tableBody = getTableBody(invoice, company.currency);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    margin: { left: ML, right: MR },
    headStyles: {
      fillColor: [P.brand[0], P.brand[1], P.brand[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [P.text[0], P.text[1], P.text[2]],
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: [P.border[0], P.border[1], P.border[2]],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [P.rowAlt[0], P.rowAlt[1], P.rowAlt[2]],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    styles: { overflow: 'linebreak' },
    theme: 'grid',
    tableLineColor: [P.border[0], P.border[1], P.border[2]],
    tableLineWidth: 0.2,
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // ── Separator line between table and totals ──
  const tableEdge = PW - MR;
  const totalsBlockLeft = tableEdge - 65;
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.3);
  doc.line(totalsBlockLeft, y, tableEdge, y);
  y += 6;

  // ── Totals ──
  const valX = tableEdge - 4;
  const lblX = totalsBlockLeft + 4;

  const drawRow = (label: string, value: string, opts?: { bold?: boolean; color?: RGB; size?: number }) => {
    const { bold = false, color = P.textMid, size = 9 } = opts || {};
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(label, lblX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += 5.5;
  };

  drawRow('Subtotal', formatCurrency(invoice.subtotal, company.currency));

  if (invoice.taxRate > 0 || invoice.taxAmount > 0) {
    const taxLabel = invoice.taxRate > 0 ? `Tax (${invoice.taxRate}%)` : 'Tax';
    drawRow(taxLabel, formatCurrency(invoice.taxAmount, company.currency));
  }

  if (invoice.discount > 0) {
    drawRow('Discount', `- ${formatCurrency(invoice.discount, company.currency)}`);
  }

  // Total highlight box
  y += 1;
  const totalBoxH = 9;
  const totalBoxL = totalsBlockLeft;
  const totalBoxW = tableEdge - totalBoxL;
  doc.setFillColor(...P.brand);
  doc.roundedRect(totalBoxL, y - 5, totalBoxW, totalBoxH, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...P.white);
  const invoiceDisplayCurrency = invoice.currency || company.currency;
  doc.text('Total', lblX, y);
  doc.text(formatCurrency(invoice.total, invoiceDisplayCurrency), valX, y, { align: 'right' });
  y += totalBoxH + 3;

  // Dual-currency note: show base-currency equivalent if doc currency differs
  if (invoice.currency && invoice.currency !== company.currency && invoice.totalInBaseCurrency != null) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.textMid);
    doc.text(`≈ ${formatCurrency(invoice.totalInBaseCurrency, company.currency)} (${company.currency})`, valX, y, { align: 'right' });
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...P.text);
  }

  if (invoice.amountPaid > 0) {
    drawRow('Amount Paid', formatCurrency(invoice.amountPaid, invoiceDisplayCurrency), { color: [34, 139, 34] as RGB });
  }

  if (invoice.amountDue > 0 && invoice.amountPaid > 0) {
    // Amount Due with subtle background
    const dueBoxH = 8;
    doc.setFillColor(...P.brandBg);
    doc.roundedRect(totalsBlockLeft, y - 4.5, totalBoxW, dueBoxH, 1.5, 1.5, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...P.brand);
    doc.text('Amount Due', lblX, y);
    doc.text(formatCurrency(invoice.amountDue, invoiceDisplayCurrency), valX, y, { align: 'right' });
    y += dueBoxH + 2;
  }

  // ── Notes & Terms ──
  y += 6;
  y = drawNotesTerms(doc, invoice, company, P, y);

  // ── Footer ──
  drawFooter(doc, company, P, 'classic');
}

// ══════════════════════════════════════════
//  TEMPLATE: MODERN
// ══════════════════════════════════════════

function renderModern(doc: jsPDF, invoice: InvoiceData, company: CompanyData, P: ColorPalette): void {
  // Left color stripe (full page height)
  doc.setFillColor(...P.brand);
  doc.rect(0, 0, 4, PH, 'F');

  let y = 22;
  const ml = 18; // slightly left-aligned for modern feel

  // ── Header ──
  if (company.invoiceShowCompanyName !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...P.text);
    doc.text(company.name || 'Company', ml, y);
    y += 7;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...P.brand);
  doc.text('INVOICE', ml, y);
  y += 4;

  // Company details (inline, separated by bullet)
  const details = getCompanyDetails(company);
  if (details.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...P.textLight);
    doc.text(details.join('  \u2022  '), ml, y);
    y += 6;
  }

  y += 4;

  // ── Invoice meta card (right side) ──
  const cardW = 72;
  const cardX = PW - MR - cardW;
  const cardY = 16;
  const cardH = 38;

  doc.setFillColor(...P.brandBg);
  doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, 'F');

  const metaRows: [string, string][] = [
    ['Invoice #', invoice.invoiceNumber || '-'],
    ['Issue Date', formatDate(invoice.issueDate)],
    ['Due Date', formatDate(invoice.dueDate)],
    ['Status', (invoice.status || 'draft').toUpperCase()],
  ];

  let metaY = cardY + 8;
  metaRows.forEach(([label, value]) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.textLight);
    doc.text(label, cardX + 6, metaY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...P.text);
    doc.text(value, cardX + cardW - 6, metaY, { align: 'right' });
    metaY += 7.5;
  });

  // ── Bill To ──
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...P.textLight);
  doc.text('BILL TO', ml, y);
  y += 5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...P.text);
  doc.text(invoice.customerName || '-', ml, y);
  y += 5;

  if (invoice.customerEmail) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.textMid);
    doc.text(invoice.customerEmail, ml, y);
    y += 4;
  }

  y = Math.max(y, cardY + cardH + 8);

  // ── Line Items Table (borderless modern style) ──
  const tableBody = getTableBody(invoice, company.currency);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    margin: { left: ml, right: MR },
    headStyles: {
      fillColor: [P.brand[0], P.brand[1], P.brand[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [P.text[0], P.text[1], P.text[2]],
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      lineColor: [P.border[0], P.border[1], P.border[2]],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [P.rowAlt[0], P.rowAlt[1], P.rowAlt[2]],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    styles: { overflow: 'linebreak' },
    theme: 'striped',
    tableLineWidth: 0,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Totals card (right-aligned) ──
  const tableEdge = PW - MR;
  const totalsCardW = 68;
  const totalsCardX = tableEdge - totalsCardW;
  const valX = tableEdge - 6;
  const lblX = totalsCardX + 6;

  // Calculate card height based on content
  let rowCount = 1; // subtotal always
  if (invoice.taxRate > 0 || invoice.taxAmount > 0) rowCount++;
  if (invoice.discount > 0) rowCount++;
  rowCount++; // total
  if (invoice.amountPaid > 0) rowCount++;
  if (invoice.amountDue > 0 && invoice.amountPaid > 0) rowCount++;

  const totalsCardH = rowCount * 7 + 14;

  // Card background
  doc.setFillColor(...P.brandBg);
  doc.roundedRect(totalsCardX, y - 4, totalsCardW, totalsCardH, 2.5, 2.5, 'F');
  doc.setDrawColor(...lighten(P.brand, 0.6));
  doc.setLineWidth(0.3);
  doc.roundedRect(totalsCardX, y - 4, totalsCardW, totalsCardH, 2.5, 2.5, 'S');

  y += 3;

  const drawRow = (label: string, value: string, opts?: { bold?: boolean; color?: RGB; size?: number }) => {
    const { bold = false, color = P.textMid, size = 9 } = opts || {};
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(label, lblX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += 7;
  };

  drawRow('Subtotal', formatCurrency(invoice.subtotal, company.currency));

  if (invoice.taxRate > 0 || invoice.taxAmount > 0) {
    const taxLabel = invoice.taxRate > 0 ? `Tax (${invoice.taxRate}%)` : 'Tax';
    drawRow(taxLabel, formatCurrency(invoice.taxAmount, company.currency));
  }

  if (invoice.discount > 0) {
    drawRow('Discount', `- ${formatCurrency(invoice.discount, company.currency)}`);
  }

  // Total — inline branded bar
  doc.setFillColor(...P.brand);
  doc.roundedRect(totalsCardX + 3, y - 5, totalsCardW - 6, 9, 1.5, 1.5, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...P.white);
  doc.text('Total', lblX, y);
  doc.text(formatCurrency(invoice.total, company.currency), valX, y, { align: 'right' });
  y += 9;

  if (invoice.amountPaid > 0) {
    drawRow('Amount Paid', formatCurrency(invoice.amountPaid, company.currency), { color: [34, 139, 34] as RGB });
  }
  if (invoice.amountDue > 0 && invoice.amountPaid > 0) {
    drawRow('Amount Due', formatCurrency(invoice.amountDue, company.currency), { bold: true, color: P.brand, size: 10 });
  }

  y += 8;

  // ── Notes & Terms ──
  y = drawNotesTerms(doc, invoice, company, P, y, ml);

  // ── Footer ──
  drawFooter(doc, company, P, 'modern');
}

// ══════════════════════════════════════════
//  TEMPLATE: MINIMAL
// ══════════════════════════════════════════

function renderMinimal(doc: jsPDF, invoice: InvoiceData, company: CompanyData, P: ColorPalette): void {
  const black: RGB = [30, 30, 30];
  const gray: RGB = [120, 120, 120];
  const lightGray: RGB = [180, 180, 180];
  const borderGray: RGB = [200, 200, 200];

  let y = 20;

  // ── Header ──
  if (company.invoiceShowCompanyName !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...black);
    doc.text(company.name || 'Company', ML, y);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(18);
  doc.setTextColor(...gray);
  doc.text('INVOICE', PW - MR, y, { align: 'right' });
  y += 5;

  // Company details
  const details = getCompanyDetails(company);
  if (details.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...lightGray);
    details.forEach(line => {
      doc.text(line, ML, y);
      y += 3.5;
    });
  }

  y = Math.max(y, 30) + 4;

  // Thin separator
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.2);
  doc.line(ML, y, PW - MR, y);
  y += 10;

  // ── Bill To + Meta ──
  const metaStartY = y;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);
  doc.text('BILL TO', ML, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(invoice.customerName || '-', ML, y);
  y += 4.5;

  if (invoice.customerEmail) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(invoice.customerEmail, ML, y);
    y += 4;
  }

  // Right: meta
  const metaRightEdge = PW - MR;
  let metaY = metaStartY;

  const metaRows: [string, string][] = [
    ['Invoice #', invoice.invoiceNumber || '-'],
    ['Issue Date', formatDate(invoice.issueDate)],
    ['Due Date', formatDate(invoice.dueDate)],
    ['Status', (invoice.status || 'draft').toUpperCase()],
  ];

  metaRows.forEach(([label, value]) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);
    doc.text(`${label}:`, metaRightEdge - 55, metaY, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(value, metaRightEdge, metaY, { align: 'right' });
    metaY += 5.5;
  });

  y = Math.max(y, metaY) + 10;

  // ── Line Items Table (minimal — horizontal rules only) ──
  const tableBody = getTableBody(invoice, company.currency);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    margin: { left: ML, right: MR },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [black[0], black[1], black[2]],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [black[0], black[1], black[2]],
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      lineColor: [borderGray[0], borderGray[1], borderGray[2]],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    styles: { overflow: 'linebreak' },
    theme: 'plain',
    tableLineWidth: 0,
    didDrawCell: (data: any) => {
      // Draw bottom border on each row
      if (data.section === 'body' || data.section === 'head') {
        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.15);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Totals (right-aligned, clean) ──
  const tableEdge = PW - MR;
  const totalsBlockLeft = tableEdge - 62;
  const valX = tableEdge - 4;
  const lblX = totalsBlockLeft + 4;

  const drawRow = (label: string, value: string, opts?: { bold?: boolean; color?: RGB; size?: number }) => {
    const { bold = false, color = gray, size = 9 } = opts || {};
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(label, lblX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += 5.5;
  };

  drawRow('Subtotal', formatCurrency(invoice.subtotal, company.currency));

  if (invoice.taxRate > 0 || invoice.taxAmount > 0) {
    const taxLabel = invoice.taxRate > 0 ? `Tax (${invoice.taxRate}%)` : 'Tax';
    drawRow(taxLabel, formatCurrency(invoice.taxAmount, company.currency));
  }

  if (invoice.discount > 0) {
    drawRow('Discount', `- ${formatCurrency(invoice.discount, company.currency)}`);
  }

  // Double line above total
  y += 1;
  doc.setDrawColor(...black);
  doc.setLineWidth(0.4);
  doc.line(totalsBlockLeft, y - 3, tableEdge, y - 3);
  doc.setLineWidth(0.15);
  doc.line(totalsBlockLeft, y - 1.5, tableEdge, y - 1.5);
  y += 2;

  // Total row
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('Total', lblX, y);
  doc.text(formatCurrency(invoice.total, company.currency), valX, y, { align: 'right' });
  y += 7;

  if (invoice.amountPaid > 0) {
    drawRow('Amount Paid', formatCurrency(invoice.amountPaid, company.currency), { color: [34, 139, 34] as RGB });
  }

  if (invoice.amountDue > 0 && invoice.amountPaid > 0) {
    // Subtle underline for amount due
    doc.setDrawColor(...black);
    doc.setLineWidth(0.3);
    doc.line(totalsBlockLeft, y - 2, tableEdge, y - 2);
    y += 2;
    drawRow('Amount Due', formatCurrency(invoice.amountDue, company.currency), { bold: true, color: black, size: 10 });
  }

  // ── Notes & Terms ──
  y += 6;
  y = drawNotesTerms(doc, invoice, company, { ...P, brand: gray, textMid: gray }, y);

  // ── Footer ──
  drawFooter(doc, company, { ...P, brand: gray, textLight: lightGray }, 'minimal');
}

// ══════════════════════════════════════════
//  SHARED RENDERERS
// ══════════════════════════════════════════

function drawNotesTerms(doc: jsPDF, invoice: InvoiceData, company: CompanyData, P: ColorPalette, y: number, marginLeft: number = ML): number {
  if (invoice.notes) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...P.brand);
    doc.text('NOTES', marginLeft, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.textMid);
    const noteLines = doc.splitTextToSize(invoice.notes, CONTENT_W);
    doc.text(noteLines, marginLeft, y);
    y += noteLines.length * 3.5 + 4;
  }

  if (invoice.terms) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...P.brand);
    doc.text('TERMS & CONDITIONS', marginLeft, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.textMid);
    const termLines = doc.splitTextToSize(invoice.terms, CONTENT_W);
    doc.text(termLines, marginLeft, y);
    y += termLines.length * 3.5 + 4;
  }

  return y;
}

function drawFooter(doc: jsPDF, company: CompanyData, P: ColorPalette, template: TemplateType): void {
  const footerY = PH - 14;

  // Divider
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.line(ML, footerY - 4, PW - MR, footerY - 4);

  // Custom footer text
  if (company.invoiceShowFooter !== false && company.invoiceFooter) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...P.textLight);
    doc.text(company.invoiceFooter, PW / 2, footerY + 1, { align: 'center' });
  }

  // Powered by
  if (company.invoiceShowPoweredBy !== false) {
    doc.setFontSize(6.5);
    doc.setTextColor(...P.textLight);
    const poweredY = (company.invoiceShowFooter !== false && company.invoiceFooter) ? footerY + 5 : footerY + 1;
    doc.text('Powered by Flowbooks', PW / 2, poweredY, { align: 'center' });
  }

  // Bottom accent (only for classic and modern)
  if (template === 'classic') {
    doc.setFillColor(...P.brand);
    doc.rect(0, PH - 3, PW, 3, 'F');
  } else if (template === 'modern') {
    // Modern keeps the left stripe (already drawn)
  }
  // Minimal: no bottom accent
}

// ══════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════

export function generateInvoicePDF(invoice: InvoiceData, company: CompanyData): Buffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  const template: TemplateType = company.invoiceTemplate || 'classic';
  const palette = buildPalette(company.invoiceColorTheme || '#D97757');

  switch (template) {
    case 'modern':
      renderModern(doc, invoice, company, palette);
      break;
    case 'minimal':
      renderMinimal(doc, invoice, company, palette);
      break;
    case 'classic':
    default:
      renderClassic(doc, invoice, company, palette);
      break;
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
