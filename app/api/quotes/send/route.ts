import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { checkPlanLimitAdmin, getEmailSendCountAdmin } from '@/services/subscription-admin';
import { generateQuotePDF } from '@/lib/quote-pdf';
import { quoteEmail, getQuoteEmailSubject } from '@/lib/email-templates';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { companyId, quoteId, type = 'sent' } = await request.json();

    if (!companyId || !quoteId) {
      return NextResponse.json(
        { error: 'companyId and quoteId are required' },
        { status: 400 }
      );
    }

    // Fetch company
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Fetch quote
    const quoteRef = adminDb.doc(`companies/${companyId}/quotes/${quoteId}`);
    const quoteSnap = await quoteRef.get();
    if (!quoteSnap.exists) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    const quote = { id: quoteSnap.id, ...quoteSnap.data() } as any;

    // Check customer email
    if (!quote.customerEmail) {
      return NextResponse.json(
        { error: 'Quote has no customer email address' },
        { status: 400 }
      );
    }

    // Check plan email limit
    const emailCount = await getEmailSendCountAdmin(companyId);
    const limitCheck = await checkPlanLimitAdmin(company.ownerId, 'emailSends', emailCount);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'Email send limit reached for your plan' },
        { status: 403 }
      );
    }

    const companyData = {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      taxId: company.taxId,
      currency: company.currency || 'USD',
      docTemplate: company.docTemplate || 'classic',
      docColorTheme: company.docColorTheme || '#D97757',
      docShowCompanyName: company.docShowCompanyName ?? true,
      docShowCompanyAddress: company.docShowCompanyAddress ?? true,
      docShowCompanyEmail: company.docShowCompanyEmail ?? true,
      docShowCompanyPhone: company.docShowCompanyPhone ?? true,
      docShowTaxId: company.docShowTaxId ?? true,
      docShowPoweredBy: company.docShowPoweredBy ?? true,
    };

    const quoteData = {
      quoteNumber: quote.quoteNumber,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      issueDate: quote.issueDate,
      expiryDate: quote.expiryDate,
      items: (quote.items || []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      discount: quote.discount,
      total: quote.total,
      status: quote.status,
      notes: quote.notes,
      terms: quote.terms,
    };

    const companyEmailData = {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      currency: company.currency || 'USD',
    };

    // Generate PDF
    const pdfBuffer = generateQuotePDF(quoteData, companyData);

    // Generate email HTML
    const emailHtml = quoteEmail(type, quoteData, companyEmailData);
    const subject = getQuoteEmailSubject(type, quote.quoteNumber, company.name);

    // Send email with PDF attachment
    await sendEmail(quote.customerEmail, subject, emailHtml, [
      {
        filename: `${quote.quoteNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ]);

    // If type === 'sent', update quote status and sentAt
    if (type === 'sent') {
      await quoteRef.update({
        status: 'sent',
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
    });
  } catch (error: any) {
    console.error('[Quotes Send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send quote email' },
      { status: 500 }
    );
  }
}
