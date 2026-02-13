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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JournalEntry, JournalEntryLine } from '@/types';

export async function getJournalEntries(companyId: string): Promise<JournalEntry[]> {
  const entriesRef = collection(db, `companies/${companyId}/journalEntries`);
  const q = query(entriesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as JournalEntry[];
}

export async function getJournalEntryById(companyId: string, entryId: string): Promise<JournalEntry | null> {
  const entryRef = doc(db, `companies/${companyId}/journalEntries`, entryId);
  const snapshot = await getDoc(entryRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as JournalEntry;
}

export async function getJournalEntryByNumber(companyId: string, entryNumber: string): Promise<JournalEntry | null> {
  const entriesRef = collection(db, `companies/${companyId}/journalEntries`);
  const q = query(entriesRef, where('entryNumber', '==', entryNumber));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as JournalEntry;
}

export async function getJournalEntriesByReference(
  companyId: string,
  referenceType: JournalEntry['referenceType'],
  referenceId: string
): Promise<JournalEntry[]> {
  const entriesRef = collection(db, `companies/${companyId}/journalEntries`);
  const q = query(
    entriesRef,
    where('referenceType', '==', referenceType),
    where('referenceId', '==', referenceId)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as JournalEntry[];
}

export async function getJournalEntriesByDateRange(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<JournalEntry[]> {
  const entriesRef = collection(db, `companies/${companyId}/journalEntries`);
  const q = query(
    entriesRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as JournalEntry[];
}

export async function generateEntryNumber(companyId: string): Promise<string> {
  const entries = await getJournalEntries(companyId);
  const nextNumber = entries.length + 1;
  return `JE-${nextNumber.toString().padStart(4, '0')}`;
}

export async function createJournalEntry(
  companyId: string,
  data: {
    date: Date;
    description: string;
    lines: JournalEntryLine[];
    reference?: string;
    referenceType?: JournalEntry['referenceType'];
    referenceId?: string;
    createdBy: string;
  }
): Promise<string> {
  // Validate that entry is balanced
  const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
  }

  const entryNumber = await generateEntryNumber(companyId);

  const entriesRef = collection(db, `companies/${companyId}/journalEntries`);
  const docRef = await addDoc(entriesRef, {
    entryNumber,
    date: Timestamp.fromDate(data.date),
    description: data.description,
    reference: data.reference || '',
    referenceType: data.referenceType || 'manual',
    referenceId: data.referenceId || '',
    lines: data.lines,
    totalDebit,
    totalCredit,
    isBalanced: true,
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateJournalEntry(
  companyId: string,
  entryId: string,
  data: {
    date?: Date;
    description?: string;
    lines?: JournalEntryLine[];
    reference?: string;
  }
): Promise<void> {
  const updateData: { [key: string]: any } = {};

  if (data.date) {
    updateData.date = Timestamp.fromDate(data.date);
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.reference !== undefined) {
    updateData.reference = data.reference;
  }
  if (data.lines) {
    // Validate that entry is balanced
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }

    updateData.lines = data.lines;
    updateData.totalDebit = totalDebit;
    updateData.totalCredit = totalCredit;
    updateData.isBalanced = true;
  }

  const entryRef = doc(db, `companies/${companyId}/journalEntries`, entryId);
  await updateDoc(entryRef, updateData);
}

export async function deleteJournalEntry(companyId: string, entryId: string): Promise<void> {
  const entryRef = doc(db, `companies/${companyId}/journalEntries`, entryId);
  await deleteDoc(entryRef);
}

// Helper function to create a balanced journal entry for common transactions
export async function createExpenseEntry(
  companyId: string,
  data: {
    date: Date;
    description: string;
    amount: number;
    expenseAccountId: string;
    expenseAccountCode: string;
    expenseAccountName: string;
    paymentAccountId: string;
    paymentAccountCode: string;
    paymentAccountName: string;
    createdBy: string;
    reference?: string;
    referenceType?: JournalEntry['referenceType'];
    referenceId?: string;
  }
): Promise<string> {
  const lines: JournalEntryLine[] = [
    {
      accountId: data.expenseAccountId,
      accountCode: data.expenseAccountCode,
      accountName: data.expenseAccountName,
      description: data.description,
      debit: data.amount,
      credit: 0,
    },
    {
      accountId: data.paymentAccountId,
      accountCode: data.paymentAccountCode,
      accountName: data.paymentAccountName,
      description: data.description,
      debit: 0,
      credit: data.amount,
    },
  ];

  return createJournalEntry(companyId, {
    date: data.date,
    description: data.description,
    lines,
    reference: data.reference,
    referenceType: data.referenceType || 'expense',
    referenceId: data.referenceId,
    createdBy: data.createdBy,
  });
}

export async function createIncomeEntry(
  companyId: string,
  data: {
    date: Date;
    description: string;
    amount: number;
    incomeAccountId: string;
    incomeAccountCode: string;
    incomeAccountName: string;
    receivableAccountId: string;
    receivableAccountCode: string;
    receivableAccountName: string;
    createdBy: string;
    reference?: string;
    referenceType?: JournalEntry['referenceType'];
    referenceId?: string;
  }
): Promise<string> {
  const lines: JournalEntryLine[] = [
    {
      accountId: data.receivableAccountId,
      accountCode: data.receivableAccountCode,
      accountName: data.receivableAccountName,
      description: data.description,
      debit: data.amount,
      credit: 0,
    },
    {
      accountId: data.incomeAccountId,
      accountCode: data.incomeAccountCode,
      accountName: data.incomeAccountName,
      description: data.description,
      debit: 0,
      credit: data.amount,
    },
  ];

  return createJournalEntry(companyId, {
    date: data.date,
    description: data.description,
    lines,
    reference: data.reference,
    referenceType: data.referenceType || 'invoice',
    referenceId: data.referenceId,
    createdBy: data.createdBy,
  });
}

export async function createPaymentReceivedEntry(
  companyId: string,
  data: {
    date: Date;
    description: string;
    amount: number;
    cashAccountId: string;
    cashAccountCode: string;
    cashAccountName: string;
    receivableAccountId: string;
    receivableAccountCode: string;
    receivableAccountName: string;
    createdBy: string;
    reference?: string;
    referenceId?: string;
  }
): Promise<string> {
  const lines: JournalEntryLine[] = [
    {
      accountId: data.cashAccountId,
      accountCode: data.cashAccountCode,
      accountName: data.cashAccountName,
      description: data.description,
      debit: data.amount,
      credit: 0,
    },
    {
      accountId: data.receivableAccountId,
      accountCode: data.receivableAccountCode,
      accountName: data.receivableAccountName,
      description: data.description,
      debit: 0,
      credit: data.amount,
    },
  ];

  return createJournalEntry(companyId, {
    date: data.date,
    description: data.description,
    lines,
    reference: data.reference,
    referenceType: 'payment',
    referenceId: data.referenceId,
    createdBy: data.createdBy,
  });
}
