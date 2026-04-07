/**
 * Bill PDF Generator
 * Server-side PDF generation using jsPDF + jspdf-autotable
 * Supports dynamic color themes and visibility toggles via company.doc* fields
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ══════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════

interface BillData {
  billNumber?: string;
  vendorName: string;
  issueDate: any;
  dueDate?: any;
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  notes?: string;
}

interface CompanyData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  taxId?: string;
  currency: string;
  docTemplate?: 'classic' | 'modern' | 'minimal';
  docColorTheme?: string;
  docShowCompanyName?: boolean;
  docShowCompanyAddress?: boolean;
  docShowCompanyEmail?: boolean;
  docShowCompanyPhone?: boolean;
  docShowTaxId?: boolean;
  docShowPoweredBy?: boolean;
}

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

// Status/fixed colors (not part of brand palette)
const GREEN: RGB = [34, 139, 34] as const;

// ══════════════════════════════════════════
//  HELPERS
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

// Page constants
const PW = 210;
const PH = 297;
const ML = 20;
const MR = 20;
const CONTENT_W = PW - ML - MR;

// ══════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════

export function generateBillPDF(bill: BillData, company: CompanyData): Buffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  const fmt = (n: number) => formatCurrency(n, company.currency);
  const palette = buildPalette(company.docColorTheme || '#D97757');
  let y = 0;

  // ── Top accent bar ──
  doc.setFillColor(...palette.brand);
  doc.rect(0, 0, PW, 3, 'F');
  y = 18;

  // ── Header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...palette.text);
  if (company.docShowCompanyName !== false) {
    doc.text(company.name || 'Company', ML, y);
  }

  doc.setFontSize(26);
  doc.setTextColor(...palette.brand);
  doc.text('BILL', PW - MR, y, { align: 'right' });
  y += 6;

  // Company details
  const details: string[] = [];
  if (company.docShowCompanyAddress !== false && company.address) {
    details.push(company.city ? `${company.address}, ${company.city}` : company.address);
  }
  if (company.docShowCompanyEmail !== false && company.email) details.push(company.email);
  if (company.docShowCompanyPhone !== false && company.phone) details.push(company.phone);
  if (company.docShowTaxId !== false && company.taxId) details.push(`Tax ID: ${company.taxId}`);

  if (details.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...palette.textLight);
    details.forEach(line => {
      doc.text(line, ML, y);
      y += 3.5;
    });
  }

  y = Math.max(y, 32) + 6;

  // Divider
  doc.setDrawColor(...palette.border);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
  y += 10;

  // ── Vendor Info + Bill Meta (two columns) ──
  const metaStartY = y;

  // Left: Vendor info
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...palette.brand);
  doc.text('VENDOR', ML, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...palette.text);
  doc.text(bill.vendorName || '-', ML, y);
  y += 5;

  // Right: Bill meta
  const metaRightEdge = PW - MR;
  const metaLabelX = metaRightEdge - 55;
  let metaY = metaStartY;

  const metaRows: [string, string, boolean][] = [
    ['Bill #', bill.billNumber || '-', false],
    ['Issue Date', formatDate(bill.issueDate), false],
    ...(bill.dueDate ? [['Due Date', formatDate(bill.dueDate), false] as [string, string, boolean]] : []),
    ['Status', (bill.status || 'unpaid').toUpperCase(), true],
  ];

  metaRows.forEach(([label, value, highlight]) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.textLight);
    doc.text(`${label}:`, metaLabelX, metaY, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    const metaColor = highlight ? palette.brand : palette.text;
    doc.setTextColor(metaColor[0], metaColor[1], metaColor[2]);
    doc.text(value, metaRightEdge, metaY, { align: 'right' });
    metaY += 5.5;
  });

  y = Math.max(y, metaY) + 10;

  // ── Line Items Table ──
  const tableBody = (bill.items || []).map(item => [
    item.description || '',
    (item.quantity ?? 0).toString(),
    fmt(item.rate ?? 0),
    fmt((item.quantity ?? 0) * (item.rate ?? 0)),
  ]);
  if (tableBody.length === 0) {
    tableBody.push(['-', '0', fmt(0), fmt(0)]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    margin: { left: ML, right: MR },
    headStyles: {
      fillColor: [palette.brand[0], palette.brand[1], palette.brand[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [palette.text[0], palette.text[1], palette.text[2]],
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: [palette.border[0], palette.border[1], palette.border[2]],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [palette.rowAlt[0], palette.rowAlt[1], palette.rowAlt[2]],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    styles: { overflow: 'linebreak' },
    theme: 'grid',
    tableLineColor: [palette.border[0], palette.border[1], palette.border[2]],
    tableLineWidth: 0.2,
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // ── Totals ──
  const tableEdge = PW - MR;
  const totalsBlockLeft = tableEdge - 65;

  doc.setDrawColor(...palette.border);
  doc.setLineWidth(0.3);
  doc.line(totalsBlockLeft, y, tableEdge, y);
  y += 6;

  const valX = tableEdge - 4;
  const lblX = totalsBlockLeft + 4;

  const drawRow = (label: string, value: string, opts?: { bold?: boolean; color?: RGB; size?: number }) => {
    const { bold = false, color = palette.textMid, size = 9 } = opts || {};
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(label, lblX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += 5.5;
  };

  drawRow('Subtotal', fmt(bill.subtotal));

  if (bill.taxAmount > 0) {
    drawRow('Tax', fmt(bill.taxAmount));
  }

  // Total highlight box
  y += 1;
  const totalBoxH = 9;
  doc.setFillColor(...palette.brand);
  doc.roundedRect(totalsBlockLeft, y - 5, tableEdge - totalsBlockLeft, totalBoxH, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...palette.white);
  doc.text('Total', lblX, y);
  doc.text(fmt(bill.total), valX, y, { align: 'right' });
  y += totalBoxH + 3;

  if (bill.amountPaid > 0) {
    drawRow('Amount Paid', fmt(bill.amountPaid), { color: GREEN });
  }

  if (bill.amountDue > 0 && bill.amountPaid > 0) {
    const dueBoxH = 8;
    doc.setFillColor(...palette.brandBg);
    doc.roundedRect(totalsBlockLeft, y - 4.5, tableEdge - totalsBlockLeft, dueBoxH, 1.5, 1.5, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...palette.brand);
    doc.text('Amount Due', lblX, y);
    doc.text(fmt(bill.amountDue), valX, y, { align: 'right' });
    y += dueBoxH + 2;
  }

  // ── Notes ──
  y += 6;
  if (bill.notes) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...palette.brand);
    doc.text('NOTES', ML, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.textMid);
    const noteLines = doc.splitTextToSize(bill.notes, CONTENT_W);
    doc.text(noteLines, ML, y);
    y += noteLines.length * 3.5 + 4;
  }

  // ── Footer ──
  const footerY = PH - 14;
  doc.setDrawColor(...palette.border);
  doc.setLineWidth(0.2);
  doc.line(ML, footerY - 4, PW - MR, footerY - 4);

  if (company.docShowPoweredBy !== false) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.textLight);
    doc.text('Powered by Flowbooks', PW / 2, footerY + 1, { align: 'center' });
  }

  // Bottom accent bar
  doc.setFillColor(...palette.brand);
  doc.rect(0, PH - 3, PW, 3, 'F');

  return Buffer.from(doc.output('arraybuffer'));
}
