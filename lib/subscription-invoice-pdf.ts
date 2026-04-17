/**
 * Subscription Invoice PDF Generator
 *
 * Clean, minimal invoice/receipt PDF for subscription payments.
 * Attached to `subscription_started` and `subscription_renewed` emails.
 * NOTE: This is only for Flowbooks billing invoices, not accounting invoices.
 */

import jsPDF from 'jspdf';

export interface SubscriptionInvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  paidDate: Date;
  billingPeriodStart?: Date | null;
  billingPeriodEnd?: Date | null;
  customerName: string;
  customerEmail: string;
  customerAddress?: string | null;
  planName: string;
  billingPeriod: 'monthly' | 'yearly';
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string | null;
  lemonSqueezyOrderId?: string | null;
}

type RGB = [number, number, number];

// Minimal palette
const TEXT: RGB = [17, 24, 39];           // #111827 — near-black body
const TEXT_MUTED: RGB = [107, 114, 128];  // #6B7280 — labels, meta
const TEXT_FAINT: RGB = [156, 163, 175];  // #9CA3AF — captions
const BORDER: RGB = [229, 231, 235];      // #E5E7EB
const BG_SOFT: RGB = [249, 250, 251];     // #F9FAFB — totals box
const GREEN: RGB = [5, 122, 85];          // #057A55
const GREEN_SOFT: RGB = [209, 250, 229];  // #D1FAE5
const BRAND: RGB = [217, 119, 87];        // #D97757 — logo mark only

// Page geometry (A4 portrait, mm)
const PW = 210;
const PH = 297;
const ML = 22;
const MR = 22;
const CW = PW - ML - MR;

function fmtDate(d?: Date | null): string {
  if (!d) return '—';
  try {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function fmtMoney(n: number): string {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function setFill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function setText(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }

/** Small uppercase label: "BILLED TO", "DESCRIPTION", etc. */
function label(doc: jsPDF, text: string, x: number, y: number, align: 'left' | 'right' = 'left') {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setCharSpace(0.4);
  setText(doc, TEXT_MUTED);
  doc.text(text, x, y, { align });
  doc.setCharSpace(0);
}

function hr(doc: jsPDF, y: number, x1 = ML, x2 = PW - MR) {
  setDraw(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.line(x1, y, x2, y);
}

// ============================================================
// PDF generation
// ============================================================

export function generateSubscriptionInvoicePdf(data: SubscriptionInvoiceData): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ---- Header: logo + wordmark (left), "Invoice" + number (right) ----
  const headerY = 22;

  // Logo mark — small brand-colored rounded square with "F"
  const logoSize = 7.5;
  setFill(doc, BRAND);
  doc.roundedRect(ML, headerY - logoSize + 0.5, logoSize, logoSize, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setText(doc, [255, 255, 255]);
  doc.text('F', ML + logoSize / 2, headerY - 2, { align: 'center' });

  // Wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setText(doc, TEXT);
  doc.text('Flowbooks', ML + logoSize + 3, headerY - 1);

  // "Invoice" title + number on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setText(doc, TEXT);
  doc.text('Invoice', PW - MR, headerY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(doc, TEXT_FAINT);
  doc.text(`# ${data.invoiceNumber}`, PW - MR, headerY + 5.5, { align: 'right' });

  let y = headerY + 14;
  hr(doc, y);
  y += 9;

  // ---- Two-column meta: BILLED TO | BILLING PERIOD ----
  const col2X = ML + CW / 2;

  label(doc, 'BILLED TO', ML, y);
  label(doc, 'BILLING PERIOD', col2X, y);
  y += 5.5;

  // Customer name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setText(doc, TEXT);
  doc.text(data.customerName || '—', ML, y);

  // Billing period (or issue date if missing)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(doc, TEXT);
  if (data.billingPeriodStart && data.billingPeriodEnd) {
    doc.text(
      `${fmtDate(data.billingPeriodStart)} — ${fmtDate(data.billingPeriodEnd)}`,
      col2X,
      y,
    );
  } else {
    doc.text(fmtDate(data.issueDate), col2X, y);
  }
  y += 5;

  // Email + "Issued ..."
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(doc, TEXT_MUTED);
  doc.text(data.customerEmail || '', ML, y);
  doc.text(`Issued ${fmtDate(data.issueDate)}`, col2X, y);
  y += 4.5;

  // Optional address
  if (data.customerAddress) {
    const addrLines = doc.splitTextToSize(data.customerAddress, (CW / 2) - 4);
    doc.text(addrLines, ML, y);
    y += addrLines.length * 4.2;
  }

  y += 6;
  hr(doc, y);
  y += 8;

  // ---- Line items: DESCRIPTION | AMOUNT ----
  label(doc, 'DESCRIPTION', ML, y);
  label(doc, 'AMOUNT', PW - MR, y, 'right');
  y += 7;

  const periodLabel = data.billingPeriod === 'yearly' ? 'Annual' : 'Monthly';
  const periodRange =
    data.billingPeriodStart && data.billingPeriodEnd
      ? ` — ${fmtDate(data.billingPeriodStart)} to ${fmtDate(data.billingPeriodEnd)}`
      : '';
  const description = `${data.planName} plan (${periodLabel})${periodRange}`;

  // Description (wraps if long)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(doc, TEXT);
  const descLines = doc.splitTextToSize(description, CW - 40);
  doc.text(descLines, ML, y);

  // Amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setText(doc, TEXT);
  doc.text(fmtMoney(data.subtotal), PW - MR, y, { align: 'right' });

  y += descLines.length * 4.8 + 4;

  hr(doc, y);
  y += 10;

  // ---- Bottom section: payment info (left) | totals box (right) ----
  const bottomTop = y;

  // -- Left: PAID badge + payment method --
  let leftY = bottomTop;

  // PAID chip (soft green pill)
  const chipW = 14;
  const chipH = 6.5;
  setFill(doc, GREEN_SOFT);
  doc.roundedRect(ML, leftY - 4.5, chipW, chipH, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setText(doc, GREEN);
  doc.text('PAID', ML + chipW / 2, leftY - 0.3, { align: 'center' });

  leftY += 8;

  if (data.paymentMethod) {
    label(doc, 'PAYMENT METHOD', ML, leftY);
    leftY += 4.8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setText(doc, TEXT);
    doc.text(data.paymentMethod, ML, leftY);
    leftY += 5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(doc, TEXT_MUTED);
  doc.text(`Paid ${fmtDate(data.paidDate)}`, ML, leftY);
  leftY += 4.5;

  if (data.lemonSqueezyOrderId) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setText(doc, TEXT_FAINT);
    doc.text(`Ref ${data.lemonSqueezyOrderId}`, ML, leftY);
    leftY += 4;
  }

  // -- Right: totals box --
  const totalsW = 72;
  const totalsX = PW - MR - totalsW;
  const totalsPadX = 6;
  const totalRowH = 6.5;
  const hasTax = data.tax > 0;
  const totalsH = (hasTax ? 3 : 2) * totalRowH + 8;

  setFill(doc, BG_SOFT);
  doc.roundedRect(totalsX, bottomTop - 4, totalsW, totalsH, 2.5, 2.5, 'F');

  let tY = bottomTop + 1;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setText(doc, TEXT_MUTED);
  doc.text('Subtotal', totalsX + totalsPadX, tY);
  setText(doc, TEXT);
  doc.text(fmtMoney(data.subtotal), totalsX + totalsW - totalsPadX, tY, { align: 'right' });
  tY += totalRowH;

  // Tax
  if (hasTax) {
    setText(doc, TEXT_MUTED);
    doc.text('Tax', totalsX + totalsPadX, tY);
    setText(doc, TEXT);
    doc.text(fmtMoney(data.tax), totalsX + totalsW - totalsPadX, tY, { align: 'right' });
    tY += totalRowH;
  }

  // Divider inside box
  setDraw(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.line(totalsX + totalsPadX, tY - 2, totalsX + totalsW - totalsPadX, tY - 2);
  tY += 1.5;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  setText(doc, TEXT);
  doc.text('Total', totalsX + totalsPadX, tY + 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setText(doc, TEXT);
  doc.text(fmtMoney(data.total), totalsX + totalsW - totalsPadX, tY + 1, { align: 'right' });

  y = Math.max(leftY, bottomTop + totalsH) + 8;

  // ---- Footer ----
  const footerY = PH - 18;
  hr(doc, footerY);

  // Left: logo + company
  const fLogoSize = 5;
  setFill(doc, BRAND);
  doc.roundedRect(ML, footerY + 4, fLogoSize, fLogoSize, 0.8, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  setText(doc, [255, 255, 255]);
  doc.text('F', ML + fLogoSize / 2, footerY + 7.7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setText(doc, TEXT);
  doc.text('Flowbooks', ML + fLogoSize + 2.5, footerY + 7.7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setText(doc, TEXT_FAINT);
  doc.text('Flowbooks, Inc.  ·  flowbooksai.com', ML, footerY + 13);

  // Right: contact
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setText(doc, TEXT_FAINT);
  doc.text('Questions? hello@flowbooksai.com', PW - MR, footerY + 13, { align: 'right' });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

export function makeSubscriptionInvoiceNumber(orderId: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const shortId = (orderId || '').slice(-8).toUpperCase() || Math.random().toString(36).slice(-8).toUpperCase();
  return `FB-INV-${year}-${shortId}`;
}
