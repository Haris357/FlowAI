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
import {
  RecurringTransaction,
  RecurringFrequency,
  RecurringType,
  RecurringStatus,
  RecurringTransactionLog,
  InvoiceItem,
  BillItem,
  JournalEntryLine,
  TransactionType,
} from '@/types';

// ==========================================
// RECURRING TRANSACTIONS
// ==========================================

export async function getRecurringTransactions(companyId: string): Promise<RecurringTransaction[]> {
  const rtsRef = collection(db, `companies/${companyId}/recurringTransactions`);
  const q = query(rtsRef, orderBy('nextRunDate'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as RecurringTransaction[];
}

export async function getActiveRecurringTransactions(companyId: string): Promise<RecurringTransaction[]> {
  const rtsRef = collection(db, `companies/${companyId}/recurringTransactions`);
  const q = query(rtsRef, where('status', '==', 'active'), orderBy('nextRunDate'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as RecurringTransaction[];
}

export async function getRecurringTransactionById(companyId: string, rtId: string): Promise<RecurringTransaction | null> {
  const rtRef = doc(db, `companies/${companyId}/recurringTransactions`, rtId);
  const snapshot = await getDoc(rtRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as RecurringTransaction;
}

export async function getRecurringTransactionsByType(companyId: string, type: RecurringType): Promise<RecurringTransaction[]> {
  const rtsRef = collection(db, `companies/${companyId}/recurringTransactions`);
  const q = query(rtsRef, where('type', '==', type), orderBy('nextRunDate'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as RecurringTransaction[];
}

export async function getDueRecurringTransactions(companyId: string): Promise<RecurringTransaction[]> {
  const now = Timestamp.now();
  const rtsRef = collection(db, `companies/${companyId}/recurringTransactions`);
  const q = query(
    rtsRef,
    where('status', '==', 'active'),
    where('nextRunDate', '<=', now)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as RecurringTransaction[];
}

function calculateNextRunDate(currentDate: Date, frequency: RecurringFrequency): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

// Create recurring invoice template
export async function createRecurringInvoice(
  companyId: string,
  data: {
    name: string;
    customerId: string;
    customerName: string;
    items: InvoiceItem[];
    taxRate?: number;
    discount?: number;
    dueDays?: number;
    notes?: string;
    terms?: string;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
    maxRuns?: number;
    autoSend?: boolean;
    sendReminderDays?: number;
    reminderEmails?: string[];
  }
): Promise<string> {
  const rtsRef = collection(db, `companies/${companyId}/recurringTransactions`);
  const docRef = await addDoc(rtsRef, {
    name: data.name,
    type: 'invoice',
    frequency: data.frequency,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    nextRunDate: Timestamp.fromDate(data.startDate),
    lastRunDate: null,
    totalRuns: 0,
    maxRuns: data.maxRuns || null,
    status: 'active',
    customerId: data.customerId,
    customerName: data.customerName,
    invoiceItems: data.items,
    invoiceTaxRate: data.taxRate || 0,
    invoiceDiscount: data.discount || 0,
    invoiceDueDays: data.dueDays || 30,
    invoiceNotes: data.notes || '',
    invoiceTerms: data.terms || '',
    autoSend: data.autoSend || false,
    sendReminderDays: data.sendReminderDays || null,
    reminderEmails: data.reminderEmails || [],
    generatedRecordIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// Create recurring bill template
export async function createRecurringBill(
  companyId: string,
  data: {
    name: string;
    vendorId: string;
    vendorName: string;
    items: BillItem[];
    category?: string;
    dueDays?: number;
    notes?: string;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
    maxRuns?: number;
  }
): Promise<string> {
  const rtsRef = collection(db, `companies/${companyId}/recurringTransactions`);
  const docRef = await addDoc(rtsRef, {
    name: data.name,
    type: 'bill',
    frequency: data.frequency,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    nextRunDate: Timestamp.fromDate(data.startDate),
    lastRunDate: null,
    totalRuns: 0,
    maxRuns: data.maxRuns || null,
    status: 'active',
    vendorId: data.vendorId,
    vendorName: data.vendorName,
    billItems: data.items,
    billCategory: data.category || '',
    billDueDays: data.dueDays || 30,
    billNotes: data.notes || '',
    autoSend: false,
    generatedRecordIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// Create recurring journal entry template
export async function createRecurringJournalEntry(
  companyId: string,
  data: {
    name: string;
    description: string;
    lines: JournalEntryLine[];
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
    maxRuns?: number;
  }
): Promise<string> {
  const rtsRef = collection(db, `companies/${companyId}/recurringTransactions`);
  const docRef = await addDoc(rtsRef, {
    name: data.name,
    type: 'journal_entry',
    frequency: data.frequency,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    nextRunDate: Timestamp.fromDate(data.startDate),
    lastRunDate: null,
    totalRuns: 0,
    maxRuns: data.maxRuns || null,
    status: 'active',
    journalDescription: data.description,
    journalLines: data.lines,
    autoSend: false,
    generatedRecordIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// Create recurring transaction template
export async function createRecurringSimpleTransaction(
  companyId: string,
  data: {
    name: string;
    transactionType: TransactionType;
    amount: number;
    description: string;
    accountId: string;
    accountName: string;
    category?: string;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
    maxRuns?: number;
  }
): Promise<string> {
  const rtsRef = collection(db, `companies/${companyId}/recurringTransactions`);
  const docRef = await addDoc(rtsRef, {
    name: data.name,
    type: 'transaction',
    frequency: data.frequency,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    nextRunDate: Timestamp.fromDate(data.startDate),
    lastRunDate: null,
    totalRuns: 0,
    maxRuns: data.maxRuns || null,
    status: 'active',
    transactionType: data.transactionType,
    transactionAmount: data.amount,
    transactionDescription: data.description,
    transactionAccountId: data.accountId,
    transactionAccountName: data.accountName,
    transactionCategory: data.category || '',
    autoSend: false,
    generatedRecordIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateRecurringTransaction(
  companyId: string,
  rtId: string,
  data: Partial<RecurringTransaction>
): Promise<void> {
  const rtRef = doc(db, `companies/${companyId}/recurringTransactions`, rtId);
  await updateDoc(rtRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function pauseRecurringTransaction(companyId: string, rtId: string): Promise<void> {
  await updateRecurringTransaction(companyId, rtId, { status: 'paused' });
}

export async function resumeRecurringTransaction(companyId: string, rtId: string): Promise<void> {
  await updateRecurringTransaction(companyId, rtId, { status: 'active' });
}

export async function cancelRecurringTransaction(companyId: string, rtId: string): Promise<void> {
  await updateRecurringTransaction(companyId, rtId, { status: 'cancelled' });
}

export async function deleteRecurringTransaction(companyId: string, rtId: string): Promise<void> {
  const rtRef = doc(db, `companies/${companyId}/recurringTransactions`, rtId);
  await deleteDoc(rtRef);
}

// Record that a recurring transaction was executed
export async function recordRecurringTransactionRun(
  companyId: string,
  rtId: string,
  generatedRecordId: string,
  generatedRecordNumber: string,
  generatedRecordType: string
): Promise<void> {
  const rt = await getRecurringTransactionById(companyId, rtId);
  if (!rt) throw new Error('Recurring transaction not found');

  const now = new Date();
  const nextRunDate = calculateNextRunDate(now, rt.frequency);

  // Check if we've reached the max runs or end date
  const newTotalRuns = rt.totalRuns + 1;
  let newStatus: RecurringStatus = rt.status;

  if (rt.maxRuns && newTotalRuns >= rt.maxRuns) {
    newStatus = 'completed';
  } else if (rt.endDate) {
    const endDate = rt.endDate.toDate ? rt.endDate.toDate() : new Date(rt.endDate as unknown as string);
    if (nextRunDate > endDate) {
      newStatus = 'completed';
    }
  }

  // Update the recurring transaction
  await updateRecurringTransaction(companyId, rtId, {
    lastRunDate: Timestamp.now(),
    nextRunDate: Timestamp.fromDate(nextRunDate),
    totalRuns: newTotalRuns,
    status: newStatus,
    generatedRecordIds: [...rt.generatedRecordIds, generatedRecordId],
  });

  // Create a log entry
  const logsRef = collection(db, `companies/${companyId}/recurringTransactionLogs`);
  await addDoc(logsRef, {
    recurringTransactionId: rtId,
    recurringTransactionName: rt.name,
    runDate: Timestamp.now(),
    status: 'success',
    generatedRecordType,
    generatedRecordId,
    generatedRecordNumber,
    createdAt: serverTimestamp(),
  });
}

export async function recordRecurringTransactionFailure(
  companyId: string,
  rtId: string,
  errorMessage: string
): Promise<void> {
  const rt = await getRecurringTransactionById(companyId, rtId);
  if (!rt) throw new Error('Recurring transaction not found');

  // Create a log entry
  const logsRef = collection(db, `companies/${companyId}/recurringTransactionLogs`);
  await addDoc(logsRef, {
    recurringTransactionId: rtId,
    recurringTransactionName: rt.name,
    runDate: Timestamp.now(),
    status: 'failed',
    errorMessage,
    createdAt: serverTimestamp(),
  });
}

// ==========================================
// LOGS
// ==========================================

export async function getRecurringTransactionLogs(
  companyId: string,
  rtId?: string
): Promise<RecurringTransactionLog[]> {
  const logsRef = collection(db, `companies/${companyId}/recurringTransactionLogs`);
  let q;

  if (rtId) {
    q = query(logsRef, where('recurringTransactionId', '==', rtId), orderBy('runDate', 'desc'));
  } else {
    q = query(logsRef, orderBy('runDate', 'desc'));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as RecurringTransactionLog[];
}

// ==========================================
// STATS
// ==========================================

export async function getRecurringTransactionStats(companyId: string): Promise<{
  totalRecurring: number;
  activeRecurring: number;
  pausedRecurring: number;
  dueToday: number;
  recurringInvoices: number;
  recurringBills: number;
  recurringJournalEntries: number;
  recurringTransactions: number;
}> {
  const [all, due] = await Promise.all([
    getRecurringTransactions(companyId),
    getDueRecurringTransactions(companyId),
  ]);

  return {
    totalRecurring: all.length,
    activeRecurring: all.filter(r => r.status === 'active').length,
    pausedRecurring: all.filter(r => r.status === 'paused').length,
    dueToday: due.length,
    recurringInvoices: all.filter(r => r.type === 'invoice').length,
    recurringBills: all.filter(r => r.type === 'bill').length,
    recurringJournalEntries: all.filter(r => r.type === 'journal_entry').length,
    recurringTransactions: all.filter(r => r.type === 'transaction').length,
  };
}
