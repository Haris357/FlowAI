export interface DocArticle {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'invoicing' | 'expenses' | 'banking' | 'payroll' | 'reports' | 'ai-assistant' | 'settings';
  icon: string; // lucide icon name
  steps?: string[];
}

export const DOC_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'getting-started', label: 'Getting Started', icon: 'Rocket' },
  { id: 'invoicing', label: 'Invoicing & Sales', icon: 'FileText' },
  { id: 'expenses', label: 'Bills & Expenses', icon: 'Receipt' },
  { id: 'banking', label: 'Banking', icon: 'Landmark' },
  { id: 'payroll', label: 'Payroll', icon: 'DollarSign' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: 'MessageCircle' },
  { id: 'settings', label: 'Settings & Account', icon: 'Settings' },
];

export const DOC_ARTICLES: DocArticle[] = [
  {
    id: 'create-company',
    title: 'Create Your First Company',
    description: 'Set up your business in Flowbooks with the step-by-step company creation wizard.',
    category: 'getting-started',
    icon: 'Building2',
    steps: [
      'Click "+ New Company" on the companies page',
      'Enter your business name and select business type',
      'Set your country, currency, and contact info',
      'Configure tax settings and fiscal year',
      'Your chart of accounts is automatically created',
    ],
  },
  {
    id: 'create-invoice',
    title: 'Create and Send an Invoice',
    description: 'Learn how to create, customize, and send professional invoices to your customers.',
    category: 'invoicing',
    icon: 'FileText',
    steps: [
      'Navigate to Sales > Invoices',
      'Click "New Invoice" and select a customer',
      'Add line items with descriptions, quantities, and rates',
      'Set due date, tax rate, and any discounts',
      'Preview the invoice and click "Send" to email it',
    ],
  },
  {
    id: 'record-bill',
    title: 'Record a Bill or Expense',
    description: 'Track your business expenses by recording bills from vendors.',
    category: 'expenses',
    icon: 'Receipt',
    steps: [
      'Navigate to Purchases > Bills',
      'Click "New Bill" and enter vendor details',
      'Add expense items and categorize them',
      'Set the due date and payment terms',
      'Mark as paid when payment is made',
    ],
  },
  {
    id: 'bank-setup',
    title: 'Set Up Bank Accounts',
    description: 'Connect your bank accounts to track deposits, withdrawals, and reconcile transactions.',
    category: 'banking',
    icon: 'Landmark',
    steps: [
      'Navigate to Banking > Bank Accounts',
      'Click "Add Bank Account"',
      'Enter account name, type, and opening balance',
      'The account is linked to your chart of accounts automatically',
      'Record transactions as they occur',
    ],
  },
  {
    id: 'run-payroll',
    title: 'Run Payroll',
    description: 'Generate salary slips and manage employee payments.',
    category: 'payroll',
    icon: 'DollarSign',
    steps: [
      'Navigate to People > Employees and add your team',
      'Set salary details, allowances, and deductions',
      'Go to People > Payroll to generate salary slips',
      'Review and approve each slip',
      'Download PDF salary slips for distribution',
    ],
  },
  {
    id: 'view-reports',
    title: 'View Financial Reports',
    description: 'Access Profit & Loss, Balance Sheet, Trial Balance, and Cash Flow reports.',
    category: 'reports',
    icon: 'BarChart3',
    steps: [
      'Navigate to Reports from the sidebar',
      'Select the report type you need',
      'Choose the date range for the report',
      'View the detailed breakdown with account-level data',
      'Export to PDF or Excel (Pro and Max plans)',
    ],
  },
  {
    id: 'use-ai',
    title: 'Using the AI Assistant',
    description: 'Ask Flow AI natural language questions about your business finances.',
    category: 'ai-assistant',
    icon: 'MessageCircle',
    steps: [
      'Click "Flow AI" in the sidebar to open the chat',
      'Type questions like "Show me unpaid invoices" or "What\'s my revenue this month?"',
      'The AI can create invoices, record expenses, and run reports',
      'Use follow-up questions to drill into the data',
      'Your AI usage is tracked against your monthly token allocation',
    ],
  },
  {
    id: 'manage-subscription',
    title: 'Manage Your Subscription',
    description: 'Upgrade your plan, purchase tokens, and manage billing.',
    category: 'settings',
    icon: 'CreditCard',
    steps: [
      'Go to Account Settings > Subscription',
      'View your current plan and usage',
      'Click "Upgrade" to change plans',
      'Purchase additional AI token packs if needed',
      'View billing history and manage payment method',
    ],
  },
];

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** data-tour attribute value on the target DOM element (null = full-screen overlay step) */
  target: string | null;
  features?: string[];
  tip?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Flowbooks!',
    description: 'Your AI-powered accounting platform. Let us show you around — it only takes a minute.',
    target: null,
    features: [
      'AI-powered financial assistant',
      'Professional invoices & quotes',
      'Bill tracking & purchase orders',
      'Bank account management',
      'Employee payroll',
      'Financial reports & insights',
    ],
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'Get a real-time overview of your business — revenue, expenses, cash flow, and recent activity all in one place.',
    target: 'dashboard',
    tip: 'The dashboard updates automatically as you add transactions.',
  },
  {
    id: 'flow-ai',
    title: 'Flow AI — Your Smart Assistant',
    description: 'Ask questions in plain English like "Create an invoice for $500" or "What\'s my profit this month?" — Flow AI handles it instantly.',
    target: 'flow-ai',
    features: [
      'Create invoices & bills by chatting',
      'Get instant financial summaries',
      'Ask accounting questions naturally',
    ],
    tip: 'Try asking: "Show me a summary of my business"',
  },
  {
    id: 'sales',
    title: 'Sales & Invoicing',
    description: 'Create and send professional invoices, quotes, and credit notes. Manage your customers and track payments effortlessly.',
    target: 'sales',
    features: [
      'Invoices — Create, send, and track payments',
      'Quotes — Send estimates that convert to invoices',
      'Customers — Manage your client directory',
      'Credit Notes — Handle returns and adjustments',
    ],
  },
  {
    id: 'purchases',
    title: 'Purchases & Bills',
    description: 'Track what you owe. Record bills, create purchase orders, and manage your vendors all in one place.',
    target: 'purchases',
    features: [
      'Bills — Record and track what you owe',
      'Purchase Orders — Create orders for vendors',
      'Vendors — Manage your supplier directory',
    ],
  },
  {
    id: 'banking',
    title: 'Banking',
    description: 'Connect your bank accounts, record transactions, and reconcile everything to keep your books accurate.',
    target: 'banking',
    features: [
      'Bank Accounts — Track balances and activity',
      'Transactions — Record deposits & withdrawals',
    ],
  },
  {
    id: 'people',
    title: 'People & Payroll',
    description: 'Add employees, set salaries, and run payroll with automated salary slip generation.',
    target: 'people',
    features: [
      'Employees — Manage your team directory',
      'Payroll — Generate salary slips and track payments',
    ],
  },
  {
    id: 'accounting',
    title: 'Accounting',
    description: 'Your full chart of accounts, journal entries, and recurring transactions — the backbone of your books.',
    target: 'accounting',
    features: [
      'Chart of Accounts — Organize your finances',
      'Journal Entries — Record manual adjustments',
      'Recurring — Automate repeated transactions',
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Insights',
    description: 'Profit & Loss, Balance Sheet, Cash Flow, Trial Balance — generate any report with a single click.',
    target: 'reports',
    tip: 'Export reports to PDF or Excel on Pro and Max plans.',
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    description: 'You now know your way around Flowbooks. Start by exploring your dashboard or chatting with Flow AI.',
    target: null,
  },
];
