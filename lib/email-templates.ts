/**
 * Email Templates — Flowbooks branded HTML templates for all invoice status emails
 *
 * Theme: Terracotta (#D97757) / Warm Brown (#C4694D)
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
// THEME COLORS
// ==========================================

const THEME = {
  primary: '#D97757',       // Terracotta
  primaryDark: '#C4694D',   // Warm Brown
  primaryLight: '#F09B73',
  primaryBg: '#FEF4F0',
  primaryBorder: '#FDDCCC',

  success: '#22c55e',
  successDark: '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',

  warning: '#f59e0b',
  warningDark: '#d97706',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',

  danger: '#ef4444',
  dangerDark: '#dc2626',
  dangerBg: '#fef2f2',
  dangerBorder: '#fecaca',

  neutral: '#78736D',
  neutralDark: '#454240',
  neutralBg: '#FAF9F7',
  neutralBorder: '#E8E5DE',

  text: '#1A1915',
  textSecondary: '#5C5752',
  textTertiary: '#78736D',
  bg: '#FAF9F7',
  surface: '#FFFFFF',
  border: '#E8E5DE',
};

// ==========================================
// HELPERS
// ==========================================

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

// ==========================================
// STATUS-SPECIFIC CONFIG
// ==========================================

interface StatusEmailConfig {
  headerBg: string;
  headerText: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  badgeText: string;
  greeting: (name: string) => string;
  message: (invoice: InvoiceEmailData, company: CompanyEmailData) => string;
  showItems: boolean;
  showAttachmentNote: boolean;
  ctaLabel?: string;
}

function getStatusConfig(type: InvoiceEmailType): StatusEmailConfig {
  switch (type) {
    case 'sent':
      return {
        headerBg: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
        headerText: '#ffffff',
        accentColor: THEME.primary,
        accentBg: THEME.primaryBg,
        accentBorder: THEME.primaryBorder,
        badgeText: 'NEW INVOICE',
        greeting: (name) => `Hi ${name},`,
        message: (inv, co) =>
          `Please find your invoice <strong style="color: ${THEME.text};">${inv.invoiceNumber}</strong> attached. Below is a summary of the charges.`,
        showItems: true,
        showAttachmentNote: true,
      };

    case 'paid':
      return {
        headerBg: `linear-gradient(135deg, ${THEME.success}, ${THEME.successDark})`,
        headerText: '#ffffff',
        accentColor: THEME.success,
        accentBg: THEME.successBg,
        accentBorder: THEME.successBorder,
        badgeText: 'PAYMENT RECEIVED',
        greeting: (name) => `Hi ${name},`,
        message: (inv, co) =>
          `We've received your payment for invoice <strong style="color: ${THEME.text};">${inv.invoiceNumber}</strong>. Thank you for your prompt payment!`,
        showItems: false,
        showAttachmentNote: false,
        ctaLabel: 'Payment Confirmed',
      };

    case 'partial':
      return {
        headerBg: `linear-gradient(135deg, ${THEME.warning}, ${THEME.warningDark})`,
        headerText: '#ffffff',
        accentColor: THEME.warning,
        accentBg: THEME.warningBg,
        accentBorder: THEME.warningBorder,
        badgeText: 'PARTIAL PAYMENT',
        greeting: (name) => `Hi ${name},`,
        message: (inv, co) => {
          const paid = formatCurrency(inv.amountPaid || 0, co.currency);
          const due = formatCurrency(inv.amountDue || inv.total, co.currency);
          return `We've received a partial payment of <strong style="color: ${THEME.text};">${paid}</strong> for invoice <strong style="color: ${THEME.text};">${inv.invoiceNumber}</strong>. The remaining balance is <strong style="color: ${THEME.warningDark};">${due}</strong>.`;
        },
        showItems: false,
        showAttachmentNote: false,
      };

    case 'overdue':
      return {
        headerBg: `linear-gradient(135deg, ${THEME.danger}, ${THEME.dangerDark})`,
        headerText: '#ffffff',
        accentColor: THEME.danger,
        accentBg: THEME.dangerBg,
        accentBorder: THEME.dangerBorder,
        badgeText: 'PAYMENT OVERDUE',
        greeting: (name) => `Hi ${name},`,
        message: (inv, co) => {
          const due = formatCurrency(inv.amountDue || inv.total, co.currency);
          return `This is a friendly reminder that invoice <strong style="color: ${THEME.text};">${inv.invoiceNumber}</strong> was due on <strong style="color: ${THEME.dangerDark};">${formatDate(inv.dueDate)}</strong>. The outstanding amount is <strong style="color: ${THEME.dangerDark};">${due}</strong>. Please arrange payment at your earliest convenience.`;
        },
        showItems: true,
        showAttachmentNote: true,
      };

    case 'cancelled':
      return {
        headerBg: `linear-gradient(135deg, ${THEME.neutral}, ${THEME.neutralDark})`,
        headerText: '#ffffff',
        accentColor: THEME.neutral,
        accentBg: THEME.neutralBg,
        accentBorder: THEME.neutralBorder,
        badgeText: 'INVOICE CANCELLED',
        greeting: (name) => `Hi ${name},`,
        message: (inv) =>
          `Invoice <strong style="color: ${THEME.text};">${inv.invoiceNumber}</strong> has been cancelled. No payment is required. If you have any questions, please don't hesitate to reach out.`,
        showItems: false,
        showAttachmentNote: false,
      };

    case 'refunded':
      return {
        headerBg: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
        headerText: '#ffffff',
        accentColor: THEME.primary,
        accentBg: THEME.primaryBg,
        accentBorder: THEME.primaryBorder,
        badgeText: 'REFUND PROCESSED',
        greeting: (name) => `Hi ${name},`,
        message: (inv, co) => {
          const refundAmount = formatCurrency(inv.amountPaid || inv.total, co.currency);
          return `A refund of <strong style="color: ${THEME.text};">${refundAmount}</strong> has been processed for invoice <strong style="color: ${THEME.text};">${inv.invoiceNumber}</strong>. Please allow a few business days for the amount to appear in your account.`;
        },
        showItems: false,
        showAttachmentNote: false,
      };
  }
}

// ==========================================
// MAIN TEMPLATE BUILDER
// ==========================================

function buildItemsTable(invoice: InvoiceEmailData, company: CompanyEmailData, accentColor: string): string {
  const itemRows = invoice.items.map((item, i) => `
    <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : THEME.neutralBg};">
      <td style="padding: 12px 16px; font-size: 14px; color: ${THEME.text}; border-bottom: 1px solid ${THEME.border};">${item.description}</td>
      <td style="padding: 12px 16px; font-size: 14px; color: ${THEME.textSecondary}; text-align: center; border-bottom: 1px solid ${THEME.border};">${item.quantity}</td>
      <td style="padding: 12px 16px; font-size: 14px; color: ${THEME.textSecondary}; text-align: right; border-bottom: 1px solid ${THEME.border};">${formatCurrency(item.rate, company.currency)}</td>
      <td style="padding: 12px 16px; font-size: 14px; color: ${THEME.text}; text-align: right; font-weight: 500; border-bottom: 1px solid ${THEME.border};">${formatCurrency(item.quantity * item.rate, company.currency)}</td>
    </tr>
  `).join('');

  let totalsHtml = `
    <tr>
      <td colspan="3" style="padding: 8px 16px; text-align: right; font-size: 14px; color: ${THEME.textSecondary};">Subtotal</td>
      <td style="padding: 8px 16px; text-align: right; font-size: 14px; color: ${THEME.text}; font-weight: 500;">${formatCurrency(invoice.subtotal, company.currency)}</td>
    </tr>
  `;

  if (invoice.taxRate > 0) {
    totalsHtml += `
      <tr>
        <td colspan="3" style="padding: 8px 16px; text-align: right; font-size: 14px; color: ${THEME.textSecondary};">Tax (${invoice.taxRate}%)</td>
        <td style="padding: 8px 16px; text-align: right; font-size: 14px; color: ${THEME.text};">${formatCurrency(invoice.taxAmount, company.currency)}</td>
      </tr>
    `;
  }

  if (invoice.discount > 0) {
    totalsHtml += `
      <tr>
        <td colspan="3" style="padding: 8px 16px; text-align: right; font-size: 14px; color: ${THEME.textSecondary};">Discount</td>
        <td style="padding: 8px 16px; text-align: right; font-size: 14px; color: ${THEME.success};">-${formatCurrency(invoice.discount, company.currency)}</td>
      </tr>
    `;
  }

  totalsHtml += `
    <tr>
      <td colspan="3" style="padding: 14px 16px; text-align: right; font-size: 16px; font-weight: 700; color: ${THEME.text}; border-top: 2px solid ${accentColor};">Total</td>
      <td style="padding: 14px 16px; text-align: right; font-size: 16px; font-weight: 700; color: ${accentColor}; border-top: 2px solid ${accentColor};">${formatCurrency(invoice.total, company.currency)}</td>
    </tr>
  `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 8px; border-radius: 8px; overflow: hidden; border: 1px solid ${THEME.border};">
      <thead>
        <tr style="background-color: ${accentColor};">
          <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.05em;">Description</th>
          <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.05em;">Qty</th>
          <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.05em;">Rate</th>
          <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.05em;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        ${totalsHtml}
      </tfoot>
    </table>
  `;
}

function buildAmountSummary(invoice: InvoiceEmailData, company: CompanyEmailData, config: StatusEmailConfig): string {
  const amountDue = invoice.amountDue ?? invoice.total;
  const amountPaid = invoice.amountPaid ?? 0;

  if (config.badgeText === 'PAYMENT RECEIVED') {
    // Paid — show total paid
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid ${config.accentBorder}; background-color: ${config.accentBg};">
        <tr>
          <td style="padding: 20px 24px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 12px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Amount Paid</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${config.accentColor};">${formatCurrency(invoice.total, company.currency)}</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: ${THEME.textSecondary};">Invoice ${invoice.invoiceNumber}</p>
          </td>
        </tr>
      </table>
    `;
  }

  if (config.badgeText === 'PARTIAL PAYMENT') {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid ${config.accentBorder}; background-color: ${config.accentBg};">
        <tr>
          <td style="padding: 20px 24px;" width="50%">
            <p style="margin: 0 0 4px; font-size: 12px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Paid So Far</p>
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${THEME.success};">${formatCurrency(amountPaid, company.currency)}</p>
          </td>
          <td style="padding: 20px 24px; text-align: right;" width="50%">
            <p style="margin: 0 0 4px; font-size: 12px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Remaining Balance</p>
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${config.accentColor};">${formatCurrency(amountDue, company.currency)}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 0 24px 16px;">
            <div style="background-color: ${THEME.border}; border-radius: 4px; height: 8px; overflow: hidden;">
              <div style="background-color: ${THEME.success}; height: 100%; width: ${invoice.total > 0 ? Math.round((amountPaid / invoice.total) * 100) : 0}%; border-radius: 4px;"></div>
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  if (config.badgeText === 'REFUND PROCESSED') {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid ${config.accentBorder}; background-color: ${config.accentBg};">
        <tr>
          <td style="padding: 20px 24px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 12px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Refund Amount</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${config.accentColor};">${formatCurrency(amountPaid || invoice.total, company.currency)}</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: ${THEME.textSecondary};">Invoice ${invoice.invoiceNumber}</p>
          </td>
        </tr>
      </table>
    `;
  }

  if (config.badgeText === 'INVOICE CANCELLED') {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid ${config.accentBorder}; background-color: ${config.accentBg};">
        <tr>
          <td style="padding: 20px 24px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 12px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Invoice</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${THEME.neutral}; text-decoration: line-through;">${formatCurrency(invoice.total, company.currency)}</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: ${THEME.textSecondary};">${invoice.invoiceNumber} — Cancelled</p>
          </td>
        </tr>
      </table>
    `;
  }

  // Default (sent / overdue) — show amount due
  return '';
}

// ==========================================
// EXPORTED TEMPLATE FUNCTIONS
// ==========================================

/**
 * Generate an invoice email for any status.
 * For backwards compat, `invoiceEmailTemplate` generates a 'sent' email.
 */
export function invoiceStatusEmail(
  type: InvoiceEmailType,
  invoice: InvoiceEmailData,
  company: CompanyEmailData,
): string {
  const config = getStatusConfig(type);
  const companyDetails = [company.address, company.phone, company.email].filter(Boolean).join(' &bull; ');

  // Invoice meta cards (shown for sent & overdue)
  const showMeta = type === 'sent' || type === 'overdue';
  const metaHtml = showMeta ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-radius: 8px; overflow: hidden; background-color: ${THEME.neutralBg}; border: 1px solid ${THEME.border};">
      <tr>
        <td style="padding: 14px 20px;" width="25%">
          <span style="font-size: 10px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Invoice #</span><br />
          <span style="font-size: 14px; font-weight: 600; color: ${THEME.text};">${invoice.invoiceNumber}</span>
        </td>
        <td style="padding: 14px 20px;" width="25%">
          <span style="font-size: 10px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Issue Date</span><br />
          <span style="font-size: 14px; font-weight: 600; color: ${THEME.text};">${formatDate(invoice.issueDate)}</span>
        </td>
        <td style="padding: 14px 20px;" width="25%">
          <span style="font-size: 10px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Due Date</span><br />
          <span style="font-size: 14px; font-weight: 600; color: ${type === 'overdue' ? THEME.danger : THEME.text};">${formatDate(invoice.dueDate)}</span>
        </td>
        <td style="padding: 14px 20px; text-align: right;" width="25%">
          <span style="font-size: 10px; color: ${THEME.textTertiary}; text-transform: uppercase; letter-spacing: 0.05em;">Amount Due</span><br />
          <span style="font-size: 20px; font-weight: 700; color: ${config.accentColor};">${formatCurrency(invoice.amountDue ?? invoice.total, company.currency)}</span>
        </td>
      </tr>
    </table>
  ` : '';

  // Items table (only for sent & overdue)
  const itemsHtml = config.showItems ? buildItemsTable(invoice, company, config.accentColor) : '';

  // Amount summary (for paid, partial, cancelled, refunded)
  const summaryHtml = !config.showItems ? buildAmountSummary(invoice, company, config) : '';

  // Notes
  const notesHtml = invoice.notes ? `
    <div style="margin-top: 20px; padding: 12px 16px; background-color: ${THEME.warningBg}; border-left: 3px solid ${THEME.warning}; border-radius: 0 6px 6px 0;">
      <p style="margin: 0; font-size: 11px; color: ${THEME.warningDark}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Notes</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: ${THEME.textSecondary}; line-height: 1.5;">${invoice.notes}</p>
    </div>
  ` : '';

  // Attachment note
  const attachmentNote = config.showAttachmentNote ? `
    <p style="margin: 24px 0 0; font-size: 13px; color: ${THEME.textTertiary}; line-height: 1.5;">
      A PDF copy of this invoice is attached to this email for your records.
    </p>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoice.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${THEME.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${THEME.bg}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: ${THEME.surface}; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1);">

          <!-- Header with gradient -->
          <tr>
            <td style="background: ${config.headerBg}; padding: 32px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 700; color: ${config.headerText};">${company.name}</h1>
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(255,255,255,0.2); border-radius: 4px; font-size: 11px; font-weight: 600; color: ${config.headerText}; letter-spacing: 0.08em;">${config.badgeText}</span>
                  </td>
                  <td style="text-align: right; vertical-align: top;">
                    <span style="font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85);">${invoice.invoiceNumber}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px;">
              <!-- Greeting & Message -->
              <p style="font-size: 16px; color: ${THEME.text}; margin: 0 0 8px; font-weight: 500;">${config.greeting(invoice.customerName)}</p>
              <p style="font-size: 14px; color: ${THEME.textSecondary}; margin: 0 0 8px; line-height: 1.6;">
                ${config.message(invoice, company)}
              </p>

              ${metaHtml}
              ${summaryHtml}
              ${itemsHtml}
              ${notesHtml}
              ${attachmentNote}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${THEME.neutralBg}; padding: 24px 36px; border-top: 1px solid ${THEME.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: ${THEME.textSecondary};">${company.name}</p>
                    ${companyDetails ? `<p style="margin: 0; font-size: 12px; color: ${THEME.textTertiary}; line-height: 1.5;">${companyDetails}</p>` : ''}
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 11px; color: ${THEME.textTertiary}; text-align: center;">
                Powered by Flowbooks
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Backwards-compatible export for the "sent" invoice email.
 */
export function invoiceEmailTemplate(invoice: InvoiceEmailData, company: CompanyEmailData): string {
  return invoiceStatusEmail('sent', invoice, company);
}

/**
 * Get the email subject line for a given invoice status.
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
