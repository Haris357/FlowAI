/**
 * Email Templates — Clean HTML templates for transactional emails
 */

interface InvoiceEmailData {
  invoiceNumber: string;
  customerName: string;
  issueDate: any;
  dueDate: any;
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
}

interface CompanyEmailData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
}

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
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function invoiceEmailTemplate(invoice: InvoiceEmailData, company: CompanyEmailData): string {
  const itemRows = invoice.items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">${item.description}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333; text-align: right;">${formatCurrency(item.rate, company.currency)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333; text-align: right;">${formatCurrency(item.quantity * item.rate, company.currency)}</td>
    </tr>
  `).join('');

  let totalsHtml = `
    <tr>
      <td colspan="3" style="padding: 8px 12px; text-align: right; font-size: 14px; color: #666;">Subtotal</td>
      <td style="padding: 8px 12px; text-align: right; font-size: 14px; color: #333;">${formatCurrency(invoice.subtotal, company.currency)}</td>
    </tr>
  `;

  if (invoice.taxRate > 0) {
    totalsHtml += `
      <tr>
        <td colspan="3" style="padding: 8px 12px; text-align: right; font-size: 14px; color: #666;">Tax (${invoice.taxRate}%)</td>
        <td style="padding: 8px 12px; text-align: right; font-size: 14px; color: #333;">${formatCurrency(invoice.taxAmount, company.currency)}</td>
      </tr>
    `;
  }

  if (invoice.discount > 0) {
    totalsHtml += `
      <tr>
        <td colspan="3" style="padding: 8px 12px; text-align: right; font-size: 14px; color: #666;">Discount</td>
        <td style="padding: 8px 12px; text-align: right; font-size: 14px; color: #333;">-${formatCurrency(invoice.discount, company.currency)}</td>
      </tr>
    `;
  }

  totalsHtml += `
    <tr>
      <td colspan="3" style="padding: 12px; text-align: right; font-size: 16px; font-weight: 700; color: #1a1a1a; border-top: 2px solid #3b82f6;">Total Due</td>
      <td style="padding: 12px; text-align: right; font-size: 16px; font-weight: 700; color: #3b82f6; border-top: 2px solid #3b82f6;">${formatCurrency(invoice.total, company.currency)}</td>
    </tr>
  `;

  const companyDetails = [company.address, company.phone, company.email].filter(Boolean).join(' &bull; ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #3b82f6; padding: 28px 32px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">${company.name}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 8px;">Hi ${invoice.customerName},</p>
              <p style="font-size: 14px; color: #666; margin: 0 0 24px; line-height: 1.5;">
                Please find your invoice <strong style="color: #333;">${invoice.invoiceNumber}</strong> attached to this email. Here's a summary:
              </p>

              <!-- Invoice Meta -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #f8fafc; border-radius: 6px; padding: 16px;">
                <tr>
                  <td style="padding: 8px 16px;">
                    <span style="font-size: 12px; color: #888; text-transform: uppercase;">Invoice #</span><br />
                    <span style="font-size: 14px; font-weight: 600; color: #333;">${invoice.invoiceNumber}</span>
                  </td>
                  <td style="padding: 8px 16px;">
                    <span style="font-size: 12px; color: #888; text-transform: uppercase;">Issue Date</span><br />
                    <span style="font-size: 14px; font-weight: 600; color: #333;">${formatDate(invoice.issueDate)}</span>
                  </td>
                  <td style="padding: 8px 16px;">
                    <span style="font-size: 12px; color: #888; text-transform: uppercase;">Due Date</span><br />
                    <span style="font-size: 14px; font-weight: 600; color: #333;">${formatDate(invoice.dueDate)}</span>
                  </td>
                  <td style="padding: 8px 16px; text-align: right;">
                    <span style="font-size: 12px; color: #888; text-transform: uppercase;">Amount Due</span><br />
                    <span style="font-size: 18px; font-weight: 700; color: #3b82f6;">${formatCurrency(invoice.total, company.currency)}</span>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                <thead>
                  <tr style="background-color: #3b82f6;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #fff; text-transform: uppercase;">Description</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #fff; text-transform: uppercase;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #fff; text-transform: uppercase;">Rate</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #fff; text-transform: uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  ${totalsHtml}
                </tfoot>
              </table>

              ${invoice.notes ? `
              <div style="margin-top: 24px; padding: 12px 16px; background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 600;">Notes</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #78350f;">${invoice.notes}</p>
              </div>
              ` : ''}

              <p style="margin: 24px 0 0; font-size: 13px; color: #888; line-height: 1.5;">
                A PDF copy of this invoice is attached to this email for your records.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                ${company.name}${companyDetails ? ` &bull; ${companyDetails}` : ''}
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
