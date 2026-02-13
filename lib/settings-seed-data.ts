// Master Settings Seed Data
// These are the default options that can be customized per company

export interface SettingOption {
  code: string;
  label: string;
  color?: string;
  order: number;
  isDefault?: boolean;
  isSystem?: boolean;
  isActive?: boolean;
}

export interface SettingsCategory {
  code: string;
  name: string;
  description: string;
  options: SettingOption[];
}

// Invoice Statuses
export const INVOICE_STATUSES: SettingOption[] = [
  { code: 'draft', label: 'Draft', color: 'neutral', order: 1, isDefault: true, isSystem: true },
  { code: 'sent', label: 'Sent', color: 'primary', order: 2, isSystem: true },
  { code: 'viewed', label: 'Viewed', color: 'warning', order: 3, isSystem: true },
  { code: 'partial', label: 'Partially Paid', color: 'warning', order: 4, isSystem: true },
  { code: 'paid', label: 'Paid', color: 'success', order: 5, isSystem: true },
  { code: 'overdue', label: 'Overdue', color: 'danger', order: 6, isSystem: true },
  { code: 'cancelled', label: 'Cancelled', color: 'neutral', order: 7, isSystem: true },
  { code: 'refunded', label: 'Refunded', color: 'warning', order: 8, isSystem: true },
];

// Bill Statuses
export const BILL_STATUSES: SettingOption[] = [
  { code: 'draft', label: 'Draft', color: 'neutral', order: 1, isDefault: true, isSystem: true },
  { code: 'unpaid', label: 'Unpaid', color: 'warning', order: 2, isSystem: true },
  { code: 'partial', label: 'Partially Paid', color: 'warning', order: 3, isSystem: true },
  { code: 'paid', label: 'Paid', color: 'success', order: 4, isSystem: true },
  { code: 'overdue', label: 'Overdue', color: 'danger', order: 5, isSystem: true },
  { code: 'cancelled', label: 'Cancelled', color: 'neutral', order: 6, isSystem: true },
];

// Quote Statuses
export const QUOTE_STATUSES: SettingOption[] = [
  { code: 'draft', label: 'Draft', color: 'neutral', order: 1, isDefault: true, isSystem: true },
  { code: 'sent', label: 'Sent', color: 'primary', order: 2, isSystem: true },
  { code: 'accepted', label: 'Accepted', color: 'success', order: 3, isSystem: true },
  { code: 'declined', label: 'Declined', color: 'danger', order: 4, isSystem: true },
  { code: 'expired', label: 'Expired', color: 'neutral', order: 5, isSystem: true },
];

// Purchase Order Statuses
export const PURCHASE_ORDER_STATUSES: SettingOption[] = [
  { code: 'draft', label: 'Draft', color: 'neutral', order: 1, isDefault: true, isSystem: true },
  { code: 'sent', label: 'Sent', color: 'primary', order: 2, isSystem: true },
  { code: 'confirmed', label: 'Confirmed', color: 'primary', order: 3, isSystem: true },
  { code: 'received', label: 'Received', color: 'success', order: 4, isSystem: true },
  { code: 'cancelled', label: 'Cancelled', color: 'neutral', order: 5, isSystem: true },
];

// Credit Note Statuses
export const CREDIT_NOTE_STATUSES: SettingOption[] = [
  { code: 'draft', label: 'Draft', color: 'neutral', order: 1, isDefault: true, isSystem: true },
  { code: 'issued', label: 'Issued', color: 'primary', order: 2, isSystem: true },
  { code: 'applied', label: 'Applied', color: 'success', order: 3, isSystem: true },
  { code: 'cancelled', label: 'Cancelled', color: 'neutral', order: 4, isSystem: true },
];

// Debit Note Statuses
export const DEBIT_NOTE_STATUSES: SettingOption[] = [
  { code: 'draft', label: 'Draft', color: 'neutral', order: 1, isDefault: true, isSystem: true },
  { code: 'issued', label: 'Issued', color: 'primary', order: 2, isSystem: true },
  { code: 'applied', label: 'Applied', color: 'success', order: 3, isSystem: true },
  { code: 'partial', label: 'Partially Applied', color: 'warning', order: 4, isSystem: true },
  { code: 'settled', label: 'Settled', color: 'success', order: 5, isSystem: true },
  { code: 'void', label: 'Void', color: 'danger', order: 6, isSystem: true },
];

// Salary Slip Statuses
export const SALARY_SLIP_STATUSES: SettingOption[] = [
  { code: 'generated', label: 'Generated', color: 'warning', order: 1, isDefault: true, isSystem: true },
  { code: 'paid', label: 'Paid', color: 'success', order: 2, isSystem: true },
  { code: 'cancelled', label: 'Cancelled', color: 'neutral', order: 3, isSystem: true },
];

// Payment Methods
export const PAYMENT_METHODS: SettingOption[] = [
  { code: 'cash', label: 'Cash', color: 'success', order: 1, isDefault: true, isSystem: true },
  { code: 'bank_transfer', label: 'Bank Transfer', color: 'primary', order: 2, isSystem: true },
  { code: 'card', label: 'Credit/Debit Card', color: 'primary', order: 3, isSystem: true },
  { code: 'cheque', label: 'Cheque', color: 'neutral', order: 4, isSystem: true },
  { code: 'online', label: 'Online Payment', color: 'primary', order: 5, isSystem: true },
  { code: 'mobile', label: 'Mobile Payment', color: 'primary', order: 6, isSystem: true },
  { code: 'crypto', label: 'Cryptocurrency', color: 'warning', order: 7, isSystem: false },
];

// Expense Categories
export const EXPENSE_CATEGORIES: SettingOption[] = [
  { code: 'office_supplies', label: 'Office Supplies', order: 1, isSystem: true },
  { code: 'office_equipment', label: 'Office Equipment', order: 2, isSystem: true },
  { code: 'rent', label: 'Rent', order: 3, isSystem: true },
  { code: 'utilities', label: 'Utilities', order: 4, isSystem: true },
  { code: 'travel', label: 'Travel', order: 5, isSystem: true },
  { code: 'meals', label: 'Meals & Entertainment', order: 6, isSystem: true },
  { code: 'marketing', label: 'Marketing & Advertising', order: 7, isSystem: true },
  { code: 'software', label: 'Software & Subscriptions', order: 8, isSystem: true },
  { code: 'professional', label: 'Professional Services', order: 9, isSystem: true },
  { code: 'insurance', label: 'Insurance', order: 10, isSystem: true },
  { code: 'taxes', label: 'Taxes & Licenses', order: 11, isSystem: true },
  { code: 'repairs', label: 'Repairs & Maintenance', order: 12, isSystem: true },
  { code: 'vehicle', label: 'Vehicle Expenses', order: 13, isSystem: true },
  { code: 'shipping', label: 'Shipping & Delivery', order: 14, isSystem: true },
  { code: 'bank_fees', label: 'Bank Fees', order: 15, isSystem: true },
  { code: 'other', label: 'Other', order: 99, isSystem: true },
];

// Income Categories
export const INCOME_CATEGORIES: SettingOption[] = [
  { code: 'sales', label: 'Sales Revenue', order: 1, isDefault: true, isSystem: true },
  { code: 'services', label: 'Service Revenue', order: 2, isSystem: true },
  { code: 'consulting', label: 'Consulting', order: 3, isSystem: true },
  { code: 'interest', label: 'Interest Income', order: 4, isSystem: true },
  { code: 'rental', label: 'Rental Income', order: 5, isSystem: true },
  { code: 'commission', label: 'Commission', order: 6, isSystem: true },
  { code: 'refund', label: 'Refunds Received', order: 7, isSystem: true },
  { code: 'other', label: 'Other Income', order: 99, isSystem: true },
];

// Business Types
export const BUSINESS_TYPES: SettingOption[] = [
  { code: 'freelancer', label: 'Freelancer', order: 1, isSystem: true },
  { code: 'consulting', label: 'Consulting', order: 2, isSystem: true },
  { code: 'retail', label: 'Retail', order: 3, isSystem: true },
  { code: 'wholesale', label: 'Wholesale', order: 4, isSystem: true },
  { code: 'manufacturing', label: 'Manufacturing', order: 5, isSystem: true },
  { code: 'services', label: 'Services', order: 6, isSystem: true },
  { code: 'technology', label: 'Technology', order: 7, isSystem: true },
  { code: 'construction', label: 'Construction', order: 8, isSystem: true },
  { code: 'healthcare', label: 'Healthcare', order: 9, isSystem: true },
  { code: 'education', label: 'Education', order: 10, isSystem: true },
  { code: 'hospitality', label: 'Hospitality', order: 11, isSystem: true },
  { code: 'real_estate', label: 'Real Estate', order: 12, isSystem: true },
  { code: 'transportation', label: 'Transportation', order: 13, isSystem: true },
  { code: 'agriculture', label: 'Agriculture', order: 14, isSystem: true },
  { code: 'ecommerce', label: 'E-Commerce', order: 15, isSystem: true },
  { code: 'nonprofit', label: 'Non-Profit', order: 16, isSystem: true },
  { code: 'other', label: 'Other', order: 99, isSystem: true },
];

// Employee Statuses
export const EMPLOYEE_STATUSES: SettingOption[] = [
  { code: 'active', label: 'Active', color: 'success', order: 1, isDefault: true, isSystem: true },
  { code: 'on_leave', label: 'On Leave', color: 'warning', order: 2, isSystem: true },
  { code: 'probation', label: 'Probation', color: 'primary', order: 3, isSystem: true },
  { code: 'suspended', label: 'Suspended', color: 'danger', order: 4, isSystem: true },
  { code: 'terminated', label: 'Terminated', color: 'neutral', order: 5, isSystem: true },
  { code: 'resigned', label: 'Resigned', color: 'neutral', order: 6, isSystem: true },
];

// Salary Types
export const SALARY_TYPES: SettingOption[] = [
  { code: 'monthly', label: 'Monthly', order: 1, isDefault: true, isSystem: true },
  { code: 'bi_weekly', label: 'Bi-Weekly', order: 2, isSystem: true },
  { code: 'weekly', label: 'Weekly', order: 3, isSystem: true },
  { code: 'hourly', label: 'Hourly', order: 4, isSystem: true },
  { code: 'daily', label: 'Daily', order: 5, isSystem: true },
  { code: 'project', label: 'Per Project', order: 6, isSystem: true },
  { code: 'commission', label: 'Commission Based', order: 7, isSystem: true },
];

// Employment Types
export const EMPLOYMENT_TYPES: SettingOption[] = [
  { code: 'full_time', label: 'Full Time', order: 1, isDefault: true, isSystem: true },
  { code: 'part_time', label: 'Part Time', order: 2, isSystem: true },
  { code: 'contract', label: 'Contract', order: 3, isSystem: true },
  { code: 'temporary', label: 'Temporary', order: 4, isSystem: true },
  { code: 'intern', label: 'Intern', order: 5, isSystem: true },
  { code: 'freelance', label: 'Freelance', order: 6, isSystem: true },
];

// Customer Types
export const CUSTOMER_TYPES: SettingOption[] = [
  { code: 'individual', label: 'Individual', order: 1, isDefault: true, isSystem: true },
  { code: 'business', label: 'Business', order: 2, isSystem: true },
  { code: 'government', label: 'Government', order: 3, isSystem: true },
  { code: 'nonprofit', label: 'Non-Profit', order: 4, isSystem: true },
];

// Vendor Types
export const VENDOR_TYPES: SettingOption[] = [
  { code: 'supplier', label: 'Supplier', order: 1, isDefault: true, isSystem: true },
  { code: 'service_provider', label: 'Service Provider', order: 2, isSystem: true },
  { code: 'contractor', label: 'Contractor', order: 3, isSystem: true },
  { code: 'consultant', label: 'Consultant', order: 4, isSystem: true },
];

// Transaction Types
export const TRANSACTION_TYPES: SettingOption[] = [
  { code: 'income', label: 'Income', color: 'success', order: 1, isSystem: true },
  { code: 'expense', label: 'Expense', color: 'danger', order: 2, isSystem: true },
  { code: 'transfer', label: 'Transfer', color: 'primary', order: 3, isSystem: true },
  { code: 'refund', label: 'Refund', color: 'warning', order: 4, isSystem: true },
];

// Tax Types
export const TAX_TYPES: SettingOption[] = [
  { code: 'vat', label: 'VAT', order: 1, isSystem: true },
  { code: 'gst', label: 'GST', order: 2, isSystem: true },
  { code: 'sales_tax', label: 'Sales Tax', order: 3, isSystem: true },
  { code: 'withholding', label: 'Withholding Tax', order: 4, isSystem: true },
  { code: 'service_tax', label: 'Service Tax', order: 5, isSystem: true },
  { code: 'none', label: 'No Tax', order: 99, isDefault: true, isSystem: true },
];

// All Settings Categories
export const ALL_SETTINGS: SettingsCategory[] = [
  {
    code: 'invoice_status',
    name: 'Invoice Statuses',
    description: 'Status options for invoices',
    options: INVOICE_STATUSES,
  },
  {
    code: 'bill_status',
    name: 'Bill Statuses',
    description: 'Status options for bills',
    options: BILL_STATUSES,
  },
  {
    code: 'quote_status',
    name: 'Quote Statuses',
    description: 'Status options for quotes',
    options: QUOTE_STATUSES,
  },
  {
    code: 'purchase_order_status',
    name: 'Purchase Order Statuses',
    description: 'Status options for purchase orders',
    options: PURCHASE_ORDER_STATUSES,
  },
  {
    code: 'credit_note_status',
    name: 'Credit Note Statuses',
    description: 'Status options for credit notes',
    options: CREDIT_NOTE_STATUSES,
  },
  {
    code: 'debit_note_status',
    name: 'Debit Note Statuses',
    description: 'Status options for debit notes',
    options: DEBIT_NOTE_STATUSES,
  },
  {
    code: 'salary_slip_status',
    name: 'Salary Slip Statuses',
    description: 'Status options for salary slips',
    options: SALARY_SLIP_STATUSES,
  },
  {
    code: 'payment_method',
    name: 'Payment Methods',
    description: 'Available payment methods',
    options: PAYMENT_METHODS,
  },
  {
    code: 'expense_category',
    name: 'Expense Categories',
    description: 'Categories for expenses',
    options: EXPENSE_CATEGORIES,
  },
  {
    code: 'income_category',
    name: 'Income Categories',
    description: 'Categories for income',
    options: INCOME_CATEGORIES,
  },
  {
    code: 'business_type',
    name: 'Business Types',
    description: 'Types of businesses',
    options: BUSINESS_TYPES,
  },
  {
    code: 'employee_status',
    name: 'Employee Statuses',
    description: 'Status options for employees',
    options: EMPLOYEE_STATUSES,
  },
  {
    code: 'salary_type',
    name: 'Salary Types',
    description: 'Salary payment frequencies',
    options: SALARY_TYPES,
  },
  {
    code: 'employment_type',
    name: 'Employment Types',
    description: 'Types of employment',
    options: EMPLOYMENT_TYPES,
  },
  {
    code: 'customer_type',
    name: 'Customer Types',
    description: 'Types of customers',
    options: CUSTOMER_TYPES,
  },
  {
    code: 'vendor_type',
    name: 'Vendor Types',
    description: 'Types of vendors',
    options: VENDOR_TYPES,
  },
  {
    code: 'transaction_type',
    name: 'Transaction Types',
    description: 'Types of transactions',
    options: TRANSACTION_TYPES,
  },
  {
    code: 'tax_type',
    name: 'Tax Types',
    description: 'Types of taxes',
    options: TAX_TYPES,
  },
];

// Helper to get default option for a category
export function getDefaultOption(options: SettingOption[]): SettingOption | undefined {
  return options.find(o => o.isDefault) || options[0];
}

// Helper to get option by code
export function getOptionByCode(options: SettingOption[], code: string): SettingOption | undefined {
  return options.find(o => o.code === code);
}

// Helper to get option label by code
export function getOptionLabel(options: SettingOption[], code: string): string {
  const option = getOptionByCode(options, code);
  return option?.label || code;
}

// Helper to get option color by code
export function getOptionColor(options: SettingOption[], code: string): string {
  const option = getOptionByCode(options, code);
  return option?.color || 'neutral';
}
