/**
 * Company Snapshot Service
 *
 * Builds a COMPLETE snapshot of all company data and caches it:
 *   L1 — Module-level in-memory Map (60 s, per warm instance)
 *   L2 — Firestore cache doc (10 min, cross-instance)
 *
 * Every module is included: customers, vendors, employees, invoices, bills,
 * quotes, purchase orders, credit notes, recurring transactions, journal entries,
 * transactions, bank accounts, accounts, salary slips, and company settings.
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const db = getFirestore();

// No caching — always build fresh so every new entry / settings change is immediately visible to AI

// ==========================================
// TYPES
// ==========================================

export interface CompanySnapshot {
  // Identity
  companyId: string;
  companyName: string;
  currency: string;
  cachedAt: string;

  // Company profile / invoice sender details
  description?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  taxRate?: number;
  taxName?: string;
  businessType?: string;
  enableTax?: boolean;
  hasInventory?: boolean;
  hasEmployees?: boolean;
  invoicePrefix?: string;
  billPrefix?: string;
  invoiceNextNumber?: number;
  billNextNumber?: number;
  invoiceDefaultTerms?: number;
  billDefaultTerms?: number;
  invoiceDefaultTaxRate?: number;
  invoiceNotes?: string;
  invoiceFooter?: string;
  dateFormat?: string;
  fiscalYearStart?: number;
  showDecimalPlaces?: number;

  // Bank
  bankAccounts: Array<{
    id: string; name: string; bankName: string;
    balance: number; currency: string; accountType: string; accountNumber?: string;
  }>;
  totalCashBalance: number;

  // Chart of accounts
  accounts: Array<{
    id: string; name: string; code: string;
    type: string; subtype: string; balance: number; description?: string;
  }>;

  // Customers — ALL active
  customers: Array<{
    id: string; name: string; email?: string; phone?: string;
    address?: string; city?: string; country?: string;
    taxId?: string; notes?: string; currency?: string;
    paymentTermsDays?: number; totalOwed: number; overdueAmount: number;
  }>;
  totalReceivable: number;
  totalOverdueReceivable: number;

  // Vendors — ALL active
  vendors: Array<{
    id: string; name: string; email?: string; phone?: string;
    address?: string; city?: string; country?: string;
    taxId?: string; notes?: string; currency?: string;
    totalOwed: number; overdueAmount: number;
  }>;
  totalPayable: number;
  totalOverduePayable: number;

  // Employees — ALL active
  employees: Array<{
    id: string; name: string; email?: string; phone?: string;
    position?: string; department?: string; salary?: number;
    joiningDate?: string; isActive: boolean;
  }>;

  // Invoice summary + records
  invoiceSummary: {
    draft: number; sent: number; overdue: number; paid: number; cancelled: number;
    paidThisMonth: number; totalOutstanding: number; totalOverdue: number; revenueThisMonth: number;
  };
  invoices: Array<{
    id: string; invoiceNumber: string; customerName: string; customerId?: string;
    totalAmount: number; taxAmount?: number; status: string;
    issueDate: string; dueDate?: string; paidAt?: string; notes?: string;
  }>;

  // Bill summary + records
  billSummary: {
    draft: number; unpaid: number; overdue: number; paid: number; cancelled: number;
    paidThisMonth: number; totalUnpaid: number; totalOverdue: number; expensesThisMonth: number;
  };
  bills: Array<{
    id: string; billNumber: string; vendorName: string; vendorId?: string;
    totalAmount: number; taxAmount?: number; status: string;
    issueDate: string; dueDate?: string; paidAt?: string; notes?: string;
  }>;

  // Quotes
  quotes: Array<{
    id: string; quoteNumber: string; customerName: string;
    totalAmount: number; status: string; issueDate: string; expiryDate?: string;
  }>;

  // Purchase Orders
  purchaseOrders: Array<{
    id: string; poNumber: string; vendorName: string;
    totalAmount: number; status: string; issueDate: string; deliveryDate?: string;
  }>;

  // Credit Notes
  creditNotes: Array<{
    id: string; creditNoteNumber: string; customerName: string;
    totalAmount: number; status: string; issueDate: string;
  }>;

  // Recurring Transactions — ALL
  recurringTransactions: Array<{
    id: string; name: string; type: string; frequency: string;
    amount?: number; nextDate?: string; isActive: boolean;
    customerName?: string; vendorName?: string;
  }>;

  // Transactions
  transactions: Array<{
    id: string; date: string; description: string; amount: number;
    type: string; category?: string; accountName?: string; reference?: string;
  }>;

  // Journal Entries
  journalEntries: Array<{
    id: string; entryNumber: string; date: string;
    description: string; totalDebit: number; totalCredit: number;
  }>;

  // Salary Slips
  salarySlips: Array<{
    id: string; employeeName: string; month: string; year: number;
    netSalary: number; status: string;
  }>;
}

// ==========================================
// L1 IN-MEMORY CACHE
// ==========================================

// ==========================================
// PUBLIC API
// ==========================================

export async function getCompanySnapshot(companyId: string): Promise<CompanySnapshot> {
  // Always build fresh — no caching so every new entry / settings change is immediately visible
  return buildSnapshot(companyId);
}

export function invalidateCompanySnapshot(_companyId: string): void {
  // No-op — snapshot is always built fresh, nothing to invalidate
}

// ==========================================
// HELPERS
// ==========================================

function tsToDate(val: any): string {
  if (!val) return '';
  if (typeof val.toDate === 'function') return val.toDate().toISOString().slice(0, 10);
  if (val._seconds != null) return new Date(val._seconds * 1000).toISOString().slice(0, 10);
  if (val.seconds != null) return new Date(val.seconds * 1000).toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function sumDocs(docs: FirebaseFirestore.QueryDocumentSnapshot[], field: string): number {
  return docs.reduce((s, d) => s + (d.data()[field] ?? 0), 0);
}

// ==========================================
// SNAPSHOT BUILDER
// ==========================================

async function buildSnapshot(companyId: string): Promise<CompanySnapshot> {
  const base = `companies/${companyId}`;
  const startOfMonth = Timestamp.fromDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // All Firestore reads in a single parallel round-trip
  const [
    companyDoc,
    // Master data
    bankAccountsSnap,
    accountsSnap,
    customersSnap,
    vendorsSnap,
    employeesSnap,
    recurringSnap,
    // Invoice status slices (for counts + summaries)
    draftInvSnap,
    sentInvSnap,
    overdueInvSnap,
    paidInvMonthSnap,
    cancelledInvSnap,
    // Bill status slices
    draftBillSnap,
    unpaidBillSnap,
    overdueBillSnap,
    paidBillMonthSnap,
    cancelledBillSnap,
    // Outstanding amounts for receivable/payable totals
    outstandingInvSnap,
    outstandingBillSnap,
    // Document records
    invoicesSnap,
    billsSnap,
    quotesSnap,
    purchaseOrdersSnap,
    creditNotesSnap,
    transactionsSnap,
    journalEntriesSnap,
    salarySlipsSnap,
  ] = await Promise.all([
    db.doc(base).get(),
    // Master data — get ALL
    db.collection(`${base}/bankAccounts`).get(),
    db.collection(`${base}/accounts`).where('isActive', '==', true).get(),
    db.collection(`${base}/customers`).where('isActive', '==', true).limit(500).get(),
    db.collection(`${base}/vendors`).where('isActive', '==', true).limit(500).get(),
    db.collection(`${base}/employees`).where('isActive', '==', true).limit(200).get(),
    db.collection(`${base}/recurringTransactions`).get(),
    // Invoice counts
    db.collection(`${base}/invoices`).where('status', '==', 'draft').get(),
    db.collection(`${base}/invoices`).where('status', '==', 'sent').get(),
    db.collection(`${base}/invoices`).where('status', '==', 'overdue').get(),
    db.collection(`${base}/invoices`).where('status', '==', 'paid').where('paidAt', '>=', startOfMonth).get(),
    db.collection(`${base}/invoices`).where('status', '==', 'cancelled').get(),
    // Bill counts
    db.collection(`${base}/bills`).where('status', '==', 'draft').get(),
    db.collection(`${base}/bills`).where('status', '==', 'unpaid').get(),
    db.collection(`${base}/bills`).where('status', '==', 'overdue').get(),
    db.collection(`${base}/bills`).where('status', '==', 'paid').where('paidAt', '>=', startOfMonth).get(),
    db.collection(`${base}/bills`).where('status', '==', 'cancelled').get(),
    // Outstanding for totals
    db.collection(`${base}/invoices`).where('status', 'in', ['sent', 'overdue']).get(),
    db.collection(`${base}/bills`).where('status', 'in', ['unpaid', 'overdue']).get(),
    // Records — recent 50 for documents, 100 for transactions
    db.collection(`${base}/invoices`).orderBy('createdAt', 'desc').limit(50).get(),
    db.collection(`${base}/bills`).orderBy('createdAt', 'desc').limit(50).get(),
    db.collection(`${base}/quotes`).orderBy('createdAt', 'desc').limit(30).get(),
    db.collection(`${base}/purchaseOrders`).orderBy('createdAt', 'desc').limit(30).get(),
    db.collection(`${base}/creditNotes`).orderBy('createdAt', 'desc').limit(30).get(),
    db.collection(`${base}/transactions`).orderBy('date', 'desc').limit(100).get(),
    db.collection(`${base}/journalEntries`).orderBy('date', 'desc').limit(50).get(),
    db.collection(`${base}/salarySlips`).orderBy('createdAt', 'desc').limit(30).get(),
  ]);

  const cd = companyDoc.data() ?? {};
  const currency: string = cd.currency || 'USD';

  // --- Bank accounts ---
  const bankAccounts = bankAccountsSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      name: x.name ?? '',
      bankName: x.bankName ?? '',
      balance: x.balance ?? x.currentBalance ?? 0,
      currency: x.currency ?? currency,
      accountType: x.accountType ?? 'checking',
      accountNumber: x.accountNumber || undefined,
    };
  });
  const totalCashBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);

  // --- Chart of accounts ---
  const accounts = accountsSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      name: x.name ?? '',
      code: x.code ?? '',
      type: x.typeCode ?? x.type ?? '',
      subtype: x.subtypeCode ?? x.subtype ?? '',
      balance: x.balance ?? 0,
      description: x.description || undefined,
    };
  });

  // --- Customer outstanding amounts ---
  const custMap = new Map<string, { totalOwed: number; overdueAmount: number }>();
  outstandingInvSnap.docs.forEach(d => {
    const { customerId, totalAmount, total, status } = d.data();
    if (!customerId) return;
    const amount = totalAmount ?? total ?? 0;
    const cur = custMap.get(customerId) ?? { totalOwed: 0, overdueAmount: 0 };
    cur.totalOwed += amount;
    if (status === 'overdue') cur.overdueAmount += amount;
    custMap.set(customerId, cur);
  });

  const customers = customersSnap.docs.map(d => {
    const x = d.data();
    const inv = custMap.get(d.id) ?? { totalOwed: 0, overdueAmount: 0 };
    return {
      id: d.id,
      name: x.name ?? x.displayName ?? '',
      email: x.email || undefined,
      phone: x.phone || undefined,
      address: x.address || undefined,
      city: x.city || undefined,
      country: x.country || undefined,
      taxId: x.taxId || undefined,
      notes: x.notes || undefined,
      currency: x.currency || undefined,
      paymentTermsDays: x.paymentTermsDays ?? x.defaultPaymentTerms ?? undefined,
      totalOwed: inv.totalOwed,
      overdueAmount: inv.overdueAmount,
    };
  });
  const totalReceivable = customers.reduce((s, c) => s + c.totalOwed, 0);
  const totalOverdueReceivable = customers.reduce((s, c) => s + c.overdueAmount, 0);

  // --- Vendor outstanding amounts ---
  const vendMap = new Map<string, { totalOwed: number; overdueAmount: number }>();
  outstandingBillSnap.docs.forEach(d => {
    const { vendorId, totalAmount, total, status } = d.data();
    if (!vendorId) return;
    const amount = totalAmount ?? total ?? 0;
    const cur = vendMap.get(vendorId) ?? { totalOwed: 0, overdueAmount: 0 };
    cur.totalOwed += amount;
    if (status === 'overdue') cur.overdueAmount += amount;
    vendMap.set(vendorId, cur);
  });

  const vendors = vendorsSnap.docs.map(d => {
    const x = d.data();
    const bill = vendMap.get(d.id) ?? { totalOwed: 0, overdueAmount: 0 };
    return {
      id: d.id,
      name: x.name ?? x.displayName ?? '',
      email: x.email || undefined,
      phone: x.phone || undefined,
      address: x.address || undefined,
      city: x.city || undefined,
      country: x.country || undefined,
      taxId: x.taxId || undefined,
      notes: x.notes || undefined,
      currency: x.currency || undefined,
      totalOwed: bill.totalOwed,
      overdueAmount: bill.overdueAmount,
    };
  });
  const totalPayable = vendors.reduce((s, v) => s + v.totalOwed, 0);
  const totalOverduePayable = outstandingBillSnap.docs
    .filter(d => d.data().status === 'overdue')
    .reduce((s, d) => s + (d.data().totalAmount ?? d.data().total ?? 0), 0);

  // --- Employees ---
  const employees = employeesSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      name: x.name ?? x.fullName ?? '',
      email: x.email || undefined,
      phone: x.phone || undefined,
      position: x.position ?? x.jobTitle ?? undefined,
      department: x.department || undefined,
      salary: x.salary ?? x.basicSalary ?? undefined,
      joiningDate: tsToDate(x.joiningDate) || undefined,
      isActive: x.isActive !== false,
    };
  });

  // --- Recurring transactions ---
  const recurringTransactions = recurringSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      name: x.name ?? '',
      type: x.type ?? '',
      frequency: x.frequency ?? '',
      amount: x.amount ?? x.templateData?.totalAmount ?? undefined,
      nextDate: tsToDate(x.nextDate) || undefined,
      isActive: x.isActive !== false,
      customerName: x.customerName ?? x.templateData?.customerName ?? undefined,
      vendorName: x.vendorName ?? x.templateData?.vendorName ?? undefined,
    };
  });

  // --- Invoice summary ---
  const invoiceSummary = {
    draft: draftInvSnap.size,
    sent: sentInvSnap.size,
    overdue: overdueInvSnap.size,
    paid: paidInvMonthSnap.size,
    cancelled: cancelledInvSnap.size,
    paidThisMonth: paidInvMonthSnap.size,
    totalOutstanding: totalReceivable,
    totalOverdue: totalOverdueReceivable,
    revenueThisMonth: sumDocs(paidInvMonthSnap.docs, 'totalAmount'),
  };

  // --- Bill summary ---
  const billSummary = {
    draft: draftBillSnap.size,
    unpaid: unpaidBillSnap.size,
    overdue: overdueBillSnap.size,
    paid: paidBillMonthSnap.size,
    cancelled: cancelledBillSnap.size,
    paidThisMonth: paidBillMonthSnap.size,
    totalUnpaid: totalPayable,
    totalOverdue: totalOverduePayable,
    expensesThisMonth: sumDocs(paidBillMonthSnap.docs, 'totalAmount'),
  };

  // --- Invoices (last 50) ---
  const invoices = invoicesSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      invoiceNumber: x.invoiceNumber ?? x.number ?? '',
      customerName: x.customerName ?? '',
      customerId: x.customerId || undefined,
      totalAmount: x.totalAmount ?? x.total ?? 0,
      taxAmount: x.taxAmount || undefined,
      status: x.status ?? '',
      issueDate: tsToDate(x.issueDate ?? x.createdAt),
      dueDate: tsToDate(x.dueDate) || undefined,
      paidAt: tsToDate(x.paidAt) || undefined,
      notes: x.notes || undefined,
    };
  });

  // --- Bills (last 50) ---
  const bills = billsSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      billNumber: x.billNumber ?? x.number ?? '',
      vendorName: x.vendorName ?? '',
      vendorId: x.vendorId || undefined,
      totalAmount: x.totalAmount ?? x.total ?? 0,
      taxAmount: x.taxAmount || undefined,
      status: x.status ?? '',
      issueDate: tsToDate(x.issueDate ?? x.createdAt),
      dueDate: tsToDate(x.dueDate) || undefined,
      paidAt: tsToDate(x.paidAt) || undefined,
      notes: x.notes || undefined,
    };
  });

  // --- Quotes ---
  const quotes = quotesSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      quoteNumber: x.quoteNumber ?? x.number ?? '',
      customerName: x.customerName ?? '',
      totalAmount: x.totalAmount ?? x.total ?? 0,
      status: x.status ?? '',
      issueDate: tsToDate(x.issueDate ?? x.createdAt),
      expiryDate: tsToDate(x.expiryDate) || undefined,
    };
  });

  // --- Purchase Orders ---
  const purchaseOrders = purchaseOrdersSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      poNumber: x.poNumber ?? x.number ?? '',
      vendorName: x.vendorName ?? '',
      totalAmount: x.totalAmount ?? x.total ?? 0,
      status: x.status ?? '',
      issueDate: tsToDate(x.issueDate ?? x.createdAt),
      deliveryDate: tsToDate(x.deliveryDate) || undefined,
    };
  });

  // --- Credit Notes ---
  const creditNotes = creditNotesSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      creditNoteNumber: x.creditNoteNumber ?? x.number ?? '',
      customerName: x.customerName ?? '',
      totalAmount: x.totalAmount ?? x.total ?? 0,
      status: x.status ?? '',
      issueDate: tsToDate(x.issueDate ?? x.createdAt),
    };
  });

  // --- Transactions (last 100) ---
  const transactions = transactionsSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      date: tsToDate(x.date),
      description: x.description ?? x.memo ?? '',
      amount: x.amount ?? 0,
      type: x.type ?? '',
      category: x.category || undefined,
      accountName: x.accountName || undefined,
      reference: x.reference || undefined,
    };
  });

  // --- Journal Entries ---
  const journalEntries = journalEntriesSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      entryNumber: x.entryNumber ?? x.number ?? '',
      date: tsToDate(x.date),
      description: x.description ?? x.memo ?? '',
      totalDebit: x.totalDebit ?? 0,
      totalCredit: x.totalCredit ?? 0,
    };
  });

  // --- Salary Slips ---
  const salarySlips = salarySlipsSnap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      employeeName: x.employeeName ?? x.name ?? '',
      month: x.month ?? '',
      year: x.year ?? new Date().getFullYear(),
      netSalary: x.netSalary ?? x.netPay ?? x.amount ?? 0,
      status: x.status ?? '',
    };
  });

  return {
    companyId,
    companyName: cd.name ?? cd.companyName ?? '',
    currency,
    cachedAt: new Date().toISOString(),
    // Company profile
    description: cd.description || undefined,
    contactName: cd.contactName || undefined,
    email: cd.email || undefined,
    phone: cd.phone || undefined,
    website: cd.website || undefined,
    address: cd.address || undefined,
    city: cd.city || undefined,
    state: cd.state || undefined,
    zipCode: cd.zipCode || undefined,
    country: cd.country || undefined,
    taxId: cd.taxId || undefined,
    taxRate: cd.invoiceDefaultTaxRate ?? cd.taxRate ?? undefined,
    taxName: cd.taxName || undefined,
    businessType: cd.businessType || undefined,
    enableTax: cd.enableTax ?? undefined,
    hasInventory: cd.hasInventory ?? undefined,
    hasEmployees: cd.hasEmployees ?? undefined,
    invoicePrefix: cd.invoicePrefix || undefined,
    billPrefix: cd.billPrefix || undefined,
    invoiceNextNumber: cd.invoiceNextNumber ?? undefined,
    billNextNumber: cd.billNextNumber ?? undefined,
    invoiceDefaultTerms: cd.invoiceDefaultTerms ?? undefined,
    billDefaultTerms: cd.billDefaultTerms ?? undefined,
    invoiceDefaultTaxRate: cd.invoiceDefaultTaxRate ?? undefined,
    invoiceNotes: cd.invoiceNotes || undefined,
    invoiceFooter: cd.invoiceFooter || undefined,
    dateFormat: cd.dateFormat || undefined,
    fiscalYearStart: cd.fiscalYearStart ?? undefined,
    showDecimalPlaces: cd.showDecimalPlaces ?? undefined,
    // Financial
    bankAccounts,
    totalCashBalance,
    accounts,
    // Contacts
    customers,
    totalReceivable,
    totalOverdueReceivable,
    vendors,
    totalPayable,
    totalOverduePayable,
    employees,
    // Documents
    invoiceSummary,
    invoices,
    billSummary,
    bills,
    quotes,
    purchaseOrders,
    creditNotes,
    // Operations
    recurringTransactions,
    transactions,
    journalEntries,
    salarySlips,
  };
}

// ==========================================
// SYSTEM PROMPT FORMATTER
// ==========================================

export function buildSnapshotPrompt(s: CompanySnapshot): string {
  const fmt = (n: number) =>
    `${s.currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const lines: string[] = [
    `\n\n[COMPLETE BUSINESS SNAPSHOT — ${s.companyName || s.companyId} | ${s.currency} | ${month}]`,
  ];

  // ── Company Profile ──
  const profile: string[] = [];
  if (s.description) profile.push(`Description: ${s.description}`);
  if (s.businessType) profile.push(`Business Type: ${s.businessType}`);
  if (s.contactName) profile.push(`Contact: ${s.contactName}`);
  if (s.email) profile.push(`Email: ${s.email}`);
  if (s.phone) profile.push(`Phone: ${s.phone}`);
  if (s.website) profile.push(`Website: ${s.website}`);
  if (s.address) profile.push(`Address: ${[s.address, s.city, s.state, s.zipCode, s.country].filter(Boolean).join(', ')}`);
  if (s.taxId) profile.push(`Tax ID: ${s.taxId}`);
  if (s.taxRate != null) profile.push(`Tax Rate: ${s.taxRate}%${s.taxName ? ` (${s.taxName})` : ''}${s.enableTax === false ? ' [DISABLED]' : ''}`);
  if (s.invoicePrefix) profile.push(`Invoice prefix: ${s.invoicePrefix}${s.invoiceNextNumber != null ? `-${s.invoiceNextNumber}` : ''}${s.billPrefix ? ` | Bill prefix: ${s.billPrefix}${s.billNextNumber != null ? `-${s.billNextNumber}` : ''}` : ''}`);
  if (s.invoiceDefaultTerms != null) profile.push(`Default payment terms: Net ${s.invoiceDefaultTerms} days`);
  if (s.billDefaultTerms != null) profile.push(`Default bill terms: Net ${s.billDefaultTerms} days`);
  if (s.fiscalYearStart != null) profile.push(`Fiscal year starts: Month ${s.fiscalYearStart}`);
  if (s.dateFormat) profile.push(`Date format: ${s.dateFormat}`);
  if (s.hasInventory != null) profile.push(`Inventory tracking: ${s.hasInventory ? 'Yes' : 'No'}`);
  if (s.hasEmployees != null) profile.push(`Has employees: ${s.hasEmployees ? 'Yes' : 'No'}`);
  if (s.invoiceNotes) profile.push(`Default invoice notes: ${s.invoiceNotes}`);
  if (s.invoiceFooter) profile.push(`Invoice footer: ${s.invoiceFooter}`);
  if (profile.length > 0) { lines.push(`\n## Company Profile`); profile.forEach(l => lines.push(l)); }

  // ── Bank Accounts ──
  lines.push(`\n## Bank Accounts`);
  if (!s.bankAccounts.length) { lines.push('None.'); }
  else {
    s.bankAccounts.forEach(b => lines.push(
      `- ${b.name}${b.bankName ? ` (${b.bankName})` : ''} [${b.accountType}]${b.accountNumber ? ` #${b.accountNumber}` : ''}: ${fmt(b.balance)} (id:${b.id})`
    ));
    lines.push(`Total cash: ${fmt(s.totalCashBalance)}`);
  }

  // ── Receivables Summary ──
  lines.push(
    `\n## Receivables`,
    `Outstanding: ${fmt(s.totalReceivable)} | Overdue: ${fmt(s.totalOverdueReceivable)}`,
    `Invoices → Draft:${s.invoiceSummary.draft} Sent:${s.invoiceSummary.sent} Overdue:${s.invoiceSummary.overdue} Cancelled:${s.invoiceSummary.cancelled}`,
    `Paid in ${month}: ${s.invoiceSummary.paidThisMonth} = ${fmt(s.invoiceSummary.revenueThisMonth)}`
  );

  // ── Payables Summary ──
  lines.push(
    `\n## Payables`,
    `Outstanding: ${fmt(s.totalPayable)} | Overdue: ${fmt(s.totalOverduePayable)}`,
    `Bills → Draft:${s.billSummary.draft} Unpaid:${s.billSummary.unpaid} Overdue:${s.billSummary.overdue} Cancelled:${s.billSummary.cancelled}`,
    `Paid in ${month}: ${s.billSummary.paidThisMonth} = ${fmt(s.billSummary.expensesThisMonth)}`
  );

  // ── Customers — ALL ──
  lines.push(`\n## Customers (${s.customers.length} total)`);
  if (!s.customers.length) { lines.push('None.'); }
  else {
    s.customers.forEach(c => {
      const parts = [`- ${c.name} (id:${c.id})`];
      if (c.email) parts.push(`email:${c.email}`);
      if (c.phone) parts.push(`phone:${c.phone}`);
      if (c.address) parts.push(`addr:${[c.address, c.city, c.country].filter(Boolean).join(', ')}`);
      if (c.taxId) parts.push(`taxId:${c.taxId}`);
      if (c.paymentTermsDays) parts.push(`terms:Net${c.paymentTermsDays}`);
      if (c.totalOwed > 0) parts.push(`owes:${fmt(c.totalOwed)}${c.overdueAmount > 0 ? ` (${fmt(c.overdueAmount)} OVERDUE)` : ''}`);
      if (c.notes) parts.push(`notes:${c.notes}`);
      lines.push(parts.join(' | '));
    });
  }

  // ── Vendors — ALL ──
  lines.push(`\n## Vendors (${s.vendors.length} total)`);
  if (!s.vendors.length) { lines.push('None.'); }
  else {
    s.vendors.forEach(v => {
      const parts = [`- ${v.name} (id:${v.id})`];
      if (v.email) parts.push(`email:${v.email}`);
      if (v.phone) parts.push(`phone:${v.phone}`);
      if (v.address) parts.push(`addr:${[v.address, v.city, v.country].filter(Boolean).join(', ')}`);
      if (v.taxId) parts.push(`taxId:${v.taxId}`);
      if (v.totalOwed > 0) parts.push(`owed:${fmt(v.totalOwed)}${v.overdueAmount > 0 ? ` (${fmt(v.overdueAmount)} OVERDUE)` : ''}`);
      if (v.notes) parts.push(`notes:${v.notes}`);
      lines.push(parts.join(' | '));
    });
  }

  // ── Employees ──
  if (s.employees.length > 0) {
    lines.push(`\n## Employees (${s.employees.length})`);
    s.employees.forEach(e => {
      const parts = [`- ${e.name} (id:${e.id})`];
      if (e.position) parts.push(e.position);
      if (e.department) parts.push(`dept:${e.department}`);
      if (e.email) parts.push(`email:${e.email}`);
      if (e.phone) parts.push(`phone:${e.phone}`);
      if (e.salary != null) parts.push(`salary:${fmt(e.salary)}`);
      if (e.joiningDate) parts.push(`joined:${e.joiningDate}`);
      lines.push(parts.join(' | '));
    });
  }

  // ── Invoices ──
  if (s.invoices.length > 0) {
    lines.push(`\n## Invoices (last ${s.invoices.length})`);
    s.invoices.forEach(inv => {
      let line = `- #${inv.invoiceNumber} | ${inv.customerName} | ${fmt(inv.totalAmount)} | ${inv.status} | ${inv.issueDate}`;
      if (inv.dueDate) line += ` | due:${inv.dueDate}`;
      if (inv.paidAt) line += ` | paid:${inv.paidAt}`;
      if (inv.notes) line += ` | notes:${inv.notes}`;
      line += ` (id:${inv.id})`;
      lines.push(line);
    });
  }

  // ── Bills ──
  if (s.bills.length > 0) {
    lines.push(`\n## Bills (last ${s.bills.length})`);
    s.bills.forEach(b => {
      let line = `- #${b.billNumber} | ${b.vendorName} | ${fmt(b.totalAmount)} | ${b.status} | ${b.issueDate}`;
      if (b.dueDate) line += ` | due:${b.dueDate}`;
      if (b.paidAt) line += ` | paid:${b.paidAt}`;
      if (b.notes) line += ` | notes:${b.notes}`;
      line += ` (id:${b.id})`;
      lines.push(line);
    });
  }

  // ── Quotes ──
  if (s.quotes.length > 0) {
    lines.push(`\n## Quotes (last ${s.quotes.length})`);
    s.quotes.forEach(q => lines.push(
      `- #${q.quoteNumber} | ${q.customerName} | ${fmt(q.totalAmount)} | ${q.status} | ${q.issueDate}${q.expiryDate ? ` | exp:${q.expiryDate}` : ''} (id:${q.id})`
    ));
  }

  // ── Purchase Orders ──
  if (s.purchaseOrders.length > 0) {
    lines.push(`\n## Purchase Orders (last ${s.purchaseOrders.length})`);
    s.purchaseOrders.forEach(po => lines.push(
      `- #${po.poNumber} | ${po.vendorName} | ${fmt(po.totalAmount)} | ${po.status} | ${po.issueDate}${po.deliveryDate ? ` | del:${po.deliveryDate}` : ''} (id:${po.id})`
    ));
  }

  // ── Credit Notes ──
  if (s.creditNotes.length > 0) {
    lines.push(`\n## Credit Notes (last ${s.creditNotes.length})`);
    s.creditNotes.forEach(cn => lines.push(
      `- #${cn.creditNoteNumber} | ${cn.customerName} | ${fmt(cn.totalAmount)} | ${cn.status} | ${cn.issueDate} (id:${cn.id})`
    ));
  }

  // ── Recurring Transactions ──
  if (s.recurringTransactions.length > 0) {
    lines.push(`\n## Recurring Transactions (${s.recurringTransactions.length})`);
    s.recurringTransactions.forEach(r => {
      const parts = [`- ${r.name} (id:${r.id})`, r.type, r.frequency];
      if (r.amount != null) parts.push(fmt(r.amount));
      if (r.customerName) parts.push(`customer:${r.customerName}`);
      if (r.vendorName) parts.push(`vendor:${r.vendorName}`);
      if (r.nextDate) parts.push(`next:${r.nextDate}`);
      parts.push(r.isActive ? 'ACTIVE' : 'PAUSED');
      lines.push(parts.join(' | '));
    });
  }

  // ── Transactions ──
  if (s.transactions.length > 0) {
    lines.push(`\n## Transactions (last ${s.transactions.length})`);
    s.transactions.forEach(t => {
      const parts = [`- ${t.date} | ${t.type} | ${fmt(t.amount)} | ${t.description}`];
      if (t.category) parts.push(`cat:${t.category}`);
      if (t.accountName) parts.push(`acc:${t.accountName}`);
      if (t.reference) parts.push(`ref:${t.reference}`);
      parts.push(`(id:${t.id})`);
      lines.push(parts.join(' | '));
    });
  }

  // ── Journal Entries ──
  if (s.journalEntries.length > 0) {
    lines.push(`\n## Journal Entries (last ${s.journalEntries.length})`);
    s.journalEntries.forEach(j => lines.push(
      `- #${j.entryNumber} | ${j.date} | ${j.description} | Dr:${fmt(j.totalDebit)} Cr:${fmt(j.totalCredit)} (id:${j.id})`
    ));
  }

  // ── Salary Slips ──
  if (s.salarySlips.length > 0) {
    lines.push(`\n## Salary Slips (last ${s.salarySlips.length})`);
    s.salarySlips.forEach(sl => lines.push(
      `- ${sl.employeeName} | ${sl.month} ${sl.year} | ${fmt(sl.netSalary)} | ${sl.status} (id:${sl.id})`
    ));
  }

  // ── Chart of Accounts ──
  if (s.accounts.length > 0) {
    lines.push(`\n## Chart of Accounts (${s.accounts.length})`);
    const byType: Record<string, typeof s.accounts> = {};
    s.accounts.forEach(a => { (byType[a.type] ??= []).push(a); });
    Object.entries(byType).forEach(([type, accs]) =>
      lines.push(`${type}: ${accs.map(a => `${a.name}[${a.code}]${a.balance !== 0 ? `=${fmt(a.balance)}` : ''}`).join(', ')}`)
    );
  }

  lines.push(`\n[END SNAPSHOT — use query_records for records beyond these limits]`);
  return lines.join('\n');
}

// ==========================================
// FIRESTORE SCHEMA (for AI query_records guidance)
// ==========================================

export const FIRESTORE_SCHEMA = `
[FIRESTORE SCHEMA — use with query_records tool]
All collections are under companies/{companyId}/

invoices:              invoiceNumber, customerName, customerId, totalAmount, taxAmount, status(draft|sent|overdue|paid|cancelled), issueDate, dueDate, paidAt, items[], notes, createdAt
bills:                 billNumber, vendorName, vendorId, totalAmount, taxAmount, status(draft|unpaid|overdue|paid|cancelled), issueDate, dueDate, paidAt, items[], notes, createdAt
customers:             name, email, phone, address, city, country, taxId, notes, currency, paymentTermsDays, isActive, createdAt
vendors:               name, email, phone, address, city, country, taxId, notes, currency, isActive, createdAt
employees:             name, email, phone, position, department, salary, joiningDate, isActive, createdAt
transactions:          date, description, amount, type(income|expense|transfer), accountId, accountName, category, reference, createdAt
accounts:              name, code, typeCode(asset|liability|equity|income|expense), subtypeCode, balance, isActive, description
bankAccounts:          name, bankName, accountNumber, accountType(checking|savings|credit|loan), balance, currency, isActive
journalEntries:        entryNumber, date, description, lines[], totalDebit, totalCredit, createdAt
recurringTransactions: name, type(invoice|bill|expense), frequency(daily|weekly|monthly|yearly), nextDate, isActive, amount, customerName, vendorName
quotes:                quoteNumber, customerName, customerId, totalAmount, status(draft|sent|accepted|rejected|expired), issueDate, expiryDate, items[]
purchaseOrders:        poNumber, vendorName, vendorId, totalAmount, status(draft|sent|received|cancelled), issueDate, deliveryDate, items[]
creditNotes:           creditNoteNumber, customerName, customerId, totalAmount, status(draft|issued|applied), issueDate, items[]
salarySlips:           employeeName, employeeId, month, year, basicSalary, netSalary, status(draft|paid), createdAt
`.trim();
