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
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CreditNote, CreditNoteItem, CreditNoteStatus, DebitNote, DebitNoteStatus, CreditNoteApplication, PaymentMethod, JournalEntryLine } from '@/types';
import { createJournalEntry } from './journalEntries';

// ==========================================
// CUSTOMER CREDIT NOTES (we owe customer)
// ==========================================

export async function getCreditNotes(companyId: string): Promise<CreditNote[]> {
  const cnsRef = collection(db, `companies/${companyId}/creditNotes`);
  const q = query(cnsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CreditNote[];
}

export async function getCreditNoteById(companyId: string, cnId: string): Promise<CreditNote | null> {
  const cnRef = doc(db, `companies/${companyId}/creditNotes`, cnId);
  const snapshot = await getDoc(cnRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as CreditNote;
}

export async function getCreditNotesByCustomer(companyId: string, customerId: string): Promise<CreditNote[]> {
  const cnsRef = collection(db, `companies/${companyId}/creditNotes`);
  const q = query(cnsRef, where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CreditNote[];
}

export async function getAvailableCreditNotes(companyId: string, customerId?: string): Promise<CreditNote[]> {
  const cnsRef = collection(db, `companies/${companyId}/creditNotes`);
  let q;
  if (customerId) {
    q = query(
      cnsRef,
      where('customerId', '==', customerId),
      where('status', 'in', ['issued', 'partial']),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      cnsRef,
      where('status', 'in', ['issued', 'partial']),
      orderBy('createdAt', 'desc')
    );
  }
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CreditNote[];
}

export async function generateCreditNoteNumber(companyId: string): Promise<string> {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) throw new Error('Company not found');

  const companyData = companySnap.data();
  const nextNumber = companyData.creditNoteNextNumber || 1;

  await updateDoc(companyRef, {
    creditNoteNextNumber: increment(1),
  });

  return `CN-${nextNumber.toString().padStart(4, '0')}`;
}

export async function createCreditNote(
  companyId: string,
  data: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    items: CreditNoteItem[];
    taxRate?: number;
    reason: 'return' | 'discount' | 'error' | 'other';
    reasonDescription?: string;
    originalInvoiceId?: string;
    originalInvoiceNumber?: string;
    notes?: string;
  }
): Promise<string> {
  const creditNoteNumber = await generateCreditNoteNumber(companyId);

  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((data.taxRate || 0) / 100);
  const total = subtotal + taxAmount;

  const cnsRef = collection(db, `companies/${companyId}/creditNotes`);
  const docRef = await addDoc(cnsRef, {
    creditNoteNumber,
    customerId: data.customerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail || '',
    date: Timestamp.now(),
    items: data.items,
    subtotal,
    taxRate: data.taxRate || 0,
    taxAmount,
    total,
    appliedAmount: 0,
    remainingCredit: total,
    status: 'draft',
    reason: data.reason,
    reasonDescription: data.reasonDescription || '',
    originalInvoiceId: data.originalInvoiceId || '',
    originalInvoiceNumber: data.originalInvoiceNumber || '',
    notes: data.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateCreditNote(
  companyId: string,
  cnId: string,
  data: Partial<CreditNote>
): Promise<void> {
  const cnRef = doc(db, `companies/${companyId}/creditNotes`, cnId);
  await updateDoc(cnRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function issueCreditNote(
  companyId: string,
  cnId: string,
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
  const cn = await getCreditNoteById(companyId, cnId);
  if (!cn) throw new Error('Credit Note not found');

  await updateCreditNote(companyId, cnId, { status: 'issued' });

  // Create journal entry for credit note (reduces revenue and A/R)
  if (accountingConfig) {
    const lines: JournalEntryLine[] = [
      // Debit Sales Returns (reduce revenue)
      {
        accountId: accountingConfig.revenueAccountId,
        accountCode: accountingConfig.revenueAccountCode,
        accountName: accountingConfig.revenueAccountName,
        description: `Credit Note ${cn.creditNoteNumber} - ${cn.customerName}`,
        debit: cn.total,
        credit: 0,
      },
      // Credit Accounts Receivable (reduce what customer owes)
      {
        accountId: accountingConfig.receivableAccountId,
        accountCode: accountingConfig.receivableAccountCode,
        accountName: accountingConfig.receivableAccountName,
        description: `Credit Note ${cn.creditNoteNumber} - ${cn.customerName}`,
        debit: 0,
        credit: cn.total,
      },
    ];

    await createJournalEntry(companyId, {
      date: new Date(),
      description: `Credit Note ${cn.creditNoteNumber} - ${cn.customerName}`,
      lines,
      reference: cn.creditNoteNumber,
      referenceType: 'invoice', // Credit notes relate to invoices
      referenceId: cnId,
      createdBy: accountingConfig.createdBy,
    });
  }
}

export async function applyCreditToInvoice(
  companyId: string,
  cnId: string,
  invoiceId: string,
  invoiceNumber: string,
  amount: number
): Promise<string> {
  const cn = await getCreditNoteById(companyId, cnId);
  if (!cn) throw new Error('Credit Note not found');

  if (amount > cn.remainingCredit) {
    throw new Error('Amount exceeds remaining credit');
  }

  // Create application record
  const applicationsRef = collection(db, `companies/${companyId}/creditNoteApplications`);
  const appRef = await addDoc(applicationsRef, {
    creditNoteId: cnId,
    creditNoteNumber: cn.creditNoteNumber,
    invoiceId,
    invoiceNumber,
    amount,
    appliedAt: Timestamp.now(),
    createdAt: serverTimestamp(),
  });

  // Update credit note
  const newAppliedAmount = cn.appliedAmount + amount;
  const newRemainingCredit = cn.total - newAppliedAmount;
  let newStatus: CreditNoteStatus = cn.status;

  if (newRemainingCredit <= 0) {
    newStatus = 'applied';
  } else if (newAppliedAmount > 0) {
    newStatus = 'partial';
  }

  await updateCreditNote(companyId, cnId, {
    appliedAmount: newAppliedAmount,
    remainingCredit: Math.max(0, newRemainingCredit),
    status: newStatus,
  });

  return appRef.id;
}

export async function refundCreditNote(
  companyId: string,
  cnId: string,
  refundMethod: PaymentMethod,
  paymentConfig?: {
    bankAccountId: string;
    bankAccountCode: string;
    bankAccountName: string;
    receivableAccountId: string;
    receivableAccountCode: string;
    receivableAccountName: string;
    createdBy: string;
  }
): Promise<void> {
  const cn = await getCreditNoteById(companyId, cnId);
  if (!cn) throw new Error('Credit Note not found');

  await updateCreditNote(companyId, cnId, {
    status: 'refunded',
    refundedAt: Timestamp.now(),
    refundMethod,
  });

  // Create journal entry for refund (cash outflow)
  if (paymentConfig) {
    const lines: JournalEntryLine[] = [
      // Debit Accounts Receivable (reverse the credit note reduction)
      {
        accountId: paymentConfig.receivableAccountId,
        accountCode: paymentConfig.receivableAccountCode,
        accountName: paymentConfig.receivableAccountName,
        description: `Refund - Credit Note ${cn.creditNoteNumber}`,
        debit: cn.remainingCredit,
        credit: 0,
      },
      // Credit Cash/Bank Account (cash goes out)
      {
        accountId: paymentConfig.bankAccountId,
        accountCode: paymentConfig.bankAccountCode,
        accountName: paymentConfig.bankAccountName,
        description: `Refund - Credit Note ${cn.creditNoteNumber}`,
        debit: 0,
        credit: cn.remainingCredit,
      },
    ];

    await createJournalEntry(companyId, {
      date: new Date(),
      description: `Refund - Credit Note ${cn.creditNoteNumber} - ${cn.customerName}`,
      lines,
      reference: `REF-${cn.creditNoteNumber}`,
      referenceType: 'payment',
      referenceId: cnId,
      createdBy: paymentConfig.createdBy,
    });
  }
}

export async function voidCreditNote(companyId: string, cnId: string): Promise<void> {
  await updateCreditNote(companyId, cnId, { status: 'void' });
}

export async function deleteCreditNote(companyId: string, cnId: string): Promise<void> {
  const cnRef = doc(db, `companies/${companyId}/creditNotes`, cnId);
  await deleteDoc(cnRef);
}

// ==========================================
// VENDOR DEBIT NOTES (vendor owes us)
// ==========================================

export async function getDebitNotes(companyId: string): Promise<DebitNote[]> {
  const dnsRef = collection(db, `companies/${companyId}/debitNotes`);
  const q = query(dnsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as DebitNote[];
}

export async function getDebitNoteById(companyId: string, dnId: string): Promise<DebitNote | null> {
  const dnRef = doc(db, `companies/${companyId}/debitNotes`, dnId);
  const snapshot = await getDoc(dnRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as DebitNote;
}

export async function getDebitNotesByVendor(companyId: string, vendorId: string): Promise<DebitNote[]> {
  const dnsRef = collection(db, `companies/${companyId}/debitNotes`);
  const q = query(dnsRef, where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as DebitNote[];
}

export async function generateDebitNoteNumber(companyId: string): Promise<string> {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) throw new Error('Company not found');

  const companyData = companySnap.data();
  const nextNumber = companyData.debitNoteNextNumber || 1;

  await updateDoc(companyRef, {
    debitNoteNextNumber: increment(1),
  });

  return `DN-${nextNumber.toString().padStart(4, '0')}`;
}

export async function createDebitNote(
  companyId: string,
  data: {
    vendorId: string;
    vendorName: string;
    vendorEmail?: string;
    items: CreditNoteItem[];
    taxRate?: number;
    reason: 'return' | 'discount' | 'error' | 'other';
    reasonDescription?: string;
    originalBillId?: string;
    originalBillNumber?: string;
    notes?: string;
  }
): Promise<string> {
  const debitNoteNumber = await generateDebitNoteNumber(companyId);

  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((data.taxRate || 0) / 100);
  const total = subtotal + taxAmount;

  const dnsRef = collection(db, `companies/${companyId}/debitNotes`);
  const docRef = await addDoc(dnsRef, {
    debitNoteNumber,
    vendorId: data.vendorId,
    vendorName: data.vendorName,
    vendorEmail: data.vendorEmail || '',
    date: Timestamp.now(),
    items: data.items,
    subtotal,
    taxRate: data.taxRate || 0,
    taxAmount,
    total,
    appliedAmount: 0,
    remainingBalance: total,
    status: 'draft',
    reason: data.reason,
    reasonDescription: data.reasonDescription || '',
    originalBillId: data.originalBillId || '',
    originalBillNumber: data.originalBillNumber || '',
    notes: data.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateDebitNote(
  companyId: string,
  dnId: string,
  data: Partial<DebitNote>
): Promise<void> {
  const dnRef = doc(db, `companies/${companyId}/debitNotes`, dnId);
  await updateDoc(dnRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function issueDebitNote(
  companyId: string,
  dnId: string,
  accountingConfig?: {
    payableAccountId: string;
    payableAccountCode: string;
    payableAccountName: string;
    expenseAccountId: string;
    expenseAccountCode: string;
    expenseAccountName: string;
    createdBy: string;
  }
): Promise<void> {
  const dn = await getDebitNoteById(companyId, dnId);
  if (!dn) throw new Error('Debit Note not found');

  await updateDebitNote(companyId, dnId, { status: 'issued' });

  // Create journal entry for debit note (reduces A/P and expense)
  if (accountingConfig) {
    const lines: JournalEntryLine[] = [
      // Debit Accounts Payable (reduce what we owe vendor)
      {
        accountId: accountingConfig.payableAccountId,
        accountCode: accountingConfig.payableAccountCode,
        accountName: accountingConfig.payableAccountName,
        description: `Debit Note ${dn.debitNoteNumber} - ${dn.vendorName}`,
        debit: dn.total,
        credit: 0,
      },
      // Credit Purchase Returns (reduce expense)
      {
        accountId: accountingConfig.expenseAccountId,
        accountCode: accountingConfig.expenseAccountCode,
        accountName: accountingConfig.expenseAccountName,
        description: `Debit Note ${dn.debitNoteNumber} - ${dn.vendorName}`,
        debit: 0,
        credit: dn.total,
      },
    ];

    await createJournalEntry(companyId, {
      date: new Date(),
      description: `Debit Note ${dn.debitNoteNumber} - ${dn.vendorName}`,
      lines,
      reference: dn.debitNoteNumber,
      referenceType: 'bill', // Debit notes relate to bills
      referenceId: dnId,
      createdBy: accountingConfig.createdBy,
    });
  }
}

export async function applyDebitToBill(
  companyId: string,
  dnId: string,
  amount: number
): Promise<void> {
  const dn = await getDebitNoteById(companyId, dnId);
  if (!dn) throw new Error('Debit Note not found');

  if (amount > dn.remainingBalance) {
    throw new Error('Amount exceeds remaining balance');
  }

  const newAppliedAmount = dn.appliedAmount + amount;
  const newRemainingBalance = dn.total - newAppliedAmount;
  let newStatus: DebitNoteStatus = dn.status;

  if (newRemainingBalance <= 0) {
    newStatus = 'settled';
  } else if (newAppliedAmount > 0) {
    newStatus = 'partial';
  }

  await updateDebitNote(companyId, dnId, {
    appliedAmount: newAppliedAmount,
    remainingBalance: Math.max(0, newRemainingBalance),
    status: newStatus,
    settledAt: newStatus === 'settled' ? Timestamp.now() : undefined,
  });
}

export async function voidDebitNote(companyId: string, dnId: string): Promise<void> {
  await updateDebitNote(companyId, dnId, { status: 'void' });
}

export async function deleteDebitNote(companyId: string, dnId: string): Promise<void> {
  const dnRef = doc(db, `companies/${companyId}/debitNotes`, dnId);
  await deleteDoc(dnRef);
}

// ==========================================
// STATS
// ==========================================

export async function getCreditNoteStats(companyId: string): Promise<{
  totalCreditNotes: number;
  totalDebitNotes: number;
  totalCreditValue: number;
  totalDebitValue: number;
  availableCreditValue: number;
  availableDebitValue: number;
}> {
  const [creditNotes, debitNotes] = await Promise.all([
    getCreditNotes(companyId),
    getDebitNotes(companyId),
  ]);

  return {
    totalCreditNotes: creditNotes.length,
    totalDebitNotes: debitNotes.length,
    totalCreditValue: creditNotes.reduce((sum, cn) => sum + cn.total, 0),
    totalDebitValue: debitNotes.reduce((sum, dn) => sum + dn.total, 0),
    availableCreditValue: creditNotes
      .filter(cn => cn.status === 'issued' || cn.status === 'partial')
      .reduce((sum, cn) => sum + cn.remainingCredit, 0),
    availableDebitValue: debitNotes
      .filter(dn => dn.status === 'issued' || dn.status === 'partial')
      .reduce((sum, dn) => sum + dn.remainingBalance, 0),
  };
}
