import {
  FileText, Receipt, Users, Building2, UserCheck, ClipboardList,
  ArrowLeftRight, BookOpen, Search, AlertCircle, Clock, BarChart3,
  TrendingUp, TrendingDown, Calculator, DollarSign, Activity,
  Bell, Download, Layers, GitMerge, BarChart2, Trash2,
  ShieldCheck, HelpCircle, AlignLeft, Scale, UserPlus,
  RefreshCw, CreditCard, Package, Landmark, List,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CommandCategory = 'create' | 'find' | 'reports' | 'ai' | 'actions';
export type CommandAction = 'prompt' | 'navigate' | 'function';

export interface SlashCommand {
  id: string;
  /** Text after the `/` that matches this command */
  trigger: string;
  /** Alias triggers (also matches) */
  aliases?: string[];
  label: string;
  description: string;
  icon: LucideIcon;
  category: CommandCategory;
  action: CommandAction;
  /** Prompt text to insert into the textarea (for action: 'prompt') */
  prompt?: string;
  /** Path suffix to navigate to, e.g. '/invoices' (for action: 'navigate') */
  path?: string;
  /** Named function to call (for action: 'function') */
  fn?: string;
  /** Keyboard shortcut hint shown in palette */
  shortcut?: string;
}

export const CATEGORY_META: Record<CommandCategory, { label: string; color: string }> = {
  create:  { label: 'Create',   color: 'var(--joy-palette-primary-500)' },
  find:    { label: 'Find',     color: 'var(--joy-palette-success-500)' },
  reports: { label: 'Reports',  color: 'var(--joy-palette-warning-500)' },
  ai:      { label: 'AI Modes', color: 'var(--joy-palette-neutral-600)' },
  actions: { label: 'Actions',  color: 'var(--joy-palette-danger-400)' },
};

export const COMMANDS: SlashCommand[] = [
  // ─── CREATE ────────────────────────────────────────────────────────────────
  {
    id: 'create-invoice', trigger: 'invoice', aliases: ['inv'],
    label: 'Create Invoice', description: 'Create a new customer invoice',
    icon: FileText, category: 'create', action: 'prompt',
    prompt: 'Create a new invoice for customer ',
  },
  {
    id: 'create-bill', trigger: 'bill',
    label: 'Create Bill', description: 'Record a new vendor bill',
    icon: Receipt, category: 'create', action: 'prompt',
    prompt: 'Create a new bill for vendor ',
  },
  {
    id: 'create-quote', trigger: 'quote', aliases: ['estimate'],
    label: 'Create Quote', description: 'Generate a quote / estimate',
    icon: ClipboardList, category: 'create', action: 'prompt',
    prompt: 'Create a quote for customer ',
  },
  {
    id: 'create-customer', trigger: 'customer', aliases: ['client'],
    label: 'Add Customer', description: 'Add a new customer',
    icon: UserPlus, category: 'create', action: 'prompt',
    prompt: 'Add a new customer named ',
  },
  {
    id: 'create-vendor', trigger: 'vendor', aliases: ['supplier'],
    label: 'Add Vendor', description: 'Add a new vendor / supplier',
    icon: Building2, category: 'create', action: 'prompt',
    prompt: 'Add a new vendor named ',
  },
  {
    id: 'create-employee', trigger: 'employee', aliases: ['staff'],
    label: 'Add Employee', description: 'Add a new employee',
    icon: UserCheck, category: 'create', action: 'prompt',
    prompt: 'Add a new employee named ',
  },
  {
    id: 'create-transaction', trigger: 'transaction', aliases: ['tx', 'expense', 'income'],
    label: 'Record Transaction', description: 'Record income, expense or transfer',
    icon: ArrowLeftRight, category: 'create', action: 'prompt',
    prompt: 'Record a transaction: ',
  },
  {
    id: 'create-journal', trigger: 'journal', aliases: ['je'],
    label: 'Journal Entry', description: 'Create a manual journal entry',
    icon: BookOpen, category: 'create', action: 'prompt',
    prompt: 'Create a manual journal entry: ',
  },
  {
    id: 'create-purchase-order', trigger: 'po', aliases: ['purchaseorder'],
    label: 'Purchase Order', description: 'Create a new purchase order',
    icon: Package, category: 'create', action: 'prompt',
    prompt: 'Create a purchase order for vendor ',
  },
  {
    id: 'create-credit-note', trigger: 'creditnote', aliases: ['cn', 'credit'],
    label: 'Credit Note', description: 'Create a credit note',
    icon: CreditCard, category: 'create', action: 'prompt',
    prompt: 'Create a credit note for customer ',
  },
  {
    id: 'create-bank-account', trigger: 'bankaccount', aliases: ['bank'],
    label: 'Bank Account', description: 'Add a new bank account',
    icon: Landmark, category: 'create', action: 'prompt',
    prompt: 'Add a new bank account: ',
  },
  {
    id: 'create-salary', trigger: 'salary', aliases: ['payslip', 'salaryslip'],
    label: 'Generate Salary Slip', description: 'Generate salary slip for employee',
    icon: DollarSign, category: 'create', action: 'prompt',
    prompt: 'Generate a salary slip for employee ',
  },

  // ─── FIND ──────────────────────────────────────────────────────────────────
  {
    id: 'find', trigger: 'find', aliases: ['search', 'lookup'],
    label: 'Find Anything', description: 'Search across all records',
    icon: Search, category: 'find', action: 'prompt',
    prompt: 'Find ',
  },
  {
    id: 'find-invoices', trigger: 'invoices',
    label: 'Browse Invoices', description: 'View and filter invoices',
    icon: FileText, category: 'find', action: 'prompt',
    prompt: 'Show me all invoices ',
  },
  {
    id: 'find-bills', trigger: 'bills',
    label: 'Browse Bills', description: 'View and filter bills',
    icon: Receipt, category: 'find', action: 'prompt',
    prompt: 'Show me all bills ',
  },
  {
    id: 'find-customers', trigger: 'customers',
    label: 'Browse Customers', description: 'View all customers with balances',
    icon: Users, category: 'find', action: 'prompt',
    prompt: 'Show me all customers with their outstanding balances',
  },
  {
    id: 'find-vendors', trigger: 'vendors',
    label: 'Browse Vendors', description: 'View all vendors with balances',
    icon: Building2, category: 'find', action: 'prompt',
    prompt: 'Show me all vendors with their outstanding balances',
  },
  {
    id: 'find-employees', trigger: 'employees',
    label: 'Browse Employees', description: 'View all employees',
    icon: UserCheck, category: 'find', action: 'prompt',
    prompt: 'Show me all active employees with their details',
  },
  {
    id: 'find-overdue', trigger: 'overdue',
    label: 'Overdue Items', description: 'All overdue invoices and bills',
    icon: AlertCircle, category: 'find', action: 'prompt',
    prompt: 'Show me all overdue invoices and bills with days past due and amounts owed',
  },
  {
    id: 'find-unpaid', trigger: 'unpaid',
    label: 'Unpaid Invoices', description: 'All unpaid / outstanding invoices',
    icon: Clock, category: 'find', action: 'prompt',
    prompt: 'Show me all unpaid and sent invoices with amounts due',
  },
  {
    id: 'find-transactions', trigger: 'transactions',
    label: 'Browse Transactions', description: 'View recent transactions',
    icon: ArrowLeftRight, category: 'find', action: 'prompt',
    prompt: 'Show me recent transactions ',
  },
  {
    id: 'find-accounts', trigger: 'accounts',
    label: 'Chart of Accounts', description: 'View all accounts and balances',
    icon: Landmark, category: 'find', action: 'prompt',
    prompt: 'Show me the chart of accounts with current balances',
  },
  {
    id: 'find-quotes', trigger: 'quotes',
    label: 'Browse Quotes', description: 'View all quotes / estimates',
    icon: ClipboardList, category: 'find', action: 'prompt',
    prompt: 'Show me all quotes ',
  },

  // ─── REPORTS ───────────────────────────────────────────────────────────────
  {
    id: 'report-pnl', trigger: 'pnl', aliases: ['pl', 'profitloss'],
    label: 'Profit & Loss', description: 'Generate P&L report',
    icon: BarChart3, category: 'reports', action: 'prompt',
    prompt: 'Generate a profit and loss report for this month',
    shortcut: '/pnl',
  },
  {
    id: 'report-balance', trigger: 'balance', aliases: ['bs', 'balancesheet'],
    label: 'Balance Sheet', description: 'Generate balance sheet',
    icon: Scale, category: 'reports', action: 'prompt',
    prompt: 'Generate the balance sheet as of today',
  },
  {
    id: 'report-cashflow', trigger: 'cashflow', aliases: ['cf'],
    label: 'Cash Flow', description: 'Cash flow statement',
    icon: TrendingUp, category: 'reports', action: 'prompt',
    prompt: 'Generate a cash flow statement for this month',
  },
  {
    id: 'report-trial', trigger: 'trial', aliases: ['tb', 'trialbalance'],
    label: 'Trial Balance', description: 'Generate trial balance',
    icon: List, category: 'reports', action: 'prompt',
    prompt: 'Generate the trial balance',
  },
  {
    id: 'report-ar', trigger: 'ar', aliases: ['receivable', 'aging'],
    label: 'AR Aging', description: 'Accounts receivable aging report',
    icon: TrendingDown, category: 'reports', action: 'prompt',
    prompt: 'Generate an accounts receivable aging report showing overdue amounts by customer and age bucket (current, 1-30, 31-60, 60+ days)',
  },
  {
    id: 'report-ap', trigger: 'ap', aliases: ['payable'],
    label: 'AP Aging', description: 'Accounts payable aging report',
    icon: TrendingDown, category: 'reports', action: 'prompt',
    prompt: 'Generate an accounts payable aging report showing amounts owed by vendor and age bucket',
  },
  {
    id: 'report-tax', trigger: 'tax', aliases: ['vat', 'gst'],
    label: 'Tax Summary', description: 'Tax liability and collected summary',
    icon: Calculator, category: 'reports', action: 'prompt',
    prompt: 'Generate a tax summary report showing tax collected on invoices, tax paid on bills, and net tax liability for this period',
  },
  {
    id: 'report-payroll', trigger: 'payroll',
    label: 'Payroll Summary', description: 'Payroll and salary summary',
    icon: DollarSign, category: 'reports', action: 'prompt',
    prompt: 'Generate a payroll summary for this month showing all employees, salaries, deductions and net pay',
  },
  {
    id: 'report-compare', trigger: 'compare', aliases: ['comparison'],
    label: 'Compare Periods', description: 'Compare two financial periods',
    icon: BarChart2, category: 'reports', action: 'prompt',
    prompt: 'Compare this month vs last month: revenue, expenses, profit, and key changes',
  },
  {
    id: 'report-forecast', trigger: 'forecast',
    label: 'Forecast', description: 'Forecast next period financials',
    icon: TrendingUp, category: 'reports', action: 'prompt',
    prompt: 'Based on current trends, forecast next month\'s revenue and expenses with reasoning',
  },
  {
    id: 'report-expense', trigger: 'expenses',
    label: 'Expense Analysis', description: 'Break down expenses by category',
    icon: Receipt, category: 'reports', action: 'prompt',
    prompt: 'Show a detailed expense breakdown by category for this month with totals and percentage of total spend',
  },

  // ─── AI MODES ──────────────────────────────────────────────────────────────
  {
    id: 'mode-analyst', trigger: 'analyst', aliases: ['analysis'],
    label: 'Analyst Mode', description: 'Deep financial analysis with insights',
    icon: BarChart3, category: 'ai', action: 'prompt',
    prompt: '[ANALYST MODE] Perform a deep financial analysis: ',
  },
  {
    id: 'mode-audit', trigger: 'audit', aliases: ['auditor'],
    label: 'Audit Mode', description: 'Formal, citation-heavy audit responses',
    icon: ShieldCheck, category: 'ai', action: 'prompt',
    prompt: '[AUDIT MODE] Provide a formal audit-ready response with precise figures and citations: ',
  },
  {
    id: 'mode-brief', trigger: 'brief', aliases: ['short', 'tldr'],
    label: 'Brief Mode', description: 'Short, to-the-point answers only',
    icon: AlignLeft, category: 'ai', action: 'prompt',
    prompt: '[BRIEF] In one concise paragraph only: ',
  },
  {
    id: 'mode-explain', trigger: 'explain',
    label: 'Explain Mode', description: 'Plain-language explanations for non-accountants',
    icon: HelpCircle, category: 'ai', action: 'prompt',
    prompt: 'Explain in plain, simple language (as if to a non-accountant): ',
  },
  {
    id: 'mode-advisor', trigger: 'advise', aliases: ['advisor', 'recommend'],
    label: 'Advisor Mode', description: 'Strategic business advice and recommendations',
    icon: Activity, category: 'ai', action: 'prompt',
    prompt: '[ADVISOR MODE] As a financial advisor, provide strategic recommendations: ',
  },

  // ─── ACTIONS ───────────────────────────────────────────────────────────────
  {
    id: 'summarize', trigger: 'summarize', aliases: ['summary', 'overview'],
    label: 'Summarize Finances', description: 'Full financial health summary',
    icon: Activity, category: 'actions', action: 'prompt',
    prompt: 'Summarize the current financial state of the business including revenue, expenses, outstanding balances, overdue items, and any urgent actions needed',
  },
  {
    id: 'remind', trigger: 'remind', aliases: ['reminders', 'followup'],
    label: 'Send Reminders', description: 'Payment reminders to overdue customers',
    icon: Bell, category: 'actions', action: 'prompt',
    prompt: 'Send payment reminders to all customers with overdue invoices. Show me the list of customers and draft reminder messages',
  },
  {
    id: 'reconcile', trigger: 'reconcile', aliases: ['recon'],
    label: 'Reconcile', description: 'Bank reconciliation assistance',
    icon: GitMerge, category: 'actions', action: 'prompt',
    prompt: 'Help me reconcile my bank accounts for this month. Show unmatched transactions and any discrepancies',
  },
  {
    id: 'bulk', trigger: 'bulk', aliases: ['batch'],
    label: 'Bulk Operations', description: 'Process multiple records at once',
    icon: Layers, category: 'actions', action: 'prompt',
    prompt: 'Perform bulk operation: ',
  },
  {
    id: 'export', trigger: 'export',
    label: 'Export Data', description: 'Export records to CSV or PDF',
    icon: Download, category: 'actions', action: 'prompt',
    prompt: 'Export ',
  },
  {
    id: 'recurring', trigger: 'recurring', aliases: ['repeat', 'schedule'],
    label: 'Recurring Setup', description: 'Set up recurring transactions',
    icon: RefreshCw, category: 'actions', action: 'prompt',
    prompt: 'Set up a recurring transaction: ',
  },
  {
    id: 'clear', trigger: 'clear', aliases: ['new', 'reset'],
    label: 'Clear Chat', description: 'Start a fresh conversation',
    icon: Trash2, category: 'actions', action: 'function',
    fn: 'clearChat',
  },
];

/** Return commands filtered by a query string (fuzzy match on trigger, label, description) */
export function searchCommands(query: string): SlashCommand[] {
  if (!query) return COMMANDS;
  const q = query.toLowerCase().trim();
  return COMMANDS.filter(cmd => {
    if (cmd.trigger.startsWith(q)) return true;
    if (cmd.aliases?.some(a => a.startsWith(q))) return true;
    if (cmd.label.toLowerCase().includes(q)) return true;
    if (cmd.description.toLowerCase().includes(q)) return true;
    return false;
  });
}

/** Group a list of commands by category, preserving order */
export function groupCommands(cmds: SlashCommand[]): Partial<Record<CommandCategory, SlashCommand[]>> {
  const result: Partial<Record<CommandCategory, SlashCommand[]>> = {};
  const order: CommandCategory[] = ['create', 'find', 'reports', 'ai', 'actions'];
  for (const cat of order) {
    const items = cmds.filter(c => c.category === cat);
    if (items.length > 0) result[cat] = items;
  }
  return result;
}
