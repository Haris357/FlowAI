import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, query,
  orderBy, limit, where, serverTimestamp, writeBatch, deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppNotification, NotificationType, NotificationCategory } from '@/types/notification';

export async function getNotifications(userId: string, maxItems = 50): Promise<AppNotification[]> {
  try {
    const ref = collection(db, 'users', userId, 'notifications');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppNotification);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const ref = collection(db, 'users', userId, 'notifications');
    const q = query(ref, where('read', '==', false));
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const ref = collection(db, 'users', userId, 'notifications');
    const q = query(ref, where('read', '==', false));
    const snap = await getDocs(q);

    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
}

export async function createNotification(
  userId: string,
  data: {
    type: NotificationType;
    title: string;
    message: string;
    category: NotificationCategory;
    actionUrl?: string;
  }
): Promise<void> {
  try {
    const ref = doc(collection(db, 'users', userId, 'notifications'));
    await setDoc(ref, {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'notifications', notificationId));
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}
