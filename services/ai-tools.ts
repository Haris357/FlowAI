// AI Tool Execution Service
// Handles all tool calls from Flow AI with proper validation and rich responses

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { RichResponse, ActionButton } from '@/lib/ai-config';
import { formatStatus, getAllowedTransitions, getStatusOption } from '@/lib/status-management';
import { createTransaction as createTransactionService, getTransactions, updateTransaction as updateTransactionService, deleteTransaction as deleteTransactionService } from './transactions';
import { getAccounts, updateAccount as updateAccountService, deleteAccount as deleteAccountService } from './accounts';
import { createBill as createBillService } from './vendors';
import { createInvoice as createInvoiceService, updateInvoice as updateInvoiceService, deleteInvoice as deleteInvoiceService, updateInvoiceStatus } from './invoices';
import { getCustomers, createCustomer } from './customers';
import { updateBill as updateBillService, deleteBill as deleteBillService, updateBillStatus } from './bills';
import { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote } from './quotes';
import { getPurchaseOrders, getPurchaseOrderById, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from './purchaseOrders';
import { getCreditNotes, getCreditNoteById, createCreditNote, updateCreditNote, deleteCreditNote } from './creditNotes';
import { getRecurringTransactions, createRecurringInvoice, createRecurringBill, createRecurringSimpleTransaction, updateRecurringTransaction, deleteRecurringTransaction } from './recurringTransactions';
import { getJournalEntries, getJournalEntryById, updateJournalEntry, deleteJournalEntry, createJournalEntry as createJournalEntryService } from './journalEntries';
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from './bankAccounts';
import { getSalarySlips, generateSalarySlip, updateSalarySlipStatus } from './salarySlips';
import { getActiveEmployees } from './employees';
import { getVendors } from './vendors';
import { getAccountPreferences } from './preferences';
import { Account, AccountPreferences } from '@/types';

// ==========================================
// TYPES
// ==========================================

export interface ToolResult {
  success: boolean;
  message: string;
  data?: RichResponse['data'];
  actions?: ActionButton[];
  followUp?: string;
  error?: string;
}

export interface ToolContext {
  companyId: string;
  userId: string;
}

// ==========================================
// ACCOUNT PREFERENCES HELPER
// ==========================================

// Maps subtypeCode → typeCode for accounts that are missing the typeCode field
const SUBTYPE_TO_TYPE: Record<string, string> = {
  current_asset: 'asset',
  fixed_asset: 'asset',
  other_asset: 'asset',
  current_liability: 'liability',
  long_term_liability: 'liability',
  owner_equity: 'equity',
  retained_earnings: 'equity',
  operating_revenue: 'revenue',
  other_revenue: 'revenue',
  operating_expense: 'expense',
  cost_of_goods_sold: 'expense',
  payroll_expense: 'expense',
  other_expense: 'expense',
};

// Maps known account names → typeCode for accounts missing ALL type fields
const NAME_TO_TYPE: Record<string, string> = {
  // Assets
  'cash': 'asset', 'bank account': 'asset', 'accounts receivable': 'asset',
  'inventory': 'asset', 'office equipment': 'asset', 'computer equipment': 'asset',
  'furniture & fixtures': 'asset', 'vehicles': 'asset', 'accumulated depreciation': 'asset',
  'merchandise inventory': 'asset', 'raw materials': 'asset', 'work in progress': 'asset',
  'finished goods': 'asset',
  // Liabilities
  'accounts payable': 'liability', 'credit card': 'liability', 'tax payable': 'liability',
  'salaries payable': 'liability', 'bank loan': 'liability',
  // Equity
  "owner's equity": 'equity', "owner's drawings": 'equity', 'retained earnings': 'equity',
  // Revenue
  'service revenue': 'revenue', 'product sales': 'revenue', 'consulting income': 'revenue',
  'interest income': 'revenue', 'other income': 'revenue', 'project income': 'revenue',
  'retainer income': 'revenue', 'service fees': 'revenue',
  // Expenses
  'advertising & marketing': 'expense', 'bank charges': 'expense',
  'software & subscriptions': 'expense', 'office supplies': 'expense',
  'professional services': 'expense', 'travel expenses': 'expense',
  'meals & entertainment': 'expense', 'internet & phone': 'expense',
  'insurance': 'expense', 'rent': 'expense', 'utilities': 'expense',
  'repairs & maintenance': 'expense', 'depreciation expense': 'expense',
  'salaries & wages': 'expense', 'employee benefits': 'expense',
  'payroll taxes': 'expense', 'cost of goods sold': 'expense',
  'freight & shipping': 'expense', 'other expenses': 'expense',
  'subcontractor costs': 'expense', 'manufacturing overhead': 'expense',
};

/** Infer typeCode from account name when typeCode/subtypeCode fields are missing */
function inferTypeFromName(name: string): string | undefined {
  const lower = name.toLowerCase().trim();
  // Exact name match first
  if (NAME_TO_TYPE[lower]) return NAME_TO_TYPE[lower];
  // Keyword heuristics
  if (/\bexpense[s]?\b/.test(lower) && !/accumulated/.test(lower)) return 'expense';
  if (/\b(payroll|wages|salary|salaries)\b/.test(lower)) return 'expense';
  if (/\b(revenue|income|sales)\b/.test(lower)) return 'revenue';
  if (/\bpayable\b/.test(lower)) return 'liability';
  if (/\b(loan|mortgage)\b/.test(lower)) return 'liability';
  if (/\b(equity|drawings|capital)\b/.test(lower)) return 'equity';
  if (/\b(retained earnings)\b/.test(lower)) return 'equity';
  if (/\b(cash|bank|receivable|inventory|equipment|furniture|vehicle|materials)\b/.test(lower)) return 'asset';
  return undefined;
}

// Cache preferences per request to avoid multiple Firestore reads
let _prefCache: { companyId: string; prefs: AccountPreferences } | null = null;

async function getCachedPreferences(companyId: string): Promise<AccountPreferences> {
  if (_prefCache && _prefCache.companyId === companyId) return _prefCache.prefs;
  const prefs = await getAccountPreferences(companyId);
  _prefCache = { companyId, prefs };
  return prefs;
}

/**
 * Resolve preferred account from preferences, with fallback to type/subtype matching
 */
async function resolvePreferredAccount(
  companyId: string,
  accounts: Account[],
  preferenceIdKey: keyof AccountPreferences,
  fallbackTypeCode: string,
  fallbackSubtypeCode?: string,
  fallbackNameMatch?: string
): Promise<Account | undefined> {
  const prefs = await getCachedPreferences(companyId);
  const preferredId = prefs[preferenceIdKey] as string | undefined;

  // isActive check: treat undefined/null as active (backwards compat)
  const isActive = (a: Account) => a.isActive !== false;
  // Match by typeCode OR legacy 'type' field OR typeName OR subtypeCode/subType OR infer from name
  const typeMatches = (a: Account) => {
    const tc = fallbackTypeCode.toLowerCase();
    const acc = a as any; // allow access to legacy field names
    return (
      acc.typeCode?.toLowerCase() === tc ||
      acc.type?.toLowerCase() === tc ||          // legacy field from ChartAccount
      acc.typeName?.toLowerCase().includes(tc) ||
      SUBTYPE_TO_TYPE[acc.subtypeCode?.toLowerCase() ?? ''] === tc ||
      SUBTYPE_TO_TYPE[acc.subType?.toLowerCase() ?? ''] === tc || // legacy subType field
      inferTypeFromName(a.name) === tc
    );
  };

  if (preferredId) {
    const preferred = accounts.find(a => a.id === preferredId && isActive(a));
    if (preferred) return preferred;
  }

  // Fallback: try subtype match first (case-insensitive)
  if (fallbackSubtypeCode) {
    const match = accounts.find(a => isActive(a) && typeMatches(a) && a.subtypeCode?.toLowerCase() === fallbackSubtypeCode.toLowerCase());
    if (match) return match;
  }

  // Fallback: try name match within type (case-insensitive)
  if (fallbackNameMatch) {
    const match = accounts.find(a =>
      isActive(a) && typeMatches(a) &&
      a.name.toLowerCase().includes(fallbackNameMatch.toLowerCase())
    );
    if (match) return match;
  }

  // Fallback: name match across ALL accounts (ignore type) for cash/bank keywords
  if (fallbackSubtypeCode === 'cash' || fallbackTypeCode === 'asset') {
    const cashKeywords = ['cash', 'bank', 'checking', 'savings', 'petty cash'];
    const match = accounts.find(a =>
      isActive(a) && cashKeywords.some(kw => a.name.toLowerCase().includes(kw))
    );
    if (match) return match;
  }

  // Final fallback: any active account of the type (case-insensitive)
  const result = accounts.find(a => isActive(a) && typeMatches(a));

  return result;
}

// ==========================================
// HELPER FUNCTIONS FOR BETTER UX
// ==========================================

/**
 * Wraps errors in user-friendly messages
 */
function handleError(error: any, context: string): ToolResult {
  console.error(`${context} error:`, error);

  // Never expose technical errors to users
  const friendlyMessages: Record<string, string> = {
    'not found': "I couldn't find that. Could you double-check the details?",
    'permission': "I'm having trouble accessing that. Please try again.",
    'duplicate': "That already exists. Would you like to update it instead?",
    'required': "I need a bit more information to complete this.",
    'invalid': "That doesn't look quite right. Could you check the format?",
  };

  const errorMsg = error?.message?.toLowerCase() || '';
  for (const [key, message] of Object.entries(friendlyMessages)) {
    if (errorMsg.includes(key)) {
      return { success: false, message };
    }
  }

  return {
    success: false,
    message: "Something went wrong. Could you try that again?",
  };
}

/**
 * Validates required fields and returns user-friendly message if missing
 */
function validateRequired(args: Record<string, any>, fields: string[]): ToolResult | null {
  const missing = fields.filter(field => !args[field]);
  if (missing.length === 0) return null;

  const fieldNames: Record<string, string> = {
    name: "name",
    customerName: "customer's name",
    vendorName: "vendor's name",
    amount: "amount",
    description: "description",
    items: "items/products",
  };

  const friendlyNames = missing.map(f => fieldNames[f] || f).join(', ');
  return {
    success: false,
    message: `I need the ${friendlyNames} to proceed. Could you provide that?`,
  };
}

/**
 * Parse number from various formats (5k, $5000, 5,000)
 */
function parseAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const str = String(value).toLowerCase().replace(/[$,\s]/g, '');
  if (str.endsWith('k')) return parseFloat(str) * 1000;
  if (str.endsWith('m')) return parseFloat(str) * 1000000;
  return parseFloat(str) || 0;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date for display
 */
function formatDate(date: any): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ==========================================
// MAIN EXECUTOR
// ==========================================

export async function executeAITool(
  toolName: string,
  args: Record<string, any>,
  context: ToolContext
): Promise<ToolResult> {
  const { companyId, userId } = context;

  // Clear preferences cache for fresh data each tool execution
  _prefCache = null;

  try {
    switch (toolName) {
      // Customer Operations
      case 'add_customer':
        return await addCustomer(args, companyId);
      case 'list_customers':
        return await listCustomers(args, companyId);
      case 'get_customer':
        return await getCustomer(args, companyId);
      case 'update_customer':
        return await updateCustomer(args, companyId);
      case 'delete_customer':
        return await deleteCustomer(args, companyId);

      // Vendor Operations
      case 'add_vendor':
        return await addVendor(args, companyId);
      case 'list_vendors':
        return await listVendors(args, companyId);
      case 'update_vendor':
        return await updateVendor(args, companyId);
      case 'delete_vendor':
        return await deleteVendor(args, companyId);

      // Employee Operations
      case 'add_employee':
        return await addEmployee(args, companyId);
      case 'list_employees':
        return await listEmployees(args, companyId);
      case 'update_employee':
        return await updateEmployee(args, companyId);
      case 'delete_employee':
        return await deleteEmployee(args, companyId);

      // Invoice Operations
      case 'create_invoice':
        return await createInvoice(args, companyId);
      case 'list_invoices':
        return await listInvoices(args, companyId);
      case 'get_invoice':
        return await getInvoice(args, companyId);
      case 'update_invoice':
        return await updateInvoice(args, companyId);
      case 'delete_invoice':
        return await deleteInvoice(args, companyId);

      // Transaction Operations
      case 'record_expense':
        return await recordExpense(args, companyId);
      case 'record_payment_received':
        return await recordPaymentReceived(args, companyId);
      case 'record_payment_made':
        return await recordPaymentMade(args, companyId);
      case 'list_transactions':
        return await listTransactions(args, companyId);
      case 'update_transaction':
        return await updateTransaction(args, companyId);
      case 'delete_transaction':
        return await deleteTransaction(args, companyId);

      // Account Operations
      case 'create_account':
        return await createAccount(args, companyId);
      case 'list_accounts':
        return await listAccounts(args, companyId);
      case 'create_journal_entry':
        return await createJournalEntry(args, companyId);
      case 'get_account_balance':
        return await getAccountBalance(args, companyId);
      case 'update_account':
        return await updateAccount(args, companyId);
      case 'delete_account':
        return await deleteAccount(args, companyId);

      // Report Operations
      case 'generate_report':
        return await generateReport(args, companyId);
      case 'get_dashboard_summary':
        return await getDashboardSummary(args, companyId);

      // Bill Operations
      case 'create_bill':
        return await createBill(args, companyId);
      case 'list_bills':
        return await listBills(args, companyId);
      case 'update_bill':
        return await updateBill(args, companyId);
      case 'delete_bill':
        return await deleteBill(args, companyId);

      // Quote Operations
      case 'create_quote':
        return await createQuoteAI(args, companyId);
      case 'list_quotes':
        return await listQuotes(args, companyId);
      case 'get_quote':
        return await getQuote(args, companyId);
      case 'update_quote':
        return await updateQuoteAI(args, companyId);
      case 'delete_quote':
        return await deleteQuoteAI(args, companyId);

      // Purchase Order Operations
      case 'create_purchase_order':
        return await createPurchaseOrderAI(args, companyId);
      case 'list_purchase_orders':
        return await listPurchaseOrders(args, companyId);
      case 'get_purchase_order':
        return await getPurchaseOrder(args, companyId);
      case 'update_purchase_order':
        return await updatePurchaseOrderAI(args, companyId);
      case 'delete_purchase_order':
        return await deletePurchaseOrderAI(args, companyId);

      // Credit Note Operations
      case 'create_credit_note':
        return await createCreditNoteAI(args, companyId);
      case 'list_credit_notes':
        return await listCreditNotes(args, companyId);
      case 'get_credit_note':
        return await getCreditNote(args, companyId);
      case 'update_credit_note':
        return await updateCreditNoteAI(args, companyId);
      case 'delete_credit_note':
        return await deleteCreditNoteAI(args, companyId);

      // Recurring Transaction Operations
      case 'create_recurring_transaction':
        return await createRecurringTransactionAI(args, companyId);
      case 'list_recurring_transactions':
        return await listRecurringTransactionsAI(args, companyId);
      case 'update_recurring_transaction':
        return await updateRecurringTransactionAI(args, companyId);
      case 'delete_recurring_transaction':
        return await deleteRecurringTransactionAI(args, companyId);

      // Journal Entry Operations
      case 'list_journal_entries':
        return await listJournalEntriesAI(args, companyId);
      case 'get_journal_entry':
        return await getJournalEntry(args, companyId);
      case 'update_journal_entry':
        return await updateJournalEntryAI(args, companyId);
      case 'delete_journal_entry':
        return await deleteJournalEntryAI(args, companyId);

      // Bank Account Operations
      case 'create_bank_account':
        return await createBankAccountAI(args, companyId);
      case 'list_bank_accounts':
        return await listBankAccountsAI(args, companyId);
      case 'update_bank_account':
        return await updateBankAccountAI(args, companyId);
      case 'delete_bank_account':
        return await deleteBankAccountAI(args, companyId);

      // Salary/Payroll Operations
      case 'generate_salary_slip':
        return await generateSalarySlipAI(args, companyId);
      case 'list_salary_slips':
        return await listSalarySlipsAI(args, companyId);

      // Send Invoice via Email
      case 'send_invoice':
        return await sendInvoiceViaEmail(args, companyId);

      // Status Management Operations
      case 'change_invoice_status':
        return await changeInvoiceStatus(args, companyId);
      case 'change_bill_status':
        return await changeBillStatus(args, companyId);
      case 'change_salary_slip_status':
        return await changeSalarySlipStatus(args, companyId);

      default:
        return {
          success: false,
          message: `Unknown operation: ${toolName}`,
          error: 'Invalid tool name',
        };
    }
  } catch (error: any) {
    console.error(`Error executing ${toolName}:`, error);
    return {
      success: false,
      message: `Failed to execute operation: ${error.message}`,
      error: error.message,
    };
  }
}

// ==========================================
// CUSTOMER OPERATIONS
// ==========================================

async function addCustomer(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    // Validate required fields
    const validation = validateRequired(args, ['name']);
    if (validation) return validation;

    const customersRef = collection(db, `companies/${companyId}/customers`);

    const customerData = {
      name: args.name,
      email: args.email || '',
      phone: args.phone || '',
      address: args.address || '',
      city: args.city || '',
      country: args.country || '',
      taxId: args.taxId || '',
      notes: args.notes || '',
      totalBilled: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(customersRef, customerData);

    return {
      success: true,
      message: `✓ Added **${args.name}** as a new customer${args.email ? ` (${args.email})` : ''}`,
      data: {
        type: 'entity',
        entityType: 'customer',
        entity: {
          id: docRef.id,
          ...customerData,
          createdAt: new Date().toISOString(),
        },
      },
      actions: [
        {
          type: 'view',
          label: 'View Details',
          entityType: 'customer',
          entityId: docRef.id,
          data: { id: docRef.id, ...customerData },
        },
      ],
    };
  } catch (error: any) {
    return handleError(error, 'Add customer');
  }
}

async function listCustomers(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const customersRef = collection(db, `companies/${companyId}/customers`);
    const pageSize = Math.min(args.pageSize || 10, 50);

    let q = query(customersRef, orderBy('createdAt', 'desc'), limit(pageSize + 1)); // Get one extra to check if there are more

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > pageSize;
    const customers = snapshot.docs.slice(0, pageSize).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        outstandingBalance: data.outstandingBalance || 0,
        totalBilled: data.totalBilled || 0,
        createdAt: formatDate(data.createdAt),
      };
    });

    if (customers.length === 0) {
      return {
        success: true,
        message: "You don't have any customers yet. Would you like to add one?",
        followUp: 'Just tell me the customer name and contact details to get started.',
      };
    }

    const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
    const message = hasMore
      ? `Here are your ${customers.length} most recent customers (showing 1-${customers.length}, more available):`
      : `Here are your ${customers.length} customers:`;

    return {
      success: true,
      message: totalOutstanding > 0
        ? `${message}\n\n💰 Total outstanding: ${formatCurrency(totalOutstanding)}`
        : message,
      data: {
        type: 'list',
        entityType: 'customer',
        items: customers,
        columns: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'phone', label: 'Phone', type: 'text' },
          { key: 'outstandingBalance', label: 'Outstanding', type: 'currency' },
        ],
        pagination: { page: args.page || 1, pageSize, total: customers.length },
      },
      actions: [],
      followUp: hasMore ? 'Want to see more customers?' : undefined,
    };
  } catch (error: any) {
    return handleError(error, 'List customers');
  }
}

async function getCustomer(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const customersRef = collection(db, `companies/${companyId}/customers`);

  let customer: Record<string, any> | null = null;
  let customerId = args.id;

  if (args.name) {
    // Search by name — exact match first, then partial/contains match
    const snapshot = await getDocs(customersRef);
    const searchName = args.name.toLowerCase().trim();

    // Try exact match first
    const exactMatch = snapshot.docs.find(doc =>
      doc.data().name?.toLowerCase().trim() === searchName
    );
    if (exactMatch) {
      customer = { id: exactMatch.id, ...exactMatch.data() } as any;
      customerId = exactMatch.id;
    } else {
      // Try partial match: name contains search OR search contains name
      const partialMatches = snapshot.docs.filter(doc => {
        const name = doc.data().name?.toLowerCase().trim() || '';
        return name.includes(searchName) || searchName.includes(name);
      });
      if (partialMatches.length === 1) {
        customer = { id: partialMatches[0].id, ...partialMatches[0].data() } as any;
        customerId = partialMatches[0].id;
      } else if (partialMatches.length > 1) {
        const names = partialMatches.map(d => d.data().name).join(', ');
        return {
          success: false,
          message: `I found multiple customers matching "${args.name}": ${names}. Which one did you mean?`,
        };
      }
    }
  } else if (args.id) {
    const docSnap = await getDoc(doc(db, `companies/${companyId}/customers`, args.id));
    if (docSnap.exists()) {
      customer = { id: docSnap.id, ...docSnap.data() } as any;
    }
  }

  if (!customer) {
    return {
      success: false,
      message: `I couldn't find a customer matching "${args.name || args.id}". Would you like to see a list of all customers?`,
    };
  }

  return {
    success: true,
    message: `Here are the details for **${customer.name}**:`,
    data: {
      type: 'entity',
      entityType: 'customer',
      entity: customer,
    },
    actions: [
      { type: 'view', label: 'View Details', entityType: 'customer', entityId: customerId, data: customer },
    ],
  };
}

async function updateCustomer(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const customersRef = collection(db, `companies/${companyId}/customers`);

  let customerId = args.customerId;

  if (!customerId && args.customerName) {
    const snapshot = await getDocs(customersRef);
    const found = snapshot.docs.find(doc =>
      doc.data().name?.toLowerCase().includes(args.customerName.toLowerCase())
    );
    if (found) customerId = found.id;
  }

  if (!customerId) {
    return {
      success: false,
      message: `I couldn't find a customer named "${args.customerName}". Could you check the name?`,
    };
  }

  const updates = { ...args.updates, updatedAt: serverTimestamp() };
  await updateDoc(doc(db, `companies/${companyId}/customers`, customerId), updates);

  return {
    success: true,
    message: `I've updated the customer information.`,
    data: { type: 'entity', entityType: 'customer', entity: { id: customerId, ...updates } },
    actions: [{ type: 'view', label: 'View Customer', entityType: 'customer', entityId: customerId }],
  };
}

async function deleteCustomer(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  if (!args.confirmed) {
    return {
      success: false,
      message: `Are you sure you want to delete this customer? This action cannot be undone. Please confirm by saying "yes, delete" or "confirm deletion".`,
    };
  }

  const customersRef = collection(db, `companies/${companyId}/customers`);
  let customerId = args.customerId;

  if (!customerId && args.customerName) {
    const snapshot = await getDocs(customersRef);
    const found = snapshot.docs.find(doc =>
      doc.data().name?.toLowerCase().includes(args.customerName.toLowerCase())
    );
    if (found) customerId = found.id;
  }

  if (!customerId) {
    return {
      success: false,
      message: `I couldn't find that customer. Please check the name and try again.`,
    };
  }

  await deleteDoc(doc(db, `companies/${companyId}/customers`, customerId));

  return {
    success: true,
    message: `The customer has been deleted successfully.`,
  };
}

// ==========================================
// VENDOR OPERATIONS
// ==========================================

async function addVendor(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const vendorsRef = collection(db, `companies/${companyId}/vendors`);

  const vendorData = {
    name: args.name,
    email: args.email || '',
    phone: args.phone || '',
    address: args.address || '',
    taxId: args.taxId || '',
    paymentTerms: args.paymentTerms || 'Net 30',
    notes: args.notes || '',
    totalBilled: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(vendorsRef, vendorData);

  return {
    success: true,
    message: `I've added **${args.name}** as a new vendor.`,
    data: { type: 'entity', entityType: 'vendor', entity: { id: docRef.id, ...vendorData } },
    actions: [
      { type: 'view', label: 'View Details', entityType: 'vendor', entityId: docRef.id, data: { id: docRef.id, ...vendorData } },
    ],
  };
}

async function listVendors(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const vendorsRef = collection(db, `companies/${companyId}/vendors`);
  const pageSize = Math.min(args.pageSize || 10, 50);

  const snapshot = await getDocs(query(vendorsRef, orderBy('createdAt', 'desc'), limit(pageSize)));
  const vendors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (vendors.length === 0) {
    return {
      success: true,
      message: "You don't have any vendors yet. Would you like to add one?",
    };
  }

  return {
    success: true,
    message: `Here are your vendors (${vendors.length} total):`,
    data: {
      type: 'list',
      entityType: 'vendor',
      items: vendors,
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'outstandingBalance', label: 'Outstanding', type: 'currency' },
      ],
    },
  };
}

async function updateVendor(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const vendorsRef = collection(db, `companies/${companyId}/vendors`);
  let vendorId = args.vendorId;

  if (!vendorId && args.vendorName) {
    const snapshot = await getDocs(vendorsRef);
    const found = snapshot.docs.find(doc =>
      doc.data().name?.toLowerCase().includes(args.vendorName.toLowerCase())
    );
    if (found) vendorId = found.id;
  }

  if (!vendorId) {
    return { success: false, message: `Couldn't find that vendor.` };
  }

  await updateDoc(doc(db, `companies/${companyId}/vendors`, vendorId), { ...args.updates, updatedAt: serverTimestamp() });

  return {
    success: true,
    message: `Vendor information updated.`,
  };
}

async function deleteVendor(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  if (!args.confirmed) {
    return {
      success: false,
      message: `Please confirm that you want to delete this vendor.`,
    };
  }

  const vendorsRef = collection(db, `companies/${companyId}/vendors`);
  let vendorId = args.vendorId;

  if (!vendorId && args.vendorName) {
    const snapshot = await getDocs(vendorsRef);
    const found = snapshot.docs.find(doc =>
      doc.data().name?.toLowerCase().includes(args.vendorName.toLowerCase())
    );
    if (found) vendorId = found.id;
  }

  if (!vendorId) {
    return { success: false, message: `Couldn't find that vendor.` };
  }

  await deleteDoc(doc(db, `companies/${companyId}/vendors`, vendorId));

  return { success: true, message: `Vendor deleted successfully.` };
}

// ==========================================
// EMPLOYEE OPERATIONS
// ==========================================

async function addEmployee(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  const employeeId = `EMP-${Date.now().toString().slice(-6)}`;

  const employeeData = {
    employeeId,
    name: args.name,
    email: args.email || '',
    phone: args.phone || '',
    designation: args.designation,
    department: args.department || '',
    salary: args.salary,
    salaryType: args.salaryType || 'monthly',
    joiningDate: args.joiningDate ? new Date(args.joiningDate) : new Date(),
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(employeesRef, employeeData);

  return {
    success: true,
    message: `I've added **${args.name}** as a new employee.`,
    data: {
      type: 'entity',
      entityType: 'employee',
      entity: { id: docRef.id, ...employeeData },
    },
    actions: [
      { type: 'view', label: 'View Employee', entityType: 'employee', entityId: docRef.id, data: { id: docRef.id, ...employeeData } },
    ],
    followUp: 'Would you like to add another employee?',
  };
}

async function listEmployees(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  const snapshot = await getDocs(query(employeesRef, orderBy('createdAt', 'desc')));
  const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (employees.length === 0) {
    return { success: true, message: "You don't have any employees yet." };
  }

  return {
    success: true,
    message: `Here are your employees (${employees.length} total):`,
    data: {
      type: 'list',
      entityType: 'employee',
      items: employees,
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'designation', label: 'Role', type: 'text' },
        { key: 'department', label: 'Department', type: 'text' },
        { key: 'salary', label: 'Salary', type: 'currency' },
      ],
    },
  };
}

async function updateEmployee(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  let empId = args.employeeId;

  if (!empId && args.employeeName) {
    const snapshot = await getDocs(employeesRef);
    const found = snapshot.docs.find(doc =>
      doc.data().name?.toLowerCase().includes(args.employeeName.toLowerCase())
    );
    if (found) empId = found.id;
  }

  if (!empId) {
    return { success: false, message: `Couldn't find that employee.` };
  }

  await updateDoc(doc(db, `companies/${companyId}/employees`, empId), { ...args.updates, updatedAt: serverTimestamp() });

  return { success: true, message: `Employee information updated.` };
}

async function deleteEmployee(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  if (!args.confirmed) {
    return { success: false, message: `Please confirm deletion.` };
  }

  const employeesRef = collection(db, `companies/${companyId}/employees`);
  let empId = args.employeeId;

  if (!empId && args.employeeName) {
    const snapshot = await getDocs(employeesRef);
    const found = snapshot.docs.find(doc =>
      doc.data().name?.toLowerCase().includes(args.employeeName.toLowerCase())
    );
    if (found) empId = found.id;
  }

  if (!empId) {
    return { success: false, message: `Couldn't find that employee.` };
  }

  await deleteDoc(doc(db, `companies/${companyId}/employees`, empId));

  return { success: true, message: `Employee removed successfully.` };
}

// ==========================================
// INVOICE OPERATIONS
// ==========================================

async function createInvoice(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    // Find or create customer — try exact match first, then partial/contains match
    const customers = await getCustomers(companyId);
    const searchName = args.customerName.toLowerCase().trim();
    let customer = customers.find(c =>
      c.name.toLowerCase() === searchName ||
      c.email?.toLowerCase() === args.customerEmail?.toLowerCase()
    );
    if (!customer) {
      // Partial match: customer name contains search or search contains customer name
      const partialMatches = customers.filter(c =>
        c.name.toLowerCase().includes(searchName) ||
        searchName.includes(c.name.toLowerCase())
      );
      if (partialMatches.length === 1) {
        customer = partialMatches[0];
      } else if (partialMatches.length > 1) {
        // Multiple matches — ask user to pick
        const names = partialMatches.map(c => c.name).join(', ');
        return {
          success: false,
          message: `I found multiple customers matching "${args.customerName}": ${names}. Which one did you mean?`,
          followUp: `Please specify the exact customer name.`,
        };
      }
    }

    if (!customer) {
      // Create new customer
      const customerId = await createCustomer(companyId, {
        name: args.customerName,
        email: args.customerEmail || '',
        phone: '',
        address: '',
        city: '',
        country: '',
        taxId: '',
        notes: '',
      });
      customer = { id: customerId, name: args.customerName, email: args.customerEmail || '' } as any;
    }

    const items = args.items || [];
    const invoiceItems = items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
    }));

    const dueDate = args.dueDate
      ? new Date(args.dueDate)
      : new Date(Date.now() + (Number(args.dueDays) || 30) * 24 * 60 * 60 * 1000);

    const invoiceData = {
      customerId: customer!.id,
      customerName: customer!.name,
      customerEmail: customer!.email || args.customerEmail || '',
      items: invoiceItems,
      dueDate,
      taxRate: Number(args.taxRate) || 0,
      discount: Number(args.discount) || 0,
      notes: args.notes || '',
      terms: args.terms || '',
    };

    // Use the service function to create invoice (creates as draft, no journal entry yet)
    const invoiceId = await createInvoiceService(companyId, invoiceData);

    return {
      success: true,
      message: `I've created a draft invoice for **${args.customerName}**. The invoice needs to be sent to create the accounting journal entry.`,
      data: {
        type: 'entity',
        entityType: 'invoice',
        entity: { id: invoiceId, ...invoiceData },
      },
      actions: [
        { type: 'send', label: 'Send Invoice', entityType: 'invoice', entityId: invoiceId, toolCall: 'send_invoice' },
        { type: 'view', label: 'View Invoice', entityType: 'invoice', entityId: invoiceId, data: { id: invoiceId, ...invoiceData } },
        { type: 'download', label: 'Download PDF', entityType: 'invoice', entityId: invoiceId },
      ],
      followUp: 'Click "Send Invoice" to email it to the customer and create the accounting entries (Debit AR, Credit Revenue).',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to create invoice: ${error.message}`,
      error: error.message,
    };
  }
}

async function listInvoices(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  const snapshot = await getDocs(query(invoicesRef, orderBy('createdAt', 'desc'), limit(20)));
  const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (invoices.length === 0) {
    return { success: true, message: "You don't have any invoices yet." };
  }

  return {
    success: true,
    message: `Here are your invoices (${invoices.length}):`,
    data: {
      type: 'list',
      entityType: 'invoice',
      items: invoices,
      columns: [
        { key: 'invoiceNumber', label: 'Invoice #', type: 'text' },
        { key: 'customerName', label: 'Customer', type: 'text' },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'status', label: 'Status', type: 'status' },
      ],
    },
  };
}

async function getInvoice(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  let invoice: Record<string, any> | null = null;

  if (args.invoiceNumber) {
    const snapshot = await getDocs(query(invoicesRef, where('invoiceNumber', '==', args.invoiceNumber)));
    if (!snapshot.empty) {
      invoice = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
    }
  } else if (args.invoiceId) {
    const docSnap = await getDoc(doc(db, `companies/${companyId}/invoices`, args.invoiceId));
    if (docSnap.exists()) {
      invoice = { id: docSnap.id, ...docSnap.data() } as any;
    }
  }

  if (!invoice) {
    return { success: false, message: `Couldn't find that invoice.` };
  }

  return {
    success: true,
    message: `Here are the details for invoice **${invoice.invoiceNumber}**:`,
    data: { type: 'entity', entityType: 'invoice', entity: invoice },
    actions: [
      { type: 'view', label: 'View Invoice', entityType: 'invoice', entityId: invoice.id, data: invoice },
    ],
  };
}

async function updateInvoice(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { invoiceId, ...updateData } = args;

    if (!invoiceId) {
      return { success: false, message: 'Invoice ID is required to update an invoice.' };
    }

    // Get the existing invoice
    const docSnap = await getDoc(doc(db, `companies/${companyId}/invoices`, invoiceId));
    if (!docSnap.exists()) {
      return { success: false, message: `Invoice not found with ID: ${invoiceId}` };
    }

    const existingInvoice: any = { id: docSnap.id, ...docSnap.data() };

    // Prepare update data, converting dates if provided
    const preparedData: Record<string, any> = {};

    if (updateData.dueDate) {
      preparedData.dueDate = Timestamp.fromDate(new Date(updateData.dueDate));
    }
    if (updateData.items) {
      preparedData.items = updateData.items;
      // Recalculate totals
      const subtotal = updateData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
      const taxAmount = subtotal * ((updateData.taxRate || existingInvoice.taxRate || 0) / 100);
      const total = subtotal + taxAmount - (updateData.discount || existingInvoice.discount || 0);
      preparedData.subtotal = subtotal;
      preparedData.taxAmount = taxAmount;
      preparedData.total = total;
    }
    if (updateData.taxRate !== undefined) preparedData.taxRate = updateData.taxRate;
    if (updateData.discount !== undefined) preparedData.discount = updateData.discount;
    if (updateData.notes !== undefined) preparedData.notes = updateData.notes;
    if (updateData.terms !== undefined) preparedData.terms = updateData.terms;

    await updateInvoiceService(companyId, invoiceId, preparedData);

    return {
      success: true,
      message: `Invoice **${existingInvoice.invoiceNumber}** has been updated successfully.`,
      data: { type: 'entity', entityType: 'invoice', entity: { ...existingInvoice, ...preparedData } },
      actions: [
        { type: 'view', label: 'View Invoice', entityType: 'invoice', entityId: invoiceId },
      ],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update invoice: ${error.message}`, error: error.message };
  }
}

async function deleteInvoice(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { invoiceId } = args;

    if (!invoiceId) {
      return { success: false, message: 'Invoice ID is required to delete an invoice.' };
    }

    // Get the invoice details before deleting
    const docSnap = await getDoc(doc(db, `companies/${companyId}/invoices`, invoiceId));
    if (!docSnap.exists()) {
      return { success: false, message: `Invoice not found with ID: ${invoiceId}` };
    }

    const invoice : any = { id: docSnap.id, ...docSnap.data() };

    await deleteInvoiceService(companyId, invoiceId);

    return {
      success: true,
      message: `Invoice **${invoice.invoiceNumber}** for **${invoice.customerName}** has been deleted successfully.`,
    };
  } catch (error: any) {
    return { success: false, message: `Failed to delete invoice: ${error.message}`, error: error.message };
  }
}

// ==========================================
// TRANSACTION OPERATIONS
// ==========================================

async function recordExpense(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const accounts = await getAccounts(companyId);

    // Use preferred cash account, fallback to asset/cash subtype, then any asset
    const cashAccount = await resolvePreferredAccount(companyId, accounts, 'defaultCashAccountId', 'asset', 'cash');
    if (!cashAccount) {
      return {
        success: false,
        message: 'No active cash or asset account found. Please create one in Chart of Accounts.',
        error: 'Missing cash account',
      };
    }

    // Use preferred expense account, fallback to category name match, then any expense
    const expenseAccount = await resolvePreferredAccount(companyId, accounts, 'defaultExpenseAccountId', 'expense', undefined, args.category);
    if (!expenseAccount) {
      return {
        success: false,
        message: 'No active expense account found. Please create one in Chart of Accounts.',
        error: 'Missing expense account',
      };
    }

    const amount = Math.abs(Number(args.amount));
    const date = args.date ? Timestamp.fromDate(new Date(args.date)) : Timestamp.now();

    // Create transaction data with proper structure
    const transactionData = {
      type: 'expense' as const,
      description: args.description,
      amount,
      category: args.category || 'General',
      accountId: cashAccount.id,
      accountName: cashAccount.name,
      date,
      paymentMethod: args.paymentMethod || 'cash',
      reference: args.reference || '',
      journalEntryId: '', // Will be filled by createTransactionService
    };

    // Create accounting config for journal entry
    const accountingConfig = {
      expenseAccountId: expenseAccount.id,
      expenseAccountCode: expenseAccount.code,
      expenseAccountName: expenseAccount.name,
      createdBy: 'ai-assistant',
    };

    // Use the service function to create transaction with journal entry
    const transactionId = await createTransactionService(companyId, transactionData, accountingConfig);

    // Include journal entry lines for accounting impact display
    const journalLines = [
      { accountName: expenseAccount.name, accountCode: expenseAccount.code, debit: amount, credit: 0 },
      { accountName: cashAccount.name, accountCode: cashAccount.code, debit: 0, credit: amount },
    ];

    const entityData = { id: transactionId, ...transactionData, journalLines };

    return {
      success: true,
      message: `I've recorded an expense of **$${amount.toLocaleString()}** for "${args.description}" and created the corresponding journal entry.`,
      data: { type: 'entity', entityType: 'transaction', entity: entityData },
      actions: [
        { type: 'view', label: 'View Transaction', entityType: 'transaction', entityId: transactionId, data: entityData },
      ],
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to record expense: ${error.message}`,
      error: error.message,
    };
  }
}

async function recordPaymentReceived(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    // Get all accounts to find appropriate cash and revenue accounts
    const accounts = await getAccounts(companyId);

    // Use preferred cash account, fallback to asset/cash subtype, then any asset
    const cashAccount = await resolvePreferredAccount(companyId, accounts, 'defaultCashAccountId', 'asset', 'cash');
    if (!cashAccount) {
      return {
        success: false,
        message: 'No active cash or asset account found. Please create one in Chart of Accounts.',
        error: 'Missing cash account',
      };
    }

    // Use preferred revenue account, fallback to any revenue
    const revenueAccount = await resolvePreferredAccount(companyId, accounts, 'defaultRevenueAccountId', 'revenue');
    if (!revenueAccount) {
      return {
        success: false,
        message: 'No active revenue account found. Please create one in Chart of Accounts.',
        error: 'Missing revenue account',
      };
    }

    const amount = Math.abs(Number(args.amount));
    const date = args.date ? Timestamp.fromDate(new Date(args.date)) : Timestamp.now();
    const description = `Payment from ${args.customerName}`;

    // Create transaction data with proper structure
    const transactionData = {
      type: 'income' as const,
      description,
      amount,
      category: 'Customer Payment',
      accountId: cashAccount.id,
      accountName: cashAccount.name,
      date,
      paymentMethod: args.paymentMethod || 'cash',
      reference: args.reference || args.invoiceNumber || '',
      journalEntryId: '', // Will be filled by createTransactionService
    };

    // Create accounting config for journal entry
    const accountingConfig = {
      revenueAccountId: revenueAccount.id,
      revenueAccountCode: revenueAccount.code,
      revenueAccountName: revenueAccount.name,
      createdBy: 'ai-assistant',
    };

    // Use the service function to create transaction with journal entry
    const transactionId = await createTransactionService(companyId, transactionData, accountingConfig);

    // Include journal entry lines for accounting impact display
    const journalLines = [
      { accountName: cashAccount.name, accountCode: cashAccount.code, debit: amount, credit: 0 },
      { accountName: revenueAccount.name, accountCode: revenueAccount.code, debit: 0, credit: amount },
    ];

    const entityData = { id: transactionId, ...transactionData, journalLines };

    return {
      success: true,
      message: `I've recorded a payment of **$${amount.toLocaleString()}** received from **${args.customerName}** and created the corresponding journal entry.`,
      data: { type: 'entity', entityType: 'transaction', entity: entityData },
      actions: [
        { type: 'view', label: 'View Transaction', entityType: 'transaction', entityId: transactionId, data: entityData },
      ],
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to record payment: ${error.message}`,
      error: error.message,
    };
  }
}

async function recordPaymentMade(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const accounts = await getAccounts(companyId);

    const cashAccount = await resolvePreferredAccount(companyId, accounts, 'defaultCashAccountId', 'asset', 'cash');
    if (!cashAccount) return { success: false, message: 'No active cash or asset account found. Please create one in Chart of Accounts.' };

    const expenseAccount = await resolvePreferredAccount(companyId, accounts, 'defaultExpenseAccountId', 'expense');
    if (!expenseAccount) return { success: false, message: 'No active expense account found. Please create one in Chart of Accounts.' };

    const amount = Math.abs(Number(args.amount));
    const date = args.date ? Timestamp.fromDate(new Date(args.date)) : Timestamp.now();
    const description = args.description || `Payment to ${args.vendorName}`;

    const transactionData = {
      type: 'expense' as const,
      description,
      amount,
      category: 'Vendor Payment',
      accountId: cashAccount.id,
      accountName: cashAccount.name,
      date,
      paymentMethod: args.paymentMethod || 'cash',
      reference: args.reference || args.billNumber || '',
      journalEntryId: '',
    };

    const accountingConfig = {
      expenseAccountId: expenseAccount.id,
      expenseAccountCode: expenseAccount.code,
      expenseAccountName: expenseAccount.name,
      createdBy: 'ai-assistant',
    };

    const transactionId = await createTransactionService(companyId, transactionData, accountingConfig);

    const journalLines = [
      { accountName: expenseAccount.name, accountCode: expenseAccount.code, debit: amount, credit: 0 },
      { accountName: cashAccount.name, accountCode: cashAccount.code, debit: 0, credit: amount },
    ];

    const entityData = { id: transactionId, ...transactionData, journalLines };

    return {
      success: true,
      message: `I've recorded a payment of **$${amount.toLocaleString()}** made to **${args.vendorName}** and created the corresponding journal entry.`,
      data: { type: 'entity', entityType: 'transaction', entity: entityData },
      actions: [
        { type: 'view', label: 'View Transaction', entityType: 'transaction', entityId: transactionId, data: entityData },
      ],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to record payment: ${error.message}`, error: error.message };
  }
}

async function listTransactions(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const snapshot = await getDocs(query(transactionsRef, orderBy('createdAt', 'desc'), limit(20)));
  const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (transactions.length === 0) {
    return { success: true, message: "No transactions recorded yet." };
  }

  return {
    success: true,
    message: `Here are your recent transactions (${transactions.length}):`,
    data: {
      type: 'list',
      entityType: 'transaction',
      items: transactions,
      columns: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'type', label: 'Type', type: 'status' },
        { key: 'amount', label: 'Amount', type: 'currency' },
      ],
    },
  };
}

async function updateTransaction(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { transactionId, ...updateData } = args;

    if (!transactionId) {
      return { success: false, message: 'Transaction ID is required to update a transaction.' };
    }

    // Get the existing transaction
    const docSnap = await getDoc(doc(db, `companies/${companyId}/transactions`, transactionId));
    if (!docSnap.exists()) {
      return { success: false, message: `Transaction not found with ID: ${transactionId}` };
    }

    const existingTransaction : any = { id: docSnap.id, ...docSnap.data() };

    // Prepare update data
    const preparedData: Record<string, any> = {};

    if (updateData.date) {
      preparedData.date = Timestamp.fromDate(new Date(updateData.date));
    }
    if (updateData.amount !== undefined) preparedData.amount = updateData.amount;
    if (updateData.description !== undefined) preparedData.description = updateData.description;
    if (updateData.category !== undefined) preparedData.category = updateData.category;
    if (updateData.reference !== undefined) preparedData.reference = updateData.reference;

    await updateTransactionService(companyId, transactionId, preparedData);

    return {
      success: true,
      message: `Transaction **${existingTransaction.description}** has been updated successfully.`,
      data: { type: 'entity', entityType: 'transaction', entity: { ...existingTransaction, ...preparedData } },
      actions: [
        { type: 'view', label: 'View Transaction', entityType: 'transaction', entityId: transactionId },
      ],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update transaction: ${error.message}`, error: error.message };
  }
}

async function deleteTransaction(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { transactionId } = args;

    if (!transactionId) {
      return { success: false, message: 'Transaction ID is required to delete a transaction.' };
    }

    // Get the transaction details before deleting
    const docSnap = await getDoc(doc(db, `companies/${companyId}/transactions`, transactionId));
    if (!docSnap.exists()) {
      return { success: false, message: `Transaction not found with ID: ${transactionId}` };
    }

    const transaction : any = { id: docSnap.id, ...docSnap.data() };

    await deleteTransactionService(companyId, transactionId);

    return {
      success: true,
      message: `Transaction **${transaction.description}** (${transaction.amount}) has been deleted successfully.`,
    };
  } catch (error: any) {
    return { success: false, message: `Failed to delete transaction: ${error.message}`, error: error.message };
  }
}

// ==========================================
// ACCOUNT OPERATIONS
// ==========================================

async function createAccount(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const accountCode = args.code || `ACC-${Date.now().toString().slice(-6)}`;

  const accountData = {
    code: accountCode,
    name: args.name,
    subtypeCode: args.subtypeCode,
    description: args.description || '',
    isActive: true,
    isSystem: false,
    balance: 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(accountsRef, accountData);

  return {
    success: true,
    message: `I've created the account **${args.name}** (${accountCode}).`,
    data: { type: 'entity', entityType: 'account', entity: { id: docRef.id, ...accountData } },
    actions: [
      { type: 'view', label: 'View Account', entityType: 'account', entityId: docRef.id, data: { id: docRef.id, ...accountData } },
    ],
  };
}

async function listAccounts(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  let q = query(accountsRef, orderBy('code'));

  const snapshot = await getDocs(q);
  let accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (args.typeCode) {
    accounts = accounts.filter((a: any) => a.subtypeCode?.includes(args.typeCode));
  }

  if (accounts.length === 0) {
    return { success: true, message: "No accounts found." };
  }

  return {
    success: true,
    message: `Here are your accounts (${accounts.length}):`,
    data: {
      type: 'list',
      entityType: 'account',
      items: accounts,
      columns: [
        { key: 'code', label: 'Code', type: 'text' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'subtypeCode', label: 'Type', type: 'text' },
        { key: 'balance', label: 'Balance', type: 'currency' },
      ],
    },
  };
}

async function createJournalEntry(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const entries = args.entries || [];
  const totalDebit = entries.reduce((sum: number, e: any) => sum + (Number(e.debit) || 0), 0);
  const totalCredit = entries.reduce((sum: number, e: any) => sum + (Number(e.credit) || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      success: false,
      message: `The journal entry doesn't balance. Debits ($${totalDebit.toFixed(2)}) must equal credits ($${totalCredit.toFixed(2)}).`,
    };
  }

  const journalRef = collection(db, `companies/${companyId}/journalEntries`);
  const entryNumber = `JE-${Date.now().toString().slice(-6)}`;

  const journalData = {
    entryNumber,
    description: args.description,
    date: args.date ? new Date(args.date) : new Date(),
    lines: entries.map((e: any) => ({
      accountName: e.accountName,
      debit: Number(e.debit) || 0,
      credit: Number(e.credit) || 0,
    })),
    totalDebit,
    totalCredit,
    isBalanced: true,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(journalRef, journalData);

  return {
    success: true,
    message: `I've created journal entry **${entryNumber}**: "${args.description}" (Total: $${totalDebit.toFixed(2)}).`,
    data: { type: 'entity', entityType: 'journal_entry', entity: { id: docRef.id, ...journalData } },
  };
}

async function getAccountBalance(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const snapshot = await getDocs(transactionsRef);

  let income = 0;
  let expenses = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.type === 'income') income += Number(data.amount) || 0;
    if (data.type === 'expense') expenses += Number(data.amount) || 0;
  });

  const accountName = args.accountName?.toLowerCase() || '';

  if (accountName.includes('cash') || accountName.includes('bank')) {
    return {
      success: true,
      message: `**Cash/Bank Summary:**\n- Total Income: $${income.toLocaleString()}\n- Total Expenses: $${expenses.toLocaleString()}\n- Net Balance: $${(income - expenses).toLocaleString()}`,
      data: {
        type: 'summary',
        summary: { income, expenses, net: income - expenses },
      },
    };
  }

  if (accountName.includes('receivable')) {
    const invoicesRef = collection(db, `companies/${companyId}/invoices`);
    const invSnapshot = await getDocs(invoicesRef);
    const totalReceivable = invSnapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().amountDue) || 0), 0);

    return {
      success: true,
      message: `**Accounts Receivable:** $${totalReceivable.toLocaleString()}`,
      data: { type: 'summary', summary: { receivables: totalReceivable } },
    };
  }

  return {
    success: true,
    message: `**Financial Summary:**\n- Total Income: $${income.toLocaleString()}\n- Total Expenses: $${expenses.toLocaleString()}\n- Net: $${(income - expenses).toLocaleString()}`,
  };
}

async function updateAccount(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { accountId, ...updateData } = args;

    if (!accountId) {
      return { success: false, message: 'Account ID is required to update an account.' };
    }

    // Get the existing account
    const docSnap = await getDoc(doc(db, `companies/${companyId}/chartOfAccounts`, accountId));
    if (!docSnap.exists()) {
      return { success: false, message: `Account not found with ID: ${accountId}` };
    }

    const existingAccount : any = { id: docSnap.id, ...docSnap.data() };

    // Prepare update data
    const preparedData: Record<string, any> = {};

    if (updateData.name !== undefined) preparedData.name = updateData.name;
    if (updateData.description !== undefined) preparedData.description = updateData.description;
    if (updateData.isActive !== undefined) preparedData.isActive = updateData.isActive;

    await updateAccountService(companyId, accountId, preparedData);

    return {
      success: true,
      message: `Account **${existingAccount.name}** (${existingAccount.code}) has been updated successfully.`,
      data: { type: 'entity', entityType: 'account', entity: { ...existingAccount, ...preparedData } },
      actions: [
        { type: 'view', label: 'View Account', entityType: 'account', entityId: accountId },
      ],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update account: ${error.message}`, error: error.message };
  }
}

async function deleteAccount(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { accountId } = args;

    if (!accountId) {
      return { success: false, message: 'Account ID is required to delete an account.' };
    }

    // Get the account details before deleting
    const docSnap = await getDoc(doc(db, `companies/${companyId}/chartOfAccounts`, accountId));
    if (!docSnap.exists()) {
      return { success: false, message: `Account not found with ID: ${accountId}` };
    }

    const account : any = { id: docSnap.id, ...docSnap.data() };

    // Check if it's a system account
    if (account.isSystem) {
      return { success: false, message: `Cannot delete system account **${account.name}** (${account.code}).` };
    }

    await deleteAccountService(companyId, accountId);

    return {
      success: true,
      message: `Account **${account.name}** (${account.code}) has been deleted successfully.`,
    };
  } catch (error: any) {
    return { success: false, message: `Failed to delete account: ${error.message}`, error: error.message };
  }
}

// ==========================================
// REPORT OPERATIONS
// ==========================================

async function generateReport(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const startDate = new Date(args.startDate);
  const endDate = new Date(args.endDate);

  const snapshot = await getDocs(transactionsRef);
  const transactions = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((t: any) => {
      const txDate = t.date?.toDate?.() || new Date(t.date);
      return txDate >= startDate && txDate <= endDate;
    });

  let income = 0;
  let expenses = 0;
  const categories: Record<string, number> = {};

  transactions.forEach((t: any) => {
    if (t.type === 'income') income += Number(t.amount) || 0;
    if (t.type === 'expense') {
      expenses += Number(t.amount) || 0;
      const cat = t.category || 'Other';
      categories[cat] = (categories[cat] || 0) + Number(t.amount);
    }
  });

  const reportType = args.reportType;
  const REPORT_LABELS: Record<string, string> = {
    profit_loss: 'Profit & Loss',
    balance_sheet: 'Balance Sheet',
    cash_flow: 'Cash Flow',
    trial_balance: 'Trial Balance',
    expense_report: 'Expense Report',
    revenue_report: 'Revenue Report',
    aging_report: 'Aging Report',
    tax_summary: 'Tax Summary',
  };

  const reportLabel = REPORT_LABELS[reportType] || reportType.replace(/_/g, ' ');
  const net = income - expenses;
  const message = `Here's your **${reportLabel}** for ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}.`;

  return {
    success: true,
    message,
    data: {
      type: 'report',
      entityType: reportType,
      summary: {
        reportName: reportLabel,
        period: `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`,
        income,
        expenses,
        net,
        categories,
        transactionCount: transactions.length,
      },
    },
    actions: [
      { type: 'download', label: 'Download Report', entityType: 'report', data: { reportType, startDate, endDate } },
    ],
  };
}

async function getDashboardSummary(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const period = args.period || 'month';
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  const snapshot = await getDocs(transactionsRef);

  let income = 0;
  let expenses = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const txDate = data.date?.toDate?.() || new Date(data.date || Date.now());
    if (txDate >= startDate) {
      if (data.type === 'income') income += Number(data.amount) || 0;
      if (data.type === 'expense') expenses += Number(data.amount) || 0;
    }
  });

  // Get customer/vendor counts
  const customersSnapshot = await getDocs(collection(db, `companies/${companyId}/customers`));
  const vendorsSnapshot = await getDocs(collection(db, `companies/${companyId}/vendors`));
  const invoicesSnapshot = await getDocs(collection(db, `companies/${companyId}/invoices`));

  const openInvoices = invoicesSnapshot.docs.filter(doc => doc.data().status !== 'paid').length;

  return {
    success: true,
    message: `Here's your business dashboard summary for the past **${period}**.`,
    data: {
      type: 'summary',
      summary: {
        period,
        income,
        expenses,
        net: income - expenses,
        customerCount: customersSnapshot.size,
        vendorCount: vendorsSnapshot.size,
        openInvoices,
      },
    },
  };
}

// ==========================================
// BILL OPERATIONS
// ==========================================

async function createBill(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    // Get all accounts to find appropriate payable and expense accounts
    const accounts = await getAccounts(companyId);

    // Use preferred payable account, fallback to liability/accounts_payable, then any liability
    const payableAccount = await resolvePreferredAccount(companyId, accounts, 'defaultPayableAccountId', 'liability', 'accounts_payable');
    if (!payableAccount) {
      return {
        success: false,
        message: 'No active accounts payable account found. Please create one in Chart of Accounts.',
        error: 'Missing accounts payable account',
      };
    }

    // Use preferred expense account, fallback to category name match, then any expense
    const expenseAccount = await resolvePreferredAccount(companyId, accounts, 'defaultExpenseAccountId', 'expense', undefined, args.category);
    if (!expenseAccount) {
      return {
        success: false,
        message: 'No active expense account found. Please create one in Chart of Accounts.',
        error: 'Missing expense account',
      };
    }

    const items = args.items || [];
    const billItems = items.map((item: any) => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
    }));

    const subtotal = billItems.reduce((sum: number, item: any) => sum + item.amount, 0);
    const taxAmount = args.taxAmount ? Number(args.taxAmount) : 0;
    const total = subtotal + taxAmount;

    const billData = {
      vendorName: args.vendorName,
      items: billItems,
      issueDate: args.billDate ? Timestamp.fromDate(new Date(args.billDate)) : Timestamp.now(),
      dueDate: args.dueDate ? new Date(args.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal,
      taxAmount,
      total,
      amountPaid: 0,
      amountDue: total,
      status: 'unpaid' as const,
      category: args.category || '',
      notes: args.notes || '',
      accountingConfig: {
        payableAccountId: payableAccount.id,
        payableAccountCode: payableAccount.code,
        payableAccountName: payableAccount.name,
        expenseAccountId: expenseAccount.id,
        expenseAccountCode: expenseAccount.code,
        expenseAccountName: expenseAccount.name,
        createdBy: 'ai-assistant',
      },
    };

    // Use the service function to create bill with journal entry
    const billId = await createBillService(companyId, billData as any);

    return {
      success: true,
      message: `I've recorded a bill from **${args.vendorName}** for **$${total.toLocaleString()}** and created the corresponding journal entry.`,
      data: { type: 'entity', entityType: 'bill', entity: { id: billId, ...billData } },
      actions: [
        { type: 'view', label: 'View Bill', entityType: 'bill', entityId: billId, data: { id: billId, ...billData } },
      ],
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to create bill: ${error.message}`,
      error: error.message,
    };
  }
}

async function listBills(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const billsRef = collection(db, `companies/${companyId}/bills`);
  const snapshot = await getDocs(query(billsRef, orderBy('createdAt', 'desc'), limit(20)));
  const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (bills.length === 0) {
    return { success: true, message: "No bills recorded yet." };
  }

  return {
    success: true,
    message: `Here are your bills (${bills.length}):`,
    data: {
      type: 'list',
      entityType: 'bill',
      items: bills,
      columns: [
        { key: 'billNumber', label: 'Bill #', type: 'text' },
        { key: 'vendorName', label: 'Vendor', type: 'text' },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'status', label: 'Status', type: 'status' },
      ],
    },
  };
}

async function updateBill(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { billId, ...updateData } = args;

    if (!billId) {
      return { success: false, message: 'Bill ID is required to update a bill.' };
    }

    // Get the existing bill — try by doc ID, then scan by billNumber or vendor name
    const billsRef = collection(db, `companies/${companyId}/bills`);
    let resolvedId = billId;
    let docSnap = await getDoc(doc(db, `companies/${companyId}/bills`, billId)).catch(() => null as any);
    if (!docSnap?.exists()) {
      const allSnap = await getDocs(query(billsRef, orderBy('createdAt', 'desc'), limit(200)));
      const needle = billId.toLowerCase();
      const match = allSnap.docs.find(d => {
        const data = d.data();
        const vName = (data.vendorName || '').toLowerCase();
        const bNum = (data.billNumber || '').toLowerCase();
        return bNum === needle || vName.includes(needle) || needle.includes(vName);
      });
      if (match) { resolvedId = match.id; docSnap = match; }
    }
    if (!docSnap?.exists()) {
      return { success: false, message: `Bill not found with ID: ${billId}` };
    }

    const existingBill: any = { id: docSnap.id, ...docSnap.data() };

    // Prepare update data
    const preparedData: Record<string, any> = {};

    if (updateData.dueDate) {
      preparedData.dueDate = Timestamp.fromDate(new Date(updateData.dueDate));
    }
    if (updateData.items) {
      preparedData.items = updateData.items;
      // Recalculate totals
      const subtotal = updateData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
      const taxAmount = subtotal * ((updateData.taxRate || existingBill.taxRate || 0) / 100);
      const total = subtotal + taxAmount;
      preparedData.subtotal = subtotal;
      preparedData.taxAmount = taxAmount;
      preparedData.total = total;
    }
    if (updateData.taxRate !== undefined) preparedData.taxRate = updateData.taxRate;
    if (updateData.notes !== undefined) preparedData.notes = updateData.notes;

    await updateBillService(companyId, resolvedId, preparedData);

    return {
      success: true,
      message: `Bill **${existingBill.billNumber}** has been updated successfully.`,
      data: { type: 'entity', entityType: 'bill', entity: { ...existingBill, ...preparedData } },
      actions: [
        { type: 'view', label: 'View Bill', entityType: 'bill', entityId: resolvedId },
      ],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update bill: ${error.message}`, error: error.message };
  }
}

async function deleteBill(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { billId } = args;

    if (!billId) {
      return { success: false, message: 'Bill ID is required to delete a bill.' };
    }

    // Get the bill details before deleting
    const docSnap = await getDoc(doc(db, `companies/${companyId}/bills`, billId));
    if (!docSnap.exists()) {
      return { success: false, message: `Bill not found with ID: ${billId}` };
    }

    const bill : any = { id: docSnap.id, ...docSnap.data() };

    await deleteBillService(companyId, billId);

    return {
      success: true,
      message: `Bill **${bill.billNumber}** from **${bill.vendorName}** has been deleted successfully.`,
    };
  } catch (error: any) {
    return { success: false, message: `Failed to delete bill: ${error.message}`, error: error.message };
  }
}

// ==========================================
// QUOTE OPERATIONS
// ==========================================

async function createQuoteAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const customers = await getCustomers(companyId);
    let customer = customers.find(c =>
      c.name.toLowerCase() === args.customerName?.toLowerCase() ||
      c.email?.toLowerCase() === args.customerEmail?.toLowerCase()
    );

    if (!customer && args.customerName) {
      const customerId = await createCustomer(companyId, {
        name: args.customerName,
        email: args.customerEmail || '',
        phone: '', address: '', city: '', country: '', taxId: '', notes: '',
      });
      customer = { id: customerId, name: args.customerName, email: args.customerEmail || '' } as any;
    }

    if (!customer) {
      return { success: false, message: 'Customer name is required to create a quote.' };
    }

    const items = args.items || [{ description: args.description || 'Item', quantity: args.quantity || 1, rate: args.amount || 0, amount: (args.quantity || 1) * (args.amount || 0) }];

    const processedItems = items.map((item: any) => ({
      description: item.description || 'Item',
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.rate) || 0),
    }));

    const subtotal = processedItems.reduce((s: number, i: any) => s + i.amount, 0);
    const taxRate = Number(args.taxRate) || 0;
    const discount = Number(args.discount) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal - discount + tax;

    const quoteId = await createQuote(companyId, {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email || args.customerEmail || '',
      items: processedItems,
      expiryDate: args.expiryDate ? new Date(args.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      taxRate,
      discount,
      notes: args.notes || '',
      terms: args.terms || '',
    });

    const entity = {
      id: quoteId,
      customerName: customer.name,
      items: processedItems,
      subtotal,
      taxRate,
      tax,
      discount,
      total,
      status: 'draft',
      expiryDate: args.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return {
      success: true,
      message: `Quote created for **${customer.name}** — **$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}**`,
      data: { type: 'entity', entityType: 'quote' as any, entity },
      actions: [{ type: 'view', label: 'View Details', entityType: 'quote' as any, entityId: quoteId, data: entity }],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to create quote: ${error.message}`, error: error.message };
  }
}

async function listQuotes(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const quotes = await getQuotes(companyId);
  if (quotes.length === 0) {
    return { success: true, message: "No quotes found." };
  }
  return {
    success: true,
    message: `Here are your quotes (${quotes.length}):`,
    data: {
      type: 'list',
      entityType: 'quote' as any,
      items: quotes,
      columns: [
        { key: 'quoteNumber', label: 'Quote #', type: 'text' },
        { key: 'customerName', label: 'Customer', type: 'text' },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'status', label: 'Status', type: 'status' },
      ],
    },
  };
}

async function getQuote(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const { quoteId } = args;
  if (!quoteId) return { success: false, message: 'Quote ID is required.' };

  const quote = await getQuoteById(companyId, quoteId);
  if (!quote) return { success: false, message: `Quote not found with ID: ${quoteId}` };

  return {
    success: true,
    message: `Here are the details for quote **${quote.quoteNumber}**:`,
    data: { type: 'entity', entityType: 'quote' as any, entity: quote },
    actions: [{ type: 'view', label: 'View Quote', entityType: 'quote' as any, entityId: quote.id }],
  };
}

async function updateQuoteAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { quoteId, ...updateData } = args;
    if (!quoteId) return { success: false, message: 'Quote ID is required.' };

    const quote = await getQuoteById(companyId, quoteId);
    if (!quote) return { success: false, message: `Quote not found with ID: ${quoteId}` };

    await updateQuote(companyId, quoteId, updateData);

    return {
      success: true,
      message: `Quote **${quote.quoteNumber}** updated successfully.`,
      data: { type: 'entity', entityType: 'quote' as any, entity: { ...quote, ...updateData } },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update quote: ${error.message}`, error: error.message };
  }
}

async function deleteQuoteAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { quoteId } = args;
    if (!quoteId) return { success: false, message: 'Quote ID is required.' };

    const quote = await getQuoteById(companyId, quoteId);
    if (!quote) return { success: false, message: `Quote not found with ID: ${quoteId}` };

    await deleteQuote(companyId, quoteId);

    return { success: true, message: `Quote **${quote.quoteNumber}** deleted successfully.` };
  } catch (error: any) {
    return { success: false, message: `Failed to delete quote: ${error.message}`, error: error.message };
  }
}

// ==========================================
// PURCHASE ORDER OPERATIONS
// ==========================================

async function createPurchaseOrderAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const vendors = await getVendors(companyId);
    let vendor = vendors.find(v => v.name.toLowerCase() === args.vendorName?.toLowerCase());

    if (!vendor && args.vendorName) {
      return { success: false, message: `Vendor "${args.vendorName}" not found. Please create the vendor first.` };
    }

    if (!vendor) {
      return { success: false, message: 'Vendor name is required to create a purchase order.' };
    }

    const items = args.items || [{ description: args.description || 'Item', quantity: args.quantity || 1, rate: args.amount || 0, amount: (args.quantity || 1) * (args.amount || 0) }];

    const poId = await createPurchaseOrder(companyId, {
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorEmail: vendor.email || args.vendorEmail || '',
      items,
      expectedDate: args.expectedDate ? new Date(args.expectedDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      taxRate: Number(args.taxRate) || 0,
      discount: Number(args.discount) || 0,
      shippingAddress: args.shippingAddress || '',
      notes: args.notes || '',
      terms: args.terms || '',
    });

    return {
      success: true,
      message: `Purchase order created for **${vendor.name}**`,
      data: { type: 'entity', entityType: 'purchaseOrder' as any, entity: { id: poId, vendorName: vendor.name } },
      actions: [{ type: 'view', label: 'View PO', entityType: 'purchaseOrder' as any, entityId: poId }],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to create purchase order: ${error.message}`, error: error.message };
  }
}

async function listPurchaseOrders(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const pos = await getPurchaseOrders(companyId);
  if (pos.length === 0) {
    return { success: true, message: "No purchase orders found." };
  }
  return {
    success: true,
    message: `Here are your purchase orders (${pos.length}):`,
    data: {
      type: 'list',
      entityType: 'purchaseOrder' as any,
      items: pos,
      columns: [
        { key: 'poNumber', label: 'PO #', type: 'text' },
        { key: 'vendorName', label: 'Vendor', type: 'text' },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'status', label: 'Status', type: 'status' },
      ],
    },
  };
}

async function getPurchaseOrder(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const { poId } = args;
  if (!poId) return { success: false, message: 'PO ID is required.' };

  const po = await getPurchaseOrderById(companyId, poId);
  if (!po) return { success: false, message: `Purchase order not found with ID: ${poId}` };

  return {
    success: true,
    message: `Here are the details for PO **${po.poNumber}**:`,
    data: { type: 'entity', entityType: 'purchaseOrder' as any, entity: po },
    actions: [{ type: 'view', label: 'View PO', entityType: 'purchaseOrder' as any, entityId: po.id }],
  };
}

async function updatePurchaseOrderAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { poId, ...updateData } = args;
    if (!poId) return { success: false, message: 'PO ID is required.' };

    const po = await getPurchaseOrderById(companyId, poId);
    if (!po) return { success: false, message: `Purchase order not found with ID: ${poId}` };

    await updatePurchaseOrder(companyId, poId, updateData);

    return {
      success: true,
      message: `Purchase order **${po.poNumber}** updated successfully.`,
      data: { type: 'entity', entityType: 'purchaseOrder' as any, entity: { ...po, ...updateData } },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update purchase order: ${error.message}`, error: error.message };
  }
}

async function deletePurchaseOrderAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { poId } = args;
    if (!poId) return { success: false, message: 'PO ID is required.' };

    const po = await getPurchaseOrderById(companyId, poId);
    if (!po) return { success: false, message: `Purchase order not found with ID: ${poId}` };

    await deletePurchaseOrder(companyId, poId);

    return { success: true, message: `Purchase order **${po.poNumber}** deleted successfully.` };
  } catch (error: any) {
    return { success: false, message: `Failed to delete purchase order: ${error.message}`, error: error.message };
  }
}

// ==========================================
// CREDIT NOTE OPERATIONS
// ==========================================

async function createCreditNoteAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const customers = await getCustomers(companyId);
    let customer = customers.find(c => c.name.toLowerCase() === args.customerName?.toLowerCase());

    if (!customer && args.customerName) {
      return { success: false, message: `Customer "${args.customerName}" not found. Please create the customer first.` };
    }

    if (!customer) {
      return { success: false, message: 'Customer name is required to create a credit note.' };
    }

    const items = args.items || [{ description: args.description || 'Credit', quantity: args.quantity || 1, rate: args.amount || 0, amount: (args.quantity || 1) * (args.amount || 0) }];

    const cnId = await createCreditNote(companyId, {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email || args.customerEmail || '',
      items,
      reason: args.reason || 'Refund',
      taxRate: Number(args.taxRate) || 0,
      notes: args.notes || '',
    });

    return {
      success: true,
      message: `Credit note created for **${customer.name}**`,
      data: { type: 'entity', entityType: 'creditNote' as any, entity: { id: cnId, customerName: customer.name } },
      actions: [{ type: 'view', label: 'View Credit Note', entityType: 'creditNote' as any, entityId: cnId }],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to create credit note: ${error.message}`, error: error.message };
  }
}

async function listCreditNotes(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const cns = await getCreditNotes(companyId);
  if (cns.length === 0) {
    return { success: true, message: "No credit notes found." };
  }
  return {
    success: true,
    message: `Here are your credit notes (${cns.length}):`,
    data: {
      type: 'list',
      entityType: 'creditNote' as any,
      items: cns,
      columns: [
        { key: 'creditNoteNumber', label: 'CN #', type: 'text' },
        { key: 'customerName', label: 'Customer', type: 'text' },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'status', label: 'Status', type: 'status' },
      ],
    },
  };
}

async function getCreditNote(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const { cnId } = args;
  if (!cnId) return { success: false, message: 'Credit note ID is required.' };

  const cn = await getCreditNoteById(companyId, cnId);
  if (!cn) return { success: false, message: `Credit note not found with ID: ${cnId}` };

  return {
    success: true,
    message: `Here are the details for credit note **${cn.creditNoteNumber}**:`,
    data: { type: 'entity', entityType: 'creditNote' as any, entity: cn },
    actions: [{ type: 'view', label: 'View Credit Note', entityType: 'creditNote' as any, entityId: cn.id }],
  };
}

async function updateCreditNoteAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { cnId, ...updateData } = args;
    if (!cnId) return { success: false, message: 'Credit note ID is required.' };

    const cn = await getCreditNoteById(companyId, cnId);
    if (!cn) return { success: false, message: `Credit note not found with ID: ${cnId}` };

    await updateCreditNote(companyId, cnId, updateData);

    return {
      success: true,
      message: `Credit note **${cn.creditNoteNumber}** updated successfully.`,
      data: { type: 'entity', entityType: 'creditNote' as any, entity: { ...cn, ...updateData } },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update credit note: ${error.message}`, error: error.message };
  }
}

async function deleteCreditNoteAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { cnId } = args;
    if (!cnId) return { success: false, message: 'Credit note ID is required.' };

    const cn = await getCreditNoteById(companyId, cnId);
    if (!cn) return { success: false, message: `Credit note not found with ID: ${cnId}` };

    await deleteCreditNote(companyId, cnId);

    return { success: true, message: `Credit note **${cn.creditNoteNumber}** deleted successfully.` };
  } catch (error: any) {
    return { success: false, message: `Failed to delete credit note: ${error.message}`, error: error.message };
  }
}

// ==========================================
// RECURRING TRANSACTION OPERATIONS
// ==========================================

async function createRecurringTransactionAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const type = args.type || 'simple';
    let rtId: string;

    // Parse dates safely — convert string to Date
    const startDate = args.startDate ? new Date(args.startDate) : new Date();
    const endDate = args.endDate ? new Date(args.endDate) : undefined;

    if (type === 'invoice') {
      rtId = await createRecurringInvoice(companyId, {
        ...args,
        startDate,
        endDate,
      } as any);
    } else if (type === 'bill') {
      rtId = await createRecurringBill(companyId, {
        ...args,
        startDate,
        endDate,
      } as any);
    } else {
      // Simple transaction — needs accountId, accountName, transactionType
      const accounts = await getAccounts(companyId);
      let account = await resolvePreferredAccount(companyId, accounts, 'defaultExpenseAccountId', 'expense');
      if (!account) account = accounts.find(a => a.isActive);

      rtId = await createRecurringSimpleTransaction(companyId, {
        name: args.name || 'Recurring Transaction',
        transactionType: args.transactionType || 'expense',
        amount: Number(args.amount) || 0,
        description: args.description || args.name || 'Recurring',
        accountId: account?.id || '',
        accountName: account?.name || 'General',
        category: args.category || '',
        frequency: args.frequency || 'monthly',
        startDate,
        endDate,
      });
    }

    const entity = {
      id: rtId,
      name: args.name,
      frequency: args.frequency,
      type,
      amount: args.amount,
      isActive: true,
    };

    return {
      success: true,
      message: `Recurring **${args.frequency}** ${type} transaction **${args.name}** created successfully.`,
      data: { type: 'entity', entityType: 'recurring_transaction' as any, entity },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to create recurring transaction: ${error.message}`, error: error.message };
  }
}

async function listRecurringTransactionsAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const rts = await getRecurringTransactions(companyId);
  if (rts.length === 0) {
    return { success: true, message: "No recurring transactions found." };
  }
  return {
    success: true,
    message: `Here are your recurring transactions (${rts.length}):`,
    data: {
      type: 'list',
      entityType: 'recurringTransaction',
      items: rts,
      columns: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'type', label: 'Type', type: 'status' },
        { key: 'frequency', label: 'Frequency', type: 'text' },
        { key: 'isActive', label: 'Active', type: 'status' },
      ],
    },
  };
}

async function updateRecurringTransactionAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { rtId, ...updateData } = args;
    if (!rtId) return { success: false, message: 'Recurring transaction ID is required.' };

    await updateRecurringTransaction(companyId, rtId, updateData);

    return {
      success: true,
      message: `Recurring transaction updated successfully.`,
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update recurring transaction: ${error.message}`, error: error.message };
  }
}

async function deleteRecurringTransactionAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { rtId } = args;
    if (!rtId) return { success: false, message: 'Recurring transaction ID is required.' };

    await deleteRecurringTransaction(companyId, rtId);

    return { success: true, message: `Recurring transaction deleted successfully.` };
  } catch (error: any) {
    return { success: false, message: `Failed to delete recurring transaction: ${error.message}`, error: error.message };
  }
}

// ==========================================
// JOURNAL ENTRY OPERATIONS
// ==========================================

async function listJournalEntriesAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const entries = await getJournalEntries(companyId);
  if (entries.length === 0) {
    return { success: true, message: "No journal entries found." };
  }
  return {
    success: true,
    message: `Here are your journal entries (${entries.length}):`,
    data: {
      type: 'list',
      entityType: 'journalEntry' as any,
      items: entries,
      columns: [
        { key: 'entryNumber', label: 'Entry #', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'totalDebit', label: 'Debit', type: 'currency' },
        { key: 'totalCredit', label: 'Credit', type: 'currency' },
      ],
    },
  };
}

async function getJournalEntry(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const { entryId } = args;
  if (!entryId) return { success: false, message: 'Journal entry ID is required.' };

  const entry = await getJournalEntryById(companyId, entryId);
  if (!entry) return { success: false, message: `Journal entry not found with ID: ${entryId}` };

  return {
    success: true,
    message: `Here are the details for journal entry **${entry.entryNumber}**:`,
    data: { type: 'entity', entityType: 'journalEntry' as any, entity: entry },
    actions: [{ type: 'view', label: 'View Entry', entityType: 'journalEntry' as any, entityId: entry.id }],
  };
}

async function updateJournalEntryAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { entryId, ...updateData } = args;
    if (!entryId) return { success: false, message: 'Journal entry ID is required.' };

    const entry = await getJournalEntryById(companyId, entryId);
    if (!entry) return { success: false, message: `Journal entry not found with ID: ${entryId}` };

    await updateJournalEntry(companyId, entryId, updateData);

    return {
      success: true,
      message: `Journal entry **${entry.entryNumber}** updated successfully.`,
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update journal entry: ${error.message}`, error: error.message };
  }
}

async function deleteJournalEntryAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { entryId } = args;
    if (!entryId) return { success: false, message: 'Journal entry ID is required.' };

    const entry = await getJournalEntryById(companyId, entryId);
    if (!entry) return { success: false, message: `Journal entry not found with ID: ${entryId}` };

    await deleteJournalEntry(companyId, entryId);

    return { success: true, message: `Journal entry **${entry.entryNumber}** deleted successfully.` };
  } catch (error: any) {
    return { success: false, message: `Failed to delete journal entry: ${error.message}`, error: error.message };
  }
}

// ==========================================
// BANK ACCOUNT OPERATIONS
// ==========================================

async function createBankAccountAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const openingBalance = Number(args.balance) || 0;

    // Use preferred linked asset account, fallback to asset/cash or current_asset
    const accounts = await getAccounts(companyId);
    let linkedAccount = await resolvePreferredAccount(companyId, accounts, 'defaultLinkedAssetAccountId', 'asset', 'cash');
    if (!linkedAccount) linkedAccount = accounts.find(a => a.isActive && a.typeCode === 'asset' && a.subtypeCode === 'current_asset');
    if (!linkedAccount) linkedAccount = accounts.find(a => a.isActive && a.typeCode === 'asset');

    // Use preferred equity account, fallback to any equity
    const obAccount = await resolvePreferredAccount(companyId, accounts, 'defaultEquityAccountId', 'equity');

    const accountId = await createBankAccount(companyId, {
      bankName: args.bankName || '',
      name: args.accountName || args.name || 'Bank Account',
      accountNumber: args.accountNumber || '',
      accountType: args.accountType || 'checking',
      currency: args.currency || 'USD',
      openingBalance,
      linkedAccountId: linkedAccount?.id || '',
      linkedAccountName: linkedAccount?.name || '',
      linkedAccountCode: linkedAccount?.code || '',
      openingBalanceAccountId: obAccount?.id || '',
      openingBalanceAccountName: obAccount?.name || '',
      openingBalanceAccountCode: obAccount?.code || '',
      createdBy: 'ai-assistant',
    });

    const entity = {
      id: accountId,
      accountName: args.accountName || args.name,
      bankName: args.bankName,
      accountType: args.accountType || 'checking',
      currency: args.currency || 'USD',
      balance: openingBalance,
    };

    return {
      success: true,
      message: `Bank account **${entity.accountName}** at **${args.bankName}** created with opening balance of **$${openingBalance.toLocaleString()}**.`,
      data: { type: 'entity', entityType: 'bank_account' as any, entity },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to create bank account: ${error.message}`, error: error.message };
  }
}

async function listBankAccountsAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const accounts = await getBankAccounts(companyId);
  if (accounts.length === 0) {
    return { success: true, message: "No bank accounts found." };
  }
  return {
    success: true,
    message: `Here are your bank accounts (${accounts.length}):`,
    data: {
      type: 'list',
      entityType: 'bankAccount' as any,
      items: accounts,
      columns: [
        { key: 'accountName', label: 'Account', type: 'text' },
        { key: 'bankName', label: 'Bank', type: 'text' },
        { key: 'balance', label: 'Balance', type: 'currency' },
        { key: 'isActive', label: 'Active', type: 'status' },
      ],
    },
  };
}

async function updateBankAccountAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { accountId, ...updateData } = args;
    if (!accountId) return { success: false, message: 'Bank account ID is required.' };

    await updateBankAccount(companyId, accountId, updateData);

    return {
      success: true,
      message: `Bank account updated successfully.`,
    };
  } catch (error: any) {
    return { success: false, message: `Failed to update bank account: ${error.message}`, error: error.message };
  }
}

async function deleteBankAccountAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const { accountId } = args;
    if (!accountId) return { success: false, message: 'Bank account ID is required.' };

    await deleteBankAccount(companyId, accountId);

    return { success: true, message: `Bank account deleted successfully.` };
  } catch (error: any) {
    return { success: false, message: `Failed to delete bank account: ${error.message}`, error: error.message };
  }
}

// ==========================================
// SALARY/PAYROLL OPERATIONS
// ==========================================

async function generateSalarySlipAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    // Resolve employee ID — lookup by name if no ID provided
    let employeeId = args.employeeId;
    let employeeName = args.employeeName || '';

    if (!employeeId && employeeName) {
      const employees = await getActiveEmployees(companyId);
      const match = employees.find(e =>
        e.name.toLowerCase().includes(employeeName.toLowerCase()) ||
        employeeName.toLowerCase().includes(e.name.toLowerCase())
      );
      if (match) {
        employeeId = match.id;
        employeeName = match.name;
      }
    }

    if (!employeeId) {
      // Still no ID — ask if user wants to create the employee
      const employees = await getActiveEmployees(companyId);
      if (employees.length === 0) {
        return {
          success: false,
          message: employeeName
            ? `I couldn't find **${employeeName}** as an employee. Would you like me to add them as an employee first? Just confirm and I'll create the employee record, then generate the salary slip.`
            : 'No active employees found. Would you like me to add an employee first?',
        };
      }
      const names = employees.map(e => e.name).join(', ');
      return {
        success: false,
        message: `I couldn't find **${employeeName}** in the employee list. Would you like me to add **${employeeName}** as a new employee and then generate the salary slip? Or did you mean one of these: ${names}?`,
      };
    }

    const month = Number(args.month);
    const year = Number(args.year);

    if (!month || !year) {
      return { success: false, message: 'Month and year are required to generate a salary slip.' };
    }

    // Map AI's flexible allowance/deduction keys to the service's expected format
    const rawAllowances = args.allowances || {};
    const allowances = {
      hra: Number(rawAllowances.hra || rawAllowances.housing || rawAllowances.houseRent || 0),
      da: Number(rawAllowances.da || rawAllowances.dearness || 0),
      ta: Number(rawAllowances.ta || rawAllowances.transport || rawAllowances.travel || rawAllowances.transportation || 0),
      other: Number(rawAllowances.other || rawAllowances.medical || rawAllowances.food || rawAllowances.misc || 0),
    };

    const rawDeductions = args.deductions || {};
    const deductions = {
      tax: Number(rawDeductions.tax || rawDeductions.incomeTax || 0),
      providentFund: Number(rawDeductions.providentFund || rawDeductions.pf || rawDeductions.pension || 0),
      loan: Number(rawDeductions.loan || rawDeductions.advance || 0),
      other: Number(rawDeductions.other || rawDeductions.insurance || rawDeductions.misc || 0),
    };

    const slipId = await generateSalarySlip(companyId, employeeId, month, year, allowances, deductions);

    // Fetch employee details for rich card
    const employees = await getActiveEmployees(companyId);
    const emp = employees.find(e => e.id === employeeId);
    const basicSalary = emp?.salary || 0;
    const totalEarnings = basicSalary + allowances.hra + allowances.da + allowances.ta + allowances.other;
    const totalDeductions = deductions.tax + deductions.providentFund + deductions.loan + deductions.other;
    const netPay = totalEarnings - totalDeductions;

    const monthName = new Date(year, month - 1).toLocaleString('en', { month: 'long' });

    const entity = {
      id: slipId,
      employeeName: employeeName || emp?.name || 'Employee',
      designation: emp?.designation || '',
      month,
      year,
      basicSalary,
      totalEarnings,
      totalDeductions,
      netPay,
      status: 'generated',
    };

    return {
      success: true,
      message: `Salary slip generated for **${entity.employeeName}** — ${monthName} ${year}\n\nBasic: $${basicSalary.toLocaleString()} | Allowances: +$${(allowances.hra + allowances.da + allowances.ta + allowances.other).toLocaleString()} | Deductions: -$${totalDeductions.toLocaleString()} | **Net Pay: $${netPay.toLocaleString()}**`,
      data: { type: 'entity', entityType: 'salary_slip' as any, entity },
      actions: [
        {
          type: 'view' as const,
          label: 'View Salary Slip',
          entityType: 'salary_slip' as any,
          entityId: slipId,
          data: { ...entity },
        },
        {
          type: 'download' as const,
          label: 'Download PDF',
          entityType: 'salary_slip' as any,
          entityId: slipId,
        },
      ],
    };
  } catch (error: any) {
    return { success: false, message: `Failed to generate salary slip: ${error.message}`, error: error.message };
  }
}

async function listSalarySlipsAI(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  const slips = await getSalarySlips(companyId);
  if (slips.length === 0) {
    return { success: true, message: "No salary slips found." };
  }
  return {
    success: true,
    message: `Here are your salary slips (${slips.length}):`,
    data: {
      type: 'list',
      entityType: 'salarySlip' as any,
      items: slips,
      columns: [
        { key: 'employeeName', label: 'Employee', type: 'text' },
        { key: 'month', label: 'Month', type: 'text' },
        { key: 'year', label: 'Year', type: 'text' },
        { key: 'netSalary', label: 'Net Salary', type: 'currency' },
        { key: 'status', label: 'Status', type: 'status' },
      ],
    },
  };
}

// ==========================================
// SEND INVOICE VIA EMAIL
// ==========================================

async function sendInvoiceViaEmail(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const validation = validateRequired(args, ['invoiceId']);
    if (validation) return validation;

    const { invoiceId } = args;

    // Find invoice by number or ID
    const invoicesRef = collection(db, `companies/${companyId}/invoices`);
    const q = query(invoicesRef, where('invoiceNumber', '==', invoiceId));
    let snapshot = await getDocs(q);

    if (snapshot.empty) {
      try {
        const docRef = doc(db, `companies/${companyId}/invoices`, invoiceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          snapshot = { docs: [docSnap], empty: false } as any;
        }
      } catch (e) { /* invalid doc ID */ }
    }

    // Last resort: scan all invoices and match by invoiceNumber (handles missing index / casing)
    if (snapshot.empty) {
      const allSnap = await getDocs(query(invoicesRef, orderBy('createdAt', 'desc'), limit(200)));
      const match = allSnap.docs.find(d => {
        const num = d.data().invoiceNumber as string | undefined;
        return num?.toLowerCase() === invoiceId.toLowerCase();
      });
      if (match) snapshot = { docs: [match], empty: false } as any;
    }

    if (snapshot.empty) {
      return { success: false, message: `Couldn't find invoice "${invoiceId}". Please check the invoice number.` };
    }

    const invoiceDoc = snapshot.docs[0];
    const invoice: any = { id: invoiceDoc.id, ...invoiceDoc.data() };

    if (invoice.status !== 'draft') {
      return {
        success: false,
        message: `Invoice **${invoice.invoiceNumber}** is already **${invoice.status}**. Only draft invoices can be sent via email.`,
      };
    }

    if (!invoice.customerEmail) {
      return {
        success: false,
        message: `Invoice **${invoice.invoiceNumber}** has no customer email. Please update the customer's email first.`,
      };
    }

    // Call the comprehensive status API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/invoices/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, invoiceId: invoiceDoc.id, newStatus: 'sent' }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || 'Failed to send invoice email.',
      };
    }

    let msg = `✓ Invoice **${invoice.invoiceNumber}** has been sent to **${invoice.customerEmail}**.`;
    if (result.emailSent) msg += `\n\nThe invoice PDF was attached to the email.`;
    msg += ` Status changed to **Sent**.`;
    if (result.accountingActions?.length > 0) {
      msg += `\n\n📒 Accounting: ${result.accountingActions.join(', ')}`;
    }

    return {
      success: true,
      message: msg,
      data: {
        type: 'entity',
        entityType: 'invoice',
        entity: { ...invoice, status: 'sent' },
      },
      actions: [
        {
          type: 'view',
          label: 'View Invoice',
          entityType: 'invoice',
          entityId: invoiceDoc.id,
          data: { ...invoice, status: 'sent' },
        },
      ],
    };
  } catch (error: any) {
    return handleError(error, 'Send invoice');
  }
}

// ==========================================
// STATUS MANAGEMENT OPERATIONS
// ==========================================

async function changeInvoiceStatus(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const validation = validateRequired(args, ['invoiceId', 'newStatus']);
    if (validation) return validation;

    const { invoiceId, newStatus } = args;

    // Get current invoice - try by invoice number first, then by document ID
    const invoicesRef = collection(db, `companies/${companyId}/invoices`);
    const q = query(invoicesRef, where('invoiceNumber', '==', invoiceId));
    let snapshot = await getDocs(q);

    // If not found by invoice number, try by document ID
    if (snapshot.empty) {
      try {
        const docRef = doc(db, `companies/${companyId}/invoices`, invoiceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          snapshot = { docs: [docSnap], empty: false } as any;
        }
      } catch (e) {
        // Invalid document ID format
      }
    }

    // Last resort: scan all invoices and match by invoiceNumber (handles missing index / casing)
    if (snapshot.empty) {
      const allSnap = await getDocs(query(invoicesRef, orderBy('createdAt', 'desc'), limit(200)));
      const match = allSnap.docs.find(d => {
        const num = d.data().invoiceNumber as string | undefined;
        return num?.toLowerCase() === invoiceId.toLowerCase();
      });
      if (match) snapshot = { docs: [match], empty: false } as any;
    }

    if (snapshot.empty) {
      return { success: false, message: `Couldn't find invoice "${invoiceId}". Please check the invoice number or ID.` };
    }

    const invoiceDoc = snapshot.docs[0];
    const invoice: any = { id: invoiceDoc.id, ...invoiceDoc.data() };
    const currentStatus = invoice.status;

    // Show allowed transitions if requested
    if (!newStatus || newStatus === 'help' || newStatus === '?') {
      const allowedStatuses = getAllowedTransitions('invoice', currentStatus);
      if (allowedStatuses.length === 0) {
        return {
          success: true,
          message: `Invoice **${invoiceId}** is currently **${formatStatus('invoice', currentStatus)}**. No status changes are allowed from this status.`,
        };
      }

      const statusList = allowedStatuses.map(s => {
        const option = getStatusOption('invoice', s);
        return `• **${option?.label || s}**: ${option?.description || ''}`;
      }).join('\n');

      return {
        success: true,
        message: `Invoice **${invoiceId}** is currently **${formatStatus('invoice', currentStatus)}**.\n\nYou can change it to:\n${statusList}`,
        followUp: 'Which status would you like to set?',
      };
    }

    // Use the comprehensive status API for all transitions (handles accounting + email)
    try {
      const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      const res = await fetch(`${baseUrl}/api/invoices/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          invoiceId: invoiceDoc.id,
          newStatus,
          paymentAmount: args.paymentAmount,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, message: result.error || `Failed to change status to ${newStatus}` };
      }

      let message = `✓ Invoice **${invoiceId}** status changed from **${formatStatus('invoice', currentStatus)}** to **${formatStatus('invoice', newStatus)}**`;
      if (result.emailSent) {
        message += ` Notification email sent to **${invoice.customerEmail}**.`;
      }
      if (result.accountingActions?.length > 0) {
        message += `\n\n📒 Accounting: ${result.accountingActions.join(', ')}`;
      }

      return {
        success: true,
        message,
        data: {
          type: 'entity',
          entityType: 'invoice',
          entity: { ...invoice, status: newStatus },
        },
        actions: [
          {
            type: 'view',
            label: 'View Invoice',
            entityType: 'invoice',
            entityId: invoiceDoc.id,
            data: { ...invoice, status: newStatus },
          },
        ],
      };
    } catch (fetchError: any) {
      // Fallback to client-side status update if API call fails
      await updateInvoiceStatus(companyId, invoiceDoc.id, newStatus);
      return {
        success: true,
        message: `✓ Invoice **${invoiceId}** status changed to **${formatStatus('invoice', newStatus)}** (accounting entries may not have been created)`,
        data: {
          type: 'entity',
          entityType: 'invoice',
          entity: { ...invoice, status: newStatus },
        },
        actions: [
          {
            type: 'view',
            label: 'View Invoice',
            entityType: 'invoice',
            entityId: invoiceDoc.id,
            data: { ...invoice, status: newStatus },
          },
        ],
      };
    }
  } catch (error: any) {
    return handleError(error, 'Change invoice status');
  }
}

async function changeBillStatus(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const validation = validateRequired(args, ['billId', 'newStatus']);
    if (validation) return validation;

    const { billId, newStatus } = args;

    // Get current bill - try by bill number, then document ID, then vendor name
    const billsRef = collection(db, `companies/${companyId}/bills`);
    const q = query(billsRef, where('billNumber', '==', billId));
    let snapshot = await getDocs(q);

    // If not found by bill number, try by document ID
    if (snapshot.empty) {
      try {
        const docRef = doc(db, `companies/${companyId}/bills`, billId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          snapshot = { docs: [docSnap], empty: false } as any;
        }
      } catch (e) {
        // Invalid document ID format
      }
    }

    // If still not found, try scanning by vendor name (case-insensitive)
    if (snapshot.empty) {
      const allSnap = await getDocs(query(billsRef, orderBy('createdAt', 'desc'), limit(200)));
      const needle = billId.toLowerCase();
      const match = allSnap.docs.find(d => {
        const data = d.data();
        const vName = (data.vendorName || '').toLowerCase();
        const bNum = (data.billNumber || '').toLowerCase();
        return vName.includes(needle) || needle.includes(vName) || bNum === needle;
      });
      if (match) snapshot = { docs: [match], empty: false } as any;
    }

    if (snapshot.empty) {
      return { success: false, message: `Couldn't find bill "${billId}". Please check the bill number or vendor name.` };
    }

    const billDoc = snapshot.docs[0];
    const bill: any = { id: billDoc.id, ...billDoc.data() };
    const currentStatus = bill.status;

    // Show allowed transitions if requested
    if (!newStatus || newStatus === 'help' || newStatus === '?') {
      const allowedStatuses = getAllowedTransitions('bill', currentStatus);
      if (allowedStatuses.length === 0) {
        return {
          success: true,
          message: `Bill **${billId}** is currently **${formatStatus('bill', currentStatus)}**. No status changes are allowed from this status.`,
        };
      }

      const statusList = allowedStatuses.map(s => {
        const option = getStatusOption('bill', s);
        return `• **${option?.label || s}**: ${option?.description || ''}`;
      }).join('\n');

      return {
        success: true,
        message: `Bill **${billId}** is currently **${formatStatus('bill', currentStatus)}**.\n\nYou can change it to:\n${statusList}`,
        followUp: 'Which status would you like to set?',
      };
    }

    // Update the status
    await updateBillStatus(companyId, billDoc.id, newStatus);

    return {
      success: true,
      message: `✓ Bill **${billId}** status changed from **${formatStatus('bill', currentStatus)}** to **${formatStatus('bill', newStatus)}**`,
      data: {
        type: 'entity',
        entityType: 'bill',
        entity: { ...bill, status: newStatus },
      },
      actions: [
        {
          type: 'view',
          label: 'View Bill',
          entityType: 'bill',
          entityId: billDoc.id,
          data: { ...bill, status: newStatus },
        },
      ],
    };
  } catch (error: any) {
    return handleError(error, 'Change bill status');
  }
}

async function changeSalarySlipStatus(args: Record<string, any>, companyId: string): Promise<ToolResult> {
  try {
    const validation = validateRequired(args, ['slipId', 'newStatus']);
    if (validation) return validation;

    const { slipId, newStatus } = args;

    // Get current salary slip
    const slip = await getSalarySlips(companyId).then(slips =>
      slips.find(s => s.id === slipId || s.employeeName.toLowerCase().includes(slipId.toLowerCase()))
    );

    if (!slip) {
      return { success: false, message: `Couldn't find salary slip "${slipId}"` };
    }

    const currentStatus = slip.status;

    // Show allowed transitions if requested
    if (!newStatus || newStatus === 'help' || newStatus === '?') {
      const allowedStatuses = getAllowedTransitions('salarySlip', currentStatus);
      if (allowedStatuses.length === 0) {
        return {
          success: true,
          message: `Salary slip for **${slip.employeeName}** is currently **${formatStatus('salarySlip', currentStatus)}**. No status changes are allowed from this status.`,
        };
      }

      const statusList = allowedStatuses.map(s => {
        const option = getStatusOption('salarySlip', s);
        return `• **${option?.label || s}**: ${option?.description || ''}`;
      }).join('\n');

      return {
        success: true,
        message: `Salary slip for **${slip.employeeName}** is currently **${formatStatus('salarySlip', currentStatus)}**.\n\nYou can change it to:\n${statusList}`,
        followUp: 'Which status would you like to set?',
      };
    }

    // Update the status
    await updateSalarySlipStatus(companyId, slip.id, newStatus);

    return {
      success: true,
      message: `✓ Salary slip for **${slip.employeeName}** status changed from **${formatStatus('salarySlip', currentStatus)}** to **${formatStatus('salarySlip', newStatus)}**`,
      data: {
        type: 'entity',
        entityType: 'salarySlip' as any,
        entity: { ...slip, status: newStatus },
      },
    };
  } catch (error: any) {
    return handleError(error, 'Change salary slip status');
  }
}
