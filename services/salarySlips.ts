import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SalarySlip, SalaryAllowances, SalaryDeductions, Employee, JournalEntryLine } from '@/types';
import { getActiveEmployees, getEmployeeById } from './employees';
import { createJournalEntry } from './journalEntries';
import { getAccounts } from './accounts';
import { getAccountPreferences } from './preferences';
import {
  isValidTransition,
  canDelete as canDeleteCheck,
  canEdit as canEditCheck,
  getStatusValidation,
} from '@/lib/status-management';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get recent salary slips with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of salary slips sorted by year/month (newest first)
 */
export async function getSalarySlips(companyId: string, maxResults: number = QUERY_LIMITS.TRANSACTIONS): Promise<SalarySlip[]> {
  const slipsRef = collection(db, `companies/${companyId}/salarySlips`);
  const q = query(slipsRef, orderBy('year', 'desc'), orderBy('month', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SalarySlip[];
}

export async function getSalarySlipById(companyId: string, slipId: string): Promise<SalarySlip | null> {
  const slipRef = doc(db, `companies/${companyId}/salarySlips`, slipId);
  const snapshot = await getDoc(slipRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as SalarySlip;
}

/**
 * Get salary slips for a specific month/year
 * @param companyId - Company ID
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Array of salary slips for the specified period
 */
export async function getSalarySlipsByMonth(
  companyId: string,
  month: number,
  year: number
): Promise<SalarySlip[]> {
  const slipsRef = collection(db, `companies/${companyId}/salarySlips`);
  const q = query(
    slipsRef,
    where('month', '==', month),
    where('year', '==', year)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SalarySlip[];
}

/**
 * Get salary slips for a specific employee
 * @param companyId - Company ID
 * @param employeeId - Employee ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of employee salary slips
 */
export async function getSalarySlipsByEmployee(
  companyId: string,
  employeeId: string,
  maxResults: number = QUERY_LIMITS.DEFAULT
): Promise<SalarySlip[]> {
  const slipsRef = collection(db, `companies/${companyId}/salarySlips`);
  const q = query(
    slipsRef,
    where('employeeId', '==', employeeId),
    orderBy('year', 'desc'),
    orderBy('month', 'desc'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SalarySlip[];
}

/**
 * Update salary slip status with validation
 * @throws Error if status transition is not allowed
 */
export async function updateSalarySlipStatus(
  companyId: string,
  slipId: string,
  newStatus: string
): Promise<void> {
  const slip = await getSalarySlipById(companyId, slipId);
  if (!slip) throw new Error('Salary slip not found');

  // Validate status transition
  if (!isValidTransition('salarySlip', slip.status, newStatus)) {
    throw new Error(
      `Cannot change salary slip status from "${slip.status}" to "${newStatus}". This transition is not allowed.`
    );
  }

  const slipRef = doc(db, `companies/${companyId}/salarySlips`, slipId);
  await updateDoc(slipRef, {
    status: newStatus,
    ...(newStatus === 'paid' ? { paidDate: Timestamp.now() } : {}),
  });

  // When marking paid, auto-create the journal entry using available accounts
  if (newStatus === 'paid') {
    try {
      const [accounts, prefs] = await Promise.all([getAccounts(companyId), getAccountPreferences(companyId)]);

      const salaryExpenseAccount =
        (prefs.defaultSalaryExpenseAccountId ? accounts.find(a => a.id === prefs.defaultSalaryExpenseAccountId && a.isActive !== false) : undefined) ||
        accounts.find(a => a.isActive && a.typeCode === 'expense' &&
          (a.name.toLowerCase().includes('salary') || a.name.toLowerCase().includes('wage') || a.name.toLowerCase().includes('payroll'))
        ) || accounts.find(a => a.isActive && a.typeCode === 'expense');

      const bankAccount =
        (prefs.defaultSalaryBankAccountId ? accounts.find(a => a.id === prefs.defaultSalaryBankAccountId && a.isActive !== false) : undefined) ||
        (prefs.defaultCashAccountId ? accounts.find(a => a.id === prefs.defaultCashAccountId && a.isActive !== false) : undefined) ||
        accounts.find(a =>
          a.isActive && a.typeCode === 'asset' &&
          (a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('checking'))
        ) || accounts.find(a => a.isActive && a.typeCode === 'asset');

      if (salaryExpenseAccount && bankAccount) {
        const lines: JournalEntryLine[] = [
          {
            accountId: salaryExpenseAccount.id,
            accountCode: salaryExpenseAccount.code,
            accountName: salaryExpenseAccount.name,
            description: `Salary - ${slip.employeeName} (${slip.month}/${slip.year})`,
            debit: slip.totalEarnings,
            credit: 0,
          },
          {
            accountId: bankAccount.id,
            accountCode: bankAccount.code,
            accountName: bankAccount.name,
            description: `Net salary - ${slip.employeeName}`,
            debit: 0,
            credit: slip.netSalary,
          },
        ];

        // If there's a difference (deductions), credit a payable account or split
        const deductionTotal = slip.totalEarnings - slip.netSalary;
        if (deductionTotal > 0) {
          const taxPayable =
            (prefs.defaultTaxPayableAccountId ? accounts.find(a => a.id === prefs.defaultTaxPayableAccountId && a.isActive !== false) : undefined) ||
            accounts.find(a =>
              a.isActive && a.typeCode === 'liability' &&
              (a.name.toLowerCase().includes('tax') || a.name.toLowerCase().includes('payable'))
            ) || accounts.find(a => a.isActive && a.typeCode === 'liability');

          if (taxPayable) {
            lines.push({
              accountId: taxPayable.id,
              accountCode: taxPayable.code,
              accountName: taxPayable.name,
              description: `Deductions withheld - ${slip.employeeName}`,
              debit: 0,
              credit: deductionTotal,
            });
          } else {
            // No liability account — just credit full gross to bank (simplified)
            lines[1].credit = slip.totalEarnings;
          }
        }

        await createJournalEntry(companyId, {
          date: new Date(),
          description: `Salary Payment - ${slip.employeeName} (${slip.month}/${slip.year})`,
          lines,
          reference: `SAL-${slip.employeeName}-${slip.month}/${slip.year}`,
          referenceType: 'salary',
          referenceId: slipId,
          createdBy: 'system',
        });
      }
    } catch (jeError) {
      // JE creation is non-blocking — log but don't fail the status update
      console.warn('[Payroll] Failed to create journal entry for salary payment:', jeError);
    }
  }
}

export async function generateSalarySlip(
  companyId: string,
  employeeDocId: string,
  month: number,
  year: number,
  allowances?: {
    hra?: number;
    da?: number;
    ta?: number;
    other?: number;
  },
  deductions?: {
    tax?: number;
    providentFund?: number;
    loan?: number;
    other?: number;
  }
): Promise<string> {
  const employee = await getEmployeeById(companyId, employeeDocId);
  if (!employee) throw new Error('Employee not found');

  // Check if slip already exists
  const existingSlips = await getSalarySlipsByMonth(companyId, month, year);
  const existingSlip = existingSlips.find(s => s.employeeId === employeeDocId);
  if (existingSlip) {
    throw new Error(`Salary slip already exists for ${employee.name} for ${month}/${year}`);
  }

  const basicSalary = employee.salary;

  const finalAllowances = {
    hra: allowances?.hra || 0,
    da: allowances?.da || 0,
    ta: allowances?.ta || 0,
    other: allowances?.other || 0,
  };

  const finalDeductions = {
    tax: deductions?.tax || 0,
    providentFund: deductions?.providentFund || 0,
    loan: deductions?.loan || 0,
    other: deductions?.other || 0,
  };

  const totalEarnings = basicSalary +
    finalAllowances.hra +
    finalAllowances.da +
    finalAllowances.ta +
    finalAllowances.other;

  const totalDeductions =
    finalDeductions.tax +
    finalDeductions.providentFund +
    finalDeductions.loan +
    finalDeductions.other;

  const netSalary = totalEarnings - totalDeductions;

  const slipsRef = collection(db, `companies/${companyId}/salarySlips`);
  const docRef = await addDoc(slipsRef, {
    employeeId: employeeDocId,
    employeeName: employee.name,
    employeeDesignation: employee.designation || '',
    month,
    year,
    basicSalary,
    allowances: finalAllowances,
    totalEarnings,
    deductions: finalDeductions,
    totalDeductions,
    netSalary,
    status: 'generated',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function generateSalarySlipsForAllEmployees(
  companyId: string,
  month: number,
  year: number
): Promise<{ success: string[]; failed: { name: string; error: string }[] }> {
  const employees = await getActiveEmployees(companyId);
  const results = {
    success: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  for (const employee of employees) {
    try {
      await generateSalarySlip(companyId, employee.id, month, year);
      results.success.push(employee.name);
    } catch (error) {
      results.failed.push({
        name: employee.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

export async function markSalarySlipPaid(
  companyId: string,
  slipId: string,
  paymentMethod: string,
  accountingConfig?: {
    salaryExpenseAccountId: string;
    salaryExpenseAccountCode: string;
    salaryExpenseAccountName: string;
    bankAccountId: string;
    bankAccountCode: string;
    bankAccountName: string;
    taxPayableAccountId?: string;
    taxPayableAccountCode?: string;
    taxPayableAccountName?: string;
    pfPayableAccountId?: string;
    pfPayableAccountCode?: string;
    pfPayableAccountName?: string;
    createdBy: string;
  }
): Promise<void> {
  const slip = await getSalarySlipById(companyId, slipId);
  if (!slip) throw new Error('Salary slip not found');

  const slipRef = doc(db, `companies/${companyId}/salarySlips`, slipId);
  await updateDoc(slipRef, {
    status: 'paid',
    paidDate: Timestamp.now(),
    paymentMethod,
  });

  // Create journal entry for salary payment
  if (accountingConfig) {
    const lines: JournalEntryLine[] = [
      // Debit Salary Expense (total earnings)
      {
        accountId: accountingConfig.salaryExpenseAccountId,
        accountCode: accountingConfig.salaryExpenseAccountCode,
        accountName: accountingConfig.salaryExpenseAccountName,
        description: `Salary - ${slip.employeeName} (${slip.month}/${slip.year})`,
        debit: slip.totalEarnings,
        credit: 0,
      },
    ];

    // Credit for tax withheld (if applicable)
    if (slip.deductions.tax > 0 && accountingConfig.taxPayableAccountId) {
      lines.push({
        accountId: accountingConfig.taxPayableAccountId,
        accountCode: accountingConfig.taxPayableAccountCode || '',
        accountName: accountingConfig.taxPayableAccountName || 'Tax Payable',
        description: `Tax withheld - ${slip.employeeName}`,
        debit: 0,
        credit: slip.deductions.tax,
      });
    }

    // Credit for PF withheld (if applicable)
    if (slip.deductions.providentFund > 0 && accountingConfig.pfPayableAccountId) {
      lines.push({
        accountId: accountingConfig.pfPayableAccountId,
        accountCode: accountingConfig.pfPayableAccountCode || '',
        accountName: accountingConfig.pfPayableAccountName || 'Provident Fund Payable',
        description: `PF withheld - ${slip.employeeName}`,
        debit: 0,
        credit: slip.deductions.providentFund,
      });
    }

    // Credit Cash/Bank Account (net salary paid)
    lines.push({
      accountId: accountingConfig.bankAccountId,
      accountCode: accountingConfig.bankAccountCode,
      accountName: accountingConfig.bankAccountName,
      description: `Net salary - ${slip.employeeName}`,
      debit: 0,
      credit: slip.netSalary,
    });

    // Add any remaining deductions (loan, other) to net salary credit
    const otherDeductions = slip.deductions.loan + slip.deductions.other;
    if (otherDeductions > 0) {
      // For simplicity, these are included in the bank payment
      // In a full implementation, you might have separate liability accounts
    }

    await createJournalEntry(companyId, {
      date: new Date(),
      description: `Salary Payment - ${slip.employeeName} (${slip.month}/${slip.year})`,
      lines,
      reference: `SAL-${slip.employeeName}-${slip.month}/${slip.year}`,
      referenceType: 'salary',
      referenceId: slipId,
      createdBy: accountingConfig.createdBy,
    });
  }
}

export async function markAllSalarySlipsPaid(
  companyId: string,
  month: number,
  year: number,
  paymentMethod: string
): Promise<number> {
  const slips = await getSalarySlipsByMonth(companyId, month, year);
  const unpaidSlips = slips.filter(s => s.status !== 'paid');

  const updates = unpaidSlips.map(slip =>
    markSalarySlipPaid(companyId, slip.id, paymentMethod)
  );

  await Promise.all(updates);
  return unpaidSlips.length;
}

export async function getTotalPayrollForMonth(
  companyId: string,
  month: number,
  year: number
): Promise<{
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  count: number;
}> {
  const slips = await getSalarySlipsByMonth(companyId, month, year);

  return {
    totalGross: slips.reduce((sum, s) => sum + s.totalEarnings, 0),
    totalDeductions: slips.reduce((sum, s) => sum + s.totalDeductions, 0),
    totalNet: slips.reduce((sum, s) => sum + s.netSalary, 0),
    count: slips.length,
  };
}

export async function getUnpaidSalarySlips(companyId: string): Promise<SalarySlip[]> {
  const slipsRef = collection(db, `companies/${companyId}/salarySlips`);
  const q = query(slipsRef, where('status', '==', 'generated'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SalarySlip[];
}

/**
 * Create a salary slip manually with all fields provided
 */
export async function createSalarySlipManually(
  companyId: string,
  data: {
    employeeId: string;
    employeeName: string;
    employeeDesignation?: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances: SalaryAllowances;
    deductions: SalaryDeductions;
  }
): Promise<string> {
  // Check for duplicate
  const existingSlips = await getSalarySlipsByMonth(companyId, data.month, data.year);
  const existingSlip = existingSlips.find(s => s.employeeId === data.employeeId);
  if (existingSlip) {
    throw new Error(`Salary slip already exists for ${data.employeeName} for ${data.month}/${data.year}`);
  }

  const totalEarnings = data.basicSalary +
    (data.allowances.hra || 0) +
    (data.allowances.da || 0) +
    (data.allowances.ta || 0) +
    (data.allowances.other || 0);

  const totalDeductions =
    (data.deductions.tax || 0) +
    (data.deductions.providentFund || 0) +
    (data.deductions.loan || 0) +
    (data.deductions.other || 0);

  const netSalary = totalEarnings - totalDeductions;

  const slipsRef = collection(db, `companies/${companyId}/salarySlips`);
  const docRef = await addDoc(slipsRef, {
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    employeeDesignation: data.employeeDesignation || '',
    month: data.month,
    year: data.year,
    basicSalary: data.basicSalary,
    allowances: {
      hra: data.allowances.hra || 0,
      da: data.allowances.da || 0,
      ta: data.allowances.ta || 0,
      other: data.allowances.other || 0,
    },
    totalEarnings,
    deductions: {
      tax: data.deductions.tax || 0,
      providentFund: data.deductions.providentFund || 0,
      loan: data.deductions.loan || 0,
      other: data.deductions.other || 0,
    },
    totalDeductions,
    netSalary,
    status: 'generated',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Update a salary slip (only when status is 'generated')
 */
export async function updateSalarySlip(
  companyId: string,
  slipId: string,
  updates: {
    basicSalary?: number;
    allowances?: Partial<SalaryAllowances>;
    deductions?: Partial<SalaryDeductions>;
    month?: number;
    year?: number;
  }
): Promise<void> {
  const slip = await getSalarySlipById(companyId, slipId);
  if (!slip) throw new Error('Salary slip not found');

  const editCheck = canEditCheck('salarySlip', slip.status);
  if (!editCheck.allowed) {
    throw new Error(editCheck.message || 'Cannot edit this salary slip');
  }

  const newAllowances = {
    hra: updates.allowances?.hra ?? slip.allowances.hra,
    da: updates.allowances?.da ?? slip.allowances.da,
    ta: updates.allowances?.ta ?? slip.allowances.ta,
    other: updates.allowances?.other ?? slip.allowances.other,
  };

  const newDeductions = {
    tax: updates.deductions?.tax ?? slip.deductions.tax,
    providentFund: updates.deductions?.providentFund ?? slip.deductions.providentFund,
    loan: updates.deductions?.loan ?? slip.deductions.loan,
    other: updates.deductions?.other ?? slip.deductions.other,
  };

  const basicSalary = updates.basicSalary ?? slip.basicSalary;

  const totalEarnings = basicSalary +
    newAllowances.hra + newAllowances.da + newAllowances.ta + newAllowances.other;

  const totalDeductions =
    newDeductions.tax + newDeductions.providentFund + newDeductions.loan + newDeductions.other;

  const netSalary = totalEarnings - totalDeductions;

  const slipRef = doc(db, `companies/${companyId}/salarySlips`, slipId);
  await updateDoc(slipRef, {
    ...(updates.basicSalary !== undefined && { basicSalary }),
    ...(updates.month !== undefined && { month: updates.month }),
    ...(updates.year !== undefined && { year: updates.year }),
    allowances: newAllowances,
    deductions: newDeductions,
    totalEarnings,
    totalDeductions,
    netSalary,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a salary slip (only when status is 'generated')
 */
export async function deleteSalarySlip(
  companyId: string,
  slipId: string
): Promise<void> {
  const slip = await getSalarySlipById(companyId, slipId);
  if (!slip) throw new Error('Salary slip not found');

  const deleteCheck = canDeleteCheck('salarySlip', slip.status);
  if (!deleteCheck.allowed) {
    throw new Error(deleteCheck.message || 'Cannot delete this salary slip');
  }

  const slipRef = doc(db, `companies/${companyId}/salarySlips`, slipId);
  await deleteDoc(slipRef);
}
