import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { generateSalarySlipPDF } from '@/lib/salary-slip-pdf';

// Reads request.url query params + hits Firestore — never statically renderable.
export const dynamic = 'force-dynamic';

initAdmin();
const adminDb = getFirestore();

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const slipId = searchParams.get('slipId');

    if (!companyId || !slipId) {
      return NextResponse.json(
        { error: 'companyId and slipId are required' },
        { status: 400 }
      );
    }

    // Fetch salary slip
    const slipSnap = await adminDb.doc(`companies/${companyId}/salarySlips/${slipId}`).get();
    if (!slipSnap.exists) {
      return NextResponse.json({ error: 'Salary slip not found' }, { status: 404 });
    }
    const slip = { id: slipSnap.id, ...slipSnap.data() } as any;

    // Fetch employee data
    let employee: any = { name: slip.employeeName || 'Employee' };
    if (slip.employeeId) {
      const empSnap = await adminDb.doc(`companies/${companyId}/employees/${slip.employeeId}`).get();
      if (empSnap.exists) {
        employee = { id: empSnap.id, ...empSnap.data() };
      }
    }

    // Fetch company for branding
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Generate PDF
    const pdfBuffer = generateSalarySlipPDF(slip, employee, company);

    const empName = (slip.employeeName || 'Employee').replace(/\s+/g, '-');
    const monthName = MONTHS[(slip.month || 1) - 1] || 'January';
    const fileName = `SalarySlip-${empName}-${monthName}${slip.year || ''}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('[Salary Slip PDF] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate salary slip PDF' },
      { status: 500 }
    );
  }
}
