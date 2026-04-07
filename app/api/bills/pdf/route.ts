import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { generateBillPDF } from '@/lib/bill-pdf';

initAdmin();
const adminDb = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const billId = searchParams.get('billId');

    if (!companyId || !billId) {
      return NextResponse.json({ error: 'companyId and billId are required' }, { status: 400 });
    }

    const billSnap = await adminDb.doc(`companies/${companyId}/bills/${billId}`).get();
    if (!billSnap.exists) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    const bill = { id: billSnap.id, ...billSnap.data() } as any;

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

    const billData = {
      billNumber: bill.billNumber || billId,
      vendorName: bill.vendorName,
      issueDate: bill.issueDate,
      dueDate: bill.dueDate,
      subtotal: bill.subtotal || 0,
      taxAmount: bill.taxAmount || 0,
      total: bill.total,
      amountPaid: bill.amountPaid,
      amountDue: bill.amountDue,
      status: bill.status || 'unpaid',
      items: (bill.items || []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
      notes: bill.notes,
    };

    const pdfBuffer = generateBillPDF(billData, companyData);
    const fileName = `${bill.billNumber || billId}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[Bill PDF] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate bill PDF' }, { status: 500 });
  }
}
