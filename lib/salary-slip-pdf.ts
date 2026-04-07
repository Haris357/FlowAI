/**
 * Salary Slip PDF Generator
 * Server-side PDF generation using jsPDF + jspdf-autotable
 * Supports dynamic color themes and visibility toggles via company.doc* fields
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalarySlipData {
  employeeName: string;
  employeeDesignation?: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: { hra: number; da: number; ta: number; other: number };
  totalEarnings: number;
  deductions: { tax: number; providentFund: number; loan: number; other: number };
  totalDeductions: number;
  netSalary: number;
  status: string;
  paidDate?: any;
  paymentMethod?: string;
}

interface EmployeeData {
  employeeId?: string;
  name: string;
  designation?: string;
  department?: string;
  bankName?: string;
  bankAccount?: string;
  taxId?: string;
}

interface CompanyData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', PKR: 'Rs ',
    AED: 'AED ', SAR: 'SAR ', AUD: 'A$', CAD: 'C$',
    SGD: 'S$', MYR: 'RM ', JPY: '¥', CNY: '¥',
  };
  const sym = symbols[currency] || `${currency} `;
  return `${sym}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: any): string {
  if (!date) return '-';
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '-';
  }
}

export function generateSalarySlipPDF(slip: SalarySlipData, employee: EmployeeData, company: CompanyData): Buffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();   // 297
  const ml = 20;
  const mr = 20;
  const contentW = pw - ml - mr;
  let y = 0;

  const fmt = (n: number) => formatCurrency(n, company.currency);
  const palette = buildPalette(company.docColorTheme || '#D97757');

  // ── Top accent bar ──
  doc.setFillColor(...palette.brand);
  doc.rect(0, 0, pw, 3, 'F');
  y = 18;

  // ══════════════════════════════════════════
  //  HEADER
  // ══════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...palette.text);
  if (company.docShowCompanyName !== false) {
    doc.text(company.name || 'Company', ml, y);
  }

  doc.setFontSize(24);
  doc.setTextColor(...palette.brand);
  doc.text('SALARY SLIP', pw - mr, y, { align: 'right' });

  y += 6;

  // Company details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...palette.textLight);
  const details: string[] = [];
  if (company.docShowCompanyAddress !== false && company.address) details.push(company.address);
  if (company.docShowCompanyEmail !== false && company.email) details.push(company.email);
  if (company.docShowCompanyPhone !== false && company.phone) details.push(company.phone);
  if (company.docShowTaxId !== false && company.taxId) details.push(`Tax ID: ${company.taxId}`);

  details.forEach(line => {
    doc.text(line, ml, y);
    y += 3.5;
  });

  y = Math.max(y, 32) + 6;

  // Divider
  doc.setDrawColor(...palette.border);
  doc.setLineWidth(0.3);
  doc.line(ml, y, pw - mr, y);
  y += 10;

  // ══════════════════════════════════════════
  //  EMPLOYEE INFO + PAY PERIOD (two columns)
  // ══════════════════════════════════════════
  const infoStartY = y;

  // Left: Employee details
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...palette.brand);
  doc.text('EMPLOYEE', ml, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...palette.text);
  doc.text(slip.employeeName || employee.name || '-', ml, y);
  y += 4.5;

  const empDetails: string[] = [];
  if (employee.designation || slip.employeeDesignation) empDetails.push(employee.designation || slip.employeeDesignation || '');
  if (employee.department) empDetails.push(employee.department);
  if (employee.employeeId) empDetails.push(`ID: ${employee.employeeId}`);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...palette.textMid);
  empDetails.forEach(line => {
    doc.text(line, ml, y);
    y += 4;
  });

  // Right: Pay period meta
  const metaRightEdge = pw - mr;
  const metaLabelX = metaRightEdge - 55;
  let metaY = infoStartY;

  const period = `${MONTHS[(slip.month || 1) - 1] || 'January'} ${slip.year || new Date().getFullYear()}`;

  const metaRows: [string, string, boolean][] = [
    ['Pay Period', period, false],
    ['Status', (slip.status || 'generated').toUpperCase(), true],
  ];
  if (slip.paidDate) {
    metaRows.push(['Paid Date', formatDate(slip.paidDate), false]);
  }
  if (slip.paymentMethod) {
    metaRows.push(['Payment', slip.paymentMethod, false]);
  }

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

  // ══════════════════════════════════════════
  //  EARNINGS & DEDUCTIONS (side by side)
  // ══════════════════════════════════════════
  const halfW = (contentW - 6) / 2;  // 6mm gap between tables
  const tableStartY = y;

  // --- Earnings Table (left) ---
  const earningsBody: string[][] = [];
  earningsBody.push(['Basic Salary', fmt(slip.basicSalary)]);
  if (slip.allowances.hra > 0) earningsBody.push(['House Rent Allowance', fmt(slip.allowances.hra)]);
  if (slip.allowances.da > 0) earningsBody.push(['Dearness Allowance', fmt(slip.allowances.da)]);
  if (slip.allowances.ta > 0) earningsBody.push(['Travel Allowance', fmt(slip.allowances.ta)]);
  if (slip.allowances.other > 0) earningsBody.push(['Other Allowances', fmt(slip.allowances.other)]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Earnings', 'Amount']],
    body: earningsBody,
    foot: [['Total Earnings', fmt(slip.totalEarnings)]],
    margin: { left: ml, right: pw - ml - halfW },
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
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      lineColor: [palette.border[0], palette.border[1], palette.border[2]],
      lineWidth: 0.2,
    },
    footStyles: {
      fillColor: [palette.brandBg[0], palette.brandBg[1], palette.brandBg[2]],
      textColor: [palette.text[0], palette.text[1], palette.text[2]],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: [palette.rowAlt[0], palette.rowAlt[1], palette.rowAlt[2]],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 30, halign: 'right' },
    },
    theme: 'grid',
    tableLineColor: [palette.border[0], palette.border[1], palette.border[2]],
    tableLineWidth: 0.2,
  });

  const earningsEndY = (doc as any).lastAutoTable.finalY;

  // --- Deductions Table (right) ---
  const deductionsBody: string[][] = [];
  if (slip.deductions.tax > 0) deductionsBody.push(['Income Tax', fmt(slip.deductions.tax)]);
  if (slip.deductions.providentFund > 0) deductionsBody.push(['Provident Fund', fmt(slip.deductions.providentFund)]);
  if (slip.deductions.loan > 0) deductionsBody.push(['Loan Repayment', fmt(slip.deductions.loan)]);
  if (slip.deductions.other > 0) deductionsBody.push(['Other Deductions', fmt(slip.deductions.other)]);
  if (deductionsBody.length === 0) deductionsBody.push(['No Deductions', fmt(0)]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Deductions', 'Amount']],
    body: deductionsBody,
    foot: [['Total Deductions', fmt(slip.totalDeductions)]],
    margin: { left: ml + halfW + 6, right: mr },
    headStyles: {
      fillColor: [palette.textMid[0], palette.textMid[1], palette.textMid[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [palette.text[0], palette.text[1], palette.text[2]],
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      lineColor: [palette.border[0], palette.border[1], palette.border[2]],
      lineWidth: 0.2,
    },
    footStyles: {
      fillColor: [palette.rowAlt[0], palette.rowAlt[1], palette.rowAlt[2]],
      textColor: [palette.text[0], palette.text[1], palette.text[2]],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: [palette.rowAlt[0], palette.rowAlt[1], palette.rowAlt[2]],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 30, halign: 'right' },
    },
    theme: 'grid',
    tableLineColor: [palette.border[0], palette.border[1], palette.border[2]],
    tableLineWidth: 0.2,
  });

  const deductionsEndY = (doc as any).lastAutoTable.finalY;
  y = Math.max(earningsEndY, deductionsEndY) + 10;

  // ══════════════════════════════════════════
  //  NET PAY — highlight box
  // ══════════════════════════════════════════
  const netBoxH = 14;
  doc.setFillColor(...palette.brand);
  doc.roundedRect(ml, y, contentW, netBoxH, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...palette.white);
  doc.text('NET PAY', ml + 6, y + 9);

  doc.setFontSize(16);
  doc.text(fmt(slip.netSalary), pw - mr - 6, y + 9.5, { align: 'right' });

  y += netBoxH + 10;

  // ══════════════════════════════════════════
  //  BANK DETAILS (if available)
  // ══════════════════════════════════════════
  if (employee.bankName || employee.bankAccount) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...palette.brand);
    doc.text('BANK DETAILS', ml, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...palette.textMid);
    if (employee.bankName) {
      doc.text(`Bank: ${employee.bankName}`, ml, y);
      y += 4;
    }
    if (employee.bankAccount) {
      doc.text(`Account: ${employee.bankAccount}`, ml, y);
      y += 4;
    }
    if (employee.taxId) {
      doc.text(`Tax ID: ${employee.taxId}`, ml, y);
      y += 4;
    }
  }

  // ══════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════
  const footerY = ph - 14;

  doc.setDrawColor(...palette.border);
  doc.setLineWidth(0.2);
  doc.line(ml, footerY - 4, pw - mr, footerY - 4);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...palette.textLight);
  doc.text('This is a system-generated salary slip.', pw / 2, footerY + 1, { align: 'center' });

  if (company.docShowPoweredBy !== false) {
    doc.setFontSize(6.5);
    doc.setTextColor(...palette.textLight);
    doc.text('Powered by Flowbooks', pw / 2, footerY + 5, { align: 'center' });
  }

  // Bottom accent bar
  doc.setFillColor(...palette.brand);
  doc.rect(0, ph - 3, pw, 3, 'F');

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
