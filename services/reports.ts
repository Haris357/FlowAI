import { getAccounts, getAccountsByType } from './accounts';
import { getTransactionsByDateRange, getTotalIncome, getTotalExpenses, getExpensesByCategory, getIncomeByCategory } from './transactions';
import { getJournalEntriesByDateRange, getJournalEntries } from './journalEntries';
import { getOutstandingInvoices, getOverdueInvoices, getInvoices } from './invoices';
import { getVendorsWithOutstandingBalance, getVendors } from './vendors';
import { getCustomersWithOutstandingBalance, getCustomers } from './customers';
import { getBills, getOutstandingBills } from './bills';
import {
  ProfitLossReport,
  BalanceSheetReport,
  TrialBalanceReport,
  CashFlowReport,
  GeneralLedgerReport,
  GeneralLedgerAccount,
  AgedReceivablesReport,
  AgedPayablesReport,
  AgedCustomer,
  AgedVendor,
  Account,
} from '@/types';

export async function generateProfitLossReport(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<ProfitLossReport> {
  const [incomeByCategory, expensesByCategory, totalRevenue, totalExpenses] = await Promise.all([
    getIncomeByCategory(companyId, startDate, endDate),
    getExpensesByCategory(companyId, startDate, endDate),
    getTotalIncome(companyId, startDate, endDate),
    getTotalExpenses(companyId, startDate, endDate),
  ]);

  return {
    startDate,
    endDate,
    revenue: {
      accounts: incomeByCategory.map(c => ({ name: c.category, amount: c.amount })),
      total: totalRevenue,
    },
    expenses: {
      accounts: expensesByCategory.map(c => ({ name: c.category, amount: c.amount })),
      total: totalExpenses,
    },
    netProfit: totalRevenue - totalExpenses,
  };
}

export async function generateBalanceSheetReport(
  companyId: string,
  asOfDate: Date
): Promise<BalanceSheetReport> {
  const accounts = await getAccounts(companyId);

  const assets = accounts.filter(a => a.typeCode === 'asset');
  const liabilities = accounts.filter(a => a.typeCode === 'liability');
  const equity = accounts.filter(a => a.typeCode === 'equity');

  const currentAssets = assets.filter(a => a.subtypeCode === 'current_asset');
  const fixedAssets = assets.filter(a => a.subtypeCode === 'fixed_asset');
  const currentLiabilities = liabilities.filter(a => a.subtypeCode === 'current_liability');
  const longTermLiabilities = liabilities.filter(a => a.subtypeCode === 'long_term_liability');

  const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.balance, 0);
  const totalFixedAssets = fixedAssets.reduce((sum, a) => sum + a.balance, 0);
  const totalCurrentLiabilities = currentLiabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalLongTermLiabilities = longTermLiabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

  return {
    asOfDate,
    assets: {
      current: currentAssets.map(a => ({ name: a.name, amount: a.balance })),
      fixed: fixedAssets.map(a => ({ name: a.name, amount: a.balance })),
      totalCurrent: totalCurrentAssets,
      totalFixed: totalFixedAssets,
      total: totalCurrentAssets + totalFixedAssets,
    },
    liabilities: {
      current: currentLiabilities.map(a => ({ name: a.name, amount: a.balance })),
      longTerm: longTermLiabilities.map(a => ({ name: a.name, amount: a.balance })),
      totalCurrent: totalCurrentLiabilities,
      totalLongTerm: totalLongTermLiabilities,
      total: totalCurrentLiabilities + totalLongTermLiabilities,
    },
    equity: {
      items: equity.map(a => ({ name: a.name, amount: a.balance })),
      total: totalEquity,
    },
  };
}

export async function generateTrialBalanceReport(
  companyId: string,
  asOfDate: Date
): Promise<TrialBalanceReport> {
  const accounts = await getAccounts(companyId);

  const accountsWithBalances = accounts
    .filter(a => a.balance !== 0)
    .map(a => {
      // Assets and Expenses normally have debit balances
      // Liabilities, Equity, and Revenue normally have credit balances
      const isDebitNormal = a.typeCode === 'asset' || a.typeCode === 'expense';

      return {
        code: a.code,
        name: a.name,
        debit: isDebitNormal ? a.balance : 0,
        credit: !isDebitNormal ? a.balance : 0,
      };
    });

  const totalDebit = accountsWithBalances.reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = accountsWithBalances.reduce((sum, a) => sum + a.credit, 0);

  return {
    asOfDate,
    accounts: accountsWithBalances,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}

export async function generateCashFlowReport(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  startDate: Date;
  endDate: Date;
  operatingActivities: { description: string; amount: number }[];
  totalOperating: number;
  investingActivities: { description: string; amount: number }[];
  totalInvesting: number;
  financingActivities: { description: string; amount: number }[];
  totalFinancing: number;
  netCashFlow: number;
}> {
  const transactions = await getTransactionsByDateRange(companyId, startDate, endDate);

  // Simplified cash flow - in real implementation, this would be more sophisticated
  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  return {
    startDate,
    endDate,
    operatingActivities: [
      { description: 'Cash received from customers', amount: totalIncome },
      { description: 'Cash paid for operating expenses', amount: -totalExpenses },
    ],
    totalOperating: totalIncome - totalExpenses,
    investingActivities: [],
    totalInvesting: 0,
    financingActivities: [],
    totalFinancing: 0,
    netCashFlow: totalIncome - totalExpenses,
  };
}

export async function generateExpenseReport(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  startDate: Date;
  endDate: Date;
  categories: { category: string; amount: number; percentage: number }[];
  total: number;
}> {
  const expensesByCategory = await getExpensesByCategory(companyId, startDate, endDate);
  const total = expensesByCategory.reduce((sum, c) => sum + c.amount, 0);

  return {
    startDate,
    endDate,
    categories: expensesByCategory.map(c => ({
      category: c.category,
      amount: c.amount,
      percentage: total > 0 ? (c.amount / total) * 100 : 0,
    })),
    total,
  };
}

export async function generateRevenueReport(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  startDate: Date;
  endDate: Date;
  categories: { category: string; amount: number; percentage: number }[];
  total: number;
}> {
  const incomeByCategory = await getIncomeByCategory(companyId, startDate, endDate);
  const total = incomeByCategory.reduce((sum, c) => sum + c.amount, 0);

  return {
    startDate,
    endDate,
    categories: incomeByCategory.map(c => ({
      category: c.category,
      amount: c.amount,
      percentage: total > 0 ? (c.amount / total) * 100 : 0,
    })),
    total,
  };
}

export async function generateARAgingReport(companyId: string): Promise<{
  current: { customer: string; amount: number }[];
  days30: { customer: string; amount: number }[];
  days60: { customer: string; amount: number }[];
  days90Plus: { customer: string; amount: number }[];
  totals: { current: number; days30: number; days60: number; days90Plus: number; total: number };
}> {
  const invoices = await getOutstandingInvoices(companyId);
  const now = new Date();

  const current: { customer: string; amount: number }[] = [];
  const days30: { customer: string; amount: number }[] = [];
  const days60: { customer: string; amount: number }[] = [];
  const days90Plus: { customer: string; amount: number }[] = [];

  invoices.forEach(inv => {
    const dueDate = inv.dueDate?.toDate ? inv.dueDate.toDate() : new Date(inv.dueDate as unknown as string);
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const item = { customer: inv.customerName, amount: inv.amountDue };

    if (daysPastDue <= 0) {
      current.push(item);
    } else if (daysPastDue <= 30) {
      days30.push(item);
    } else if (daysPastDue <= 60) {
      days60.push(item);
    } else {
      days90Plus.push(item);
    }
  });

  return {
    current,
    days30,
    days60,
    days90Plus,
    totals: {
      current: current.reduce((sum, i) => sum + i.amount, 0),
      days30: days30.reduce((sum, i) => sum + i.amount, 0),
      days60: days60.reduce((sum, i) => sum + i.amount, 0),
      days90Plus: days90Plus.reduce((sum, i) => sum + i.amount, 0),
      total: invoices.reduce((sum, i) => sum + i.amountDue, 0),
    },
  };
}

export async function getDashboardSummary(companyId: string): Promise<{
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  overdueInvoicesCount: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRevenue, totalExpenses, outstandingInvoices, overdueInvoices, vendorsWithBalance] = await Promise.all([
    getTotalIncome(companyId, startOfMonth, now),
    getTotalExpenses(companyId, startOfMonth, now),
    getOutstandingInvoices(companyId),
    getOverdueInvoices(companyId),
    getVendorsWithOutstandingBalance(companyId),
  ]);

  const outstandingReceivables = outstandingInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  const outstandingPayables = vendorsWithBalance.reduce((sum, v) => sum + v.outstandingBalance, 0);

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    outstandingReceivables,
    outstandingPayables,
    overdueInvoicesCount: overdueInvoices.length,
  };
}

// ==========================================
// GENERAL LEDGER REPORT
// ==========================================

export async function generateGeneralLedgerReport(
  companyId: string,
  startDate: Date,
  endDate: Date,
  accountIds?: string[]
): Promise<GeneralLedgerReport> {
  const [accounts, journalEntries] = await Promise.all([
    getAccounts(companyId),
    getJournalEntriesByDateRange(companyId, startDate, endDate),
  ]);

  // Filter accounts if specific ones are requested
  const filteredAccounts = accountIds
    ? accounts.filter(a => accountIds.includes(a.id))
    : accounts.filter(a => a.balance !== 0 || journalEntries.some(je => je.lines.some(l => l.accountId === a.id)));

  const ledgerAccounts: GeneralLedgerAccount[] = filteredAccounts.map(account => {
    // Get all journal entry lines for this account
    const accountEntries = journalEntries
      .filter(je => je.lines.some(l => l.accountId === account.id))
      .map(je => {
        const line = je.lines.find(l => l.accountId === account.id)!;
        return {
          date: je.date.toDate ? je.date.toDate() : new Date(je.date as unknown as string),
          entryNumber: je.entryNumber,
          description: line.description || je.description,
          reference: je.reference,
          debit: line.debit,
          credit: line.credit,
          balance: 0, // Will calculate running balance
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate running balance
    // For assets and expenses, debit increases balance; for liabilities, equity, revenue, credit increases
    const isDebitNormal = account.typeCode === 'asset' || account.typeCode === 'expense';
    let runningBalance = 0; // Opening balance for period (simplified)

    accountEntries.forEach(entry => {
      if (isDebitNormal) {
        runningBalance += entry.debit - entry.credit;
      } else {
        runningBalance += entry.credit - entry.debit;
      }
      entry.balance = runningBalance;
    });

    const totalDebits = accountEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = accountEntries.reduce((sum, e) => sum + e.credit, 0);

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.typeName,
      openingBalance: 0, // Simplified - would need to calculate from prior periods
      entries: accountEntries,
      totalDebits,
      totalCredits,
      closingBalance: runningBalance,
    };
  });

  return {
    startDate,
    endDate,
    accounts: ledgerAccounts,
  };
}

// ==========================================
// ENHANCED CASH FLOW REPORT
// ==========================================

export async function generateEnhancedCashFlowReport(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<CashFlowReport> {
  const [transactions, accounts] = await Promise.all([
    getTransactionsByDateRange(companyId, startDate, endDate),
    getAccounts(companyId),
  ]);

  // Get cash accounts (bank accounts, cash on hand)
  const cashAccounts = accounts.filter(a =>
    a.subtypeCode === 'cash' || a.subtypeCode === 'bank' || a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank')
  );
  const openingBalance = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

  // Categorize transactions
  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  // Group income by category
  const incomeByCategory = new Map<string, number>();
  income.forEach(t => {
    const cat = t.category || 'Other Income';
    incomeByCategory.set(cat, (incomeByCategory.get(cat) || 0) + t.amount);
  });

  // Group expenses by category
  const expensesByCategory = new Map<string, number>();
  expenses.forEach(t => {
    const cat = t.category || 'Other Expenses';
    expensesByCategory.set(cat, (expensesByCategory.get(cat) || 0) + t.amount);
  });

  const operatingInflows = Array.from(incomeByCategory.entries()).map(([desc, amount]) => ({ description: desc, amount }));
  const operatingOutflows = Array.from(expensesByCategory.entries()).map(([desc, amount]) => ({ description: desc, amount: -amount }));

  const totalOperatingInflows = operatingInflows.reduce((sum, i) => sum + i.amount, 0);
  const totalOperatingOutflows = Math.abs(operatingOutflows.reduce((sum, i) => sum + i.amount, 0));
  const netOperating = totalOperatingInflows - totalOperatingOutflows;

  // Simplified - in real implementation, would categorize investing and financing activities
  const investingInflows: { description: string; amount: number }[] = [];
  const investingOutflows: { description: string; amount: number }[] = [];
  const financingInflows: { description: string; amount: number }[] = [];
  const financingOutflows: { description: string; amount: number }[] = [];

  const netCashChange = netOperating;
  const closingBalance = openingBalance + netCashChange;

  return {
    startDate,
    endDate,
    openingBalance,
    operating: {
      inflows: operatingInflows,
      outflows: operatingOutflows,
      totalInflows: totalOperatingInflows,
      totalOutflows: totalOperatingOutflows,
      netOperating,
    },
    investing: {
      inflows: investingInflows,
      outflows: investingOutflows,
      totalInflows: 0,
      totalOutflows: 0,
      netInvesting: 0,
    },
    financing: {
      inflows: financingInflows,
      outflows: financingOutflows,
      totalInflows: 0,
      totalOutflows: 0,
      netFinancing: 0,
    },
    netCashChange,
    closingBalance,
  };
}

// ==========================================
// AGED RECEIVABLES REPORT (Enhanced)
// ==========================================

export async function generateAgedReceivablesReport(
  companyId: string,
  asOfDate: Date = new Date()
): Promise<AgedReceivablesReport> {
  const [invoices, customers] = await Promise.all([
    getInvoices(companyId),
    getCustomers(companyId),
  ]);

  // Filter to outstanding invoices
  const outstandingInvoices = invoices.filter(inv =>
    ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status) && inv.amountDue > 0
  );

  // Group by customer
  const customerMap = new Map<string, AgedCustomer>();

  outstandingInvoices.forEach(inv => {
    const dueDate = inv.dueDate?.toDate ? inv.dueDate.toDate() : new Date(inv.dueDate as unknown as string);
    const daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Determine aging bucket
    let current = 0, days1to30 = 0, days31to60 = 0, days61to90 = 0, over90 = 0;
    if (daysOverdue <= 0) {
      current = inv.amountDue;
    } else if (daysOverdue <= 30) {
      days1to30 = inv.amountDue;
    } else if (daysOverdue <= 60) {
      days31to60 = inv.amountDue;
    } else if (daysOverdue <= 90) {
      days61to90 = inv.amountDue;
    } else {
      over90 = inv.amountDue;
    }

    const agedInvoice = {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.issueDate?.toDate ? inv.issueDate.toDate() : new Date(inv.issueDate as unknown as string),
      dueDate,
      total: inv.total,
      amountDue: inv.amountDue,
      daysOverdue: Math.max(0, daysOverdue),
      current,
      days1to30,
      days31to60,
      days61to90,
      over90,
    };

    if (!customerMap.has(inv.customerId)) {
      customerMap.set(inv.customerId, {
        customerId: inv.customerId,
        customerName: inv.customerName,
        invoices: [],
        totalCurrent: 0,
        total1to30: 0,
        total31to60: 0,
        total61to90: 0,
        totalOver90: 0,
        totalOutstanding: 0,
      });
    }

    const customer = customerMap.get(inv.customerId)!;
    customer.invoices.push(agedInvoice);
    customer.totalCurrent += current;
    customer.total1to30 += days1to30;
    customer.total31to60 += days31to60;
    customer.total61to90 += days61to90;
    customer.totalOver90 += over90;
    customer.totalOutstanding += inv.amountDue;
  });

  const agedCustomers = Array.from(customerMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  return {
    asOfDate,
    customers: agedCustomers,
    summaryCurrent: agedCustomers.reduce((sum, c) => sum + c.totalCurrent, 0),
    summary1to30: agedCustomers.reduce((sum, c) => sum + c.total1to30, 0),
    summary31to60: agedCustomers.reduce((sum, c) => sum + c.total31to60, 0),
    summary61to90: agedCustomers.reduce((sum, c) => sum + c.total61to90, 0),
    summaryOver90: agedCustomers.reduce((sum, c) => sum + c.totalOver90, 0),
    totalOutstanding: agedCustomers.reduce((sum, c) => sum + c.totalOutstanding, 0),
  };
}

// ==========================================
// AGED PAYABLES REPORT
// ==========================================

export async function generateAgedPayablesReport(
  companyId: string,
  asOfDate: Date = new Date()
): Promise<AgedPayablesReport> {
  const [bills, vendors] = await Promise.all([
    getBills(companyId),
    getVendors(companyId),
  ]);

  // Filter to outstanding bills
  const outstandingBills = bills.filter(bill =>
    ['unpaid', 'partial', 'overdue'].includes(bill.status) && bill.amountDue > 0
  );

  // Group by vendor
  const vendorMap = new Map<string, AgedVendor>();

  outstandingBills.forEach(bill => {
    const dueDate = bill.dueDate?.toDate
      ? bill.dueDate.toDate()
      : bill.dueDate
        ? new Date(bill.dueDate as unknown as string)
        : bill.issueDate?.toDate
          ? bill.issueDate.toDate()
          : new Date(bill.issueDate as unknown as string);

    const daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Determine aging bucket
    let current = 0, days1to30 = 0, days31to60 = 0, days61to90 = 0, over90 = 0;
    if (daysOverdue <= 0) {
      current = bill.amountDue;
    } else if (daysOverdue <= 30) {
      days1to30 = bill.amountDue;
    } else if (daysOverdue <= 60) {
      days31to60 = bill.amountDue;
    } else if (daysOverdue <= 90) {
      days61to90 = bill.amountDue;
    } else {
      over90 = bill.amountDue;
    }

    const agedBill = {
      billId: bill.id,
      billNumber: bill.billNumber,
      date: bill.issueDate?.toDate ? bill.issueDate.toDate() : new Date(bill.issueDate as unknown as string),
      dueDate,
      total: bill.total,
      amountDue: bill.amountDue,
      daysOverdue: Math.max(0, daysOverdue),
      current,
      days1to30,
      days31to60,
      days61to90,
      over90,
    };

    const vendorId = bill.vendorId || 'unknown';
    if (!vendorMap.has(vendorId)) {
      vendorMap.set(vendorId, {
        vendorId,
        vendorName: bill.vendorName,
        bills: [],
        totalCurrent: 0,
        total1to30: 0,
        total31to60: 0,
        total61to90: 0,
        totalOver90: 0,
        totalOutstanding: 0,
      });
    }

    const vendor = vendorMap.get(vendorId)!;
    vendor.bills.push(agedBill);
    vendor.totalCurrent += current;
    vendor.total1to30 += days1to30;
    vendor.total31to60 += days31to60;
    vendor.total61to90 += days61to90;
    vendor.totalOver90 += over90;
    vendor.totalOutstanding += bill.amountDue;
  });

  const agedVendors = Array.from(vendorMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  return {
    asOfDate,
    vendors: agedVendors,
    summaryCurrent: agedVendors.reduce((sum, v) => sum + v.totalCurrent, 0),
    summary1to30: agedVendors.reduce((sum, v) => sum + v.total1to30, 0),
    summary31to60: agedVendors.reduce((sum, v) => sum + v.total31to60, 0),
    summary61to90: agedVendors.reduce((sum, v) => sum + v.total61to90, 0),
    summaryOver90: agedVendors.reduce((sum, v) => sum + v.totalOver90, 0),
    totalOutstanding: agedVendors.reduce((sum, v) => sum + v.totalOutstanding, 0),
  };
}
