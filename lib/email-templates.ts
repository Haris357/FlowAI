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
  | 'new_blog'
  | 'feedback_acknowledged'
  | 'ticket_in_progress'
  | 'message_reset'
  // Subscription lifecycle (Lemon Squeezy)
  | 'subscription_started'
  | 'subscription_renewed'
  | 'subscription_cancelled_scheduled'
  | 'subscription_ended'
  | 'subscription_renewal_reminder'
  | 'subscription_resumed'
  | 'subscription_payment_failed'
  | 'subscription_refunded'
  | 'trial_ending'
  | 'trial_expired';

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
  // New blog post
  blogTitle?: string;
  blogExcerpt?: string;
  blogSlug?: string;
  blogCategory?: string;
  blogCoverImage?: string;
  blogReadTime?: number;
  blogTags?: string[];
  // Feedback
  feedbackSubject?: string;
  feedbackResponse?: string;
  // Message reset
  weeklyMessageLimit?: string; // @deprecated — kept for template compatibility
  // Subscription lifecycle
  invoiceNumber?: string;
  billingPeriod?: 'monthly' | 'yearly';
  renewalDate?: string;        // ISO or pretty
  endDate?: string;            // ISO or pretty
  nextRenewalAmount?: string;  // e.g. "$29.00"
  paymentMethod?: string;      // e.g. "Visa ending in 4242"
  updatePaymentUrl?: string;
  trialEndDate?: string;
  refundAmount?: string;
  failureReason?: string;
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
      { key: 'resetLink', label: 'Reset Link', type: 'text', required: true, placeholder: 'https://flowbooksai.com/reset?token=...' },
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
  {
    value: 'new_blog', type: 'new_blog',
    label: 'New Blog Post',
    description: 'Notify users that a new post has gone live on the blog',
    icon: 'book-open',
    color: '#D97757',
    fields: [
      { key: 'blogTitle', label: 'Post Title', type: 'text', required: true, placeholder: 'The 5 invoicing mistakes small businesses keep making' },
      { key: 'blogExcerpt', label: 'Excerpt', type: 'textarea', required: true, placeholder: 'A 1–2 sentence summary shown before the Read button' },
      { key: 'blogSlug', label: 'Slug', type: 'text', required: true, placeholder: 'five-invoicing-mistakes' },
      { key: 'blogCategory', label: 'Category', type: 'text', placeholder: 'Guides' },
      { key: 'blogCoverImage', label: 'Cover image URL (optional)', type: 'text', placeholder: 'https://…' },
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

// ==========================================
// ICON LIBRARY — inline SVGs for email
// Embedded inline so no external asset fetches are needed.
// Renders in Gmail, Apple Mail, Outlook Web, Fastmail, etc.
// Outlook Desktop falls back gracefully to the colored badge.
// ==========================================

type IconName =
  | 'check-circle'
  | 'x-circle'
  | 'credit-card'
  | 'receipt'
  | 'calendar'
  | 'clock'
  | 'sparkles'
  | 'alert-triangle'
  | 'refresh'
  | 'crown'
  | 'heart'
  | 'mail'
  | 'arrow-right'
  | 'shield'
  | 'info';

function iconSvg(name: IconName, color: string, size = 20): string {
  const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"`;
  switch (name) {
    case 'check-circle':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    case 'x-circle':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    case 'credit-card':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
    case 'receipt':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`;
    case 'calendar':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    case 'clock':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    case 'sparkles':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>`;
    case 'alert-triangle':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    case 'refresh':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
    case 'crown':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><path d="M2 18h20l-2-12-5 4-5-7-5 7-5-4z"/><line x1="2" y1="22" x2="22" y2="22"/></svg>`;
    case 'heart':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    case 'mail':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
    case 'arrow-right':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    case 'shield':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    case 'info':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }
}

/**
 * Circular colored badge containing an inline SVG icon.
 * Works as a visual anchor at the top of callout boxes and section headers.
 */
function pIconBadge(icon: IconName, bgColor: string, iconColor: string, size = 44): string {
  const iconSize = Math.round(size * 0.5);
  return `<div style="display:inline-block;width:${size}px;height:${size}px;background:${bgColor};border-radius:50%;text-align:center;line-height:${size}px;vertical-align:middle;">
    <div style="display:inline-block;vertical-align:middle;line-height:0;padding-top:${Math.round(size / 2 - iconSize / 2)}px;">${iconSvg(icon, iconColor, iconSize)}</div>
  </div>`;
}

/**
 * Full-width hero callout with an icon badge, title and subtitle.
 * Used for primary status moments: subscription started, renewed, cancelled, etc.
 */
function pHeroCallout(
  icon: IconName,
  title: string,
  subtitle: string,
  accent: string,
  accentBg: string,
): string {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:28px 24px;background:${accentBg};border-radius:12px;text-align:center;border:1px solid ${accent}22;">
                    <div style="margin:0 auto 14px;">${pIconBadge(icon, '#FFFFFF', accent, 56)}</div>
                    <h2 style="margin:0;font-size:20px;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${esc(title)}</h2>
                    <p style="margin:8px 0 0;font-size:14px;color:${C.textMid};line-height:1.6;">${subtitle}</p>
                  </td>
                </tr>
              </table>`;
}

/**
 * Section header with an inline icon on the left, for grouping details below.
 */
function pSectionHeader(icon: IconName, label: string, color = C.brand): string {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 12px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;line-height:0;">${iconSvg(icon, color, 18)}</td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${color};font-weight:700;">${esc(label)}</p>
                  </td>
                </tr>
              </table>`;
}

/**
 * Box with an icon on the left and stacked label/value content on the right.
 * Used for compact info callouts (e.g., renewal date, payment method).
 */
function pIconInfoBox(icon: IconName, label: string, value: string, color = C.brand): string {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
                <tr>
                  <td style="padding:16px 20px;background:${C.brandBg};border-radius:10px;border-left:4px solid ${color};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" style="vertical-align:middle;line-height:0;padding-right:14px;">${pIconBadge(icon, '#FFFFFF', color, 36)}</td>
                        <td style="vertical-align:middle;">
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${C.textLight};font-weight:600;">${esc(label)}</p>
                          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:${C.text};">${value}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`;
}

/**
 * Icon + text bullet row — replaces pBulletItem when an icon fits better.
 */
function pIconBullet(icon: IconName, text: string, color = C.green): string {
  return `
                <tr>
                  <td style="padding:10px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" style="vertical-align:top;padding-top:2px;line-height:0;">${iconSvg(icon, color, 18)}</td>
                        <td style="vertical-align:top;padding-left:4px;">
                          <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.6;">${text}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
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
${pButton('Get Started', 'https://flowbooksai.com')}
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
${pButton('View My Plan', 'https://flowbooksai.com/settings/billing')}
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
${pButton('Check My Balance', 'https://flowbooksai.com/settings')}
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
${pButton('Review My Account', 'https://flowbooksai.com/settings')}
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
${pButton('View Ticket', 'https://flowbooksai.com/settings?section=support')}
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
${pHeroCallout('check-circle', 'Payment Received', `Thank you for your payment of <strong>${esc(amount)}</strong>.`, C.green, C.greenBg)}
${pSectionHeader('receipt', 'Receipt Details', C.brand)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:10px;overflow:hidden;border:1px solid ${C.border};">
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
${pParagraph('Your subscription is active. You can view your full billing history and manage your subscription from your account settings.')}
${pButton('View Billing', 'https://flowbooksai.com/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionCancelled(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'your plan';
  const subject = 'Your Flowbooks subscription has been cancelled';

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('x-circle', 'Subscription Cancelled', `Your <strong>${esc(plan)}</strong> plan has been cancelled.`, C.slateDark, C.slateBg)}
${pParagraph('Here is what this means for your account:')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
${pIconBullet('shield', 'Your data and invoices remain safely stored in your account.', C.green)}
${pIconBullet('info', 'Premium features are no longer available on the Free plan.', C.slateDark)}
${pIconBullet('refresh', 'You can resubscribe at any time to regain full access.', C.brand)}
              </table>
${pParagraph('We are sorry to see you go. If there is anything we can do to improve your experience, please let us know.')}
${pButton('Resubscribe', 'https://flowbooksai.com/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplPasswordReset(d: EmailTemplateData): EmailTemplateResult {
  const link = d.resetLink || 'https://flowbooksai.com/login';
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
${pButton('Open Flowbooks', 'https://flowbooksai.com')}
${pDivider()}
              <p style="margin:0;font-size:12px;color:${C.textLight};line-height:1.6;text-align:center;">
                You are receiving this because you are subscribed to Flowbooks updates.<br/>
                <a href="https://flowbooksai.com/settings" style="color:${C.brand};text-decoration:underline;">Manage email preferences</a>
              </p>`;

  return { subject, html: pShell(subject, body) };
}

function tplNewBlog(d: EmailTemplateData): EmailTemplateResult {
  const title = d.blogTitle || 'New post on the Flowbooks blog';
  const excerpt = d.blogExcerpt || '';
  const slug = d.blogSlug || '';
  const category = d.blogCategory || 'Guides';
  const coverImage = d.blogCoverImage || '';
  const readTime = d.blogReadTime || 5;
  const tags = d.blogTags || [];

  const baseUrl = (process.env.APP_URL || 'https://flowbooksai.com').replace(/\/$/, '');
  const postUrl = slug ? `${baseUrl}/blog/${slug}` : `${baseUrl}/blog`;

  const subject = `New on Flowbooks: ${title}`;

  const coverHtml = coverImage ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:0;border-radius:10px;overflow:hidden;">
                    <a href="${esc(postUrl)}" target="_blank" style="display:block;">
                      <img src="${esc(coverImage)}" alt="${esc(title)}" width="500" style="display:block;width:100%;max-width:500px;height:auto;border-radius:10px;"/>
                    </a>
                  </td>
                </tr>
              </table>` : '';

  const tagsHtml = tags.length > 0 ? `
              <p style="margin:16px 0 0;font-size:12px;color:${C.textLight};">
                ${tags.slice(0, 5).map(t => `<span style="display:inline-block;margin:0 6px 4px 0;padding:3px 10px;background:${C.slateBg};color:${C.textMid};border-radius:999px;font-size:11px;font-weight:500;">${esc(t)}</span>`).join('')}
              </p>` : '';

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const body = `
              <!-- Category label + date -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:4px 10px;background:${C.brandBg};color:${C.brand};border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">${esc(category)}</span>
                    <span style="margin-left:8px;font-size:12px;color:${C.textLight};">${esc(dateStr)} · ${readTime} min read</span>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <h2 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${C.text};letter-spacing:-0.02em;line-height:1.25;">
                <a href="${esc(postUrl)}" target="_blank" style="color:${C.text};text-decoration:none;">${esc(title)}</a>
              </h2>

              ${coverHtml}

${excerpt ? `              <p style="margin:0 0 24px;font-size:15px;color:${C.textMid};line-height:1.75;">${esc(excerpt)}</p>` : ''}

${pButton('Read the full post', postUrl)}

${tagsHtml}

${pDivider()}

${pGreeting(d.userName)}
${pParagraph('We just published this post on the Flowbooks blog. Give it a read — it is designed to help small-business owners like you run sharper operations.')}

              <p style="margin:24px 0 0;font-size:12px;color:${C.textLight};line-height:1.6;text-align:center;">
                You are receiving this because you opted into new blog-post alerts.<br/>
                <a href="${esc(baseUrl)}/settings" style="color:${C.brand};text-decoration:underline;">Manage email preferences</a>
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
${pButton('View Dashboard', 'https://flowbooksai.com/companies')}
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
${pButton('View Support', 'https://flowbooksai.com/settings?section=support')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

// ==========================================
// SUBSCRIPTION LIFECYCLE TEMPLATES
// ==========================================

function tplSubscriptionStarted(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'Pro';
  const amount = d.amount || '$0.00';
  const period = d.billingPeriod === 'yearly' ? 'yearly' : 'monthly';
  const renewal = d.renewalDate || '—';
  const invoiceNumber = d.invoiceNumber || '—';
  const subject = `Welcome to Flowbooks ${plan}`;

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('sparkles', `You're on ${plan}!`, `Your subscription is live — thanks for choosing Flowbooks.`, C.brand, C.brandBg)}
${pParagraph(`Your <strong>${esc(plan)}</strong> plan is now active, billed ${esc(period)} at <strong>${esc(amount)}</strong>. A copy of your invoice is attached to this email.`)}

${pSectionHeader('receipt', 'Subscription Details', C.brand)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${C.border};border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${pReceiptRow('Plan', esc(plan))}
${pReceiptRow('Billing', `${period === 'yearly' ? 'Yearly' : 'Monthly'} — ${esc(amount)}`)}
${pReceiptRow('Next Renewal', esc(renewal))}
${pReceiptRow('Invoice #', esc(invoiceNumber))}
                    </table>
                  </td>
                </tr>
              </table>

${pSectionHeader('crown', 'What\'s unlocked for you', C.brand)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
${pIconBullet('sparkles', 'Extended AI usage per session and across the week.', C.brand)}
${pIconBullet('shield', 'All financial reports, payroll, and exports.', C.green)}
${pIconBullet('crown', 'Higher company and team member allowances.', C.brand)}
${pIconBullet('mail', 'Priority support when you need a hand.', C.brandDark)}
              </table>

${pButton('Manage Subscription', 'https://flowbooksai.com/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionRenewed(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'Pro';
  const amount = d.amount || '$0.00';
  const period = d.billingPeriod === 'yearly' ? 'yearly' : 'monthly';
  const renewal = d.renewalDate || '—';
  const invoiceNumber = d.invoiceNumber || '—';
  const subject = `Flowbooks ${plan} renewed — ${amount}`;

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('check-circle', 'Subscription Renewed', `Your <strong>${esc(plan)}</strong> plan has been renewed for another ${esc(period === 'yearly' ? 'year' : 'month')}.`, C.green, C.greenBg)}
${pParagraph(`Thanks for continuing with Flowbooks. A PDF invoice is attached to this email for your records.`)}

${pSectionHeader('receipt', 'Renewal Details', C.brand)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${C.border};border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${pReceiptRow('Plan', esc(plan))}
${pReceiptRow('Amount Charged', esc(amount))}
${pReceiptRow('Next Renewal', esc(renewal))}
${pReceiptRow('Invoice #', esc(invoiceNumber))}
${d.paymentMethod ? pReceiptRow('Payment Method', esc(d.paymentMethod)) : ''}
                    </table>
                  </td>
                </tr>
              </table>

${pButton('View Billing', 'https://flowbooksai.com/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionCancelledScheduled(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'your plan';
  const endDate = d.endDate || 'the end of your billing period';
  const subject = 'Your Flowbooks subscription is cancelled';

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('clock', 'Cancellation Scheduled', `Your <strong>${esc(plan)}</strong> subscription will end on <strong>${esc(endDate)}</strong>.`, C.amberDark, C.amberBg)}
${pParagraph(`You'll keep full access to every <strong>${esc(plan)}</strong> feature until that date. After that, your account will be moved to the Free plan.`)}

${pIconInfoBox('calendar', 'Access ends on', esc(endDate), C.amber)}

${pSectionHeader('info', 'Changed your mind?', C.brand)}
${pParagraph('You can resume your subscription at any time before the end date — no re-payment needed, and your plan simply continues.')}

${pButton('Resume Subscription', 'https://flowbooksai.com/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionEnded(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'your plan';
  const subject = 'Your Flowbooks subscription has ended';

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('x-circle', 'Subscription Ended', `Your <strong>${esc(plan)}</strong> plan has ended and your account is now on the Free plan.`, C.slateDark, C.slateBg)}
${pParagraph('Your data, invoices, and companies remain safely stored. You can come back and pick up where you left off anytime.')}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
${pIconBullet('shield', 'All your data is preserved — nothing has been deleted.', C.green)}
${pIconBullet('info', 'Paid features are paused until you resubscribe.', C.slateDark)}
${pIconBullet('refresh', 'Resubscribe anytime to restore full access instantly.', C.brand)}
              </table>

${pButton('Resubscribe', 'https://flowbooksai.com/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionRenewalReminder(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'your plan';
  const amount = d.nextRenewalAmount || d.amount || '$0.00';
  const renewal = d.renewalDate || 'soon';
  const subject = `Your Flowbooks subscription renews on ${renewal}`;

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('calendar', 'Renewal Coming Up', `Your <strong>${esc(plan)}</strong> subscription will renew on <strong>${esc(renewal)}</strong>.`, C.brand, C.brandBg)}
${pParagraph(`We'll charge <strong>${esc(amount)}</strong> to your payment method on file. No action is needed — this is just a heads-up.`)}

${pIconInfoBox('credit-card', 'Payment Method', esc(d.paymentMethod || 'Card on file'), C.brand)}

${pSectionHeader('info', 'Want to make changes?', C.brand)}
${pParagraph('You can update your payment method, change plans, or cancel at any time from your billing settings.')}

${pButton('Manage Subscription', 'https://flowbooksai.com/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionResumed(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'your plan';
  const renewal = d.renewalDate || '—';
  const subject = 'Welcome back — your Flowbooks subscription is active';

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('check-circle', 'Subscription Resumed', `Your <strong>${esc(plan)}</strong> plan is active again.`, C.green, C.greenBg)}
${pParagraph(`Your subscription has been reactivated. Full ${esc(plan)} features are back, and your next renewal is on <strong>${esc(renewal)}</strong>.`)}

${pButton('Go to Flowbooks', 'https://flowbooksai.com/companies')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionPaymentFailed(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'your plan';
  const reason = d.failureReason || 'the card on file was declined';
  const updateUrl = d.updatePaymentUrl || 'https://flowbooksai.com/settings/billing';
  const subject = 'Payment issue with your Flowbooks subscription';

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('alert-triangle', 'Payment Failed', `We couldn't process the latest payment for your <strong>${esc(plan)}</strong> plan.`, C.redDark, C.redBg)}
${pParagraph(`Reason: <strong>${esc(reason)}</strong>. We'll retry automatically, but to keep things running smoothly it's best to update your payment method.`)}

${pWarningBox('If payment is not received before the end of your billing period, your subscription will be suspended and your account moved to the Free plan.')}

${pButton('Update Payment Method', updateUrl)}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplSubscriptionRefunded(d: EmailTemplateData): EmailTemplateResult {
  const plan = d.planName || 'your plan';
  const refund = d.refundAmount || d.amount || '$0.00';
  const subject = 'Your Flowbooks refund has been processed';

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('refresh', 'Refund Processed', `A refund of <strong>${esc(refund)}</strong> has been issued for your <strong>${esc(plan)}</strong> plan.`, C.brand, C.brandBg)}
${pParagraph('The refund should appear on your statement within 3–5 business days, depending on your bank.')}

${pIconInfoBox('credit-card', 'Refund Amount', esc(refund), C.brand)}

${pParagraph('If you have any questions, reach out to our support team and we\'ll be happy to help.')}
${pButton('Contact Support', 'https://flowbooksai.com/settings?section=support')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplTrialEnding(d: EmailTemplateData): EmailTemplateResult {
  const trialEnd = d.trialEndDate || 'soon';
  const subject = 'Your Flowbooks free trial ends soon';

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('clock', 'Your Trial Is Ending', `Your Flowbooks free trial ends on <strong>${esc(trialEnd)}</strong>.`, C.amberDark, C.amberBg)}
${pParagraph('Subscribe now to keep using all the features you\'ve been enjoying — no interruption to your work.')}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
${pIconBullet('sparkles', 'Extended AI usage and advanced models.', C.brand)}
${pIconBullet('shield', 'All reports, payroll, and exports — unlocked.', C.green)}
${pIconBullet('crown', 'Multiple companies and team members.', C.brandDark)}
              </table>

${pButton('Subscribe Now', 'https://flowbooksai.com/settings/billing')}
${pSignOff()}`;

  return { subject, html: pShell(subject, body) };
}

function tplTrialExpired(d: EmailTemplateData): EmailTemplateResult {
  const subject = 'Your Flowbooks free trial has ended';

  const body = `
${pGreeting(d.userName)}
${pHeroCallout('x-circle', 'Trial Expired', 'Your 3-day free trial has ended. To keep using Flowbooks, please subscribe to a plan.', C.redDark, C.redBg)}
${pParagraph('Your data is safe — everything you created during the trial is still there. Pick a plan to pick up right where you left off.')}

${pButton('View Plans', 'https://flowbooksai.com/settings/billing')}
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
${pButton('Open Flowbooks', 'https://flowbooksai.com/companies')}
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
    case 'new_blog':
      return tplNewBlog(data);
    case 'feedback_acknowledged':
      return tplFeedbackAcknowledged(data);
    case 'ticket_in_progress':
      return tplTicketInProgress(data);
    case 'message_reset':
      return tplMessageReset(data);
    case 'subscription_started':
      return tplSubscriptionStarted(data);
    case 'subscription_renewed':
      return tplSubscriptionRenewed(data);
    case 'subscription_cancelled_scheduled':
      return tplSubscriptionCancelledScheduled(data);
    case 'subscription_ended':
      return tplSubscriptionEnded(data);
    case 'subscription_renewal_reminder':
      return tplSubscriptionRenewalReminder(data);
    case 'subscription_resumed':
      return tplSubscriptionResumed(data);
    case 'subscription_payment_failed':
      return tplSubscriptionPaymentFailed(data);
    case 'subscription_refunded':
      return tplSubscriptionRefunded(data);
    case 'trial_ending':
      return tplTrialEnding(data);
    case 'trial_expired':
      return tplTrialExpired(data);
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

// ==========================================
// SALARY SLIP EMAIL
// ==========================================

export type SalarySlipEmailData = {
  employeeName: string;
  month: number; // 1-12
  year: number;
  basicSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  paymentMethod?: string;
  status: string; // 'generated' | 'paid'
};

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function getSalarySlipEmailSubject(
  slipMonth: number,
  slipYear: number,
  companyName: string,
): string {
  const monthName = MONTHS_LONG[(slipMonth || 1) - 1] || 'January';
  return `Salary Slip - ${monthName} ${slipYear} | ${companyName}`;
}

export function salarySlipEmail(slip: SalarySlipEmailData, company: CompanyEmailData): string {
  const isPaid = slip.status === 'paid';
  const accent = isPaid ? C.green : C.brand;
  const accentDark = isPaid ? C.greenDark : C.brandDark;
  const accentBg = isPaid ? C.greenBg : C.brandBg;
  const badge = isPaid ? 'Payment Confirmed' : 'Salary Slip';
  const monthName = MONTHS_LONG[(slip.month || 1) - 1] || 'January';
  const periodLabel = `${monthName} ${slip.year}`;

  const fmtC = (n: number) => fmtCurrency(n, company.currency);

  const contactParts = [company.email, company.phone].filter(Boolean);
  const contactHtml = contactParts.length > 0
    ? `<p style="margin:4px 0 0;font-size:12px;color:${C.textLight};">${contactParts.join(' &nbsp;·&nbsp; ')}</p>`
    : '';
  const addressHtml = company.address
    ? `<p style="margin:2px 0 0;font-size:12px;color:${C.textLight};">${company.address}</p>`
    : '';

  const metaHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:20px 24px;background:${C.borderLight};border-radius:10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${metaRow('Pay Period', periodLabel)}
            ${metaRow('Basic Salary', fmtC(slip.basicSalary))}
            ${metaRow('Total Earnings', fmtC(slip.totalEarnings))}
            ${metaRow('Total Deductions', fmtC(slip.totalDeductions))}
            <tr>
              <td style="padding:14px 0 4px;font-size:13px;color:${C.textLight};">Net Pay</td>
              <td style="padding:14px 0 4px;font-size:20px;font-weight:700;color:${accent};text-align:right;">${fmtC(slip.netSalary)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  const netPayCardHtml = isPaid ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="padding:28px 24px;text-align:center;background:${accentBg};border-radius:10px;border:1px solid ${C.border};">
          <div style="width:48px;height:48px;margin:0 auto 12px;background:${accent};border-radius:50%;line-height:48px;text-align:center;">
            <span style="font-size:22px;color:#fff;font-weight:700;">✓</span>
          </div>
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Net Pay Received</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:700;color:${accent};letter-spacing:-0.02em;">${fmtC(slip.netSalary)}</p>
          <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">${periodLabel}${slip.paymentMethod ? ' &nbsp;·&nbsp; ' + slip.paymentMethod : ''}</p>
        </td>
      </tr>
    </table>` : '';

  const attachNote = `
    <p style="margin:24px 0 0;font-size:12px;color:${C.textLight};line-height:1.5;text-align:center;">
      📎 &nbsp;Your salary slip is attached as a PDF.
    </p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Salary Slip — ${periodLabel}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:48px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${C.white};border-radius:16px;overflow:hidden;border:1px solid ${C.border};">

          <!-- Accent bar -->
          <tr><td style="height:4px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${company.name}</h1>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <span style="display:inline-block;padding:5px 12px;background:${accentBg};color:${accent};font-size:11px;font-weight:700;border-radius:20px;letter-spacing:0.04em;text-transform:uppercase;">${badge}</span>
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
              <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:${C.text};">Dear ${slip.employeeName},</p>
              <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.7;">Please find your salary slip for <strong>${periodLabel}</strong> attached below.</p>
              ${metaHtml}
              ${netPayCardHtml}
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

      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

// ==========================================
// BILL EMAIL (to vendor)
// ==========================================

export type BillEmailType = 'created' | 'payment_sent';

export type BillEmailData = {
  billNumber: string;
  vendorName: string;
  issueDate: any;
  dueDate?: any;
  total: number;
  amountPaid: number;
  amountDue: number;
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  notes?: string;
};

export function getBillEmailSubject(
  type: BillEmailType,
  billNumber: string,
  companyName: string,
): string {
  switch (type) {
    case 'created':
      return `Bill ${billNumber} from ${companyName}`;
    case 'payment_sent':
      return `Payment Sent — Bill ${billNumber}`;
  }
}

export function billEmail(
  type: BillEmailType,
  bill: BillEmailData,
  company: CompanyEmailData,
): string {
  const isPayment = type === 'payment_sent';
  const accent = isPayment ? C.green : C.brand;
  const accentDark = isPayment ? C.greenDark : C.brandDark;
  const accentBg = isPayment ? C.greenBg : C.brandBg;
  const badge = isPayment ? 'Payment Sent' : 'Bill Received';

  const fmtC = (n: number) => fmtCurrency(n, company.currency);

  const contactParts = [company.email, company.phone].filter(Boolean);
  const contactHtml = contactParts.length > 0
    ? `<p style="margin:4px 0 0;font-size:12px;color:${C.textLight};">${contactParts.join(' &nbsp;·&nbsp; ')}</p>`
    : '';
  const addressHtml = company.address
    ? `<p style="margin:2px 0 0;font-size:12px;color:${C.textLight};">${company.address}</p>`
    : '';

  const messageHtml = isPayment
    ? `We have processed payment for bill <strong>${bill.billNumber}</strong>. Thank you for your service.`
    : `Thank you for your invoice <strong>${bill.billNumber}</strong>. Please find the bill details below.`;

  // Items table for 'created'
  const itemsHtml = !isPayment ? (() => {
    const rows = (bill.items || []).map(item => `
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:${C.text};border-bottom:1px solid ${C.borderLight};">${item.description}</td>
        <td style="padding:12px 16px;font-size:13px;color:${C.textMid};text-align:center;border-bottom:1px solid ${C.borderLight};">${item.quantity}</td>
        <td style="padding:12px 16px;font-size:13px;color:${C.textMid};text-align:right;border-bottom:1px solid ${C.borderLight};">${fmtC(item.rate)}</td>
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:${C.text};text-align:right;border-bottom:1px solid ${C.borderLight};">${fmtC(item.quantity * item.rate)}</td>
      </tr>`).join('');

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
      <tfoot>
        <tr>
          <td colspan="3" style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:${C.text};border-top:2px solid ${C.border};">Total</td>
          <td style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:${accent};border-top:2px solid ${C.border};">${fmtC(bill.total)}</td>
        </tr>
      </tfoot>
    </table>`;
  })() : '';

  const metaHtml = !isPayment ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:20px 24px;background:${C.borderLight};border-radius:10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${metaRow('Bill Number', bill.billNumber)}
            ${metaRow('Issue Date', fmtDate(bill.issueDate))}
            ${bill.dueDate ? metaRow('Due Date', fmtDate(bill.dueDate)) : ''}
            <tr>
              <td style="padding:14px 0 4px;font-size:13px;color:${C.textLight};">Amount Due</td>
              <td style="padding:14px 0 4px;font-size:20px;font-weight:700;color:${accent};text-align:right;">${fmtC(bill.amountDue)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>` : '';

  const paymentCardHtml = isPayment ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:28px 24px;text-align:center;background:${accentBg};border-radius:10px;border:1px solid ${C.border};">
          <div style="width:48px;height:48px;margin:0 auto 12px;background:${accent};border-radius:50%;line-height:48px;text-align:center;">
            <span style="font-size:22px;color:#fff;font-weight:700;">✓</span>
          </div>
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Amount Paid</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:700;color:${accent};letter-spacing:-0.02em;">${fmtC(bill.amountPaid)}</p>
          <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">Bill ${bill.billNumber}</p>
        </td>
      </tr>
    </table>` : '';

  const notesHtml = bill.notes ? `
    <div style="margin:24px 0 0;padding:14px 16px;background:${C.amberBg};border-left:3px solid ${C.amber};border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${C.amberDark};font-weight:700;">Notes</p>
      <p style="margin:6px 0 0;font-size:13px;color:${C.textMid};line-height:1.6;">${bill.notes}</p>
    </div>` : '';

  const attachNote = !isPayment ? `
    <p style="margin:24px 0 0;font-size:12px;color:${C.textLight};line-height:1.5;text-align:center;">
      📎 &nbsp;Bill details attached as PDF.
    </p>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${badge} — ${bill.billNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:48px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${C.white};border-radius:16px;overflow:hidden;border:1px solid ${C.border};">

          <!-- Accent bar -->
          <tr><td style="height:4px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${company.name}</h1>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <span style="display:inline-block;padding:5px 12px;background:${accentBg};color:${accent};font-size:11px;font-weight:700;border-radius:20px;letter-spacing:0.04em;text-transform:uppercase;">${badge}</span>
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
              <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:${C.text};">Dear ${bill.vendorName},</p>
              <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.7;">${messageHtml}</p>
              ${metaHtml}
              ${paymentCardHtml}
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

      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

// ==========================================
// QUOTE EMAIL (to customer)
// ==========================================

export type QuoteEmailType = 'sent' | 'reminder' | 'accepted' | 'expired';

export type QuoteEmailData = {
  quoteNumber: string;
  customerName: string;
  issueDate: any;
  expiryDate: any;
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
};

export function getQuoteEmailSubject(
  type: QuoteEmailType,
  quoteNumber: string,
  companyName: string,
): string {
  switch (type) {
    case 'sent':
      return `Quote ${quoteNumber} from ${companyName}`;
    case 'reminder':
      return `Reminder: Quote ${quoteNumber} expiring soon`;
    case 'accepted':
      return `Quote ${quoteNumber} Accepted`;
    case 'expired':
      return `Quote ${quoteNumber} has Expired`;
  }
}

export function quoteEmail(
  type: QuoteEmailType,
  quote: QuoteEmailData,
  company: CompanyEmailData,
): string {
  type QuoteCfg = { accent: string; accentDark: string; accentBg: string; badge: string; showItems: boolean; showAttachment: boolean };
  const cfgMap: Record<QuoteEmailType, QuoteCfg> = {
    sent:     { accent: C.brand,  accentDark: C.brandDark,  accentBg: C.brandBg,  badge: 'New Quote',     showItems: true,  showAttachment: true },
    reminder: { accent: C.amber,  accentDark: C.amberDark,  accentBg: C.amberBg,  badge: 'Expiring Soon', showItems: false, showAttachment: true },
    accepted: { accent: C.green,  accentDark: C.greenDark,  accentBg: C.greenBg,  badge: 'Accepted',      showItems: false, showAttachment: false },
    expired:  { accent: C.slate,  accentDark: C.slateDark,  accentBg: C.slateBg,  badge: 'Expired',       showItems: false, showAttachment: false },
  };
  const cfg = cfgMap[type];
  const { accent, accentDark, accentBg, badge } = cfg;

  const fmtC = (n: number) => fmtCurrency(n, company.currency);

  const contactParts = [company.email, company.phone].filter(Boolean);
  const contactHtml = contactParts.length > 0
    ? `<p style="margin:4px 0 0;font-size:12px;color:${C.textLight};">${contactParts.join(' &nbsp;·&nbsp; ')}</p>`
    : '';
  const addressHtml = company.address
    ? `<p style="margin:2px 0 0;font-size:12px;color:${C.textLight};">${company.address}</p>`
    : '';

  const messageMap: Record<QuoteEmailType, string> = {
    sent:     `Please review the quote <strong>${quote.quoteNumber}</strong> below. Feel free to reach out if you have any questions.`,
    reminder: `This is a friendly reminder that quote <strong>${quote.quoteNumber}</strong> is expiring on <strong>${fmtDate(quote.expiryDate)}</strong>. Please review it at your earliest convenience.`,
    accepted: `Thank you for accepting quote <strong>${quote.quoteNumber}</strong>. We'll be in touch shortly to proceed.`,
    expired:  `Quote <strong>${quote.quoteNumber}</strong> has expired as of <strong>${fmtDate(quote.expiryDate)}</strong>. Please contact us if you'd like to renew it.`,
  };

  const metaHtml = (type === 'sent' || type === 'reminder') ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:20px 24px;background:${C.borderLight};border-radius:10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${metaRow('Quote Number', quote.quoteNumber)}
            ${metaRow('Issue Date', fmtDate(quote.issueDate))}
            ${metaRow('Expiry Date', fmtDate(quote.expiryDate), type === 'reminder')}
            <tr>
              <td style="padding:14px 0 4px;font-size:13px;color:${C.textLight};">Total</td>
              <td style="padding:14px 0 4px;font-size:20px;font-weight:700;color:${accent};text-align:right;">${fmtC(quote.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>` : '';

  const acceptedCardHtml = type === 'accepted' ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:28px 24px;text-align:center;background:${accentBg};border-radius:10px;border:1px solid ${C.border};">
          <div style="width:48px;height:48px;margin:0 auto 12px;background:${accent};border-radius:50%;line-height:48px;text-align:center;">
            <span style="font-size:22px;color:#fff;font-weight:700;">✓</span>
          </div>
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Quote Accepted</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:700;color:${accent};letter-spacing:-0.02em;">${fmtC(quote.total)}</p>
          <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">${quote.quoteNumber}</p>
        </td>
      </tr>
    </table>` : '';

  const expiredCardHtml = type === 'expired' ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:28px 24px;text-align:center;background:${accentBg};border-radius:10px;border:1px solid ${C.border};">
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Quote Total</p>
          <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${accent};text-decoration:line-through;letter-spacing:-0.02em;">${fmtC(quote.total)}</p>
          <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">${quote.quoteNumber} — Expired</p>
        </td>
      </tr>
    </table>` : '';

  const itemsHtml = cfg.showItems ? (() => {
    const rows = (quote.items || []).map(item => `
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:${C.text};border-bottom:1px solid ${C.borderLight};">${item.description}</td>
        <td style="padding:12px 16px;font-size:13px;color:${C.textMid};text-align:center;border-bottom:1px solid ${C.borderLight};">${item.quantity}</td>
        <td style="padding:12px 16px;font-size:13px;color:${C.textMid};text-align:right;border-bottom:1px solid ${C.borderLight};">${fmtC(item.rate)}</td>
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:${C.text};text-align:right;border-bottom:1px solid ${C.borderLight};">${fmtC(item.quantity * item.rate)}</td>
      </tr>`).join('');

    let totals = `
      <tr>
        <td colspan="3" style="padding:10px 16px;text-align:right;font-size:13px;color:${C.textMid};">Subtotal</td>
        <td style="padding:10px 16px;text-align:right;font-size:13px;font-weight:600;color:${C.text};">${fmtC(quote.subtotal)}</td>
      </tr>`;
    if (quote.taxAmount > 0) {
      totals += `
      <tr>
        <td colspan="3" style="padding:6px 16px;text-align:right;font-size:13px;color:${C.textMid};">Tax</td>
        <td style="padding:6px 16px;text-align:right;font-size:13px;color:${C.text};">${fmtC(quote.taxAmount)}</td>
      </tr>`;
    }
    if (quote.discount > 0) {
      totals += `
      <tr>
        <td colspan="3" style="padding:6px 16px;text-align:right;font-size:13px;color:${C.textMid};">Discount</td>
        <td style="padding:6px 16px;text-align:right;font-size:13px;color:${C.green};">-${fmtC(quote.discount)}</td>
      </tr>`;
    }
    totals += `
      <tr>
        <td colspan="3" style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:${C.text};border-top:2px solid ${C.border};">Total</td>
        <td style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:${accent};border-top:2px solid ${C.border};">${fmtC(quote.total)}</td>
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
  })() : '';

  const notesHtml = quote.notes ? `
    <div style="margin:24px 0 0;padding:14px 16px;background:${C.amberBg};border-left:3px solid ${C.amber};border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${C.amberDark};font-weight:700;">Notes</p>
      <p style="margin:6px 0 0;font-size:13px;color:${C.textMid};line-height:1.6;">${quote.notes}</p>
    </div>` : '';

  const attachNote = cfg.showAttachment ? `
    <p style="margin:24px 0 0;font-size:12px;color:${C.textLight};line-height:1.5;text-align:center;">
      📎 &nbsp;A PDF copy of this quote is attached to this email.
    </p>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${badge} — ${quote.quoteNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:48px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${C.white};border-radius:16px;overflow:hidden;border:1px solid ${C.border};">

          <!-- Accent bar -->
          <tr><td style="height:4px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${company.name}</h1>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <span style="display:inline-block;padding:5px 12px;background:${accentBg};color:${accent};font-size:11px;font-weight:700;border-radius:20px;letter-spacing:0.04em;text-transform:uppercase;">${badge}</span>
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
              <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:${C.text};">Hi ${quote.customerName},</p>
              <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.7;">${messageMap[type]}</p>
              ${metaHtml}
              ${acceptedCardHtml}
              ${expiredCardHtml}
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

      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

// ==========================================
// PURCHASE ORDER EMAIL (to vendor)
// ==========================================

export type PurchaseOrderEmailType = 'sent' | 'confirmed' | 'cancelled';

export type PurchaseOrderEmailData = {
  poNumber: string;
  vendorName: string;
  issueDate: any;
  expectedDate?: any;
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
};

export function getPurchaseOrderEmailSubject(
  type: PurchaseOrderEmailType,
  poNumber: string,
  companyName: string,
): string {
  switch (type) {
    case 'sent':
      return `Purchase Order ${poNumber} from ${companyName}`;
    case 'confirmed':
      return `PO ${poNumber} Confirmed`;
    case 'cancelled':
      return `Purchase Order ${poNumber} Cancelled`;
  }
}

export function purchaseOrderEmail(
  type: PurchaseOrderEmailType,
  po: PurchaseOrderEmailData,
  company: CompanyEmailData,
): string {
  const blue = '#3B82F6';
  const blueDark = '#2563EB';
  const blueBg = '#EFF6FF';

  type POCfg = { accent: string; accentDark: string; accentBg: string; badge: string; showItems: boolean; showAttachment: boolean };
  const cfgMap: Record<PurchaseOrderEmailType, POCfg> = {
    sent:      { accent: blue,    accentDark: blueDark,    accentBg: blueBg,      badge: 'Purchase Order', showItems: true,  showAttachment: true },
    confirmed: { accent: C.green, accentDark: C.greenDark, accentBg: C.greenBg,   badge: 'Confirmed',      showItems: false, showAttachment: false },
    cancelled: { accent: C.red,   accentDark: C.redDark,   accentBg: C.redBg,     badge: 'Cancelled',      showItems: false, showAttachment: false },
  };
  const cfg = cfgMap[type];
  const { accent, accentDark, accentBg, badge } = cfg;

  const fmtC = (n: number) => fmtCurrency(n, company.currency);

  const contactParts = [company.email, company.phone].filter(Boolean);
  const contactHtml = contactParts.length > 0
    ? `<p style="margin:4px 0 0;font-size:12px;color:${C.textLight};">${contactParts.join(' &nbsp;·&nbsp; ')}</p>`
    : '';
  const addressHtml = company.address
    ? `<p style="margin:2px 0 0;font-size:12px;color:${C.textLight};">${company.address}</p>`
    : '';

  const messageMap: Record<PurchaseOrderEmailType, string> = {
    sent:      `Please find our purchase order <strong>${po.poNumber}</strong> below. Kindly confirm receipt and expected delivery.`,
    confirmed: `Purchase order <strong>${po.poNumber}</strong> has been confirmed. Thank you for your prompt response.`,
    cancelled: `Purchase order <strong>${po.poNumber}</strong> has been cancelled. Please disregard any previous correspondence regarding this order.`,
  };

  const metaHtml = type === 'sent' ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:20px 24px;background:${C.borderLight};border-radius:10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${metaRow('PO Number', po.poNumber)}
            ${metaRow('Issue Date', fmtDate(po.issueDate))}
            ${po.expectedDate ? metaRow('Expected Delivery', fmtDate(po.expectedDate)) : ''}
            <tr>
              <td style="padding:14px 0 4px;font-size:13px;color:${C.textLight};">Total</td>
              <td style="padding:14px 0 4px;font-size:20px;font-weight:700;color:${accent};text-align:right;">${fmtC(po.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>` : '';

  const confirmedCardHtml = type === 'confirmed' ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:28px 24px;text-align:center;background:${accentBg};border-radius:10px;border:1px solid ${C.border};">
          <div style="width:48px;height:48px;margin:0 auto 12px;background:${accent};border-radius:50%;line-height:48px;text-align:center;">
            <span style="font-size:22px;color:#fff;font-weight:700;">✓</span>
          </div>
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Order Confirmed</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:700;color:${accent};letter-spacing:-0.02em;">${fmtC(po.total)}</p>
          <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">${po.poNumber}</p>
        </td>
      </tr>
    </table>` : '';

  const cancelledCardHtml = type === 'cancelled' ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:28px 24px;text-align:center;background:${accentBg};border-radius:10px;border:1px solid ${C.border};">
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${C.textLight};font-weight:600;">Order Total</p>
          <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${accent};text-decoration:line-through;letter-spacing:-0.02em;">${fmtC(po.total)}</p>
          <p style="margin:8px 0 0;font-size:13px;color:${C.textMid};">${po.poNumber} — Cancelled</p>
        </td>
      </tr>
    </table>` : '';

  const itemsHtml = cfg.showItems ? (() => {
    const rows = (po.items || []).map(item => `
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:${C.text};border-bottom:1px solid ${C.borderLight};">${item.description}</td>
        <td style="padding:12px 16px;font-size:13px;color:${C.textMid};text-align:center;border-bottom:1px solid ${C.borderLight};">${item.quantity}</td>
        <td style="padding:12px 16px;font-size:13px;color:${C.textMid};text-align:right;border-bottom:1px solid ${C.borderLight};">${fmtC(item.rate)}</td>
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:${C.text};text-align:right;border-bottom:1px solid ${C.borderLight};">${fmtC(item.quantity * item.rate)}</td>
      </tr>`).join('');

    let totals = `
      <tr>
        <td colspan="3" style="padding:10px 16px;text-align:right;font-size:13px;color:${C.textMid};">Subtotal</td>
        <td style="padding:10px 16px;text-align:right;font-size:13px;font-weight:600;color:${C.text};">${fmtC(po.subtotal)}</td>
      </tr>`;
    if (po.taxAmount > 0) {
      totals += `
      <tr>
        <td colspan="3" style="padding:6px 16px;text-align:right;font-size:13px;color:${C.textMid};">Tax</td>
        <td style="padding:6px 16px;text-align:right;font-size:13px;color:${C.text};">${fmtC(po.taxAmount)}</td>
      </tr>`;
    }
    if (po.discount > 0) {
      totals += `
      <tr>
        <td colspan="3" style="padding:6px 16px;text-align:right;font-size:13px;color:${C.textMid};">Discount</td>
        <td style="padding:6px 16px;text-align:right;font-size:13px;color:${C.green};">-${fmtC(po.discount)}</td>
      </tr>`;
    }
    totals += `
      <tr>
        <td colspan="3" style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:${C.text};border-top:2px solid ${C.border};">Total</td>
        <td style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:${accent};border-top:2px solid ${C.border};">${fmtC(po.total)}</td>
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
  })() : '';

  const notesHtml = po.notes ? `
    <div style="margin:24px 0 0;padding:14px 16px;background:${C.amberBg};border-left:3px solid ${C.amber};border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${C.amberDark};font-weight:700;">Notes</p>
      <p style="margin:6px 0 0;font-size:13px;color:${C.textMid};line-height:1.6;">${po.notes}</p>
    </div>` : '';

  const attachNote = cfg.showAttachment ? `
    <p style="margin:24px 0 0;font-size:12px;color:${C.textLight};line-height:1.5;text-align:center;">
      📎 &nbsp;A PDF copy of this purchase order is attached to this email.
    </p>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${badge} — ${po.poNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:48px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${C.white};border-radius:16px;overflow:hidden;border:1px solid ${C.border};">

          <!-- Accent bar -->
          <tr><td style="height:4px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${company.name}</h1>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <span style="display:inline-block;padding:5px 12px;background:${accentBg};color:${accent};font-size:11px;font-weight:700;border-radius:20px;letter-spacing:0.04em;text-transform:uppercase;">${badge}</span>
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
              <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:${C.text};">Dear ${po.vendorName},</p>
              <p style="margin:0;font-size:14px;color:${C.textMid};line-height:1.7;">${messageMap[type]}</p>
              ${metaHtml}
              ${confirmedCardHtml}
              ${cancelledCardHtml}
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

      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}
