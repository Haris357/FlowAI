import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { checkPlanLimitAdmin, getEmailSendCountAdmin } from '@/services/subscription-admin';
import { generatePurchaseOrderPDF } from '@/lib/po-pdf';
import { purchaseOrderEmail, getPurchaseOrderEmailSubject } from '@/lib/email-templates';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { companyId, poId, type = 'sent' } = await request.json();

    if (!companyId || !poId) {
      return NextResponse.json(
        { error: 'companyId and poId are required' },
        { status: 400 }
      );
    }

    // Fetch company
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Fetch purchase order
    const poRef = adminDb.doc(`companies/${companyId}/purchaseOrders/${poId}`);
    const poSnap = await poRef.get();
    if (!poSnap.exists) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }
    const po = { id: poSnap.id, ...poSnap.data() } as any;

    // Determine vendor email: use po.vendorEmail first, then look up from vendors collection
    let vendorEmail: string | null = po.vendorEmail || null;

    if (!vendorEmail && po.vendorId) {
      const vendorSnap = await adminDb.doc(`companies/${companyId}/vendors/${po.vendorId}`).get();
      if (vendorSnap.exists) {
        const vendorData = vendorSnap.data() as any;
        vendorEmail = vendorData.email || null;
      }
    }

    if (!vendorEmail) {
      return NextResponse.json(
        { error: 'Vendor has no email address' },
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

    const companyEmailData = {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      currency: company.currency || 'USD',
    };

    // Generate email HTML
    const emailHtml = purchaseOrderEmail(type, poData, companyEmailData);
    const subject = getPurchaseOrderEmailSubject(type, po.poNumber, company.name);

    // Attach PDF for 'sent' type only
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    if (type === 'sent') {
      const pdfBuffer = generatePurchaseOrderPDF(poData, companyData);
      attachments.push({
        filename: `${po.poNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    // Send email
    await sendEmail(
      vendorEmail,
      subject,
      emailHtml,
      attachments.length > 0 ? attachments : undefined
    );

    // If type === 'sent', update PO status and sentAt
    if (type === 'sent') {
      await poRef.update({
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
    console.error('[Purchase Orders Send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send purchase order email' },
      { status: 500 }
    );
  }
}
