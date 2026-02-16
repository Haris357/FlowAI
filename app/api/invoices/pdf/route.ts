import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { generateInvoicePDF } from '@/lib/invoice-pdf';

initAdmin();
const adminDb = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const invoiceId = searchParams.get('invoiceId');

    if (!companyId || !invoiceId) {
      return NextResponse.json(
        { error: 'companyId and invoiceId are required' },
        { status: 400 }
      );
    }

    // Fetch invoice
    const invoiceSnap = await adminDb.doc(`companies/${companyId}/invoices/${invoiceId}`).get();
    if (!invoiceSnap.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() } as any;

    // Fetch company for branding
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Generate PDF
    const pdfBuffer = generateInvoicePDF(invoice, company);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('[PDF Generate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
