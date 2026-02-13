// Master Account Types (Global - shared across all companies)
export const MASTER_ACCOUNT_TYPES = [
  {
    code: 'asset',
    name: 'Assets',
    normalBalance: 'debit' as const,
    order: 1,
    description: 'Resources owned by the business'
  },
  {
    code: 'liability',
    name: 'Liabilities',
    normalBalance: 'credit' as const,
    order: 2,
    description: 'Obligations owed to others'
  },
  {
    code: 'equity',
    name: 'Equity',
    normalBalance: 'credit' as const,
    order: 3,
    description: 'Owner\'s stake in the business'
  },
  {
    code: 'revenue',
    name: 'Revenue',
    normalBalance: 'credit' as const,
    order: 4,
    description: 'Income from business operations'
  },
  {
    code: 'expense',
    name: 'Expenses',
    normalBalance: 'debit' as const,
    order: 5,
    description: 'Costs of running the business'
  }
];

// Default Account Subtypes (Per Company)
export const DEFAULT_ACCOUNT_SUBTYPES = [
  // Asset Subtypes
  { code: 'current_asset', name: 'Current Assets', typeCode: 'asset', order: 1, isSystem: true },
  { code: 'fixed_asset', name: 'Fixed Assets', typeCode: 'asset', order: 2, isSystem: true },
  { code: 'other_asset', name: 'Other Assets', typeCode: 'asset', order: 3, isSystem: false },

  // Liability Subtypes
  { code: 'current_liability', name: 'Current Liabilities', typeCode: 'liability', order: 1, isSystem: true },
  { code: 'long_term_liability', name: 'Long-term Liabilities', typeCode: 'liability', order: 2, isSystem: false },

  // Equity Subtypes
  { code: 'owner_equity', name: 'Owner\'s Equity', typeCode: 'equity', order: 1, isSystem: true },
  { code: 'retained_earnings', name: 'Retained Earnings', typeCode: 'equity', order: 2, isSystem: true },

  // Revenue Subtypes
  { code: 'operating_revenue', name: 'Operating Revenue', typeCode: 'revenue', order: 1, isSystem: true },
  { code: 'other_revenue', name: 'Other Revenue', typeCode: 'revenue', order: 2, isSystem: false },

  // Expense Subtypes
  { code: 'operating_expense', name: 'Operating Expenses', typeCode: 'expense', order: 1, isSystem: true },
  { code: 'cost_of_goods_sold', name: 'Cost of Goods Sold', typeCode: 'expense', order: 2, isSystem: false },
  { code: 'payroll_expense', name: 'Payroll Expenses', typeCode: 'expense', order: 3, isSystem: false },
  { code: 'other_expense', name: 'Other Expenses', typeCode: 'expense', order: 4, isSystem: false },
];

// Default Accounts (Per Company)
export const DEFAULT_ACCOUNTS = [
  // Current Assets
  { code: '1000', name: 'Cash', subtypeCode: 'current_asset', isSystem: true },
  { code: '1010', name: 'Bank Account', subtypeCode: 'current_asset', isSystem: true },
  { code: '1100', name: 'Accounts Receivable', subtypeCode: 'current_asset', isSystem: true },
  { code: '1200', name: 'Inventory', subtypeCode: 'current_asset', isSystem: false },

  // Fixed Assets
  { code: '1500', name: 'Office Equipment', subtypeCode: 'fixed_asset', isSystem: false },
  { code: '1510', name: 'Computer Equipment', subtypeCode: 'fixed_asset', isSystem: false },
  { code: '1520', name: 'Furniture & Fixtures', subtypeCode: 'fixed_asset', isSystem: false },
  { code: '1530', name: 'Vehicles', subtypeCode: 'fixed_asset', isSystem: false },
  { code: '1600', name: 'Accumulated Depreciation', subtypeCode: 'fixed_asset', isSystem: false },

  // Current Liabilities
  { code: '2000', name: 'Accounts Payable', subtypeCode: 'current_liability', isSystem: true },
  { code: '2100', name: 'Credit Card', subtypeCode: 'current_liability', isSystem: false },
  { code: '2200', name: 'Tax Payable', subtypeCode: 'current_liability', isSystem: false },
  { code: '2300', name: 'Salaries Payable', subtypeCode: 'current_liability', isSystem: false },

  // Long-term Liabilities
  { code: '2500', name: 'Bank Loan', subtypeCode: 'long_term_liability', isSystem: false },

  // Owner's Equity
  { code: '3000', name: 'Owner\'s Equity', subtypeCode: 'owner_equity', isSystem: true },
  { code: '3100', name: 'Owner\'s Drawings', subtypeCode: 'owner_equity', isSystem: false },

  // Retained Earnings
  { code: '3200', name: 'Retained Earnings', subtypeCode: 'retained_earnings', isSystem: true },

  // Operating Revenue
  { code: '4000', name: 'Service Revenue', subtypeCode: 'operating_revenue', isSystem: true },
  { code: '4010', name: 'Product Sales', subtypeCode: 'operating_revenue', isSystem: false },
  { code: '4020', name: 'Consulting Income', subtypeCode: 'operating_revenue', isSystem: false },

  // Other Revenue
  { code: '4900', name: 'Interest Income', subtypeCode: 'other_revenue', isSystem: false },
  { code: '4910', name: 'Other Income', subtypeCode: 'other_revenue', isSystem: false },

  // Operating Expenses
  { code: '5000', name: 'Advertising & Marketing', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5010', name: 'Bank Charges', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5020', name: 'Software & Subscriptions', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5030', name: 'Office Supplies', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5040', name: 'Professional Services', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5050', name: 'Travel Expenses', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5060', name: 'Meals & Entertainment', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5070', name: 'Internet & Phone', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5080', name: 'Insurance', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5090', name: 'Rent', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5100', name: 'Utilities', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5110', name: 'Repairs & Maintenance', subtypeCode: 'operating_expense', isSystem: false },
  { code: '5120', name: 'Depreciation Expense', subtypeCode: 'operating_expense', isSystem: false },

  // Payroll Expenses
  { code: '5200', name: 'Salaries & Wages', subtypeCode: 'payroll_expense', isSystem: false },
  { code: '5210', name: 'Employee Benefits', subtypeCode: 'payroll_expense', isSystem: false },
  { code: '5220', name: 'Payroll Taxes', subtypeCode: 'payroll_expense', isSystem: false },

  // Cost of Goods Sold
  { code: '5300', name: 'Cost of Goods Sold', subtypeCode: 'cost_of_goods_sold', isSystem: false },
  { code: '5310', name: 'Freight & Shipping', subtypeCode: 'cost_of_goods_sold', isSystem: false },

  // Other Expenses
  { code: '5900', name: 'Other Expenses', subtypeCode: 'other_expense', isSystem: false },
];

// Business-specific accounts to add
export const BUSINESS_SPECIFIC_ACCOUNTS: Record<string, Array<{ code: string; name: string; subtypeCode: string; isSystem: boolean }>> = {
  freelancer: [
    { code: '4030', name: 'Project Income', subtypeCode: 'operating_revenue', isSystem: false },
  ],
  consulting: [
    { code: '4030', name: 'Retainer Income', subtypeCode: 'operating_revenue', isSystem: false },
    { code: '5130', name: 'Subcontractor Costs', subtypeCode: 'operating_expense', isSystem: false },
  ],
  services: [
    { code: '4030', name: 'Service Fees', subtypeCode: 'operating_revenue', isSystem: false },
  ],
  retail: [
    { code: '1210', name: 'Merchandise Inventory', subtypeCode: 'current_asset', isSystem: false },
  ],
  manufacturing: [
    { code: '1210', name: 'Raw Materials', subtypeCode: 'current_asset', isSystem: false },
    { code: '1220', name: 'Work in Progress', subtypeCode: 'current_asset', isSystem: false },
    { code: '1230', name: 'Finished Goods', subtypeCode: 'current_asset', isSystem: false },
    { code: '5320', name: 'Manufacturing Overhead', subtypeCode: 'cost_of_goods_sold', isSystem: false },
  ],
  other: [],
};
