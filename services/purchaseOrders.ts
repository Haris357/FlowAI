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
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/types';

export async function getPurchaseOrders(companyId: string): Promise<PurchaseOrder[]> {
  const posRef = collection(db, `companies/${companyId}/purchaseOrders`);
  const q = query(posRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PurchaseOrder[];
}

export async function getPurchaseOrderById(companyId: string, poId: string): Promise<PurchaseOrder | null> {
  const poRef = doc(db, `companies/${companyId}/purchaseOrders`, poId);
  const snapshot = await getDoc(poRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as PurchaseOrder;
}

export async function getPurchaseOrdersByVendor(companyId: string, vendorId: string): Promise<PurchaseOrder[]> {
  const posRef = collection(db, `companies/${companyId}/purchaseOrders`);
  const q = query(posRef, where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PurchaseOrder[];
}

export async function getPurchaseOrdersByStatus(companyId: string, status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
  const posRef = collection(db, `companies/${companyId}/purchaseOrders`);
  const q = query(posRef, where('status', '==', status), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PurchaseOrder[];
}

export async function generatePONumber(companyId: string): Promise<string> {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);

  if (!companySnap.exists()) throw new Error('Company not found');

  const companyData = companySnap.data();
  const nextNumber = companyData.poNextNumber || 1;

  await updateDoc(companyRef, {
    poNextNumber: increment(1),
  });

  return `PO-${nextNumber.toString().padStart(4, '0')}`;
}

export async function createPurchaseOrder(
  companyId: string,
  data: {
    vendorId: string;
    vendorName: string;
    vendorEmail?: string;
    items: PurchaseOrderItem[];
    expectedDate?: Date;
    taxRate?: number;
    discount?: number;
    shippingAddress?: string;
    notes?: string;
    terms?: string;
    currency?: string;
    exchangeRate?: number;
  }
): Promise<string> {
  const poNumber = await generatePONumber(companyId);

  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((data.taxRate || 0) / 100);
  const total = subtotal + taxAmount - (data.discount || 0);
  const exchangeRate = data.exchangeRate ?? 1;
  const totalInBaseCurrency = total * exchangeRate;

  const posRef = collection(db, `companies/${companyId}/purchaseOrders`);
  const docRef = await addDoc(posRef, {
    poNumber,
    vendorId: data.vendorId,
    vendorName: data.vendorName,
    vendorEmail: data.vendorEmail || '',
    issueDate: Timestamp.now(),
    expectedDate: data.expectedDate ? Timestamp.fromDate(data.expectedDate) : null,
    items: data.items.map(item => ({ ...item, receivedQuantity: 0 })),
    subtotal,
    taxRate: data.taxRate || 0,
    taxAmount,
    discount: data.discount || 0,
    total,
    status: 'draft',
    shippingAddress: data.shippingAddress || '',
    notes: data.notes || '',
    terms: data.terms || '',
    currency: data.currency || null,
    exchangeRate,
    totalInBaseCurrency,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updatePurchaseOrder(
  companyId: string,
  poId: string,
  data: Partial<PurchaseOrder>
): Promise<void> {
  const poRef = doc(db, `companies/${companyId}/purchaseOrders`, poId);
  await updateDoc(poRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function markPOSent(companyId: string, poId: string): Promise<void> {
  await updatePurchaseOrder(companyId, poId, {
    status: 'sent',
    sentAt: Timestamp.now(),
  });
}

export async function markPOConfirmed(companyId: string, poId: string): Promise<void> {
  await updatePurchaseOrder(companyId, poId, {
    status: 'confirmed',
    confirmedAt: Timestamp.now(),
  });
}

export async function recordGoodsReceived(
  companyId: string,
  poId: string,
  receivedItems: { index: number; quantity: number }[]
): Promise<void> {
  const po = await getPurchaseOrderById(companyId, poId);
  if (!po) throw new Error('Purchase Order not found');

  const updatedItems = [...po.items];
  receivedItems.forEach(({ index, quantity }) => {
    if (updatedItems[index]) {
      updatedItems[index].receivedQuantity = (updatedItems[index].receivedQuantity || 0) + quantity;
    }
  });

  const allReceived = updatedItems.every(item => (item.receivedQuantity || 0) >= item.quantity);
  const partialReceived = updatedItems.some(item => (item.receivedQuantity || 0) > 0);

  let newStatus: PurchaseOrderStatus = po.status;
  if (allReceived) {
    newStatus = 'received';
  } else if (partialReceived) {
    newStatus = 'partial';
  }

  await updatePurchaseOrder(companyId, poId, {
    items: updatedItems,
    status: newStatus,
    receivedAt: allReceived ? Timestamp.now() : undefined,
  });
}

export async function convertPOToBill(
  companyId: string,
  poId: string,
  billId: string,
  billNumber: string
): Promise<void> {
  await updatePurchaseOrder(companyId, poId, {
    status: 'converted',
    convertedToBillId: billId,
    convertedToBillNumber: billNumber,
    convertedAt: Timestamp.now(),
  });
}

export async function cancelPurchaseOrder(companyId: string, poId: string): Promise<void> {
  await updatePurchaseOrder(companyId, poId, { status: 'cancelled' });
}

export async function deletePurchaseOrder(companyId: string, poId: string): Promise<void> {
  const poRef = doc(db, `companies/${companyId}/purchaseOrders`, poId);
  await deleteDoc(poRef);
}

export async function getPOStats(companyId: string): Promise<{
  totalPOs: number;
  totalDraft: number;
  totalSent: number;
  totalConfirmed: number;
  totalPartial: number;
  totalReceived: number;
  totalConverted: number;
  totalValue: number;
  pendingValue: number;
}> {
  const pos = await getPurchaseOrders(companyId);

  return {
    totalPOs: pos.length,
    totalDraft: pos.filter(p => p.status === 'draft').length,
    totalSent: pos.filter(p => p.status === 'sent').length,
    totalConfirmed: pos.filter(p => p.status === 'confirmed').length,
    totalPartial: pos.filter(p => p.status === 'partial').length,
    totalReceived: pos.filter(p => p.status === 'received').length,
    totalConverted: pos.filter(p => p.status === 'converted').length,
    totalValue: pos.reduce((sum, p) => sum + p.total, 0),
    pendingValue: pos.filter(p => ['sent', 'confirmed', 'partial'].includes(p.status)).reduce((sum, p) => sum + p.total, 0),
  };
}
