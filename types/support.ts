import { Timestamp } from 'firebase/firestore';

export type TicketCategory = 'bug' | 'feature_request' | 'billing' | 'account' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed' | 'rejected';

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
  /** When status = 'rejected', admin-supplied reason shown to the user. */
  rejectionReason?: string;
  /** Id of the admin user currently handling the ticket (super_admin, admin, etc). */
  assignedTo?: string | null;
  /** Last activity timestamps — used for "needs-response" badges. */
  lastUserMessageAt?: Timestamp | null;
  lastAdminMessageAt?: Timestamp | null;
  /** Whether the ticket was born from the AI chatbot (pre-seeded with transcript). */
  fromAiChat?: boolean;
  resolvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TicketMessageAuthor = 'user' | 'admin' | 'system' | 'ai';

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorType: TicketMessageAuthor;
  /** Firebase UID of the user, or adminUsers doc id of the admin. */
  authorId: string;
  /** Display name shown in the thread. */
  authorName: string;
  body: string;
  createdAt: Timestamp;
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
