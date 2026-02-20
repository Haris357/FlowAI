import {
  collection, doc, getDocs, setDoc, query, orderBy, limit, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SupportTicket, Feedback, TicketCategory, TicketPriority, FeedbackType } from '@/types/support';

// ==========================================
// SUPPORT TICKETS
// ==========================================

export async function createSupportTicket(data: {
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  attachmentUrls?: string[];
}): Promise<string> {
  const ref = doc(collection(db, 'supportTickets'));
  await setDoc(ref, {
    ...data,
    attachmentUrls: data.attachmentUrls || [],
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserTickets(userId: string, maxItems = 20): Promise<SupportTicket[]> {
  try {
    const ref = collection(db, 'supportTickets');
    const q = query(ref, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportTicket);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
}

// ==========================================
// FEEDBACK
// ==========================================

export async function createFeedback(data: {
  userId: string;
  userEmail: string;
  type: FeedbackType;
  subject: string;
  description: string;
  rating?: number;
}): Promise<string> {
  const ref = doc(collection(db, 'feedback'));
  await setDoc(ref, {
    ...data,
    status: 'new',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserFeedback(userId: string, maxItems = 20): Promise<Feedback[]> {
  try {
    const ref = collection(db, 'feedback');
    const q = query(ref, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Feedback);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return [];
  }
}
