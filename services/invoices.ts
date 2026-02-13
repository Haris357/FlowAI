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
import { Invoice, InvoiceItem, JournalEntryLine } from '@/types';
import { createJournalEntry } from './journalEntries';
import { updateCustomerBalance } from './customers';
import { updateAccountBalance } from './accounts';
import {
  isValidTransition,
  canDelete,
  canEdit,
  getStatusValidation,
} from '@/lib/status-management';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get recent invoices with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of invoices sorted by creation date (newest first)
 */
export async function getInvoices(companyId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Invoice[]> {
  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  const q = query(invoicesRef, orderBy('createdAt', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Invoice[];
}

export async function getInvoiceById(companyId: string, invoiceId: string): Promise<Invoice | null> {
  const invoiceRef = doc(db, `companies/${companyId}/invoices`, invoiceId);
  const snapshot = await getDoc(invoiceRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Invoice;
}

export async function getInvoiceByNumber(companyId: string, invoiceNumber: string): Promise<Invoice | null> {
  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  const q = query(invoicesRef, where('invoiceNumber', '==', invoiceNumber));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Invoice;
}

/**
 * Get invoices for a specific customer
 * @param companyId - Company ID
 * @param customerId - Customer ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of customer invoices
 */
export async function getInvoicesByCustomer(companyId: string, customerId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Invoice[]> {
  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  const q = query(invoicesRef, where('customerId', '==', customerId), orderBy('createdAt', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Invoice[];
}

/**
 * Update invoice status with validation
 * @throws Error if status transition is not allowed
 */
export async function updateInvoiceStatus(
  companyId: string,
  invoiceId: string,
  newStatus: string
): Promise<void> {
  const invoice = await getInvoiceById(companyId, invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  // Validate status transition
  if (!isValidTransition('invoice', invoice.status, newStatus)) {
    throw new Error(
      `Cannot change invoice status from "${invoice.status}" to "${newStatus}". This transition is not allowed.`
    );
  }

  await updateInvoice(companyId, invoiceId, {
    status: newStatus as Invoice['status'],
  });
}

/**
 * Get outstanding invoices (sent, viewed, partial, overdue)
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of outstanding invoices sorted by due date
 */
export async function getOutstandingInvoices(companyId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Invoice[]> {
  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  const q = query(
    invoicesRef,
    where('status', 'in', ['sent', 'viewed', 'partial', 'overdue']),
    orderBy('dueDate'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Invoice[];
}

/**
 * Get overdue invoices
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of overdue invoices
 */
export async function getOverdueInvoices(companyId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Invoice[]> {
  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  const q = query(invoicesRef, where('status', '==', 'overdue'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Invoice[];
}

export async function generateInvoiceNumber(companyId: string): Promise<string> {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) throw new Error('Company not found');

  const companyData = companySnap.data();
  const prefix = companyData.invoicePrefix || 'INV';
  const nextNumber = companyData.invoiceNextNumber || 1;

  // Increment the counter
  await updateDoc(companyRef, {
    invoiceNextNumber: increment(1),
  });

  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

export async function createInvoice(
  companyId: string,
  data: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    items: InvoiceItem[];
    dueDate: Date;
    taxRate?: number;
    discount?: number;
    notes?: string;
    terms?: string;
  }
): Promise<string> {
  const invoiceNumber = await generateInvoiceNumber(companyId);

  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((data.taxRate || 0) / 100);
  const total = subtotal + taxAmount - (data.discount || 0);

  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  const docRef = await addDoc(invoicesRef, {
    invoiceNumber,
    customerId: data.customerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail || '',
    issueDate: Timestamp.now(),
    dueDate: Timestamp.fromDate(data.dueDate),
    items: data.items,
    subtotal,
    taxRate: data.taxRate || 0,
    taxAmount,
    discount: data.discount || 0,
    total,
    amountPaid: 0,
    amountDue: total,
    status: 'draft',
    notes: data.notes || '',
    terms: data.terms || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateInvoice(
  companyId: string,
  invoiceId: string,
  data: Partial<Invoice>
): Promise<void> {
  // Get current invoice to check status
  const invoice = await getInvoiceById(companyId, invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  // Check if invoice can be edited
  const editPermission = canEdit('invoice', invoice.status);
  if (!editPermission.allowed) {
    // Check if we're only updating allowed fields
    const validation = getStatusValidation('invoice', invoice.status);
    if (validation.editableFields) {
      const updateKeys = Object.keys(data).filter(key => key !== 'updatedAt' && key !== 'status');
      const unauthorizedFields = updateKeys.filter(
        key => !validation.editableFields!.includes(key)
      );

      if (unauthorizedFields.length > 0) {
        throw new Error(
          `Cannot edit fields [${unauthorizedFields.join(', ')}] when invoice status is "${invoice.status}". ${editPermission.message || ''}`
        );
      }
    } else {
      throw new Error(editPermission.message || 'Cannot edit invoice with current status');
    }
  }

  const invoiceRef = doc(db, `companies/${companyId}/invoices`, invoiceId);
  await updateDoc(invoiceRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function markInvoiceSent(
  companyId: string,
  invoiceId: string,
  accountingConfig?: {
    receivableAccountId: string;
    receivableAccountCode: string;
    receivableAccountName: string;
    revenueAccountId: string;
    revenueAccountCode: string;
    revenueAccountName: string;
    createdBy: string;
  }
): Promise<void> {
  const invoice = await getInvoiceById(companyId, invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  await updateInvoice(companyId, invoiceId, {
    status: 'sent',
    sentAt: Timestamp.now(),
  });

  // Create journal entry for revenue recognition when invoice is sent
  if (accountingConfig) {
    const lines: JournalEntryLine[] = [
      // Debit Accounts Receivable
      {
        accountId: accountingConfig.receivableAccountId,
        accountCode: accountingConfig.receivableAccountCode,
        accountName: accountingConfig.receivableAccountName,
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
        debit: invoice.total,
        credit: 0,
      },
      // Credit Revenue
      {
        accountId: accountingConfig.revenueAccountId,
        accountCode: accountingConfig.revenueAccountCode,
        accountName: accountingConfig.revenueAccountName,
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
        debit: 0,
        credit: invoice.total,
      },
    ];

    await createJournalEntry(companyId, {
      date: new Date(),
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
      lines,
      reference: invoice.invoiceNumber,
      referenceType: 'invoice',
      referenceId: invoiceId,
      createdBy: accountingConfig.createdBy,
    });

    // Update customer balance: increase totalInvoiced
    await updateCustomerBalance(companyId, invoice.customerId, invoice.total, 0);

    // Update account balances
    // Accounts Receivable increases with debit
    await updateAccountBalance(companyId, accountingConfig.receivableAccountId, invoice.total, 'add');
    // Revenue increases with credit (revenue is a credit account, so we add)
    await updateAccountBalance(companyId, accountingConfig.revenueAccountId, invoice.total, 'add');
  }
}

export async function recordInvoicePayment(
  companyId: string,
  invoiceId: string,
  amount: number,
  paymentConfig?: {
    paymentDate: Date;
    paymentMethod: string;
    bankAccountId: string;
    bankAccountCode: string;
    bankAccountName: string;
    receivableAccountId: string;
    receivableAccountCode: string;
    receivableAccountName: string;
    createdBy: string;
  }
): Promise<void> {
  const invoice = await getInvoiceById(companyId, invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const newAmountPaid = invoice.amountPaid + amount;
  const newAmountDue = invoice.total - newAmountPaid;

  let newStatus: Invoice['status'];
  if (newAmountDue <= 0) {
    newStatus = 'paid';
  } else if (newAmountPaid > 0) {
    newStatus = 'partial';
  } else {
    newStatus = invoice.status;
  }

  await updateInvoice(companyId, invoiceId, {
    amountPaid: newAmountPaid,
    amountDue: Math.max(0, newAmountDue),
    status: newStatus,
    paidAt: newStatus === 'paid' ? Timestamp.now() : undefined,
  });

  // Create journal entry for payment received
  if (paymentConfig) {
    const lines: JournalEntryLine[] = [
      // Debit Cash/Bank Account
      {
        accountId: paymentConfig.bankAccountId,
        accountCode: paymentConfig.bankAccountCode,
        accountName: paymentConfig.bankAccountName,
        description: `Payment received - Invoice ${invoice.invoiceNumber}`,
        debit: amount,
        credit: 0,
      },
      // Credit Accounts Receivable
      {
        accountId: paymentConfig.receivableAccountId,
        accountCode: paymentConfig.receivableAccountCode,
        accountName: paymentConfig.receivableAccountName,
        description: `Payment received - Invoice ${invoice.invoiceNumber}`,
        debit: 0,
        credit: amount,
      },
    ];

    await createJournalEntry(companyId, {
      date: paymentConfig.paymentDate,
      description: `Payment received - Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
      lines,
      reference: `PMT-${invoice.invoiceNumber}`,
      referenceType: 'payment',
      referenceId: invoiceId,
      createdBy: paymentConfig.createdBy,
    });

    // Update customer balance: increase totalPaid
    await updateCustomerBalance(companyId, invoice.customerId, 0, amount);

    // Update account balances
    // Cash/Bank increases with debit
    await updateAccountBalance(companyId, paymentConfig.bankAccountId, amount, 'add');
    // Accounts Receivable decreases with credit
    await updateAccountBalance(companyId, paymentConfig.receivableAccountId, amount, 'subtract');
  }
}

export async function cancelInvoice(companyId: string, invoiceId: string): Promise<void> {
  await updateInvoice(companyId, invoiceId, { status: 'cancelled' });
}

export async function deleteInvoice(companyId: string, invoiceId: string): Promise<void> {
  // Get current invoice to check status
  const invoice = await getInvoiceById(companyId, invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  // Check if invoice can be deleted
  const deletePermission = canDelete('invoice', invoice.status);
  if (!deletePermission.allowed) {
    throw new Error(
      deletePermission.message || `Cannot delete invoice with status "${invoice.status}"`
    );
  }

  const invoiceRef = doc(db, `companies/${companyId}/invoices`, invoiceId);
  await deleteDoc(invoiceRef);
}

export async function checkOverdueInvoices(companyId: string): Promise<void> {
  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  const q = query(
    invoicesRef,
    where('status', 'in', ['sent', 'viewed', 'partial'])
  );
  const snapshot = await getDocs(q);

  const now = new Date();
  const updates: Promise<void>[] = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);

    if (dueDate < now) {
      updates.push(updateInvoice(companyId, doc.id, { status: 'overdue' }));
    }
  });

  await Promise.all(updates);
}

export async function getTotalOutstandingAmount(companyId: string): Promise<number> {
  const outstanding = await getOutstandingInvoices(companyId);
  return outstanding.reduce((sum, inv) => sum + inv.amountDue, 0);
}
