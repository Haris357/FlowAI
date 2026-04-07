import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { checkPlanLimitAdmin, getEmailSendCountAdmin } from '@/services/subscription-admin';
import { generateSalarySlipPDF } from '@/lib/salary-slip-pdf';
import { salarySlipEmail, getSalarySlipEmailSubject } from '@/lib/email-templates';

initAdmin();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { companyId, slipId } = await request.json();

    if (!companyId || !slipId) {
      return NextResponse.json(
        { error: 'companyId and slipId are required' },
        { status: 400 }
      );
    }

    // Fetch company
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const company = companySnap.data() as any;

    // Fetch salary slip
    const slipSnap = await adminDb.doc(`companies/${companyId}/salarySlips/${slipId}`).get();
    if (!slipSnap.exists) {
      return NextResponse.json({ error: 'Salary slip not found' }, { status: 404 });
    }
    const slip = { id: slipSnap.id, ...slipSnap.data() } as any;

    // Fetch employee
    const employeeSnap = await adminDb.doc(`companies/${companyId}/employees/${slip.employeeId}`).get();
    if (!employeeSnap.exists) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    const employee = { id: employeeSnap.id, ...employeeSnap.data() } as any;

    // Check employee has email
    if (!employee.email) {
      return NextResponse.json(
        { error: 'Employee has no email address' },
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

    // Build data shapes for PDF generator and email template
    const slipData = {
      employeeName: slip.employeeName,
      employeeDesignation: slip.employeeDesignation,
      month: slip.month,
      year: slip.year,
      basicSalary: slip.basicSalary,
      allowances: {
        hra: slip.allowances?.hra || 0,
        da: slip.allowances?.da || 0,
        ta: slip.allowances?.ta || 0,
        other: slip.allowances?.other || 0,
      },
      totalEarnings: slip.totalEarnings,
      deductions: {
        tax: slip.deductions?.tax || 0,
        providentFund: slip.deductions?.providentFund || 0,
        loan: slip.deductions?.loan || 0,
        other: slip.deductions?.other || 0,
      },
      totalDeductions: slip.totalDeductions,
      netSalary: slip.netSalary,
      status: slip.status,
      paidDate: slip.paidDate,
      paymentMethod: slip.paymentMethod,
    };

    const employeeData = {
      employeeId: employee.employeeId,
      name: employee.name,
      designation: employee.designation,
      department: employee.department,
      bankName: employee.bankName,
      bankAccount: employee.bankAccount,
      taxId: employee.taxId,
    };

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

    // Generate PDF
    const pdfBuffer = generateSalarySlipPDF(slipData, employeeData, companyData);

    // Generate email HTML
    const emailData = {
      employeeName: slip.employeeName,
      month: slip.month,
      year: slip.year,
      basicSalary: slip.basicSalary,
      totalEarnings: slip.totalEarnings,
      totalDeductions: slip.totalDeductions,
      netSalary: slip.netSalary,
      paymentMethod: slip.paymentMethod,
      status: slip.status,
    };

    const companyEmailData = {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      currency: company.currency || 'USD',
    };

    const emailHtml = salarySlipEmail(emailData, companyEmailData);
    const subject = getSalarySlipEmailSubject(slip.month, slip.year, company.name);

    // Build filename
    const employeeName = (slip.employeeName || 'employee').replace(/\s+/g, '-').toLowerCase();
    const filename = `${employeeName}-slip-${slip.month}-${slip.year}.pdf`;

    // Send email with PDF attachment
    await sendEmail(employee.email, subject, emailHtml, [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ]);

    return NextResponse.json({
      success: true,
      emailSent: true,
      recipient: employee.email,
    });
  } catch (error: any) {
    console.error('[Payroll Send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send salary slip email' },
      { status: 500 }
    );
  }
}
