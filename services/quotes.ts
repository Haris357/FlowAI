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
import { Quote, QuoteItem, QuoteStatus } from '@/types';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get recent quotes with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of quotes sorted by creation date (newest first)
 */
export async function getQuotes(companyId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Quote[]> {
  const quotesRef = collection(db, `companies/${companyId}/quotes`);
  const q = query(quotesRef, orderBy('createdAt', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Quote[];
}

export async function getQuoteById(companyId: string, quoteId: string): Promise<Quote | null> {
  const quoteRef = doc(db, `companies/${companyId}/quotes`, quoteId);
  const snapshot = await getDoc(quoteRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Quote;
}

/**
 * Get quotes for a specific customer
 * @param companyId - Company ID
 * @param customerId - Customer ID
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of customer quotes
 */
export async function getQuotesByCustomer(companyId: string, customerId: string, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Quote[]> {
  const quotesRef = collection(db, `companies/${companyId}/quotes`);
  const q = query(quotesRef, where('customerId', '==', customerId), orderBy('createdAt', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Quote[];
}

/**
 * Get quotes by status
 * @param companyId - Company ID
 * @param status - Quote status
 * @param maxResults - Maximum number of results (default: 50)
 * @returns Array of quotes with specified status
 */
export async function getQuotesByStatus(companyId: string, status: QuoteStatus, maxResults: number = QUERY_LIMITS.INVOICES): Promise<Quote[]> {
  const quotesRef = collection(db, `companies/${companyId}/quotes`);
  const q = query(quotesRef, where('status', '==', status), orderBy('createdAt', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Quote[];
}

export async function generateQuoteNumber(companyId: string): Promise<string> {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) throw new Error('Company not found');

  const companyData = companySnap.data();
  const nextNumber = companyData.quoteNextNumber || 1;

  await updateDoc(companyRef, {
    quoteNextNumber: increment(1),
  });

  return `QT-${nextNumber.toString().padStart(4, '0')}`;
}

export async function createQuote(
  companyId: string,
  data: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    items: QuoteItem[];
    expiryDate: Date;
    taxRate?: number;
    discount?: number;
    notes?: string;
    terms?: string;
  }
): Promise<string> {
  const quoteNumber = await generateQuoteNumber(companyId);

  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((data.taxRate || 0) / 100);
  const total = subtotal + taxAmount - (data.discount || 0);

  const quotesRef = collection(db, `companies/${companyId}/quotes`);
  const docRef = await addDoc(quotesRef, {
    quoteNumber,
    customerId: data.customerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail || '',
    issueDate: Timestamp.now(),
    expiryDate: Timestamp.fromDate(data.expiryDate),
    items: data.items,
    subtotal,
    taxRate: data.taxRate || 0,
    taxAmount,
    discount: data.discount || 0,
    total,
    status: 'draft',
    notes: data.notes || '',
    terms: data.terms || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateQuote(
  companyId: string,
  quoteId: string,
  data: Partial<Quote>
): Promise<void> {
  const quoteRef = doc(db, `companies/${companyId}/quotes`, quoteId);
  await updateDoc(quoteRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function markQuoteSent(companyId: string, quoteId: string): Promise<void> {
  await updateQuote(companyId, quoteId, {
    status: 'sent',
    sentAt: Timestamp.now(),
  });
}

export async function markQuoteAccepted(companyId: string, quoteId: string): Promise<void> {
  await updateQuote(companyId, quoteId, {
    status: 'accepted',
    acceptedAt: Timestamp.now(),
  });
}

export async function markQuoteRejected(companyId: string, quoteId: string): Promise<void> {
  await updateQuote(companyId, quoteId, {
    status: 'rejected',
    rejectedAt: Timestamp.now(),
  });
}

export async function convertQuoteToInvoice(
  companyId: string,
  quoteId: string,
  invoiceId: string,
  invoiceNumber: string
): Promise<void> {
  await updateQuote(companyId, quoteId, {
    status: 'converted',
    convertedToInvoiceId: invoiceId,
    convertedToInvoiceNumber: invoiceNumber,
    convertedAt: Timestamp.now(),
  });
}

export async function deleteQuote(companyId: string, quoteId: string): Promise<void> {
  const quoteRef = doc(db, `companies/${companyId}/quotes`, quoteId);
  await deleteDoc(quoteRef);
}

export async function checkExpiredQuotes(companyId: string): Promise<void> {
  const quotesRef = collection(db, `companies/${companyId}/quotes`);
  const q = query(
    quotesRef,
    where('status', 'in', ['draft', 'sent'])
  );
  const snapshot = await getDocs(q);

  const now = new Date();
  const updates: Promise<void>[] = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const expiryDate = data.expiryDate?.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate);

    if (expiryDate < now) {
      updates.push(updateQuote(companyId, doc.id, { status: 'expired' }));
    }
  });

  await Promise.all(updates);
}

export async function getQuoteStats(companyId: string): Promise<{
  totalQuotes: number;
  totalDraft: number;
  totalSent: number;
  totalAccepted: number;
  totalRejected: number;
  totalExpired: number;
  totalConverted: number;
  totalValue: number;
  acceptedValue: number;
}> {
  const quotes = await getQuotes(companyId);

  return {
    totalQuotes: quotes.length,
    totalDraft: quotes.filter(q => q.status === 'draft').length,
    totalSent: quotes.filter(q => q.status === 'sent').length,
    totalAccepted: quotes.filter(q => q.status === 'accepted').length,
    totalRejected: quotes.filter(q => q.status === 'rejected').length,
    totalExpired: quotes.filter(q => q.status === 'expired').length,
    totalConverted: quotes.filter(q => q.status === 'converted').length,
    totalValue: quotes.reduce((sum, q) => sum + q.total, 0),
    acceptedValue: quotes.filter(q => q.status === 'accepted' || q.status === 'converted').reduce((sum, q) => sum + q.total, 0),
  };
}
