import {
  collection, getDocs, query, orderBy, limit, where,
  startAfter, getCountFromServer, doc, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SupportTicket } from '@/types/support';
import type { Feedback } from '@/types/support';

// ==========================================
// USER QUERIES (CLIENT-SIDE — for admin pages)
// ==========================================

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  planId: string;
  subscriptionStatus: string;
  createdAt: any;
}

export async function getAdminUserCount(): Promise<number> {
  try {
    const ref = collection(db, 'users');
    const snap = await getCountFromServer(ref);
    return snap.data().count;
  } catch {
    return 0;
  }
}

export async function getAdminTicketCount(status?: string): Promise<number> {
  try {
    const ref = collection(db, 'supportTickets');
    const q = status ? query(ref, where('status', '==', status)) : ref;
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    return 0;
  }
}

export async function getAdminFeedbackCount(status?: string): Promise<number> {
  try {
    const ref = collection(db, 'feedback');
    const q = status ? query(ref, where('status', '==', status)) : ref;
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    return 0;
  }
}

export async function getAllTickets(maxItems = 100): Promise<SupportTicket[]> {
  try {
    const ref = collection(db, 'supportTickets');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportTicket);
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    return [];
  }
}

export async function getAllFeedback(maxItems = 100): Promise<Feedback[]> {
  try {
    const ref = collection(db, 'feedback');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Feedback);
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return [];
  }
}
