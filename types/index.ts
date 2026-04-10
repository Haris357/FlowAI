import { Timestamp } from 'firebase/firestore';

// Subscription types
export type {
  PlanId, SubscriptionStatus, PlanDefinition, UserSubscription,
  ModelUsageBreakdown, UsageState, DailyUsage, TokenPackId,
  TokenPurchase, BillingEventType, BillingEvent, PlanLimitCheck,
} from './subscription';

// Notification types
export type {
  NotificationType, NotificationCategory, AppNotification,
} from './notification';

// Support types
export type {
  TicketCategory, TicketPriority, TicketStatus, SupportTicket,
  FeedbackType, FeedbackStatus, Feedback,
} from './support';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Company types
export interface Company {
  id: string;
  name: string;
  businessType: string;
  country: string;
  currency: string;
  description?: string;
  fiscalYearStart: number;
  logo?: string;
  contactName?: string;  // Owner / contact person name shown on invoices
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  invoiceDefaultTerms?: number;
  invoiceDefaultTaxRate?: number;
  invoiceNotes?: string;
  invoiceFooter?: string;
  invoiceTemplate?: 'classic' | 'modern' | 'minimal';
  invoiceColorTheme?: string;
  invoiceShowCompanyName?: boolean;
  invoiceShowCompanyAddress?: boolean;
  invoiceShowCompanyEmail?: boolean;
  invoiceShowCompanyPhone?: boolean;
  invoiceShowLogo?: boolean;
  invoiceShowTaxId?: boolean;
  invoiceShowFooter?: boolean;
  invoiceShowPoweredBy?: boolean;
  billPrefix?: string;
  billNextNumber?: number;
  billDefaultTerms?: number;
  enableTax?: boolean;
  showDecimalPlaces?: number;
  dateFormat?: string;
  ownerId: string;
  hasInventory: boolean;
  hasEmployees: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Account Preferences (per company default accounts for operations)
export interface AccountPreferences {
  // Transaction defaults
  defaultCashAccountId?: string;
  defaultCashAccountName?: string;
  defaultRevenueAccountId?: string;
  defaultRevenueAccountName?: string;
  defaultExpenseAccountId?: string;
  defaultExpenseAccountName?: string;
  // Invoice/Bill defaults
  defaultReceivableAccountId?: string;
  defaultReceivableAccountName?: string;
  defaultPayableAccountId?: string;
  defaultPayableAccountName?: string;
  // Payroll defaults
  defaultSalaryExpenseAccountId?: string;
  defaultSalaryExpenseAccountName?: string;
  defaultTaxPayableAccountId?: string;
  defaultTaxPayableAccountName?: string;
  defaultPFPayableAccountId?: string;
  defaultPFPayableAccountName?: string;
  defaultSalaryBankAccountId?: string;
  defaultSalaryBankAccountName?: string;
  // Bank account defaults
  defaultLinkedAssetAccountId?: string;
  defaultLinkedAssetAccountName?: string;
  defaultEquityAccountId?: string;
  defaultEquityAccountName?: string;
}

// ==========================================
// COLLABORATOR / TEAM TYPES
// ==========================================

export type CompanyRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface CompanyMember {
  id: string;           // doc ID in companies/{companyId}/members
  userId: string;       // Firebase Auth UID
  email: string;
  name: string;
  photoURL?: string;
  role: CompanyRole;
  joinedAt: Timestamp;
  invitedBy: string;    // UID of the user who invited this member
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface Invitation {
  id: string;           // doc ID in top-level invitations collection
  companyId: string;
  companyName: string;
  role: CompanyRole;
  invitedEmail: string; // email of the person being invited
  invitedByUid: string;
  invitedByName: string;
  invitedByEmail: string;
  status: InvitationStatus;
  respondedAt?: Timestamp;
  createdAt: Timestamp;
  expiresAt: Timestamp; // auto-expire after 7 days
}

/** @deprecated Use CompanyMember instead */
export interface CompanyUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'accountant' | 'viewer';
  addedAt: Timestamp;
}

// Account Type (Master - Global)
export interface AccountTypeMaster {
  id: string;
  name: string;
  code: string; // 'asset', 'liability', 'equity', 'revenue', 'expense'
  normalBalance: 'debit' | 'credit';
  order: number;
  description?: string;
}

// Account Subtype (Per Company)
export interface AccountSubtype {
  id: string;
  name: string;
  code: string;
  typeId: string; // References AccountTypeMaster
  typeName: string;
  typeCode: string;
  order: number;
  description?: string;
  isSystem: boolean;
  createdAt: Timestamp;
}

// Account (Per Company)
export interface Account {
  id: string;
  code: string;
  name: string;
  typeId: string; // References AccountTypeMaster
  typeName: string;
  typeCode: string;
  subtypeId: string; // References AccountSubtype
  subtypeName: string;
  subtypeCode: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  balance: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Legacy type alias for backward compatibility
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  currency?: string;           // Default currency for this customer (e.g. 'USD')
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Vendor types
export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  currency?: string;           // Default currency for this vendor (e.g. 'USD')
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Employee types
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  designation?: string;
  department?: string;
  salary: number;
  salaryType: 'monthly' | 'hourly';
  joiningDate: Timestamp;
  bankName?: string;
  bankAccount?: string;
  taxId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Invoice types
export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  pdfUrl?: string;
  sentAt?: Timestamp;
  paidAt?: Timestamp;
  // Multi-currency fields
  currency?: string;             // Document currency (e.g. 'USD')
  exchangeRate?: number;         // 1 docCurrency = exchangeRate baseCurrency units
  totalInBaseCurrency?: number;  // total * exchangeRate
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Bill types
export interface BillItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  category?: string;
}

export type BillStatus = 'unpaid' | 'paid' | 'partial' | 'overdue';

export interface Bill {
  id: string;
  billNumber?: string;
  vendorId?: string;
  vendorName: string;
  issueDate: Timestamp;
  dueDate?: Timestamp;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: BillStatus;
  category?: string;
  notes?: string;
  attachmentUrl?: string;
  // Multi-currency fields
  currency?: string;
  exchangeRate?: number;
  totalInBaseCurrency?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Journal Entry types
export interface JournalEntryLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
}

export type JournalEntryReferenceType = 'invoice' | 'bill' | 'payment' | 'expense' | 'salary' | 'bank_account' | 'bank_transaction' | 'manual';

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: Timestamp;
  description: string;
  reference?: string;
  referenceType?: JournalEntryReferenceType;
  referenceId?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdBy: string;
  createdAt: Timestamp;
}

// Payment types
export type PaymentType = 'received' | 'made';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';

export interface Payment {
  id: string;
  type: PaymentType;
  amount: number;
  date: Timestamp;
  paymentMethod: PaymentMethod;
  reference?: string;
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  vendorId?: string;
  vendorName?: string;
  billId?: string;
  billNumber?: string;
  notes?: string;
  createdAt: Timestamp;
}

// Transaction types
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: Timestamp;
  description: string;
  category?: string;
  accountId: string;
  accountName: string;
  paymentMethod?: string;
  reference?: string;
  invoiceId?: string;
  billId?: string;
  paymentId?: string;
  journalEntryId: string;
  createdAt: Timestamp;
}

// Salary types
export interface SalaryAllowances {
  hra: number;
  da: number;
  ta: number;
  other: number;
}

export interface SalaryDeductions {
  tax: number;
  providentFund: number;
  loan: number;
  other: number;
}

export type SalarySlipStatus = 'generated' | 'paid' | 'cancelled';

export interface SalarySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDesignation?: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: SalaryAllowances;
  totalEarnings: number;
  deductions: SalaryDeductions;
  totalDeductions: number;
  netSalary: number;
  status: SalarySlipStatus;
  paidDate?: Timestamp;
  paymentMethod?: string;
  pdfUrl?: string;
  createdAt: Timestamp;
}

// Chat types
export type ChatRole = 'user' | 'assistant';

export interface ChatMessageRichData {
  type: 'entity' | 'list' | 'report' | 'summary';
  entityType?: string;
  entity?: Record<string, any>;
  entities?: Array<{ entityType: string; entity: Record<string, any>; actions?: any[] }>;
  items?: Record<string, any>[];
  columns?: { key: string; label: string; type?: 'text' | 'currency' | 'date' | 'status' }[];
  pagination?: { page: number; pageSize: number; total: number };
  summary?: Record<string, any>;
}

export interface ChatMessageAction {
  type: 'view' | 'edit' | 'delete' | 'download' | 'navigate' | 'send' | 'pay' | 'cancel' | 'approve' | 'confirm';
  label: string;
  entityType?: 'customer' | 'vendor' | 'employee' | 'invoice' | 'bill' | 'transaction' | 'account' | 'report';
  entityId?: string;
  data?: Record<string, any>;
  toolCall?: string;
  prompt?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'spreadsheet' | 'document' | 'image' | 'pdf';
  mimeType: string;
  size: number;
  url: string;
  storagePath: string;
  /** Extracted text/data from document analysis */
  extractedData?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls?: ToolCall[];
  richData?: ChatMessageRichData;
  richDataList?: ChatMessageRichData[];
  actions?: ChatMessageAction[];
  followUp?: string;
  hidden?: boolean;
  completedActions?: string[];
  selectedSuggestion?: string;
  attachments?: ChatAttachment[];
  /** Entity chips attached via @ mention — shown in user bubble */
  mentionedEntities?: { type: string; label: string; id: string }[];
  createdAt: Timestamp;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

// Chat session (conversation) type
export interface Chat {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;
  messageCount: number;
  isStarred?: boolean;
  isArchived?: boolean;
}

// Chat settings type
export interface ChatSettings {
  showTimestamps: boolean;
  voiceInputEnabled: boolean;
  defaultGreeting: boolean;
}

// Report types
export interface ReportAccountItem {
  name: string;
  amount: number;
}

export interface ProfitLossReport {
  startDate: Date;
  endDate: Date;
  revenue: {
    accounts: ReportAccountItem[];
    total: number;
  };
  expenses: {
    accounts: ReportAccountItem[];
    total: number;
  };
  netProfit: number;
}

export interface BalanceSheetReport {
  asOfDate: Date;
  assets: {
    current: ReportAccountItem[];
    fixed: ReportAccountItem[];
    other?: ReportAccountItem[];
    totalCurrent: number;
    totalFixed: number;
    totalOther?: number;
    total: number;
  };
  liabilities: {
    current: ReportAccountItem[];
    longTerm: ReportAccountItem[];
    other?: ReportAccountItem[];
    totalCurrent: number;
    totalLongTerm: number;
    totalOther?: number;
    total: number;
  };
  equity: {
    items: ReportAccountItem[];
    total: number;
  };
}

export interface TrialBalanceAccount {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  asOfDate: Date;
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

// Dashboard types
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  outstandingReceivables: number;
  outstandingPayables: number;
}

// Form data types for onboarding
export interface OnboardingData {
  companyName: string;
  businessType: string;
  country: string;
  currency: string;
  fiscalYearStart: number;
  hasInvoices: boolean;
  hasEmployees: boolean;
  tracksInventory: boolean;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatApiResponse {
  message: string;
  toolCalls?: ToolCall[];
}

// ==========================================
// QUOTE / ESTIMATE TYPES
// ==========================================

export interface QuoteItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  issueDate: Timestamp;
  expiryDate: Timestamp;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: QuoteStatus;
  notes?: string;
  terms?: string;
  convertedToInvoiceId?: string;
  convertedToInvoiceNumber?: string;
  convertedAt?: Timestamp;
  sentAt?: Timestamp;
  acceptedAt?: Timestamp;
  rejectedAt?: Timestamp;
  // Multi-currency fields
  currency?: string;
  exchangeRate?: number;
  totalInBaseCurrency?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// PURCHASE ORDER TYPES
// ==========================================

export interface PurchaseOrderItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  receivedQuantity?: number;
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled' | 'converted';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  issueDate: Timestamp;
  expectedDate?: Timestamp;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: PurchaseOrderStatus;
  shippingAddress?: string;
  notes?: string;
  terms?: string;
  convertedToBillId?: string;
  convertedToBillNumber?: string;
  convertedAt?: Timestamp;
  sentAt?: Timestamp;
  confirmedAt?: Timestamp;
  receivedAt?: Timestamp;
  // Multi-currency fields
  currency?: string;
  exchangeRate?: number;
  totalInBaseCurrency?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// CREDIT NOTE / DEBIT NOTE TYPES
// ==========================================

export interface CreditNoteItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type CreditNoteStatus = 'draft' | 'issued' | 'applied' | 'partial' | 'refunded' | 'void';

// Customer Credit Note (we owe customer)
export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  date: Timestamp;
  items: CreditNoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  appliedAmount: number;
  remainingCredit: number;
  status: CreditNoteStatus;
  reason: 'return' | 'discount' | 'error' | 'other';
  reasonDescription?: string;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  notes?: string;
  refundedAt?: Timestamp;
  refundMethod?: PaymentMethod;
  journalEntryId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Vendor Debit Note (vendor owes us)
export type DebitNoteStatus = 'draft' | 'issued' | 'applied' | 'partial' | 'settled' | 'void';

export interface DebitNote {
  id: string;
  debitNoteNumber: string;
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  date: Timestamp;
  items: CreditNoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  appliedAmount: number;
  remainingBalance: number;
  status: DebitNoteStatus;
  reason: 'return' | 'discount' | 'error' | 'other';
  reasonDescription?: string;
  originalBillId?: string;
  originalBillNumber?: string;
  notes?: string;
  settledAt?: Timestamp;
  journalEntryId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Credit Note Application (tracking which invoices credits were applied to)
export interface CreditNoteApplication {
  id: string;
  creditNoteId: string;
  creditNoteNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  appliedAt: Timestamp;
  createdAt: Timestamp;
}

// ==========================================
// BANK ACCOUNT TYPES
// ==========================================

export type BankAccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'other';

export interface BankAccount {
  id: string;
  name: string;
  accountType: BankAccountType;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  linkedAccountId: string; // Links to Chart of Accounts
  linkedAccountCode: string;
  linkedAccountName: string;
  isActive: boolean;
  isDefault: boolean;
  lastReconciledDate?: Timestamp;
  lastReconciledBalance?: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// BANK TRANSACTION TYPES
// ==========================================

export type BankTransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' | 'check' | 'other';
export type BankTransactionStatus = 'pending' | 'cleared' | 'reconciled' | 'void';
export type ReconciliationStatus = 'unreconciled' | 'matched' | 'reconciled';

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  linkedAccountId: string; // Link to Chart of Accounts (bank asset account)
  linkedAccountCode: string;
  linkedAccountName: string;
  type: BankTransactionType;
  date: Timestamp;
  amount: number; // Positive for deposits, negative for withdrawals
  description: string;
  payee?: string;
  checkNumber?: string;
  reference?: string;
  category?: string;
  categoryAccountId?: string; // Link to expense/income account for categorization
  categoryAccountCode?: string;
  categoryAccountName?: string;
  status: BankTransactionStatus;
  reconciliationStatus: ReconciliationStatus;
  reconciledAt?: Timestamp;
  // Links to other records
  invoiceId?: string;
  billId?: string;
  paymentId?: string;
  transferToAccountId?: string;
  journalEntryId?: string;
  // Import details
  importedFrom?: 'manual' | 'csv' | 'ofx' | 'qfx';
  importBatchId?: string;
  fitId?: string; // Financial Institution Transaction ID (for duplicate detection)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Bank Reconciliation Session
export interface BankReconciliation {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  statementDate: Timestamp;
  statementEndingBalance: number;
  openingBalance: number;
  clearedDeposits: number;
  clearedWithdrawals: number;
  reconciledBalance: number;
  difference: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  transactionIds: string[]; // IDs of reconciled transactions
  completedAt?: Timestamp;
  completedBy?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// RECURRING TRANSACTION TYPES
// ==========================================

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringType = 'invoice' | 'bill' | 'journal_entry' | 'transaction';
export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface RecurringTransaction {
  id: string;
  name: string;
  type: RecurringType;
  frequency: RecurringFrequency;
  startDate: Timestamp;
  endDate?: Timestamp;
  nextRunDate: Timestamp;
  lastRunDate?: Timestamp;
  totalRuns: number;
  maxRuns?: number; // Optional limit on number of occurrences
  status: RecurringStatus;

  // For invoices
  customerId?: string;
  customerName?: string;
  invoiceItems?: InvoiceItem[];
  invoiceTaxRate?: number;
  invoiceDiscount?: number;
  invoiceDueDays?: number; // Days after issue date
  invoiceNotes?: string;
  invoiceTerms?: string;

  // For bills
  vendorId?: string;
  vendorName?: string;
  billItems?: BillItem[];
  billCategory?: string;
  billDueDays?: number;
  billNotes?: string;

  // For journal entries
  journalDescription?: string;
  journalLines?: JournalEntryLine[];

  // For simple transactions
  transactionType?: TransactionType;
  transactionAmount?: number;
  transactionDescription?: string;
  transactionAccountId?: string;
  transactionAccountName?: string;
  transactionCategory?: string;

  // Auto-send settings
  autoSend: boolean;
  sendReminderDays?: number; // Days before to send reminder
  reminderEmails?: string[];

  // Tracking
  generatedRecordIds: string[]; // IDs of records created from this recurring transaction
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Recurring Transaction Log
export interface RecurringTransactionLog {
  id: string;
  recurringTransactionId: string;
  recurringTransactionName: string;
  runDate: Timestamp;
  status: 'success' | 'failed' | 'skipped';
  generatedRecordType?: string;
  generatedRecordId?: string;
  generatedRecordNumber?: string;
  errorMessage?: string;
  createdAt: Timestamp;
}

// ==========================================
// CASH FLOW REPORT TYPES
// ==========================================

export interface CashFlowItem {
  description: string;
  amount: number;
}

export interface CashFlowReport {
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  operating: {
    inflows: CashFlowItem[];
    outflows: CashFlowItem[];
    totalInflows: number;
    totalOutflows: number;
    netOperating: number;
  };
  investing: {
    inflows: CashFlowItem[];
    outflows: CashFlowItem[];
    totalInflows: number;
    totalOutflows: number;
    netInvesting: number;
  };
  financing: {
    inflows: CashFlowItem[];
    outflows: CashFlowItem[];
    totalInflows: number;
    totalOutflows: number;
    netFinancing: number;
  };
  netCashChange: number;
  closingBalance: number;
}

// ==========================================
// GENERAL LEDGER REPORT TYPES
// ==========================================

export interface GeneralLedgerEntry {
  date: Date;
  entryNumber: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  entries: GeneralLedgerEntry[];
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
}

export interface GeneralLedgerReport {
  startDate: Date;
  endDate: Date;
  accounts: GeneralLedgerAccount[];
}

// ==========================================
// AGED REPORT TYPES
// ==========================================

export interface AgedInvoice {
  invoiceId: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  total: number;
  amountDue: number;
  daysOverdue: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
}

export interface AgedCustomer {
  customerId: string;
  customerName: string;
  invoices: AgedInvoice[];
  totalCurrent: number;
  total1to30: number;
  total31to60: number;
  total61to90: number;
  totalOver90: number;
  totalOutstanding: number;
}

export interface AgedReceivablesReport {
  asOfDate: Date;
  customers: AgedCustomer[];
  summaryCurrent: number;
  summary1to30: number;
  summary31to60: number;
  summary61to90: number;
  summaryOver90: number;
  totalOutstanding: number;
}

export interface AgedBill {
  billId: string;
  billNumber?: string;
  date: Date;
  dueDate: Date;
  total: number;
  amountDue: number;
  daysOverdue: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
}

export interface AgedVendor {
  vendorId: string;
  vendorName: string;
  bills: AgedBill[];
  totalCurrent: number;
  total1to30: number;
  total31to60: number;
  total61to90: number;
  totalOver90: number;
  totalOutstanding: number;
}

export interface AgedPayablesReport {
  asOfDate: Date;
  vendors: AgedVendor[];
  summaryCurrent: number;
  summary1to30: number;
  summary31to60: number;
  summary61to90: number;
  summaryOver90: number;
  totalOutstanding: number;
}
