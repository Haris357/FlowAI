import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'info' | 'warning' | 'success' | 'action';
export type NotificationCategory = 'invoice' | 'bill' | 'subscription' | 'system' | 'support' | 'ai' | 'announcement';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  category: NotificationCategory;
  createdAt: Timestamp;
}
