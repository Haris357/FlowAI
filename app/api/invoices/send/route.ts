import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
import { invoiceEmailTemplate } from '@/lib/email-templates';
import { sendEmail } from '@/lib/email';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { companyId, invoiceId } = await request.json();

    if (!companyId || !invoiceId) {
      return NextResponse.json(
        { error: 'companyId and invoiceId are required' },
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

    // Validate status
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: `Invoice is already "${invoice.status}". Only draft invoices can be sent.` },
        { status: 400 }
      );
    }

    // Validate customer email
    if (!invoice.customerEmail) {
      return NextResponse.json(
        { error: 'Invoice has no customer email. Please add an email address before sending.' },
        { status: 400 }
      );
    }

    // Fetch company for branding
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Generate PDF
    const pdfBuffer = generateInvoicePDF(invoice, company);

    // Generate email HTML
    const emailHtml = invoiceEmailTemplate(invoice, company);

    // Send email
    await sendEmail(
      invoice.customerEmail,
      `Invoice ${invoice.invoiceNumber} from ${company.name}`,
      emailHtml,
      [{
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }]
    );

    // Update invoice status to sent
    await invoiceRef.update({
      status: 'sent',
      sentAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Create journal entry (Debit AR, Credit Revenue)
    const accountsRef = adminDb.collection(`companies/${companyId}/accounts`);

    // Find Accounts Receivable
    const arQuery = await accountsRef.where('subtypeCode', '==', 'current_asset').get();
    const arAccount = arQuery.docs.find(d => {
      const name = (d.data().name || '').toLowerCase();
      return name.includes('receivable') || name.includes('ar');
    }) || arQuery.docs[0];

    // Find Revenue account
    const revQuery = await accountsRef.where('typeCode', '==', 'revenue').get();
    const revAccount = revQuery.docs.find(d => {
      const name = (d.data().name || '').toLowerCase();
      return name.includes('revenue') || name.includes('sales') || name.includes('income');
    }) || revQuery.docs[0];

    if (arAccount && revAccount) {
      const arData = arAccount.data();
      const revData = revAccount.data();

      // Create journal entry
      await adminDb.collection(`companies/${companyId}/journalEntries`).add({
        date: Timestamp.now(),
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
        lines: [
          {
            accountId: arAccount.id,
            accountCode: arData.code || '',
            accountName: arData.name,
            description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
            debit: invoice.total,
            credit: 0,
          },
          {
            accountId: revAccount.id,
            accountCode: revData.code || '',
            accountName: revData.name,
            description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
            debit: 0,
            credit: invoice.total,
          },
        ],
        reference: invoice.invoiceNumber,
        referenceType: 'invoice',
        referenceId: invoiceId,
        totalDebit: invoice.total,
        totalCredit: invoice.total,
        createdBy: 'system',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update account balances
      await adminDb.doc(`companies/${companyId}/accounts/${arAccount.id}`).update({
        balance: (arData.balance || 0) + invoice.total,
        updatedAt: Timestamp.now(),
      });
      await adminDb.doc(`companies/${companyId}/accounts/${revAccount.id}`).update({
        balance: (revData.balance || 0) + invoice.total,
        updatedAt: Timestamp.now(),
      });

      // Update customer balance
      if (invoice.customerId) {
        const customerRef = adminDb.doc(`companies/${companyId}/customers/${invoice.customerId}`);
        const customerSnap = await customerRef.get();
        if (customerSnap.exists) {
          const customerData = customerSnap.data() as any;
          await customerRef.update({
            totalInvoiced: (customerData.totalInvoiced || 0) + invoice.total,
            updatedAt: Timestamp.now(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail}`,
      invoice: { ...invoice, status: 'sent', sentAt: new Date().toISOString() },
    });

  } catch (error: any) {
    console.error('[Send Invoice] Error:', error);

    if (error.message?.includes('SMTP') || error.message?.includes('credentials')) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
