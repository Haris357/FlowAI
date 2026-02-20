export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: { type: 'feature' | 'improvement' | 'fix'; text: string }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.0.0',
    date: '2026-02-19',
    title: 'Subscription System & Admin Panel',
    description: 'Complete subscription system with 3-tier plans, admin dashboard, and support system.',
    changes: [
      { type: 'feature', text: 'Free, Pro ($29.99/mo), and Max ($99.99/mo) subscription plans' },
      { type: 'feature', text: 'AI token usage tracking with monthly allocations' },
      { type: 'feature', text: 'Purchase extra AI token packs' },
      { type: 'feature', text: 'Lemon Squeezy payment integration' },
      { type: 'feature', text: 'Admin dashboard for user and subscription management' },
      { type: 'feature', text: 'Support ticket system and feedback forms' },
      { type: 'feature', text: 'In-app notification system' },
      { type: 'improvement', text: 'Redesigned settings page with sidebar navigation' },
      { type: 'improvement', text: 'Redesigned companies page with stat cards and quick links' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-02-15',
    title: 'Dashboard Overhaul',
    description: 'Complete dashboard redesign with real-time charts and analytics.',
    changes: [
      { type: 'feature', text: 'Revenue, profit, and cash flow charts' },
      { type: 'feature', text: '8 stat cards with real-time data' },
      { type: 'feature', text: 'Recent invoices and bills tables with status management' },
      { type: 'improvement', text: 'Status changes now integrate with email notifications' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-15',
    title: 'Initial Release',
    description: 'First public release of Flowbooks AI-first accounting.',
    changes: [
      { type: 'feature', text: 'AI-powered accounting assistant with natural language queries' },
      { type: 'feature', text: 'Invoicing, bills, quotes, purchase orders, credit notes' },
      { type: 'feature', text: 'Chart of accounts with automatic journal entries' },
      { type: 'feature', text: 'Customer, vendor, and employee management' },
      { type: 'feature', text: 'Financial reports: P&L, Balance Sheet, Trial Balance, Cash Flow' },
      { type: 'feature', text: 'Bank account management and transactions' },
      { type: 'feature', text: 'Payroll and salary slip generation' },
      { type: 'feature', text: 'Recurring transactions' },
    ],
  },
];
