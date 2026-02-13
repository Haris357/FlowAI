export interface ChartAccount {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType: string;
  parentId?: string;
  isActive: boolean;
  isSystem: boolean;
  balance: number;
}

export const getDefaultChartOfAccounts = (businessType: string): ChartAccount[] => {
  const baseAccounts: ChartAccount[] = [
    // Assets
    { code: '1000', name: 'Cash', type: 'asset', subType: 'current_asset', isActive: true, isSystem: true, balance: 0 },
    { code: '1010', name: 'Bank Account', type: 'asset', subType: 'current_asset', isActive: true, isSystem: true, balance: 0 },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', subType: 'current_asset', isActive: true, isSystem: true, balance: 0 },
    { code: '1500', name: 'Office Equipment', type: 'asset', subType: 'fixed_asset', isActive: true, isSystem: false, balance: 0 },
    { code: '1510', name: 'Computer Equipment', type: 'asset', subType: 'fixed_asset', isActive: true, isSystem: false, balance: 0 },

    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'liability', subType: 'current_liability', isActive: true, isSystem: true, balance: 0 },
    { code: '2100', name: 'Credit Card', type: 'liability', subType: 'current_liability', isActive: true, isSystem: false, balance: 0 },
    { code: '2200', name: 'Tax Payable', type: 'liability', subType: 'current_liability', isActive: true, isSystem: false, balance: 0 },

    // Equity
    { code: '3000', name: "Owner's Equity", type: 'equity', subType: 'equity', isActive: true, isSystem: true, balance: 0 },
    { code: '3100', name: 'Retained Earnings', type: 'equity', subType: 'equity', isActive: true, isSystem: true, balance: 0 },

    // Revenue
    { code: '4000', name: 'Service Revenue', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: true, balance: 0 },
    { code: '4900', name: 'Other Income', type: 'revenue', subType: 'other_revenue', isActive: true, isSystem: false, balance: 0 },

    // Expenses
    { code: '5000', name: 'Advertising & Marketing', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5010', name: 'Bank Charges', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5020', name: 'Software & Subscriptions', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5030', name: 'Office Supplies', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5040', name: 'Professional Services', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5050', name: 'Travel Expenses', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5060', name: 'Meals & Entertainment', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5070', name: 'Internet & Phone', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5080', name: 'Insurance', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5090', name: 'Rent', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5100', name: 'Utilities', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5900', name: 'Other Expenses', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
  ];

  // Add specific accounts based on business type
  const businessSpecificAccounts: { [key: string]: ChartAccount[] } = {
    freelancer: [
      { code: '4010', name: 'Consulting Income', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
      { code: '4020', name: 'Project Income', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
    ],
    consulting: [
      { code: '4010', name: 'Consulting Income', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
      { code: '4020', name: 'Retainer Income', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
      { code: '5110', name: 'Subcontractor Costs', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    ],
    services: [
      { code: '4010', name: 'Service Fees', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
      { code: '4020', name: 'Retainer Income', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
      { code: '5110', name: 'Salaries & Wages', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: true, balance: 0 },
      { code: '5120', name: 'Employee Benefits', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
      { code: '5130', name: 'Payroll Taxes', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    ],
    retail: [
      { code: '1200', name: 'Inventory', type: 'asset', subType: 'current_asset', isActive: true, isSystem: true, balance: 0 },
      { code: '4010', name: 'Product Sales', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
      { code: '5200', name: 'Cost of Goods Sold', type: 'expense', subType: 'cost_of_goods_sold', isActive: true, isSystem: true, balance: 0 },
      { code: '5210', name: 'Freight & Shipping', type: 'expense', subType: 'cost_of_goods_sold', isActive: true, isSystem: false, balance: 0 },
      { code: '5110', name: 'Salaries & Wages', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: true, balance: 0 },
    ],
    manufacturing: [
      { code: '1200', name: 'Raw Materials', type: 'asset', subType: 'current_asset', isActive: true, isSystem: true, balance: 0 },
      { code: '1210', name: 'Work in Progress', type: 'asset', subType: 'current_asset', isActive: true, isSystem: false, balance: 0 },
      { code: '1220', name: 'Finished Goods', type: 'asset', subType: 'current_asset', isActive: true, isSystem: false, balance: 0 },
      { code: '4010', name: 'Product Sales', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
      { code: '5200', name: 'Cost of Goods Sold', type: 'expense', subType: 'cost_of_goods_sold', isActive: true, isSystem: true, balance: 0 },
      { code: '5210', name: 'Manufacturing Overhead', type: 'expense', subType: 'cost_of_goods_sold', isActive: true, isSystem: false, balance: 0 },
      { code: '5110', name: 'Salaries & Wages', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: true, balance: 0 },
    ],
    other: [
      { code: '4010', name: 'Other Revenue', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
    ],
  };

  const specificAccounts = businessSpecificAccounts[businessType] || businessSpecificAccounts.other;

  return [...baseAccounts, ...specificAccounts];
};

// Get ALL accounts including base and all business-specific accounts
export const getAllChartOfAccounts = (): ChartAccount[] => {
  const baseAccounts: ChartAccount[] = [
    // Assets
    { code: '1000', name: 'Cash', type: 'asset', subType: 'current_asset', isActive: true, isSystem: true, balance: 0 },
    { code: '1010', name: 'Bank Account', type: 'asset', subType: 'current_asset', isActive: true, isSystem: true, balance: 0 },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', subType: 'current_asset', isActive: true, isSystem: true, balance: 0 },
    { code: '1200', name: 'Inventory', type: 'asset', subType: 'current_asset', isActive: true, isSystem: false, balance: 0 },
    { code: '1210', name: 'Raw Materials', type: 'asset', subType: 'current_asset', isActive: true, isSystem: false, balance: 0 },
    { code: '1220', name: 'Work in Progress', type: 'asset', subType: 'current_asset', isActive: true, isSystem: false, balance: 0 },
    { code: '1230', name: 'Finished Goods', type: 'asset', subType: 'current_asset', isActive: true, isSystem: false, balance: 0 },
    { code: '1500', name: 'Office Equipment', type: 'asset', subType: 'fixed_asset', isActive: true, isSystem: false, balance: 0 },
    { code: '1510', name: 'Computer Equipment', type: 'asset', subType: 'fixed_asset', isActive: true, isSystem: false, balance: 0 },

    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'liability', subType: 'current_liability', isActive: true, isSystem: true, balance: 0 },
    { code: '2100', name: 'Credit Card', type: 'liability', subType: 'current_liability', isActive: true, isSystem: false, balance: 0 },
    { code: '2200', name: 'Tax Payable', type: 'liability', subType: 'current_liability', isActive: true, isSystem: false, balance: 0 },

    // Equity
    { code: '3000', name: "Owner's Equity", type: 'equity', subType: 'equity', isActive: true, isSystem: true, balance: 0 },
    { code: '3100', name: 'Retained Earnings', type: 'equity', subType: 'equity', isActive: true, isSystem: true, balance: 0 },

    // Revenue
    { code: '4000', name: 'Service Revenue', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: true, balance: 0 },
    { code: '4010', name: 'Product Sales', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
    { code: '4020', name: 'Consulting Income', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
    { code: '4030', name: 'Project Income', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
    { code: '4040', name: 'Retainer Income', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
    { code: '4050', name: 'Service Fees', type: 'revenue', subType: 'operating_revenue', isActive: true, isSystem: false, balance: 0 },
    { code: '4900', name: 'Other Income', type: 'revenue', subType: 'other_revenue', isActive: true, isSystem: false, balance: 0 },

    // Expenses
    { code: '5000', name: 'Advertising & Marketing', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5010', name: 'Bank Charges', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5020', name: 'Software & Subscriptions', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5030', name: 'Office Supplies', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5040', name: 'Professional Services', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5050', name: 'Travel Expenses', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5060', name: 'Meals & Entertainment', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5070', name: 'Internet & Phone', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5080', name: 'Insurance', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5090', name: 'Rent', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5100', name: 'Utilities', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5110', name: 'Salaries & Wages', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5120', name: 'Subcontractor Costs', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5130', name: 'Employee Benefits', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5140', name: 'Payroll Taxes', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
    { code: '5200', name: 'Cost of Goods Sold', type: 'expense', subType: 'cost_of_goods_sold', isActive: true, isSystem: false, balance: 0 },
    { code: '5210', name: 'Freight & Shipping', type: 'expense', subType: 'cost_of_goods_sold', isActive: true, isSystem: false, balance: 0 },
    { code: '5220', name: 'Manufacturing Overhead', type: 'expense', subType: 'cost_of_goods_sold', isActive: true, isSystem: false, balance: 0 },
    { code: '5900', name: 'Other Expenses', type: 'expense', subType: 'operating_expense', isActive: true, isSystem: false, balance: 0 },
  ];

  return baseAccounts;
};

// Expense categories for AI to use
export const EXPENSE_CATEGORIES = [
  'Advertising & Marketing',
  'Bank Charges',
  'Software & Subscriptions',
  'Office Supplies',
  'Office Equipment',
  'Professional Services',
  'Legal & Accounting',
  'Travel Expenses',
  'Meals & Entertainment',
  'Internet & Phone',
  'Insurance',
  'Rent',
  'Utilities',
  'Salaries & Wages',
  'Employee Benefits',
  'Training & Development',
  'Repairs & Maintenance',
  'Depreciation',
  'Interest Expense',
  'Taxes & Licenses',
  'Cost of Goods Sold',
  'Freight & Shipping',
  'Other Expenses',
];

// Income categories for AI to use
export const INCOME_CATEGORIES = [
  'Service Revenue',
  'Product Sales',
  'Consulting Income',
  'Project Income',
  'Retainer Income',
  'Commission Income',
  'Interest Income',
  'Rental Income',
  'Other Income',
];
