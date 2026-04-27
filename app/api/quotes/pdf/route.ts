import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { generateQuotePDF } from '@/lib/quote-pdf';

export const dynamic = 'force-dynamic';

initAdmin();
const adminDb = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const quoteId = searchParams.get('quoteId');

    if (!companyId || !quoteId) {
      return NextResponse.json({ error: 'companyId and quoteId are required' }, { status: 400 });
    }

    const quoteSnap = await adminDb.doc(`companies/${companyId}/quotes/${quoteId}`).get();
    if (!quoteSnap.exists) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    const quote = { id: quoteSnap.id, ...quoteSnap.data() } as any;

    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

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

    const pdfBuffer = generateQuotePDF(quoteData, companyData);
    const fileName = `${quote.quoteNumber || quoteId}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[Quote PDF] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate quote PDF' }, { status: 500 });
  }
}
