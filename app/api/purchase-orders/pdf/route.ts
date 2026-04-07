import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { generatePurchaseOrderPDF } from '@/lib/po-pdf';

initAdmin();
const adminDb = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const poId = searchParams.get('poId');

    if (!companyId || !poId) {
      return NextResponse.json({ error: 'companyId and poId are required' }, { status: 400 });
    }

    const poSnap = await adminDb.doc(`companies/${companyId}/purchaseOrders/${poId}`).get();
    if (!poSnap.exists) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }
    const po = { id: poSnap.id, ...poSnap.data() } as any;

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

    const poData = {
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      vendorEmail: po.vendorEmail,
      issueDate: po.issueDate,
      expectedDate: po.expectedDate,
      items: (po.items || []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        receivedQuantity: item.receivedQuantity,
      })),
      subtotal: po.subtotal,
      taxRate: po.taxRate,
      taxAmount: po.taxAmount,
      discount: po.discount,
      total: po.total,
      status: po.status,
      shippingAddress: po.shippingAddress,
      notes: po.notes,
      terms: po.terms,
    };

    const pdfBuffer = generatePurchaseOrderPDF(poData, companyData);
    const fileName = `${po.poNumber || poId}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[PO PDF] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate purchase order PDF' }, { status: 500 });
  }
}
