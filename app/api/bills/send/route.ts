import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { checkPlanLimitAdmin, getEmailSendCountAdmin } from '@/services/subscription-admin';
import { generateBillPDF } from '@/lib/bill-pdf';
import { billEmail, getBillEmailSubject } from '@/lib/email-templates';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { companyId, billId, type = 'created' } = await request.json();

    if (!companyId || !billId) {
      return NextResponse.json(
        { error: 'companyId and billId are required' },
        { status: 400 }
      );
    }

    // Fetch company
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Fetch bill
    const billSnap = await adminDb.doc(`companies/${companyId}/bills/${billId}`).get();
    if (!billSnap.exists) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    const bill = { id: billSnap.id, ...billSnap.data() } as any;

    // Lookup vendor email
    let vendorEmail: string | null = null;

    if (bill.vendorId) {
      const vendorSnap = await adminDb.doc(`companies/${companyId}/vendors/${bill.vendorId}`).get();
      if (vendorSnap.exists) {
        const vendorData = vendorSnap.data() as any;
        vendorEmail = vendorData.email || null;
      }
    }

    // Fallback: search by vendor name
    if (!vendorEmail && bill.vendorName) {
      const vendorsSnap = await adminDb
        .collection(`companies/${companyId}/vendors`)
        .where('name', '==', bill.vendorName)
        .limit(1)
        .get();
      if (!vendorsSnap.empty) {
        const vendorData = vendorsSnap.docs[0].data() as any;
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

    const billData = {
      billNumber: bill.billNumber || bill.id,
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

    const companyEmailData = {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      currency: company.currency || 'USD',
    };

    // Generate email HTML
    const emailHtml = billEmail(type, billData, companyEmailData);
    const subject = getBillEmailSubject(type, bill.billNumber || bill.id, company.name);

    // Attach PDF for 'created' type only
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    if (type === 'created') {
      const pdfBuffer = generateBillPDF(billData, companyData);
      attachments.push({
        filename: `${bill.billNumber || billId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    await sendEmail(
      vendorEmail,
      subject,
      emailHtml,
      attachments.length > 0 ? attachments : undefined
    );

    return NextResponse.json({
      success: true,
      emailSent: true,
      recipient: vendorEmail,
    });
  } catch (error: any) {
    console.error('[Bills Send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send bill email' },
      { status: 500 }
    );
  }
}
