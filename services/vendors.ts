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
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vendor, Bill } from '@/types';
import { QUERY_LIMITS } from '@/lib/firestore-helpers';

/**
 * Get vendors with optional limit
 * @param companyId - Company ID
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of vendors sorted by name
 */
export async function getVendors(companyId: string, maxResults: number = QUERY_LIMITS.CUSTOMERS): Promise<Vendor[]> {
  const vendorsRef = collection(db, `companies/${companyId}/vendors`);
  const q = query(vendorsRef, orderBy('name'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Vendor[];
}

export async function getVendorById(companyId: string, vendorId: string): Promise<Vendor | null> {
  const vendorRef = doc(db, `companies/${companyId}/vendors`, vendorId);
  const snapshot = await getDoc(vendorRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Vendor;
}

export async function findVendorByName(companyId: string, name: string): Promise<Vendor | null> {
  const vendorsRef = collection(db, `companies/${companyId}/vendors`);
  const q = query(vendorsRef, where('name', '==', name));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Vendor;
}

export async function searchVendors(companyId: string, searchTerm: string): Promise<Vendor[]> {
  const vendors = await getVendors(companyId);
  const lowerSearch = searchTerm.toLowerCase();

  return vendors.filter(
    v => v.name.toLowerCase().includes(lowerSearch) ||
      v.email?.toLowerCase().includes(lowerSearch)
  );
}

export async function createVendor(
  companyId: string,
  data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'totalBilled' | 'totalPaid' | 'outstandingBalance'>
): Promise<string> {
  const vendorsRef = collection(db, `companies/${companyId}/vendors`);
  const docRef = await addDoc(vendorsRef, {
    ...data,
    totalBilled: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateVendor(
  companyId: string,
  vendorId: string,
  data: Partial<Vendor>
): Promise<void> {
  const vendorRef = doc(db, `companies/${companyId}/vendors`, vendorId);
  await updateDoc(vendorRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateVendorBalance(
  companyId: string,
  vendorId: string,
  billAmount: number,
  paymentAmount: number
): Promise<void> {
  const vendor = await getVendorById(companyId, vendorId);
  if (!vendor) throw new Error('Vendor not found');

  const newTotalBilled = vendor.totalBilled + billAmount;
  const newTotalPaid = vendor.totalPaid + paymentAmount;
  const newOutstandingBalance = newTotalBilled - newTotalPaid;

  await updateVendor(companyId, vendorId, {
    totalBilled: newTotalBilled,
    totalPaid: newTotalPaid,
    outstandingBalance: newOutstandingBalance,
  });
}

export async function deleteVendor(companyId: string, vendorId: string): Promise<void> {
  const vendorRef = doc(db, `companies/${companyId}/vendors`, vendorId);
  await deleteDoc(vendorRef);
}

export async function getVendorsWithOutstandingBalance(companyId: string): Promise<Vendor[]> {
  const vendorsRef = collection(db, `companies/${companyId}/vendors`);
  const q = query(vendorsRef, where('outstandingBalance', '>', 0), orderBy('outstandingBalance', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Vendor[];
}

export async function getBills(companyId: string): Promise<Bill[]> {
  const billsRef = collection(db, `companies/${companyId}/bills`);
  const q = query(billsRef, orderBy('issueDate', 'desc'));
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
  const prefix = companyData.billPrefix || 'BILL';
  const nextNumber = companyData.billNextNumber || 1;

  // Increment the counter
  await updateDoc(companyRef, {
    billNextNumber: increment(1),
  });

  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
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

export async function createBill(
  companyId: string,
  data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt' | 'billNumber'> & { billNumber?: string }
): Promise<string> {
  // Generate bill number if not provided
  const billNumber = data.billNumber || await generateBillNumber(companyId);

  const billsRef = collection(db, `companies/${companyId}/bills`);
  const docRef = await addDoc(billsRef, {
    ...data,
    billNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update vendor balance if vendor is specified
  if (data.vendorId) {
    await updateVendorBalance(companyId, data.vendorId, data.total, 0);
  }

  return docRef.id;
}

export async function recordBillPayment(
  companyId: string,
  billId: string,
  amount: number,
  paymentMethod: string
): Promise<void> {
  const bill = await getBillById(companyId, billId);
  if (!bill) throw new Error('Bill not found');

  const newAmountPaid = bill.amountPaid + amount;
  const newAmountDue = bill.total - newAmountPaid;

  let newStatus: Bill['status'] = 'partial';
  if (newAmountDue <= 0) {
    newStatus = 'paid';
  }

  const billRef = doc(db, `companies/${companyId}/bills`, billId);
  await updateDoc(billRef, {
    amountPaid: newAmountPaid,
    amountDue: Math.max(0, newAmountDue),
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  // Update vendor balance if vendor is specified
  if (bill.vendorId) {
    await updateVendorBalance(companyId, bill.vendorId, 0, amount);
  }
}

export async function updateBill(
  companyId: string,
  billId: string,
  data: Partial<Bill>
): Promise<void> {
  const billRef = doc(db, `companies/${companyId}/bills`, billId);
  await updateDoc(billRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBill(companyId: string, billId: string): Promise<void> {
  const bill = await getBillById(companyId, billId);
  if (!bill) throw new Error('Bill not found');

  // Update vendor balance if vendor is specified (reverse the bill amount)
  if (bill.vendorId) {
    await updateVendorBalance(companyId, bill.vendorId, -bill.total, -bill.amountPaid);
  }

  const billRef = doc(db, `companies/${companyId}/bills`, billId);
  await deleteDoc(billRef);
}
