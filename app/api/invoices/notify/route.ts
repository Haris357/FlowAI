import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
import { invoiceStatusEmail, getInvoiceEmailSubject, InvoiceEmailType } from '@/lib/email-templates';
import { sendEmail } from '@/lib/email';

initAdmin();
const adminDb = getFirestore();

// Statuses that should trigger a customer notification email
const EMAIL_STATUSES: InvoiceEmailType[] = ['sent', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'];

// Statuses that should include the PDF as an attachment
const ATTACH_PDF_STATUSES: InvoiceEmailType[] = ['sent', 'overdue'];

export async function POST(request: NextRequest) {
  try {
    const { companyId, invoiceId, statusType } = await request.json();

    if (!companyId || !invoiceId || !statusType) {
      return NextResponse.json(
        { error: 'companyId, invoiceId, and statusType are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_STATUSES.includes(statusType)) {
      return NextResponse.json(
        { error: `Status "${statusType}" does not trigger an email notification` },
        { status: 400 }
      );
    }

    // Fetch invoice
    const invoiceRef = adminDb.doc(`companies/${companyId}/invoices/${invoiceId}`);
    const invoiceSnap = await invoiceRef.get();

    if (!invoiceSnap.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() } as any;

    // Validate customer email
    if (!invoice.customerEmail) {
      return NextResponse.json(
        { error: 'Invoice has no customer email. Cannot send notification.' },
        { status: 400 }
      );
    }

    // Fetch company for branding
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Generate email HTML
    const emailHtml = invoiceStatusEmail(statusType, invoice, company);
    const subject = getInvoiceEmailSubject(statusType, invoice.invoiceNumber, company.name);

    // Generate PDF attachment for applicable statuses
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    if (ATTACH_PDF_STATUSES.includes(statusType)) {
      const pdfBuffer = generateInvoicePDF(invoice, company);
      attachments.push({
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    // Send email
    await sendEmail(invoice.customerEmail, subject, emailHtml, attachments.length > 0 ? attachments : undefined);

    return NextResponse.json({
      success: true,
      message: `${statusType} notification sent to ${invoice.customerEmail}`,
      emailType: statusType,
    });

  } catch (error: any) {
    console.error('[Invoice Notify] Error:', error);

    if (error.message?.includes('SMTP') || error.message?.includes('credentials')) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
