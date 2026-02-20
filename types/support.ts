import { Timestamp } from 'firebase/firestore';

export type TicketCategory = 'bug' | 'feature_request' | 'billing' | 'account' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  attachmentUrls: string[];
  adminNotes?: string;
  resolvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type FeedbackType = 'suggestion' | 'complaint' | 'praise' | 'bug_report';
export type FeedbackStatus = 'new' | 'reviewed' | 'acknowledged';

export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  type: FeedbackType;
  subject: string;
  description: string;
  rating?: number; // 1-5
  status: FeedbackStatus;
  adminResponse?: string;
  createdAt: Timestamp;
}
