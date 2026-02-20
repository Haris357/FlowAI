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

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Flowbooks',
    description: 'AI-first accounting software that helps you manage your business finances effortlessly.',
  },
  {
    id: 'create-company',
    title: 'Create Your Company',
    description: 'Start by setting up your business. Click "+ New Company" to begin.',
  },
  {
    id: 'add-customer',
    title: 'Add Your First Customer',
    description: 'Go to Sales > Customers and add a customer to start invoicing.',
  },
  {
    id: 'create-invoice',
    title: 'Create an Invoice',
    description: 'Navigate to Sales > Invoices to create and send your first invoice.',
  },
  {
    id: 'try-ai',
    title: 'Try the AI Assistant',
    description: 'Open Flow AI and ask: "Show me a summary of my business" to see it in action.',
  },
];
