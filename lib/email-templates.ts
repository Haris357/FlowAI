/**
 * Email Templates — Flowbooks
 * Clean, professional, minimalistic HTML email templates for all invoice statuses.
 *
 * Statuses: sent, partial, paid, overdue, cancelled, refunded
 */

// ==========================================
// TYPES
// ==========================================

export interface InvoiceEmailData {
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
  amountPaid?: number;
  amountDue?: number;
  status?: string;
  notes?: string;
}

export interface CompanyEmailData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
}

export type InvoiceEmailType = 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

// ==========================================
// DESIGN TOKENS
// ==========================================

const C = {
  // Brand
  brand: '#D97757',
  brandDark: '#C4694D',
  brandLight: '#F4A882',
  brandBg: '#FEF7F4',

  // Status
  green: '#10B981',
  greenDark: '#059669',
  greenBg: '#ECFDF5',

  amber: '#F59E0B',
  amberDark: '#D97706',
  amberBg: '#FFFBEB',

  red: '#EF4444',
  redDark: '#DC2626',
  redBg: '#FEF2F2',

  slate: '#94A3B8',
  slateDark: '#64748B',
  slateBg: '#F8FAFC',

  // Text
  text: '#1E293B',
  textMid: '#475569',
  textLight: '#94A3B8',

  // Surface
  bg: '#F1F5F9',
  white: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
};

// ==========================================
// HELPERS
// ==========================================

function fmtDate(date: any): string {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', PKR: 'Rs',
    AED: 'AED ', SAR: 'SAR ', AUD: 'A$', CAD: 'C$',
    SGD: 'S$', MYR: 'RM', JPY: '¥', CNY: '¥',
  };
  const sym = symbols[currency] || `${currency} `;
  return `${sym}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ==========================================
// STATUS CONFIG
// ==========================================

interface StatusConfig {
  accent: string;
  accentDark: string;
  accentBg: string;
  icon: string;       // emoji/symbol for the status
  badge: string;
  title: string;
  message: (inv: InvoiceEmailData, co: CompanyEmailData) => string;
  showItems: boolean;
  showAttachment: boolean;
}

function getConfig(type: InvoiceEmailType): StatusConfig {
  switch (type) {
    case 'sent':
      return {
        accent: C.brand, accentDark: C.brandDark, accentBg: C.brandBg,
        icon: '📄', badge: 'New Invoice', title: 'Invoice',
        message: (inv) =>
          `Here's invoice <strong>${inv.invoiceNumber}</strong>. Please find the details below and the PDF attached.`,
        showItems: true, showAttachment: true,
      };
    case 'paid':
      return {
        accent: C.green, accentDark: C.greenDark, accentBg: C.greenBg,
        icon: '✓', badge: 'Paid', title: 'Payment Received',
        message: (inv) =>
          `We've received your payment for invoice <strong>${inv.invoiceNumber}</strong>. Thank you!`,
        showItems: false, showAttachment: false,
      };
    case 'partial':
      return {
        accent: C.amber, accentDark: C.amberDark, accentBg: C.amberBg,
        icon: '◐', badge: 'Partial', title: 'Partial Payment Received',
        message: (inv, co) => {
          const paid = fmtCurrency(inv.amountPaid || 0, co.currency);
          const due = fmtCurrency(inv.amountDue || inv.total, co.currency);
          return `We received <strong>${paid}</strong> for invoice <strong>${inv.invoiceNumber}</strong>. The remaining balance is <strong>${due}</strong>.`;
        },
        showItems: false, showAttachment: false,
      };
    case 'overdue':
      return {
        accent: C.red, accentDark: C.redDark, accentBg: C.redBg,
        icon: '⏰', badge: 'Overdue', title: 'Payment Reminder',
        message: (inv, co) => {
          const due = fmtCurrency(inv.amountDue || inv.total, co.currency);
          return `Invoice <strong>${inv.invoiceNumber}</strong> was due on <strong>${fmtDate(inv.dueDate)}</strong>. The outstanding amount is <strong>${due}</strong>. Please arrange payment at your earliest convenience.`;
        },
        showItems: true, showAttachment: true,
      };
    case 'cancelled':
      return {
        accent: C.slate, accentDark: C.slateDark, accentBg: C.slateBg,
        icon: '✕', badge: 'Cancelled', title: 'Invoice Cancelled',
        message: (inv) =>
          `Invoice <strong>${inv.invoiceNumber}</strong> has been cancelled. No payment is required. Please disregard any previous correspondence regarding this invoice.`,
        showItems: false, showAttachment: false,
      };
    case 'refunded':
      return {
        accent: C.brand, accentDark: C.brandDark, accentBg: C.brandBg,
        icon: '↩', badge: 'Refunded', title: 'Refund Processed',
        message: (inv, co) => {
          const refund = fmtCurrency(inv.amountPaid || inv.total, co.currency);
          return `A refund of <strong>${refund}</strong> has been issued for invoice <strong>${inv.invoiceNumber}</strong>. Please allow 3–5 business days for the amount to appear in your account.`;
        },
        showItems: false, showAttachment: false,
      };
  }
}

// ==========================================
// TEMPLATE SECTIONS
// ==========================================

function metaRow(label: string, value: string, highlight = false): string {
  return `
    <tr>
      <td style="padding:10px 0;font-size:13px;color:${C.textLight};border-bottom:1px solid ${C.borderLight};">${label}</td>
      <td style="padding:10px 0;font-size:13px;font-weight:600;color:${highlight ? C.redDark : C.text};text-align:right;border-bottom:1px solid ${C.borderLight};">${value}</td>
    </tr>`;
}

function buildMetaBlock(inv: InvoiceEmailData, co: CompanyEmailData, cfg: StatusConfig): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:20px 24px;background:${C.borderLight};border-radius:10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${metaRow('Invoice', inv.invoiceNumber)}
            ${metaRow('Issue Date', fmtDate(inv.issueDate))}
            ${metaRow('Due Date', fmtDate(inv.dueDate), cfg.badge === 'Overdue')}
            <tr>
              <td style="padding:14px 0 4px;font-size:13px;color:${C.textLight};">Amount Due</td>
              <td style="padding:14px 0 4px;font-size:20px;font-weight:700;color:${cfg.accent};text-align:right;">${fmtCurrency(inv.amountDue ?? inv.total, co.currency)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function buildItemsTable(inv: InvoiceEmailData, co: CompanyEmailData): string {
  const rows = inv.items.map((item) => `
    <tr>
      <td style="padding:12px 16px;font-size:13px;color:${C.text};border-bottom:1px solid ${C.borderLight};">${item.description}</td>
      <td style="padding:12px 16px;font-size:13px;color:${C.textMid};text-align:center;border-bottom:1px solid ${C.borderLight};">${item.quantity}</td>
      <td style="padding:12px 16px;font-size:13px;color:${C.textMid};text-align:right;border-bottom:1px solid ${C.borderLight};">${fmtCurrency(item.rate, co.currency)}</td>
      <td style="padding:12px 16px;font-size:13px;font-weight:600;color:${C.text};text-align:right;border-bottom:1px solid ${C.borderLight};">${fmtCurrency(item.quantity * item.rate, co.currency)}</td>
    </tr>`).join('');

  let totals = `
    <tr>
      <td colspan="3" style="padding:10px 16px;text-align:right;font-size:13px;color:${C.textMid};">Subtotal</td>
      <td style="padding:10px 16px;text-align:right;font-size:13px;font-weight:600;color:${C.text};">${fmtCurrency(inv.subtotal, co.currency)}</td>
    </tr>`;

  if (inv.taxRate > 0) {
    totals += `
    <tr>
      <td colspan="3" style="padding:6px 16px;text-align:right;font-size:13px;color:${C.textMid};">Tax (${inv.taxRate}%)</td>
      <td style="padding:6px 16px;text-align:right;font-size:13px;color:${C.text};">${fmtCurrency(inv.taxAmount, co.currency)}</td>
    </tr>`;
  }

  if (inv.discount > 0) {
    totals += `
    <tr>
      <td colspan="3" style="padding:6px 16px;text-align:right;font-size:13px;color:${C.textMid};">Discount</td>
      <td style="padding:6px 16px;text-align:right;font-size:13px;color:${C.green};">-${fmtCurrency(inv.discount, co.currency)}</td>
    </tr>`;
  }

  totals += `
    <tr>
      <td colspan="3" style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:${C.text};border-top:2px solid ${C.border};">Total</td>
      <td style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:${C.brand};border-top:2px solid ${C.border};">${fmtCurrency(inv.total, co.currency)}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border-radius:10px;overflow:hidden;border:1px solid ${C.border};">
      <thead>
        <tr>
          <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:600;color:${C.textMid};text-transform:uppercase;letter-spacing:0.06em;background:${C.borderLight};border-bottom:1px solid ${C.border};">Description</th>
          <th style="padding:11px 16px;text-align:center;font-size:11px;font-weight:600;color:${C.textMid};text-transform:uppercase;letter-spacing:0.06em;background:${C.borderLight};border-bottom:1px solid ${C.border};">Qty</th>
          <th style="padding:11px 16px;text-align:right;font-size:11px;font-weight:600;color:${C.textMid};text-transform:uppercase;letter-spacing:0.06em;background:${C.borderLight};border-bottom:1px solid ${C.border};">Rate</th>
          <th style="padding:11px 16px;text-align:right;font-size:11px;font-weight:600;color:${C.textMid};text-transform:uppercase;letter-spacing:0.06em;background:${C.borderLight};border-bottom:1px solid ${C.border};">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>${totals}</tfoot>
    </table>`;
}

function buildAmountCard(inv: InvoiceEmailData, co: CompanyEmailData, cfg: StatusConfig): string {
  const amountPaid = inv.amountPaid ?? 0;
  const amountDue = inv.amountDue ?? inv.total;

  // Paid
  if (cfg.badge === 'Paid') {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
        <tr>
          <td style="padding:28px 24px;text-align:center;background:${cfg.accentBg};border-radius:10px;border:1px solid ${C.border};">
            <div style="width:48px;height:48px;margin:0 auto 12px;background:${cfg.accent};border-radius:50%;line-height:48px;text-align:center;">
              <span style="font-size:22px;color:#fff;font-weight:700;">✓</span>
            </div>
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Amount Paid</p>
            <p style="margin:6px 0 0;font-size:32px;font-weight:700;color:${cfg.accent};letter-spacing:-0.02em;">${fmtCurrency(inv.total, co.currency)}</p>
            <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">Invoice ${inv.invoiceNumber}</p>
          </td>
        </tr>
      </table>`;
  }

  // Partial
  if (cfg.badge === 'Partial') {
    const pct = inv.total > 0 ? Math.round((amountPaid / inv.total) * 100) : 0;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
        <tr>
          <td style="padding:24px;background:${cfg.accentBg};border-radius:10px;border:1px solid ${C.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-bottom:16px;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Paid</p>
                  <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:${C.green};">${fmtCurrency(amountPaid, co.currency)}</p>
                </td>
                <td width="50%" style="text-align:right;padding-bottom:16px;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Remaining</p>
                  <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:${cfg.accent};">${fmtCurrency(amountDue, co.currency)}</p>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <div style="background:${C.border};border-radius:6px;height:6px;overflow:hidden;">
                    <div style="background:${C.green};height:100%;width:${pct}%;border-radius:6px;"></div>
                  </div>
                  <p style="margin:6px 0 0;font-size:11px;color:${C.textLight};text-align:center;">${pct}% paid</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
  }

  // Refunded
  if (cfg.badge === 'Refunded') {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
        <tr>
          <td style="padding:28px 24px;text-align:center;background:${cfg.accentBg};border-radius:10px;border:1px solid ${C.border};">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Refund Amount</p>
            <p style="margin:6px 0 0;font-size:32px;font-weight:700;color:${cfg.accent};letter-spacing:-0.02em;">${fmtCurrency(amountPaid || inv.total, co.currency)}</p>
            <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">Invoice ${inv.invoiceNumber}</p>
          </td>
        </tr>
      </table>`;
  }

  // Cancelled
  if (cfg.badge === 'Cancelled') {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
        <tr>
          <td style="padding:28px 24px;text-align:center;background:${cfg.accentBg};border-radius:10px;border:1px solid ${C.border};">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Invoice Total</p>
            <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${cfg.accent};text-decoration:line-through;letter-spacing:-0.02em;">${fmtCurrency(inv.total, co.currency)}</p>
            <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">${inv.invoiceNumber} — Cancelled</p>
          </td>
        </tr>
      </table>`;
  }

  return '';
}

// ==========================================
// MAIN TEMPLATE
// ==========================================

export function invoiceStatusEmail(
  type: InvoiceEmailType,
  invoice: InvoiceEmailData,
  company: CompanyEmailData,
): string {
  const cfg = getConfig(type);

  const showMeta = type === 'sent' || type === 'overdue';
  const metaHtml = showMeta ? buildMetaBlock(invoice, company, cfg) : '';
  const itemsHtml = cfg.showItems ? buildItemsTable(invoice, company) : '';
  const summaryHtml = !cfg.showItems ? buildAmountCard(invoice, company, cfg) : '';

  const notesHtml = invoice.notes ? `
    <div style="margin:24px 0 0;padding:14px 16px;background:${C.amberBg};border-left:3px solid ${C.amber};border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${C.amberDark};font-weight:700;">Notes</p>
      <p style="margin:6px 0 0;font-size:13px;color:${C.textMid};line-height:1.6;">${invoice.notes}</p>
    </div>` : '';

  const attachNote = cfg.showAttachment ? `
    <p style="margin:24px 0 0;font-size:12px;color:${C.textLight};line-height:1.5;text-align:center;">
      📎 &nbsp;A PDF copy of this invoice is attached to this email.
    </p>` : '';

  const contactParts = [company.email, company.phone].filter(Boolean);
  const contactHtml = contactParts.length > 0
    ? `<p style="margin:4px 0 0;font-size:12px;color:${C.textLight};">${contactParts.join(' &nbsp;·&nbsp; ')}</p>`
    : '';
  const addressHtml = company.address
    ? `<p style="margin:2px 0 0;font-size:12px;color:${C.textLight};">${company.address}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${cfg.title} — ${invoice.invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${C.white};border-radius:16px;overflow:hidden;border:1px solid ${C.border};">

          <!-- Accent bar -->
          <tr><td style="height:4px;background:${cfg.accent};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${company.name}</h1>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <span style="display:inline-block;padding:5px 12px;background:${cfg.accentBg};color:${cfg.accent};font-size:11px;font-weight:700;border-radius:20px;letter-spacing:0.04em;text-transform:uppercase;">${cfg.badge}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:20px 36px 0;"><div style="height:1px;background:${C.borderLight};"></div></td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 36px 36px;">
              <!-- Greeting -->
              <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:${C.text};">Hi ${invoice.customerName},</p>
              <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.7;">${cfg.message(invoice, company)}</p>

              ${metaHtml}
              ${summaryHtml}
              ${itemsHtml}
              ${notesHtml}
              ${attachNote}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;border-top:1px solid ${C.borderLight};">
              <p style="margin:0;font-size:13px;font-weight:600;color:${C.textMid};">${company.name}</p>
              ${contactHtml}
              ${addressHtml}
            </td>
          </tr>

          <!-- Powered by -->
          <tr>
            <td style="padding:0 36px 20px;">
              <p style="margin:0;font-size:11px;color:${C.textLight};text-align:center;">Powered by <span style="color:${C.brand};font-weight:600;">Flowbooks</span></p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

/**
 * Backwards-compatible — generates a 'sent' email.
 */
export function invoiceEmailTemplate(invoice: InvoiceEmailData, company: CompanyEmailData): string {
  return invoiceStatusEmail('sent', invoice, company);
}

/**
 * Email subject line per status.
 */
export function getInvoiceEmailSubject(
  type: InvoiceEmailType,
  invoiceNumber: string,
  companyName: string,
): string {
  switch (type) {
    case 'sent':
      return `Invoice ${invoiceNumber} from ${companyName}`;
    case 'paid':
      return `Payment Received — Invoice ${invoiceNumber}`;
    case 'partial':
      return `Partial Payment Received — Invoice ${invoiceNumber}`;
    case 'overdue':
      return `Payment Reminder — Invoice ${invoiceNumber} is Overdue`;
    case 'cancelled':
      return `Invoice ${invoiceNumber} Cancelled`;
    case 'refunded':
      return `Refund Processed — Invoice ${invoiceNumber}`;
  }
}
