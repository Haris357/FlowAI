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

// ==========================================
// PLATFORM EMAIL TEMPLATES
// ==========================================

/**
 * Platform Email Templates — Flowbooks
 *
 * Professional HTML email templates for all platform communication:
 * welcome, plan_changed, messages_granted, account_warning, support_reply,
 * announcement, custom, payment_receipt, subscription_cancelled, password_reset
 *
 * All templates share a consistent branded layout with:
 * - Terracotta (#D97757) branded header
 * - Clean white content area with dark text
 * - Responsive table-based layout (email-client compatible)
 * - Inline CSS throughout
 * - Professional footer with Flowbooks branding
 */

// ------------------------------------------
// Types
// ------------------------------------------

export type EmailTemplateType =
  | 'welcome'
  | 'plan_changed'
  | 'messages_granted'
  | 'account_warning'
  | 'support_reply'
  | 'announcement'
  | 'custom'
  | 'payment_receipt'
  | 'subscription_cancelled'
  | 'password_reset'
  | 'newsletter'
  | 'feedback_acknowledged'
  | 'ticket_in_progress'
  | 'message_reset';

export interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  // Plan
  planName?: string;
  previousPlan?: string;
  // Messages
  messageAmount?: number;
  // Support
  ticketSubject?: string;
  replyMessage?: string;
  // Announcement
  announcementTitle?: string;
  announcementBody?: string;
  // Custom
  customSubject?: string;
  customMessage?: string;
  // Payment
  amount?: string;
  invoiceId?: string;
  // Warning
  warningType?: string;
  warningMessage?: string;
  // Password reset
  resetLink?: string;
  // Newsletter
  newsletterTitle?: string;
  newsletterSections?: Array<{ heading: string; body: string }>;
  newsletterFooterNote?: string;
  // Feedback
  feedbackSubject?: string;
  feedbackResponse?: string;
  // Message reset
  weeklyMessageLimit?: string; // @deprecated — kept for template compatibility
}

export interface EmailTemplateResult {
  subject: string;
  html: string;
}

// ------------------------------------------
// Admin UI template picker options
// ------------------------------------------

export interface EmailTemplateOption {
  value: EmailTemplateType;
  /** @deprecated Use `value` — kept for backward compatibility with admin UI */
  type: EmailTemplateType;
  label: string;
  description: string;
  icon: string;
  color: string;
  fields: { key: string; label: string; type: 'text' | 'textarea'; required?: boolean; placeholder?: string }[];
}

export const EMAIL_TEMPLATE_OPTIONS: EmailTemplateOption[] = [
  {
    value: 'welcome', type: 'welcome',
    label: 'Welcome',
    description: 'Welcome a new user to Flowbooks',
    icon: 'handshake',
    color: '#10B981',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
    ],
  },
  {
    value: 'plan_changed', type: 'plan_changed',
    label: 'Plan Changed',
    description: 'Notify user of a plan upgrade or downgrade',
    icon: 'credit-card',
    color: '#6366F1',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'previousPlan', label: 'Previous Plan', type: 'text', required: true, placeholder: 'Free' },
      { key: 'planName', label: 'New Plan', type: 'text', required: true, placeholder: 'Pro' },
    ],
  },
  {
    value: 'messages_granted', type: 'messages_granted',
    label: 'Messages Granted',
    description: 'Notify user that bonus weekly messages have been granted',
    icon: 'zap',
    color: '#F59E0B',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'messageAmount', label: 'Message Amount', type: 'text', required: true, placeholder: '250' },
    ],
  },
  {
    value: 'account_warning', type: 'account_warning',
    label: 'Account Warning',
    description: 'Warn user about approaching limits, suspension, etc.',
    icon: 'alert-triangle',
    color: '#EF4444',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'warningType', label: 'Warning Type', type: 'text', required: true, placeholder: 'Token Limit Reached' },
      { key: 'warningMessage', label: 'Warning Message', type: 'textarea', required: true, placeholder: 'You are approaching your weekly usage limit...' },
    ],
  },
  {
    value: 'support_reply', type: 'support_reply',
    label: 'Support Reply',
    description: 'Notify user that an admin replied to their support ticket',
    icon: 'message-circle',
    color: '#3B82F6',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'ticketSubject', label: 'Ticket Subject', type: 'text', required: true, placeholder: 'Issue with invoice generation' },
      { key: 'replyMessage', label: 'Reply Message', type: 'textarea', required: true, placeholder: 'Thank you for reaching out...' },
    ],
  },
  {
    value: 'announcement', type: 'announcement',
    label: 'Announcement',
    description: 'General announcement or newsletter to users',
    icon: 'megaphone',
    color: '#D97757',
    fields: [
      { key: 'userName', label: 'User Name (optional)', type: 'text', placeholder: 'John Doe' },
      { key: 'announcementTitle', label: 'Announcement Title', type: 'text', required: true, placeholder: 'New Feature: Bank Reconciliation' },
      { key: 'announcementBody', label: 'Announcement Body', type: 'textarea', required: true, placeholder: 'We are excited to announce...' },
    ],
  },
  {
    value: 'custom', type: 'custom',
    label: 'Custom Message',
    description: 'Send a custom admin message to a user',
    icon: 'pen-tool',
    color: '#8B5CF6',
    fields: [
      { key: 'userName', label: 'User Name (optional)', type: 'text', placeholder: 'John Doe' },
      { key: 'customSubject', label: 'Subject', type: 'text', required: true, placeholder: 'Email subject line' },
      { key: 'customMessage', label: 'Message Body', type: 'textarea', required: true, placeholder: 'Write your message here...' },
    ],
  },
  {
    value: 'payment_receipt', type: 'payment_receipt',
    label: 'Payment Receipt',
    description: 'Payment or billing confirmation',
    icon: 'receipt',
    color: '#10B981',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'amount', label: 'Amount', type: 'text', required: true, placeholder: '$29.99' },
      { key: 'planName', label: 'Plan Name', type: 'text', required: true, placeholder: 'Pro' },
      { key: 'invoiceId', label: 'Invoice / Transaction ID', type: 'text', placeholder: 'INV-2026-001' },
    ],
  },
  {
    value: 'subscription_cancelled', type: 'subscription_cancelled',
    label: 'Subscription Cancelled',
    description: 'Subscription cancellation notice',
    icon: 'x-circle',
    color: '#EF4444',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'planName', label: 'Plan Name', type: 'text', required: true, placeholder: 'Pro' },
    ],
  },
  {
    value: 'password_reset', type: 'password_reset',
    label: 'Password Reset',
    description: 'Password reset notification with a reset link',
    icon: 'key',
    color: '#F59E0B',
    fields: [
      { key: 'userName', label: 'User Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'resetLink', label: 'Reset Link', type: 'text', required: true, placeholder: 'https://flowbooks.app/reset?token=...' },
    ],
  },
  {
    value: 'newsletter', type: 'newsletter',
    label: 'Newsletter',
    description: 'AI-generated weekly newsletter with updates and tips',
    icon: 'newspaper',
    color: '#D97757',
    fields: [
      { key: 'newsletterTitle', label: 'Newsletter Title', type: 'text', required: true, placeholder: 'This Week at Flowbooks' },
      { key: 'announcementBody', label: 'Newsletter Content', type: 'textarea', required: true, placeholder: 'Newsletter content (supports sections separated by ## headings)' },
    ],
  },
];

// ------------------------------------------
// Shared layout primitives
// ------------------------------------------

function esc(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(str: string): string {
  return (str || '').replace(/\n/g, '<br/>');
}

/** Branded header bar with Flowbooks wordmark */
function pHeader(): string {
  return `
          <!-- Header -->
          <tr>
            <td style="background-color:${C.brand};padding:36px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#FFFFFF;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Flowbooks</h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);font-weight:400;letter-spacing:0.02em;">AI-First Accounting</p>
            </td>
          </tr>`;
}

/** Footer with "sent from Flowbooks" attribution */
function pFooter(): string {
  return `
          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;border-top:1px solid ${C.border};text-align:center;">
              <p style="margin:0;font-size:12px;color:${C.textLight};line-height:1.6;">
                This email was sent from <span style="color:${C.brand};font-weight:600;">Flowbooks</span>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#CBD5E1;line-height:1.5;">
                If you have questions, visit your dashboard or contact our support team.
              </p>
            </td>
          </tr>`;
}

/** Full email document shell — wraps header + content + footer */
function pShell(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${esc(title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-card { width: 100% !important; }
      .email-body { padding: 24px 20px !important; }
      .email-header { padding: 28px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" class="email-card" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background-color:${C.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

${pHeader()}

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding:36px 40px;">
${bodyContent}
            </td>
          </tr>

${pFooter()}

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/* Reusable micro-components */

function pGreeting(name?: string): string {
  const display = name ? esc(name) : 'there';
  return `              <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:${C.text};">Hi ${display},</p>`;
}

function pParagraph(html: string): string {
  return `              <p style="margin:0 0 16px;font-size:14px;color:${C.textMid};line-height:1.75;">${html}</p>`;
}

function pButton(text: string, url: string): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="border-radius:8px;background-color:${C.brand};">
                    <a href="${esc(url)}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${esc(text)}</a>
                  </td>
                </tr>
              </table>`;
}

function pInfoBox(label: string, value: string, color = C.brand): string {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:18px 22px;background:${C.brandBg};border-radius:10px;border-left:4px solid ${color};">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textLight};font-weight:600;">${esc(label)}</p>
                    <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:${color};">${value}</p>
                  </td>
                </tr>
              </table>`;
}

function pWarningBox(message: string): string {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:18px 22px;background:${C.redBg};border-radius:10px;border-left:4px solid ${C.red};">
                    <p style="margin:0;font-size:14px;color:${C.redDark};line-height:1.7;">${message}</p>
                  </td>
                </tr>
              </table>`;
}

function pNoteBox(message: string): string {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:16px 20px;background:${C.amberBg};border-radius:8px;border-left:4px solid ${C.amber};">
                    <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">${message}</p>
                  </td>
                </tr>
              </table>`;
}

function pDivider(): string {
  return `              <div style="height:1px;background:${C.border};margin:28px 0;"></div>`;
}

function pSignOff(): string {
  return `
${pDivider()}
              <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.7;">
                Best regards,<br/>
                <span style="font-weight:600;color:${C.text};">The Flowbooks Team</span>
              </p>`;
}

function pNumberedStep(num: number, title: string, desc: string): string {
  return `
                <tr>
                  <td style="padding:14px 18px;background:${C.slateBg};border-radius:8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" style="vertical-align:top;padding-top:2px;">
                          <div style="width:28px;height:28px;background:${C.brandBg};border-radius:50%;text-align:center;line-height:28px;font-size:13px;color:${C.brand};font-weight:700;">${num}</div>
                        </td>
                        <td style="padding-left:10px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:${C.text};">${esc(title)}</p>
                          <p style="margin:4px 0 0;font-size:13px;color:${C.textMid};line-height:1.5;">${esc(desc)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function pBulletItem(text: string): string {
  return `
                <tr>
                  <td style="padding:10px 18px;border-bottom:1px solid ${C.borderLight};">
                    <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.6;">
                      <span style="color:${C.brand};font-weight:700;margin-right:10px;">&bull;</span>${text}
                    </p>
                  </td>
                </tr>`;
}

function pReceiptRow(label: string, value: string, isBold = false, valueColor = C.text): string {
  return `
                      <tr>
                        <td style="padding:10px 0;font-size:13px;color:${C.textLight};border-bottom:1px solid ${C.borderLight};">${esc(label)}</td>
                        <td style="padding:10px 0;font-size:${isBold ? '14px' : '13px'};font-weight:${isBold ? '700' : '600'};color:${valueColor};text-align:right;border-bottom:1px solid ${C.borderLight};">${value}</td>
                      </tr>`;
}

// ------------------------------------------
// Individual template functions
// ------------------------------------------

function tplWelcome(d: EmailTemplateData): EmailTemplateResult {
  const subject = 'Welcome to Flowbooks!';
  const body = `
${pGreeting(d.userName)}
${pParagraph(`Welcome to <strong style="color:${C.brand};">Flowbooks</strong> — your AI-first accounting platform. We are thrilled to have you on board!`)}
${pParagraph('Here are a few things you can do to get started:')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
${pNumberedStep(1, 'Create your first invoice', 'Send professional invoices to your clients in seconds.')}
${pNumberedStep(2, 'Chat with your AI assistant', 'Ask questions about your finances, generate reports, and more.')}
${pNumberedStep(3, 'Set up your company profile', 'Add your logo, address, and tax details for branded invoices.')}
              </table>
${pParagraph('If you need any help getting started, our support team is always here for you.')}
${pButton('Get Started', 'https://flowbooks.app')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplPlanChanged(d: EmailTemplateData): EmailTemplateResult {
  const newPlan = d.planName || 'New Plan';
  const oldPlan = d.previousPlan || 'Previous Plan';
  const subject = `Your Flowbooks plan has been changed to ${newPlan}`;

  const body = `
${pGreeting(d.userName)}
${pParagraph('Your subscription plan has been updated. Here are the details:')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:24px;background:${C.slateBg};border-radius:10px;border:1px solid ${C.border};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="42%" style="text-align:center;padding:12px 8px;">
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textLight};font-weight:600;">Previous Plan</p>
                          <p style="margin:10px 0 0;font-size:20px;font-weight:700;color:${C.slateDark};">${esc(oldPlan)}</p>
                        </td>
                        <td width="16%" style="text-align:center;vertical-align:middle;padding:12px 0;">
                          <div style="width:36px;height:36px;margin:0 auto;background:${C.brandBg};border-radius:50%;line-height:36px;text-align:center;">
                            <span style="font-size:16px;color:${C.brand};font-weight:700;">&rarr;</span>
                          </div>
                        </td>
                        <td width="42%" style="text-align:center;padding:12px 8px;">
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textLight};font-weight:600;">New Plan</p>
                          <p style="margin:10px 0 0;font-size:20px;font-weight:700;color:${C.brand};">${esc(newPlan)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
${pParagraph('Your new plan is effective immediately. All features included in your new plan are now available.')}
${pParagraph('If you have any questions about your plan change, feel free to reach out to our support team.')}
${pButton('View My Plan', 'https://flowbooks.app/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplMessagesGranted(d: EmailTemplateData): EmailTemplateResult {
  const amount = d.messageAmount ?? 0;
  const formatted = amount.toLocaleString('en-US');
  const subject = `You've received bonus AI usage on Flowbooks`;

  const body = `
${pGreeting(d.userName)}
${pParagraph('Great news! Bonus AI usage has been added to your Flowbooks account.')}
${pInfoBox('Bonus Granted', `Extra weekly AI allowance`, C.brand)}
${pParagraph('This bonus is added to your weekly allowance and can be used for AI-powered features including the chat assistant, report generation, invoice analysis, and more.')}
${pParagraph('Your weekly balance has been updated and is available for use immediately.')}
${pButton('Check My Balance', 'https://flowbooks.app/settings')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplAccountWarning(d: EmailTemplateData): EmailTemplateResult {
  const wType = d.warningType || 'Account Notice';
  const wMsg = d.warningMessage || 'Please review your account to ensure continued access to all features.';
  const subject = `Flowbooks Account Warning: ${wType}`;

  const body = `
${pGreeting(d.userName)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="padding:20px 22px;background:${C.redBg};border-radius:10px;border-left:4px solid ${C.red};">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.red};font-weight:700;">${esc(wType)}</p>
                    <p style="margin:8px 0 0;font-size:14px;color:${C.textMid};line-height:1.75;">${nl2br(wMsg)}</p>
                  </td>
                </tr>
              </table>
${pParagraph('We want to make sure you have uninterrupted access to Flowbooks. Please take a moment to review your account and resolve any outstanding issues.')}
${pParagraph('If you believe this warning was sent in error, or if you need assistance, please contact our support team.')}
${pButton('Review My Account', 'https://flowbooks.app/settings')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSupportReply(d: EmailTemplateData): EmailTemplateResult {
  const ticket = d.ticketSubject || 'your support ticket';
  const reply = d.replyMessage || '';
  const subject = `Re: ${ticket} — Flowbooks Support`;

  const body = `
${pGreeting(d.userName)}
${pParagraph(`Our support team has replied to your ticket: <strong>${esc(ticket)}</strong>`)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:22px 24px;background:${C.slateBg};border-radius:10px;border:1px solid ${C.border};">
                    <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textLight};font-weight:600;">Support Reply</p>
                    <div style="font-size:14px;color:${C.text};line-height:1.75;">${nl2br(reply)}</div>
                  </td>
                </tr>
              </table>
${pParagraph('You can view the full conversation and reply directly from your Flowbooks dashboard.')}
${pButton('View Ticket', 'https://flowbooks.app/settings?section=support')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplAnnouncement(d: EmailTemplateData): EmailTemplateResult {
  const title = d.announcementTitle || 'Announcement from Flowbooks';
  const body_text = d.announcementBody || '';
  const subject = title;

  const body = `
${pGreeting(d.userName)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:28px 26px;background:${C.brandBg};border-radius:12px;border:1px solid #F4D4C4;">
                    <h2 style="margin:0 0 14px;font-size:22px;font-weight:700;color:${C.brand};letter-spacing:-0.01em;">${esc(title)}</h2>
                    <div style="font-size:14px;color:${C.textMid};line-height:1.75;">${nl2br(body_text)}</div>
                  </td>
                </tr>
              </table>
${pParagraph('Thank you for being part of the Flowbooks community. We are committed to building the best AI-first accounting experience for you.')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplCustom(d: EmailTemplateData): EmailTemplateResult {
  const subject = d.customSubject || 'Message from Flowbooks';
  const message = d.customMessage || '';

  const body = `
${pGreeting(d.userName)}
              <div style="font-size:14px;color:${C.textMid};line-height:1.75;margin:0 0 24px;">${nl2br(message)}</div>
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplPaymentReceipt(d: EmailTemplateData): EmailTemplateResult {
  const amount = d.amount || '$0.00';
  const invoiceId = d.invoiceId || 'N/A';
  const plan = d.planName || 'Flowbooks';
  const subject = `Payment Receipt — ${amount} for ${plan}`;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const body = `
${pGreeting(d.userName)}
${pParagraph('Thank you for your payment. Here is your receipt for your records.')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid ${C.border};">
                <!-- Receipt header -->
                <tr>
                  <td style="padding:18px 24px;background:${C.slateBg};border-bottom:1px solid ${C.border};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textLight};font-weight:600;">Payment Receipt</p>
                        </td>
                        <td style="text-align:right;">
                          <span style="display:inline-block;padding:4px 12px;background:${C.greenBg};color:${C.greenDark};font-size:11px;font-weight:700;border-radius:20px;letter-spacing:0.04em;text-transform:uppercase;">Paid</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Receipt details -->
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${pReceiptRow('Date', esc(dateStr))}
${pReceiptRow('Invoice ID', esc(invoiceId))}
${pReceiptRow('Plan', esc(plan))}
                      <tr>
                        <td style="padding:14px 0 6px;font-size:13px;color:${C.textLight};">Amount Paid</td>
                        <td style="padding:14px 0 6px;font-size:24px;font-weight:700;color:${C.green};text-align:right;">${esc(amount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
${pParagraph('This payment has been processed and your subscription is active. You can view your full billing history and manage your subscription from your account settings.')}
${pButton('View Billing', 'https://flowbooks.app/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionCancelled(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'your plan';
  const subject = 'Your Flowbooks subscription has been cancelled';

  const body = `
${pGreeting(d.userName)}
${pParagraph(`Your <strong>${esc(plan)}</strong> subscription to Flowbooks has been cancelled.`)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:24px;background:${C.slateBg};border-radius:10px;border:1px solid ${C.border};text-align:center;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textLight};font-weight:600;">Cancelled Plan</p>
                    <p style="margin:10px 0 0;font-size:22px;font-weight:700;color:${C.slateDark};text-decoration:line-through;">${esc(plan)}</p>
                    <p style="margin:12px 0 0;font-size:13px;color:${C.textLight};">You have been moved to the Free plan</p>
                  </td>
                </tr>
              </table>
${pParagraph('Here is what this means for your account:')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
${pBulletItem('Your data and invoices remain safely stored in your account.')}
${pBulletItem('Premium features are no longer available on the Free plan.')}
${pBulletItem('You can resubscribe at any time to regain full access.')}
              </table>
${pParagraph('We are sorry to see you go. If there is anything we can do to improve your experience, please let us know.')}
${pButton('Resubscribe', 'https://flowbooks.app/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplPasswordReset(d: EmailTemplateData): EmailTemplateResult {
  const link = d.resetLink || 'https://flowbooks.app/login';
  const subject = 'Reset your Flowbooks password';

  const body = `
${pGreeting(d.userName)}
${pParagraph('We received a request to reset the password for your Flowbooks account. Click the button below to set a new password.')}
${pButton('Reset Password', link)}
${pNoteBox('<strong>This link will expire in 1 hour.</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.')}
${pParagraph('If the button above does not work, copy and paste this URL into your browser:')}
              <p style="margin:0 0 20px;font-size:12px;color:${C.textLight};word-break:break-all;line-height:1.6;padding:14px 18px;background:${C.slateBg};border-radius:8px;border:1px solid ${C.border};">${esc(link)}</p>
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplNewsletter(d: EmailTemplateData): EmailTemplateResult {
  const title = d.newsletterTitle || 'This Week at Flowbooks';
  const subject = title;

  // If sections are provided, render each; otherwise fall back to announcementBody
  let sectionsHtml = '';
  if (d.newsletterSections && d.newsletterSections.length > 0) {
    sectionsHtml = d.newsletterSections.map(section => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 22px;background:${C.slateBg};border-radius:10px;border:1px solid ${C.border};">
                    <h3 style="margin:0 0 10px;font-size:16px;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${esc(section.heading)}</h3>
                    <div style="font-size:14px;color:${C.textMid};line-height:1.75;">${nl2br(section.body)}</div>
                  </td>
                </tr>
              </table>`).join('');
  } else if (d.announcementBody) {
    // Parse markdown-style ## headings into sections
    const raw = d.announcementBody;
    const parts = raw.split(/^## /m).filter(Boolean);
    if (parts.length > 1 || raw.startsWith('## ')) {
      sectionsHtml = parts.map(part => {
        const [heading, ...rest] = part.split('\n');
        return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 22px;background:${C.slateBg};border-radius:10px;border:1px solid ${C.border};">
                    <h3 style="margin:0 0 10px;font-size:16px;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${esc(heading.trim())}</h3>
                    <div style="font-size:14px;color:${C.textMid};line-height:1.75;">${nl2br(rest.join('\n').trim())}</div>
                  </td>
                </tr>
              </table>`;
      }).join('');
    } else {
      sectionsHtml = `
              <div style="font-size:14px;color:${C.textMid};line-height:1.75;margin:0 0 24px;">${nl2br(raw)}</div>`;
    }
  }

  const footerNote = d.newsletterFooterNote
    ? `${pNoteBox(d.newsletterFooterNote)}`
    : '';

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const body = `
              <!-- Newsletter date -->
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">${esc(dateStr)}</p>

              <!-- Title -->
              <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${C.brand};letter-spacing:-0.02em;">${esc(title)}</h2>

${pGreeting(d.userName)}
${pParagraph('Here is your weekly update from Flowbooks — new features, tips, and insights to help you manage your finances smarter.')}
${pDivider()}
${sectionsHtml}
${footerNote}
${pButton('Open Flowbooks', 'https://flowbooks.app')}
${pDivider()}
              <p style="margin:0;font-size:12px;color:${C.textLight};line-height:1.6;text-align:center;">
                You are receiving this because you are subscribed to Flowbooks updates.<br/>
                <a href="https://flowbooks.app/settings" style="color:${C.brand};text-decoration:underline;">Manage email preferences</a>
              </p>`;

  return { subject, html: pShell(subject, body) };
}

function tplFeedbackAcknowledged(d: EmailTemplateData): EmailTemplateResult {
  const feedbackSubject = d.feedbackSubject || 'your feedback';
  const response = d.feedbackResponse || '';
  const subject = `Your Feedback Has Been Reviewed — Flowbooks`;

  const body = `
${pGreeting(d.userName)}
${pParagraph(`Thank you for taking the time to share your feedback with us. We've reviewed your submission regarding: <strong>${esc(feedbackSubject)}</strong>`)}
${response ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:22px 24px;background:${C.greenBg};border-radius:10px;border:1px solid #D1FAE5;">
                    <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.greenDark};font-weight:600;">Admin Response</p>
                    <div style="font-size:14px;color:${C.text};line-height:1.75;">${nl2br(response)}</div>
                  </td>
                </tr>
              </table>
` : ''}
${pParagraph('Your input helps us improve Flowbooks for everyone. We truly appreciate your contribution.')}
${pButton('View Dashboard', 'https://flowbooks.app/companies')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplTicketInProgress(d: EmailTemplateData): EmailTemplateResult {
  const ticket = d.ticketSubject || 'your support ticket';
  const subject = `Your Ticket Is Being Worked On — Flowbooks Support`;

  const body = `
${pGreeting(d.userName)}
${pParagraph(`Great news! Our support team has started working on your ticket: <strong>${esc(ticket)}</strong>`)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:22px 24px;background:${C.brandBg};border-radius:10px;border:1px solid #F4D4C4;">
                    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.brand};font-weight:600;">Status Update</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${C.brand};">In Progress</p>
                  </td>
                </tr>
              </table>
${pParagraph('We\'ll keep you updated as we make progress. You can check the status of your ticket anytime from your dashboard.')}
${pButton('View Support', 'https://flowbooks.app/settings?section=support')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplMessageReset(d: EmailTemplateData): EmailTemplateResult {
  const limit = d.weeklyMessageLimit || '150';
  const plan = d.planName || 'your';
  const subject = `Your Weekly AI Usage Has Been Reset — Flowbooks`;

  const body = `
${pGreeting(d.userName)}
${pParagraph('Your weekly AI usage has been reset! You\'re all set for another week of AI-powered accounting.')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                <tr>
                  <td style="padding:22px 24px;background:${C.greenBg};border-radius:10px;border:1px solid #D1FAE5;">
                    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.greenDark};font-weight:600;">Weekly Reset</p>
                    <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:${C.green};">Weekly AI Usage Reset</p>
                    <p style="margin:0;font-size:13px;color:${C.textMid};">Available on your ${esc(plan)} plan</p>
                  </td>
                </tr>
              </table>
${pParagraph('Use your AI allowance to chat with the assistant, generate invoices, and get accounting insights.')}
${pButton('Open Flowbooks', 'https://flowbooks.app/companies')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

// ------------------------------------------
// Main dispatcher
// ------------------------------------------

/**
 * Generate a platform email template.
 *
 * @param type   - One of the 10 supported email template types
 * @param data   - Template-specific data fields (typed or plain record)
 * @returns      `{ subject, html }` ready to pass to `sendEmail()`
 */
export function getEmailTemplate(
  type: EmailTemplateType,
  data: EmailTemplateData | Record<string, string>,
): EmailTemplateResult {
  switch (type) {
    case 'welcome':
      return tplWelcome(data);
    case 'plan_changed':
      return tplPlanChanged(data);
    case 'messages_granted':
      return tplMessagesGranted(data);
    case 'account_warning':
      return tplAccountWarning(data);
    case 'support_reply':
      return tplSupportReply(data);
    case 'announcement':
      return tplAnnouncement(data);
    case 'custom':
      return tplCustom(data);
    case 'payment_receipt':
      return tplPaymentReceipt(data);
    case 'subscription_cancelled':
      return tplSubscriptionCancelled(data);
    case 'password_reset':
      return tplPasswordReset(data);
    case 'newsletter':
      return tplNewsletter(data);
    case 'feedback_acknowledged':
      return tplFeedbackAcknowledged(data);
    case 'ticket_in_progress':
      return tplTicketInProgress(data);
    case 'message_reset':
      return tplMessageReset(data);
    default: {
      // Fallback to custom template for any unknown type
      const fallback: EmailTemplateData = {
        ...data,
        customSubject: data.customSubject || 'Message from Flowbooks',
        customMessage: data.customMessage || '',
      };
      return tplCustom(fallback);
    }
  }
}
