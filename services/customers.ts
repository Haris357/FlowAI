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
import { Customer } from '@/types';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get customers with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of customers sorted by name
 */
export async function getCustomers(companyId: string, maxResults: number = QUERY_LIMITS.CUSTOMERS): Promise<Customer[]> {
  const customersRef = collection(db, `companies/${companyId}/customers`);
  const q = query(customersRef, orderBy('name'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Customer[];
}

export async function getCustomerById(companyId: string, customerId: string): Promise<Customer | null> {
  const customerRef = doc(db, `companies/${companyId}/customers`, customerId);
  const snapshot = await getDoc(customerRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Customer;
}

export async function findCustomerByName(companyId: string, name: string): Promise<Customer | null> {
  const customersRef = collection(db, `companies/${companyId}/customers`);
  const q = query(customersRef, where('name', '==', name));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Customer;
}

export async function searchCustomers(companyId: string, searchTerm: string): Promise<Customer[]> {
  // Firestore doesn't support full-text search, so we fetch all and filter
  const customers = await getCustomers(companyId);
  const lowerSearch = searchTerm.toLowerCase();

  return customers.filter(
    c => c.name.toLowerCase().includes(lowerSearch) ||
      c.email?.toLowerCase().includes(lowerSearch)
  );
}

export async function createCustomer(
  companyId: string,
  data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalInvoiced' | 'totalPaid' | 'outstandingBalance'>
): Promise<string> {
  const customersRef = collection(db, `companies/${companyId}/customers`);
  const docRef = await addDoc(customersRef, {
    ...data,
    totalInvoiced: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateCustomer(
  companyId: string,
  customerId: string,
  data: Partial<Customer>
): Promise<void> {
  const customerRef = doc(db, `companies/${companyId}/customers`, customerId);
  await updateDoc(customerRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateCustomerBalance(
  companyId: string,
  customerId: string,
  invoiceAmount: number,
  paymentAmount: number
): Promise<void> {
  const customer = await getCustomerById(companyId, customerId);
  if (!customer) throw new Error('Customer not found');

  const newTotalInvoiced = customer.totalInvoiced + invoiceAmount;
  const newTotalPaid = customer.totalPaid + paymentAmount;
  const newOutstandingBalance = newTotalInvoiced - newTotalPaid;

  await updateCustomer(companyId, customerId, {
    totalInvoiced: newTotalInvoiced,
    totalPaid: newTotalPaid,
    outstandingBalance: newOutstandingBalance,
  });
}

export async function deleteCustomer(companyId: string, customerId: string): Promise<void> {
  const customerRef = doc(db, `companies/${companyId}/customers`, customerId);
  await deleteDoc(customerRef);
}

export async function getCustomersWithOutstandingBalance(companyId: string): Promise<Customer[]> {
  const customersRef = collection(db, `companies/${companyId}/customers`);
  const q = query(customersRef, where('outstandingBalance', '>', 0), orderBy('outstandingBalance', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Customer[];
}
