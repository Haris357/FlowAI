import { Timestamp } from 'firebase/firestore';

export type Industry =
  | 'retail' | 'wholesale' | 'manufacturing' | 'services' | 'consulting'
  | 'technology' | 'healthcare' | 'construction' | 'education' | 'food_beverage'
  | 'real_estate' | 'transport' | 'media' | 'ngo' | 'other';

export type TaxSystem = 'GST' | 'VAT' | 'SalesTax' | 'None';
export type BusinessSize = 'solo' | 'small' | 'medium' | 'enterprise';
export type AIMode = 'conversational' | 'formal' | 'brief' | 'detailed';
export type ChatDensity = 'comfortable' | 'compact';
export type FiscalYearStart = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun'
  | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';

export const INDUSTRY_LABELS: Record<Industry, string> = {
  retail: 'Retail', wholesale: 'Wholesale', manufacturing: 'Manufacturing',
  services: 'Services', consulting: 'Consulting', technology: 'Technology / SaaS',
  healthcare: 'Healthcare', construction: 'Construction', education: 'Education',
  food_beverage: 'Food & Beverage', real_estate: 'Real Estate',
  transport: 'Transport & Logistics', media: 'Media & Creative', ngo: 'NGO / Non-Profit', other: 'Other',
};

export const FISCAL_MONTH_LABELS: Record<FiscalYearStart, string> = {
  jan: 'January', feb: 'February', mar: 'March', apr: 'April',
  may: 'May', jun: 'June', jul: 'July', aug: 'August',
  sep: 'September', oct: 'October', nov: 'November', dec: 'December',
};

export interface BusinessProfile {
  // Business identity
  industry: Industry;
  businessSize: BusinessSize;

  // Financial preferences
  fiscalYearStart: FiscalYearStart;
  taxSystem: TaxSystem;
  taxRate: number;                   // e.g. 17 for 17%
  defaultPaymentTerms: number;       // days, e.g. 30

  // AI behavior
  defaultAIMode: AIMode;
  responseLanguage: string;          // e.g. 'English', 'Urdu'
  autoSuggestActions: boolean;
  defaultTimeScope: string;          // '' | 'thisweek' | 'thismonth' | 'thisyear'

  // Interface
  chatDensity: ChatDensity;

  // Business context for AI
  businessDescription: string;       // free text: "We're a Karachi-based software house..."
  commonServices: string[];          // e.g. ['Web Development', 'SEO', 'UI Design']

  updatedAt?: Timestamp;
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  industry: 'services',
  businessSize: 'small',
  fiscalYearStart: 'jan',
  taxSystem: 'None',
  taxRate: 0,
  defaultPaymentTerms: 30,
  defaultAIMode: 'conversational',
  responseLanguage: 'English',
  autoSuggestActions: true,
  defaultTimeScope: '',
  chatDensity: 'comfortable',
  businessDescription: '',
  commonServices: [],
};

// ── Saved Templates ──────────────────────────────────────────────────────────

export const TEMPLATE_FOLDERS = ['General', 'Reports', 'Clients', 'Payroll', 'Daily', 'Custom'] as const;
export type TemplateFolder = typeof TEMPLATE_FOLDERS[number];

export interface SavedTemplate {
  id: string;
  name: string;
  prompt: string;
  folder: TemplateFolder;
  emoji: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const DEFAULT_TEMPLATES: Omit<SavedTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'EOD Summary',       prompt: 'Summarize today\'s transactions, invoices created, and payments received',                             folder: 'Daily',   emoji: '📊' },
  { name: 'Weekly AR',         prompt: 'Show all unpaid invoices older than 7 days with customer contact info and amounts due',                folder: 'Reports', emoji: '📬' },
  { name: 'Cash Position',     prompt: 'What is my current cash balance across all bank accounts and total outstanding receivables?',          folder: 'Reports', emoji: '💰' },
  { name: 'Overdue Alerts',    prompt: 'List all overdue invoices and bills with days past due, amounts, and suggested next actions',          folder: 'Clients', emoji: '🚨' },
  { name: 'Monthly P&L',      prompt: 'Generate a profit and loss report for this month with comparison to last month',                        folder: 'Reports', emoji: '📈' },
  { name: 'Payroll This Month',prompt: 'Generate payroll summary for this month showing all employees, salaries, deductions and net pay',       folder: 'Payroll', emoji: '💼' },
];
