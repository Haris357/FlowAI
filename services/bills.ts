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
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bill, BillItem, BillStatus, JournalEntryLine } from '@/types';
import { createJournalEntry } from './journalEntries';
import { updateAccountBalance, getAccounts } from './accounts';
import { getAccountPreferences } from './preferences';
import {
  isValidTransition,
  canDelete,
  canEdit,
  getStatusValidation,
} from '@/lib/status-management';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get recent bills with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of bills sorted by creation date (newest first)
 */
export async function getBills(companyId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Bill[]> {
  const billsRef = collection(db, `companies/${companyId}/bills`);
  const q = query(billsRef, orderBy('createdAt', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Bill[];
}

export async function getBillById(companyId: string, billId: string): Promise<Bill | null> {
  const billRef = doc(db, `companies/${companyId}/bills`, billId);
  const snapshot = await getDoc(billRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Bill;
}

/**
 * Get bills for a specific vendor
 * @param companyId - Company ID
 * @param vendorId - Vendor ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of vendor bills
 */
export async function getBillsByVendor(companyId: string, vendorId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Bill[]> {
  const billsRef = collection(db, `companies/${companyId}/bills`);
  const q = query(billsRef, where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Bill[];
}

/**
 * Update bill status with validation
 * @throws Error if status transition is not allowed
 */
export async function updateBillStatus(
  companyId: string,
  billId: string,
  newStatus: string
): Promise<void> {
  const bill = await getBillById(companyId, billId);
  if (!bill) throw new Error('Bill not found');

  // Validate status transition
  if (!isValidTransition('bill', bill.status, newStatus)) {
    throw new Error(
      `Cannot change bill status from "${bill.status}" to "${newStatus}". This transition is not allowed.`
    );
  }

  await updateBill(companyId, billId, {
    status: newStatus as BillStatus,
  });

  // When marking paid, auto-create the payment journal entry
  if (newStatus === 'paid') {
    try {
      const [accounts, prefs] = await Promise.all([getAccounts(companyId), getAccountPreferences(companyId)]);
      const remainingDue = bill.amountDue ?? (bill.total - (bill.amountPaid || 0));

      if (remainingDue > 0) {
        const payableAccount =
          (prefs.defaultPayableAccountId ? accounts.find(a => a.id === prefs.defaultPayableAccountId && a.isActive !== false) : undefined) ||
          accounts.find(a =>
            a.isActive && a.typeCode === 'liability' &&
            (a.name.toLowerCase().includes('payable') || a.code === '2000')
          ) || accounts.find(a => a.isActive && a.typeCode === 'liability');

        const bankAccount =
          (prefs.defaultCashAccountId ? accounts.find(a => a.id === prefs.defaultCashAccountId && a.isActive !== false) : undefined) ||
          accounts.find(a =>
            a.isActive && a.typeCode === 'asset' &&
            (a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('checking'))
          ) || accounts.find(a => a.isActive && a.typeCode === 'asset');

        if (payableAccount && bankAccount) {
          await createJournalEntry(companyId, {
            date: new Date(),
            description: `Bill payment - ${bill.billNumber} - ${bill.vendorName}`,
            lines: [
              {
                accountId: payableAccount.id,
                accountCode: payableAccount.code,
                accountName: payableAccount.name,
                description: `Payment made - Bill ${bill.billNumber}`,
                debit: remainingDue,
                credit: 0,
              },
              {
                accountId: bankAccount.id,
                accountCode: bankAccount.code,
                accountName: bankAccount.name,
                description: `Payment made - Bill ${bill.billNumber}`,
                debit: 0,
                credit: remainingDue,
              },
            ],
            reference: `PMT-${bill.billNumber}`,
            referenceType: 'payment',
            referenceId: billId,
            createdBy: 'system',
          });

          // Update account balances
          await updateAccountBalance(companyId, payableAccount.id, remainingDue, 'subtract');
          await updateAccountBalance(companyId, bankAccount.id, remainingDue, 'subtract');

          // Mark the amounts as fully paid on the bill
          await updateBill(companyId, billId, {
            amountPaid: bill.total,
            amountDue: 0,
          });
        }
      }
    } catch (jeError) {
      console.warn('[Bills] Failed to create payment journal entry:', jeError);
    }
  }
}

/**
 * Get outstanding bills (unpaid, partial, overdue)
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of outstanding bills sorted by due date
 */
export async function getOutstandingBills(companyId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Bill[]> {
  const billsRef = collection(db, `companies/${companyId}/bills`);
  const q = query(
    billsRef,
    where('status', 'in', ['unpaid', 'partial', 'overdue']),
    orderBy('dueDate'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Bill[];
}

/**
 * Get overdue bills
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of overdue bills
 */
export async function getOverdueBills(companyId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Bill[]> {
  const billsRef = collection(db, `companies/${companyId}/bills`);
  const q = query(billsRef, where('status', '==', 'overdue'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Bill[];
}

export async function generateBillNumber(companyId: string): Promise<string> {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) throw new Error('Company not found');

  const companyData = companySnap.data();
  const nextNumber = companyData.billNextNumber || 1;

  await updateDoc(companyRef, {
    billNextNumber: increment(1),
  });

  return `BILL-${nextNumber.toString().padStart(4, '0')}`;
}

export async function createBill(
  companyId: string,
  data: {
    vendorId?: string;
    vendorName: string;
    billNumber?: string;
    items: BillItem[];
    dueDate?: Date;
    taxAmount?: number;
    category?: string;
    notes?: string;
    attachmentUrl?: string;
    // Accounting config for journal entry
    accountingConfig?: {
      expenseAccountId: string;
      expenseAccountCode: string;
      expenseAccountName: string;
      payableAccountId: string;
      payableAccountCode: string;
      payableAccountName: string;
      createdBy: string;
    };
  }
): Promise<string> {
  const billNumber = data.billNumber || await generateBillNumber(companyId);

  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + (data.taxAmount || 0);

  const billsRef = collection(db, `companies/${companyId}/bills`);
  const docRef = await addDoc(billsRef, {
    billNumber,
    vendorId: data.vendorId || '',
    vendorName: data.vendorName,
    issueDate: Timestamp.now(),
    dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
    items: data.items,
    subtotal,
    taxAmount: data.taxAmount || 0,
    total,
    amountPaid: 0,
    amountDue: total,
    status: 'unpaid',
    category: data.category || '',
    notes: data.notes || '',
    attachmentUrl: data.attachmentUrl || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Create journal entry for bill (expense recognition)
  if (data.accountingConfig) {
    const lines: JournalEntryLine[] = [
      // Debit Expense Account
      {
        accountId: data.accountingConfig.expenseAccountId,
        accountCode: data.accountingConfig.expenseAccountCode,
        accountName: data.accountingConfig.expenseAccountName,
        description: `Bill ${billNumber} - ${data.vendorName}`,
        debit: total,
        credit: 0,
      },
      // Credit Accounts Payable
      {
        accountId: data.accountingConfig.payableAccountId,
        accountCode: data.accountingConfig.payableAccountCode,
        accountName: data.accountingConfig.payableAccountName,
        description: `Bill ${billNumber} - ${data.vendorName}`,
        debit: 0,
        credit: total,
      },
    ];

    await createJournalEntry(companyId, {
      date: new Date(),
      description: `Bill ${billNumber} - ${data.vendorName}`,
      lines,
      reference: billNumber,
      referenceType: 'bill',
      referenceId: docRef.id,
      createdBy: data.accountingConfig.createdBy,
    });

    // Update account balances
    // Expense increases with debit
    await updateAccountBalance(companyId, data.accountingConfig.expenseAccountId, total, 'add');
    // Accounts Payable increases with credit (liability account)
    await updateAccountBalance(companyId, data.accountingConfig.payableAccountId, total, 'add');
  }

  return docRef.id;
}

export async function updateBill(
  companyId: string,
  billId: string,
  data: Partial<Bill>
): Promise<void> {
  // Get current bill to check status
  const bill = await getBillById(companyId, billId);
  if (!bill) throw new Error('Bill not found');

  // Check if bill can be edited
  const editPermission = canEdit('bill', bill.status);
  if (!editPermission.allowed) {
    // Check if we're only updating allowed fields
    const validation = getStatusValidation('bill', bill.status);
    if (validation.editableFields) {
      const updateKeys = Object.keys(data).filter(key => key !== 'updatedAt' && key !== 'status');
      const unauthorizedFields = updateKeys.filter(
        key => !validation.editableFields!.includes(key)
      );

      if (unauthorizedFields.length > 0) {
        throw new Error(
          `Cannot edit fields [${unauthorizedFields.join(', ')}] when bill status is "${bill.status}". ${editPermission.message || ''}`
        );
      }
    } else {
      throw new Error(editPermission.message || 'Cannot edit bill with current status');
    }
  }

  const billRef = doc(db, `companies/${companyId}/bills`, billId);
  await updateDoc(billRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function recordBillPayment(
  companyId: string,
  billId: string,
  amount: number,
  paymentConfig?: {
    paymentDate: Date;
    paymentMethod: string;
    bankAccountId: string;
    bankAccountCode: string;
    bankAccountName: string;
    payableAccountId: string;
    payableAccountCode: string;
    payableAccountName: string;
    createdBy: string;
  }
): Promise<void> {
  const bill = await getBillById(companyId, billId);
  if (!bill) throw new Error('Bill not found');

  const newAmountPaid = bill.amountPaid + amount;
  const newAmountDue = bill.total - newAmountPaid;

  let newStatus: BillStatus;
  if (newAmountDue <= 0) {
    newStatus = 'paid';
  } else if (newAmountPaid > 0) {
    newStatus = 'partial';
  } else {
    newStatus = bill.status;
  }

  await updateBill(companyId, billId, {
    amountPaid: newAmountPaid,
    amountDue: Math.max(0, newAmountDue),
    status: newStatus,
  });

  // Create journal entry for payment made
  if (paymentConfig) {
    const lines: JournalEntryLine[] = [
      // Debit Accounts Payable (reduce liability)
      {
        accountId: paymentConfig.payableAccountId,
        accountCode: paymentConfig.payableAccountCode,
        accountName: paymentConfig.payableAccountName,
        description: `Payment made - Bill ${bill.billNumber}`,
        debit: amount,
        credit: 0,
      },
      // Credit Cash/Bank Account
      {
        accountId: paymentConfig.bankAccountId,
        accountCode: paymentConfig.bankAccountCode,
        accountName: paymentConfig.bankAccountName,
        description: `Payment made - Bill ${bill.billNumber}`,
        debit: 0,
        credit: amount,
      },
    ];

    await createJournalEntry(companyId, {
      date: paymentConfig.paymentDate,
      description: `Payment made - Bill ${bill.billNumber} - ${bill.vendorName}`,
      lines,
      reference: `PMT-${bill.billNumber}`,
      referenceType: 'payment',
      referenceId: billId,
      createdBy: paymentConfig.createdBy,
    });

    // Update account balances
    // Accounts Payable decreases with debit
    await updateAccountBalance(companyId, paymentConfig.payableAccountId, amount, 'subtract');
    // Cash/Bank decreases with credit
    await updateAccountBalance(companyId, paymentConfig.bankAccountId, amount, 'subtract');
  }
}

export async function deleteBill(companyId: string, billId: string): Promise<void> {
  // Get current bill to check status
  const bill = await getBillById(companyId, billId);
  if (!bill) throw new Error('Bill not found');

  // Check if bill can be deleted
  const deletePermission = canDelete('bill', bill.status);
  if (!deletePermission.allowed) {
    throw new Error(
      deletePermission.message || `Cannot delete bill with status "${bill.status}"`
    );
  }

  const billRef = doc(db, `companies/${companyId}/bills`, billId);
  await deleteDoc(billRef);
}

export async function checkOverdueBills(companyId: string): Promise<void> {
  const billsRef = collection(db, `companies/${companyId}/bills`);
  const q = query(
    billsRef,
    where('status', 'in', ['unpaid', 'partial'])
  );
  const snapshot = await getDocs(q);

  const now = new Date();
  const updates: Promise<void>[] = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.dueDate) {
      const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
      if (dueDate < now) {
        updates.push(updateBill(companyId, doc.id, { status: 'overdue' }));
      }
    }
  });

  await Promise.all(updates);
}

export async function getTotalOutstandingBills(companyId: string): Promise<number> {
  const outstanding = await getOutstandingBills(companyId);
  return outstanding.reduce((sum, bill) => sum + bill.amountDue, 0);
}

export async function getBillStats(companyId: string): Promise<{
  totalBills: number;
  totalUnpaid: number;
  totalPartial: number;
  totalPaid: number;
  totalOverdue: number;
  totalOutstanding: number;
  totalValue: number;
}> {
  const bills = await getBills(companyId);

  return {
    totalBills: bills.length,
    totalUnpaid: bills.filter(b => b.status === 'unpaid').length,
    totalPartial: bills.filter(b => b.status === 'partial').length,
    totalPaid: bills.filter(b => b.status === 'paid').length,
    totalOverdue: bills.filter(b => b.status === 'overdue').length,
    totalOutstanding: bills.filter(b => ['unpaid', 'partial', 'overdue'].includes(b.status)).reduce((sum, b) => sum + b.amountDue, 0),
    totalValue: bills.reduce((sum, b) => sum + b.total, 0),
  };
}
