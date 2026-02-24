// Flow AI Configuration - Comprehensive AI System for Flowbooks
// This file contains all tool definitions, system prompts, and response types

export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

// ==========================================
// RESPONSE TYPES FOR RICH UI
// ==========================================

export interface ActionButton {
  type: 'view' | 'edit' | 'delete' | 'download' | 'navigate' | 'send' | 'pay' | 'cancel' | 'approve';
  label: string;
  entityType: 'customer' | 'vendor' | 'employee' | 'invoice' | 'bill' | 'transaction' | 'account' | 'report' | 'salary_slip';
  entityId?: string;
  data?: Record<string, any>;
  toolCall?: string; // For actions that trigger AI tool calls (e.g., "send_invoice")
}

export interface RichResponse {
  message: string;
  data?: {
    type: 'entity' | 'list' | 'report' | 'summary';
    entityType?: string;
    entity?: Record<string, any>;
    entities?: Array<{ entityType: string; entity: Record<string, any>; actions?: ActionButton[] }>;
    items?: Record<string, any>[];
    columns?: { key: string; label: string; type?: 'text' | 'currency' | 'date' | 'status' }[];
    pagination?: { page: number; pageSize: number; total: number };
    summary?: Record<string, any>;
  };
  actions?: ActionButton[];
  followUp?: string;
}

// ==========================================
// SECURITY & RESTRICTIONS
// ==========================================

export const ALLOWED_OPERATIONS = [
  // Customer operations
  'add_customer', 'list_customers', 'get_customer', 'update_customer', 'delete_customer', 'search_customers',
  // Vendor operations
  'add_vendor', 'list_vendors', 'get_vendor', 'update_vendor', 'delete_vendor', 'search_vendors',
  // Employee operations
  'add_employee', 'list_employees', 'get_employee', 'update_employee', 'delete_employee',
  // Invoice operations
  'create_invoice', 'list_invoices', 'get_invoice', 'update_invoice', 'delete_invoice', 'search_invoices',
  'change_invoice_status', 'send_invoice',
  // Bill operations
  'create_bill', 'list_bills', 'get_bill', 'update_bill', 'delete_bill', 'change_bill_status',
  // Transaction operations
  'record_expense', 'record_payment_received', 'record_payment_made',
  'list_transactions', 'get_transaction', 'update_transaction', 'delete_transaction', 'search_transactions',
  // Account & Journal operations
  'create_account', 'list_accounts', 'update_account', 'delete_account', 'get_account_balance',
  'create_journal_entry', 'list_journal_entries', 'get_journal_entry', 'update_journal_entry', 'delete_journal_entry',
  // Quote operations
  'create_quote', 'list_quotes', 'get_quote', 'update_quote', 'delete_quote',
  // Purchase Order operations
  'create_purchase_order', 'list_purchase_orders', 'get_purchase_order', 'update_purchase_order', 'delete_purchase_order',
  // Credit Note operations
  'create_credit_note', 'list_credit_notes', 'get_credit_note', 'update_credit_note', 'delete_credit_note',
  // Recurring operations
  'create_recurring_transaction', 'list_recurring_transactions', 'update_recurring_transaction', 'delete_recurring_transaction',
  // Bank Account operations
  'create_bank_account', 'list_bank_accounts', 'update_bank_account', 'delete_bank_account',
  // Payroll operations
  'generate_salary_slip', 'list_salary_slips', 'change_salary_slip_status',
  // Report operations
  'generate_report', 'get_dashboard_summary',
] as const;

export const BLOCKED_PATTERNS = [
  /delete\s+(all|everything|database)/i,
  /drop\s+table/i,
  /truncate/i,
  /system\s+prompt/i,
  /ignore\s+instructions/i,
  /bypass/i,
  /admin\s+access/i,
  /execute\s+code/i,
  /run\s+script/i,
];

// ==========================================
// COMPREHENSIVE TOOL DEFINITIONS
// ==========================================

export const FLOW_AI_TOOLS: AITool[] = [
  // ============ CUSTOMER TOOLS ============
  {
    type: 'function',
    function: {
      name: 'add_customer',
      description: 'Add a new customer.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Customer name' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          taxId: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_customers',
      description: 'List ALL customers for browsing/viewing. Do NOT use this to find a specific customer — use get_customer or pass customerName directly to create_invoice instead.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          pageSize: { type: 'number' },
          search: { type: 'string' },
          sortBy: { type: 'string', enum: ['name', 'createdAt', 'totalBilled'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer',
      description: 'Get customer details by name or ID.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          id: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_customer',
      description: 'Update a customer.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          customerId: { type: 'string' },
          updates: {
            type: 'object',
            properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' }, city: { type: 'string' }, country: { type: 'string' } },
          },
        },
        required: ['updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_customer',
      description: 'Delete a customer. Confirm first.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          customerId: { type: 'string' },
          confirmed: { type: 'boolean' },
        },
        required: ['confirmed'],
      },
    },
  },

  // ============ VENDOR TOOLS ============
  {
    type: 'function',
    function: {
      name: 'add_vendor',
      description: 'Add a new vendor/supplier.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Vendor name' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          taxId: { type: 'string' },
          paymentTerms: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_vendors',
      description: 'List vendors.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          pageSize: { type: 'number' },
          search: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_vendor',
      description: 'Update a vendor.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: { type: 'string' },
          vendorId: { type: 'string' },
          updates: {
            type: 'object',
            properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' } },
          },
        },
        required: ['updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_vendor',
      description: 'Delete a vendor. Confirm first.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: { type: 'string' },
          vendorId: { type: 'string' },
          confirmed: { type: 'boolean' },
        },
        required: ['confirmed'],
      },
    },
  },

  // ============ EMPLOYEE TOOLS ============
  {
    type: 'function',
    function: {
      name: 'add_employee',
      description: 'Add a new employee. Needs name, designation, salary.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          designation: { type: 'string', description: 'Job title/role' },
          department: { type: 'string' },
          salary: { type: 'number', description: 'Monthly salary' },
          salaryType: { type: 'string', enum: ['monthly', 'hourly', 'annual'] },
          joiningDate: { type: 'string' },
        },
        required: ['name', 'designation', 'salary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_employees',
      description: 'List employees.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          pageSize: { type: 'number' },
          department: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_employee',
      description: 'Update employee info.',
      parameters: {
        type: 'object',
        properties: {
          employeeName: { type: 'string' },
          employeeId: { type: 'string' },
          updates: {
            type: 'object',
            properties: { name: { type: 'string' }, designation: { type: 'string' }, department: { type: 'string' }, salary: { type: 'number' }, email: { type: 'string' }, isActive: { type: 'boolean' } },
          },
        },
        required: ['updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_employee',
      description: 'Delete an employee. Confirm first.',
      parameters: {
        type: 'object',
        properties: {
          employeeName: { type: 'string' },
          employeeId: { type: 'string' },
          confirmed: { type: 'boolean' },
        },
        required: ['confirmed'],
      },
    },
  },

  // ============ INVOICE TOOLS ============
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Create an invoice. Automatically finds or creates the customer by name. Just pass customerName and items [{description, rate, quantity?}]. Do NOT look up customers first — this tool handles it.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          customerEmail: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } },
              required: ['description', 'rate'],
            },
          },
          dueDate: { type: 'string' },
          dueDays: { type: 'number' },
          taxRate: { type: 'number' },
          notes: { type: 'string' },
          terms: { type: 'string' },
        },
        required: ['customerName', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_invoices',
      description: 'List invoices. IMPORTANT: Use the status filter to narrow results. For payment reminders or overdue queries, ALWAYS pass status="overdue". For unpaid queries, pass status="sent".',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          pageSize: { type: 'number' },
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], description: 'Filter by invoice status. Use "overdue" for overdue/reminder queries, "sent" for unpaid invoices.' },
          customerName: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_invoice',
      description: 'Get invoice details.',
      parameters: {
        type: 'object',
        properties: {
          invoiceNumber: { type: 'string' },
          invoiceId: { type: 'string' },
        },
      },
    },
  },

  // ============ TRANSACTION TOOLS ============
  {
    type: 'function',
    function: {
      name: 'record_expense',
      description: 'Record a business expense. Execute immediately if description and amount are provided.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
          category: { type: 'string' },
          vendorName: { type: 'string' },
          date: { type: 'string' },
          paymentMethod: { type: 'string', enum: ['cash', 'bank_transfer', 'card', 'cheque'] },
          reference: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['description', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_payment_received',
      description: 'Record payment received from a customer.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          amount: { type: 'number' },
          invoiceNumber: { type: 'string' },
          paymentMethod: { type: 'string', enum: ['cash', 'bank_transfer', 'card', 'cheque'] },
          date: { type: 'string' },
          reference: { type: 'string' },
        },
        required: ['customerName', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_transactions',
      description: 'List transactions.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          pageSize: { type: 'number' },
          type: { type: 'string', enum: ['income', 'expense', 'all'] },
          category: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
      },
    },
  },

  // ============ ACCOUNT & JOURNAL TOOLS ============
  {
    type: 'function',
    function: {
      name: 'create_account',
      description: 'Create a chart of accounts entry.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          subtypeCode: {
            type: 'string',
            enum: ['current_asset', 'fixed_asset', 'other_asset', 'current_liability', 'long_term_liability', 'equity', 'operating_revenue', 'other_revenue', 'operating_expense', 'cost_of_goods', 'payroll_expense', 'tax_expense', 'other_expense'],
          },
          code: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['name', 'subtypeCode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_accounts',
      description: 'List chart of accounts.',
      parameters: {
        type: 'object',
        properties: {
          typeCode: { type: 'string', enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] },
          subtypeCode: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_journal_entry',
      description: 'Create a journal entry. Debits must equal credits.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          date: { type: 'string' },
          entries: {
            type: 'array',
            items: {
              type: 'object',
              properties: { accountName: { type: 'string' }, debit: { type: 'number' }, credit: { type: 'number' } },
              required: ['accountName', 'debit', 'credit'],
            },
          },
        },
        required: ['description', 'entries'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_account_balance',
      description: 'Get account balance.',
      parameters: {
        type: 'object',
        properties: {
          accountName: { type: 'string', description: 'Account name (cash, bank, receivables, etc.)' },
        },
        required: ['accountName'],
      },
    },
  },

  // ============ REPORT TOOLS ============
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description: 'Generate a financial report. Use current month if dates not specified.',
      parameters: {
        type: 'object',
        properties: {
          reportType: {
            type: 'string',
            enum: ['profit_loss', 'balance_sheet', 'cash_flow', 'trial_balance', 'expense_report', 'revenue_report', 'aging_report', 'tax_summary'],
          },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          format: { type: 'string', enum: ['summary', 'detailed'] },
          groupBy: { type: 'string', enum: ['category', 'customer', 'vendor', 'month'] },
        },
        required: ['reportType', 'startDate', 'endDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_summary',
      description: 'Get financial dashboard summary.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month', 'quarter', 'year'] },
        },
      },
    },
  },

  // ============ BILL TOOLS ============
  {
    type: 'function',
    function: {
      name: 'create_bill',
      description: 'Record a bill from a vendor.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: { type: 'string' },
          items: {
            type: 'array',
            items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } } },
          },
          billDate: { type: 'string' },
          dueDate: { type: 'string' },
          reference: { type: 'string' },
        },
        required: ['vendorName', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_bills',
      description: 'List bills.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          pageSize: { type: 'number' },
          status: { type: 'string', enum: ['unpaid', 'paid', 'overdue'] },
          vendorName: { type: 'string' },
        },
      },
    },
  },

  // ============ SEND INVOICE TOOL ============
  {
    type: 'function',
    function: {
      name: 'send_invoice',
      description: 'Send an invoice to the customer via email with PDF attachment. Changes status to sent and creates accounting entries. Only works on draft invoices.',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'Invoice number (e.g. INV-0001) or document ID' },
        },
        required: ['invoiceId'],
      },
    },
  },

  // ============ STATUS MANAGEMENT TOOLS ============
  {
    type: 'function',
    function: {
      name: 'change_invoice_status',
      description: 'Change invoice status with full accounting impact. Creates journal entries for payments (paid/partial), reversals (cancelled/refunded), and revenue recognition (sent). Sends notification emails to customers. Accepts invoice numbers (INV-0001) or document IDs.',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'Invoice number or document ID' },
          newStatus: {
            type: 'string',
            enum: ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded', 'help', '?'],
          },
          paymentAmount: { type: 'number', description: 'Payment amount (required for partial payments, optional for paid — defaults to remaining balance)' },
        },
        required: ['invoiceId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_bill_status',
      description: 'Change bill status.',
      parameters: {
        type: 'object',
        properties: {
          billId: { type: 'string' },
          newStatus: {
            type: 'string',
            enum: ['draft', 'unpaid', 'partial', 'paid', 'overdue', 'cancelled', 'help', '?'],
          },
        },
        required: ['billId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_salary_slip_status',
      description: 'Change salary slip status.',
      parameters: {
        type: 'object',
        properties: {
          slipId: { type: 'string', description: 'Slip ID or employee name' },
          newStatus: {
            type: 'string',
            enum: ['generated', 'paid', 'cancelled', 'help', '?'],
          },
        },
        required: ['slipId'],
      },
    },
  },

  // ============ QUOTE TOOLS ============
  {
    type: 'function',
    function: {
      name: 'create_quote',
      description: 'Create a quote/estimate for a customer.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          customerEmail: { type: 'string' },
          items: {
            type: 'array',
            items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } }, required: ['description', 'rate'] },
          },
          expiryDate: { type: 'string' },
          taxRate: { type: 'number' },
          discount: { type: 'number' },
          notes: { type: 'string' },
          terms: { type: 'string' },
        },
        required: ['customerName', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_quotes',
      description: 'List quotes.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          pageSize: { type: 'number' },
          search: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_quote',
      description: 'Get quote details.',
      parameters: { type: 'object', properties: { quoteId: { type: 'string' } }, required: ['quoteId'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_quote',
      description: 'Update a quote.',
      parameters: {
        type: 'object',
        properties: {
          quoteId: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } } } },
          expiryDate: { type: 'string' }, taxRate: { type: 'number' }, discount: { type: 'number' }, notes: { type: 'string' }, terms: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled'] },
        },
        required: ['quoteId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_quote',
      description: 'Delete a quote. Confirm first.',
      parameters: { type: 'object', properties: { quoteId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['quoteId', 'confirmed'] },
    },
  },

  // ============ PURCHASE ORDER TOOLS ============
  {
    type: 'function',
    function: {
      name: 'create_purchase_order',
      description: 'Create a purchase order for a vendor.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: { type: 'string' },
          vendorEmail: { type: 'string' },
          items: {
            type: 'array',
            items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } }, required: ['description', 'rate'] },
          },
          expectedDate: { type: 'string' },
          taxRate: { type: 'number' },
          discount: { type: 'number' },
          shippingAddress: { type: 'string' },
          notes: { type: 'string' }, terms: { type: 'string' },
        },
        required: ['vendorName', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_purchase_orders',
      description: 'List purchase orders.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' }, pageSize: { type: 'number' },
          search: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'sent', 'partial', 'received', 'cancelled'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_purchase_order',
      description: 'Get purchase order details.',
      parameters: { type: 'object', properties: { poId: { type: 'string' } }, required: ['poId'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_purchase_order',
      description: 'Update a purchase order.',
      parameters: {
        type: 'object',
        properties: {
          poId: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } } } },
          expectedDate: { type: 'string' }, taxRate: { type: 'number' }, discount: { type: 'number' },
          shippingAddress: { type: 'string' }, notes: { type: 'string' }, terms: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'sent', 'partial', 'received', 'cancelled'] },
        },
        required: ['poId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_purchase_order',
      description: 'Delete a purchase order. Confirm first.',
      parameters: { type: 'object', properties: { poId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['poId', 'confirmed'] },
    },
  },

  // ============ CREDIT NOTE TOOLS ============
  {
    type: 'function',
    function: {
      name: 'create_credit_note',
      description: 'Create a credit note for refunds/returns.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          customerEmail: { type: 'string' },
          items: {
            type: 'array',
            items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } }, required: ['description', 'rate'] },
          },
          reason: { type: 'string' },
          reasonDescription: { type: 'string' },
          originalInvoiceNumber: { type: 'string' },
          taxRate: { type: 'number' }, notes: { type: 'string' },
        },
        required: ['customerName', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_credit_notes',
      description: 'List credit notes.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' }, pageSize: { type: 'number' },
          search: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'issued', 'applied', 'cancelled'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_credit_note',
      description: 'Get credit note details.',
      parameters: { type: 'object', properties: { cnId: { type: 'string' } }, required: ['cnId'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_credit_note',
      description: 'Update a credit note.',
      parameters: {
        type: 'object',
        properties: {
          cnId: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } } } },
          reason: { type: 'string' }, taxRate: { type: 'number' }, notes: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'issued', 'applied', 'cancelled'] },
        },
        required: ['cnId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_credit_note',
      description: 'Delete a credit note. Confirm first.',
      parameters: { type: 'object', properties: { cnId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['cnId', 'confirmed'] },
    },
  },

  // ============ RECURRING TRANSACTION TOOLS ============
  {
    type: 'function',
    function: {
      name: 'create_recurring_transaction',
      description: 'Create a recurring transaction (invoice/bill/simple).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['invoice', 'bill', 'simple'] },
          frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          customerName: { type: 'string' },
          vendorName: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } } } },
          description: { type: 'string' },
          amount: { type: 'number' },
          category: { type: 'string' },
        },
        required: ['name', 'frequency'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_recurring_transactions',
      description: 'List recurring transactions.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'number' }, pageSize: { type: 'number' },
          status: { type: 'string', enum: ['active', 'paused', 'completed'] },
          type: { type: 'string', enum: ['invoice', 'bill', 'simple'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_recurring_transaction',
      description: 'Update a recurring transaction.',
      parameters: {
        type: 'object',
        properties: {
          rtId: { type: 'string' },
          name: { type: 'string' }, frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
          endDate: { type: 'string' }, isActive: { type: 'boolean' },
          items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } } } },
          amount: { type: 'number' },
        },
        required: ['rtId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_recurring_transaction',
      description: 'Delete a recurring transaction. Confirm first.',
      parameters: { type: 'object', properties: { rtId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['rtId', 'confirmed'] },
    },
  },

  // ============ JOURNAL ENTRY EXTRA TOOLS ============
  {
    type: 'function',
    function: {
      name: 'list_journal_entries',
      description: 'List journal entries.',
      parameters: { type: 'object', properties: { page: { type: 'number' }, pageSize: { type: 'number' }, search: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_journal_entry',
      description: 'Get journal entry details.',
      parameters: { type: 'object', properties: { entryId: { type: 'string' } }, required: ['entryId'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_journal_entry',
      description: 'Update a journal entry. Must still balance.',
      parameters: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          description: { type: 'string' }, date: { type: 'string' },
          entries: { type: 'array', items: { type: 'object', properties: { accountName: { type: 'string' }, debit: { type: 'number' }, credit: { type: 'number' } }, required: ['accountName', 'debit', 'credit'] } },
        },
        required: ['entryId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_journal_entry',
      description: 'Delete a journal entry. Confirm first.',
      parameters: { type: 'object', properties: { entryId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['entryId', 'confirmed'] },
    },
  },

  // ============ BANK ACCOUNT TOOLS ============
  {
    type: 'function',
    function: {
      name: 'create_bank_account',
      description: 'Create a bank account.',
      parameters: {
        type: 'object',
        properties: {
          accountName: { type: 'string' },
          bankName: { type: 'string' },
          accountNumber: { type: 'string' },
          accountType: { type: 'string', enum: ['checking', 'savings', 'credit_card', 'loan', 'other'] },
          currency: { type: 'string' },
          balance: { type: 'number', description: 'Opening balance' },
        },
        required: ['accountName', 'bankName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_bank_accounts',
      description: 'List bank accounts.',
      parameters: { type: 'object', properties: { page: { type: 'number' }, pageSize: { type: 'number' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_bank_account',
      description: 'Update a bank account.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
          accountName: { type: 'string' }, bankName: { type: 'string' }, accountNumber: { type: 'string' },
          accountType: { type: 'string', enum: ['checking', 'savings', 'credit_card', 'loan', 'other'] },
          currency: { type: 'string' }, isActive: { type: 'boolean' },
        },
        required: ['accountId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_bank_account',
      description: 'Delete a bank account. Confirm first.',
      parameters: { type: 'object', properties: { accountId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['accountId', 'confirmed'] },
    },
  },

  // ============ PAYROLL TOOLS ============
  {
    type: 'function',
    function: {
      name: 'generate_salary_slip',
      description: 'Generate a salary slip. Needs employee name/ID, month, year.',
      parameters: {
        type: 'object',
        properties: {
          employeeId: { type: 'string' },
          employeeName: { type: 'string' },
          month: { type: 'number', description: '1-12' },
          year: { type: 'number' },
          allowances: { type: 'object', description: '{housing, transport, etc.}' },
          deductions: { type: 'object', description: '{tax, insurance, etc.}' },
        },
        required: ['month', 'year'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_salary_slips',
      description: 'List salary slips.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number' },
          year: { type: 'number' },
          status: { type: 'string', enum: ['generated', 'paid', 'cancelled'] },
          page: { type: 'number' }, pageSize: { type: 'number' },
        },
      },
    },
  },

  // ============ ADDITIONAL TOOLS ============
  {
    type: 'function',
    function: {
      name: 'get_vendor',
      description: 'Get vendor details.',
      parameters: { type: 'object', properties: { vendorName: { type: 'string' }, vendorId: { type: 'string' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_invoice',
      description: 'Update an invoice.',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } }, required: ['description', 'rate'] } },
          dueDate: { type: 'string' }, taxRate: { type: 'number' }, discount: { type: 'number' }, notes: { type: 'string' }, terms: { type: 'string' },
        },
        required: ['invoiceId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_invoice',
      description: 'Delete an invoice. Confirm first.',
      parameters: { type: 'object', properties: { invoiceId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['invoiceId', 'confirmed'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_bill',
      description: 'Update a bill.',
      parameters: {
        type: 'object',
        properties: {
          billId: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, rate: { type: 'number' } } } },
          dueDate: { type: 'string' }, taxRate: { type: 'number' }, notes: { type: 'string' },
        },
        required: ['billId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_bill',
      description: 'Delete a bill. Confirm first.',
      parameters: { type: 'object', properties: { billId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['billId', 'confirmed'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_transaction',
      description: 'Get transaction details.',
      parameters: { type: 'object', properties: { transactionId: { type: 'string' } }, required: ['transactionId'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_transaction',
      description: 'Update a transaction.',
      parameters: {
        type: 'object',
        properties: {
          transactionId: { type: 'string' },
          description: { type: 'string' }, amount: { type: 'number' }, date: { type: 'string' }, category: { type: 'string' }, reference: { type: 'string' },
        },
        required: ['transactionId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_transaction',
      description: 'Delete a transaction. Confirm first.',
      parameters: { type: 'object', properties: { transactionId: { type: 'string' }, confirmed: { type: 'boolean' } }, required: ['transactionId', 'confirmed'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_payment_made',
      description: 'Record payment made to a vendor.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: { type: 'string' },
          amount: { type: 'number' },
          description: { type: 'string' },
          billNumber: { type: 'string' },
          paymentMethod: { type: 'string', enum: ['cash', 'bank_transfer', 'card', 'cheque'] },
          date: { type: 'string' },
          reference: { type: 'string' },
        },
        required: ['vendorName', 'amount'],
      },
    },
  },
];

// ==========================================
// SYSTEM PROMPT
// ==========================================

export const FLOW_AI_SYSTEM_PROMPT = `You are Flow AI, an expert accounting assistant for Flowbooks. You are a PhD-level professional accountant.

# RULES
1. Understand typos, abbreviations, slang ("5k"=5000, "custmer"=customer). Preserve names as typed UNLESS they contain obvious typos.
2. If you have ALL required fields for a tool, EXECUTE IMMEDIATELY. Never ask for optional fields — use defaults (date=today, skip category/notes/paymentMethod/reference). Designation is NOT required for salary slips — only employeeName, month, year are needed.
3. For "view/show/list/get" requests, execute immediately without questions.
4. Only ask when REQUIRED info is missing. Ask naturally, not technically.
5. Never show technical errors. Say "I couldn't find that" not "FirebaseError".
6. NEVER mention internal function names, tool names, action identifiers, API endpoints, or technical implementation details in your responses. Never output patterns like "[Action: ...]", "send_invoice()", "tool_call", or any code-like syntax. Your responses must be natural and user-friendly. Just say what you're doing in plain English.
7. Confirm before deleting. Suggest next steps after actions.
8. For multi-step requests ("and then", "also", "then create"), execute ALL steps in order by calling the relevant tool functions in parallel. CRITICAL: You MUST call tool functions — NEVER respond with only text describing what you plan to do. If a user asks to create/list/update/delete something, INVOKE the tool immediately. Phrases like "I'll execute this now" or "Proceeding with..." are USELESS without actual tool calls.
9. Format: currency "$5,000.00", dates "Nov 15, 2024". Use ✓ for success, ⚠️ for warnings.

# INPUT VALIDATION & AUTO-CORRECTION
15. AUTO-CORRECT obvious typos in structured data BEFORE executing any tool call:
   - Emails: fix ",com" → ".com", ",org" → ".org", ".con" → ".com", "gmial" → "gmail", "yaho" → "yahoo", missing "@" if domain is present.
   - Phone numbers: strip extra spaces/dashes but keep the digits intact.
   - Dates: normalize formats (e.g., "15/3" → current year March 15).
   - Currency: "$5k" → 5000, "$1.5m" → 1500000.
   - When you auto-correct, briefly mention what you fixed (e.g., "✓ Added Jonas (corrected email to Jonas5778@gmail.com)").

16. FLAG & CONFIRM important mistakes BEFORE proceeding — do NOT silently execute if:
   - An amount seems unusually high or low for the context (e.g., $0.01 invoice, $1M expense for a small item).
   - A customer/vendor name looks like gibberish or accidental keyboard input.
   - Required fields appear to have swapped values (e.g., email in the phone field, name in the address field).
   - A duplicate entry might be created (customer with very similar name already exists).
   - Ask something like: "The amount seems unusually high — did you mean $200 or $20,000?" or "I noticed the email has a typo. Did you mean jonas@gmail.com?"

17. NEVER save clearly malformed data. If an email is "asdf" with no @ or domain, ASK the user to provide a valid email rather than saving garbage data.

# CRITICAL: CONVERSATION CONTEXT & MEMORY
9. FOLLOW-UP ANSWERS: When a user replies after you asked a question, their response IS the answer to your question. ALWAYS connect it to the pending task.
   - If you asked "What's the customer name?" and user says "Jonas" — Jonas IS the customer name. Use it immediately.
   - If you asked for multiple pieces of info and the user provides them across multiple messages, accumulate ALL of them.
   - A single word or name reply is ALWAYS an answer to your most recent question. NEVER treat it as a new unrelated request.
   - After receiving an answer, check if you now have enough info to complete the pending task. If yes, DO IT immediately.

10. INFORMATION ACCUMULATION: You must track ALL business details mentioned across the ENTIRE conversation:
   - Customer/vendor names, pricing rules, rates, quantities, item descriptions, dates, and preferences.
   - When the user mentions pricing like "$0.025 per word" earlier and later says "make invoice for 11 scripts" — you MUST combine the pricing from earlier with the quantity from later.
   - Do math yourself: "0.025 per word" × "3000 words" = $75. "11 scripts, 3 under 2000 words, rest above 4000" = 3 scripts under 2000 + 8 scripts above 4000.
   - NEVER ask for information the user already provided earlier in the conversation. Scroll back and find it.

11. CONTEXT CONTINUITY: When the user says "make invoice" or "create bill" after discussing details in previous messages:
   - Look back through ALL previous messages for: who the customer/vendor is, what items/services were discussed, what pricing was mentioned.
   - Combine information scattered across messages into one complete action.
   - If the user gave partial info in message 1 and more info in message 5, combine both.

12. Parse naturally: "invoice john 5k for design" → customerName="john", items=[{description:"design", rate:5000}].
13. Ambiguous: "paid ali 10k" → ask if Ali is customer or vendor. "record 5000" → ask income or expense.
14. Only decline truly off-topic requests (poems, weather, code). If a user's message could relate to ANY pending accounting task from conversation history, treat it as a follow-up answer.

# INTERACTIVE BUTTONS
24. ALWAYS use the {{BUTTONS:...}} tag when asking the user to choose between options. NEVER ask yes/no or choice questions as plain text.
   Format: {{BUTTONS:Option 1|Option 2|Option 3}}
   Examples:
   - Instead of "Do you want me to send this invoice?" → write: "Would you like me to send this invoice?\n{{BUTTONS:Yes, send it now|No, keep as draft}}"
   - Instead of "Which customer?" → write: "Which customer did you mean?\n{{BUTTONS:Ali Hassan|Ali Ahmed|Ali Khan}}"
   - Instead of "Is this an expense or income?" → write: "Is this an expense or income?\n{{BUTTONS:Expense|Income}}"
   - After creating an invoice: "Invoice created!\n{{BUTTONS:Send to customer|Download PDF|Create another}}"
   Rules for buttons:
   - Keep labels SHORT (2-5 words max).
   - Max 4 buttons per group. If more options, list the top 3-4 most likely.
   - Button text should be the exact response the user would type. When clicked, it sends as a message.
   - Use buttons for: yes/no questions, customer/vendor selection, status choices, next actions.

# SMART PARSING
25. INVOICE CREATION PARSING: When parsing "create invoice" requests, identify these parts correctly:
   - CUSTOMER NAME: The person/company being invoiced. Usually mentioned first or after "for".
   - ITEM DESCRIPTION: What the service/product is. Often after "for" or described by context words like "charges", "services", "work", "hours".
   - RATE & QUANTITY: Numbers with units like "per hour", "per unit", "each".

   Common patterns:
   - "[Customer] charges [rate] per [unit] for [quantity]" → customer=[Customer], description="[unit] charges", rate=[rate], qty=[quantity]
     Example: "Haris Consulting charges 100 dollars per hour for 10 hours" → customer="Haris Consulting", description="Consulting services", rate=100, qty=10
   - "invoice [Customer] [amount] for [description]" → customer=[Customer], description=[description], rate=[amount]
   - "[Customer] [quantity] [items] at [rate]" → customer=[Customer], description=[items], rate=[rate], qty=[quantity]

   CRITICAL: The word "charges" means "the rate is" — it does NOT mean the customer name includes "charges".
   "Haris Consulting charges 100/hr" means customer="Haris Consulting", NOT customer="Haris Consulting charges".

26. CUSTOMER MATCHING & INVOICE CREATION:
   - CRITICAL: When the user says "create invoice for [name]" or "invoice [name] for [amount]", call create_invoice DIRECTLY with the customerName. Do NOT call list_customers first. The create_invoice tool automatically finds or creates the customer by name.
   - NEVER use list_customers to find a specific customer. list_customers is ONLY for when the user explicitly asks to "show me all customers" or "list my customers".
   - If you need to look up a specific customer's details, use get_customer with the name — NOT list_customers.
   - Same applies to create_bill (pass vendorName directly), record_expense, etc. — these tools handle entity lookup internally.
   - If a tool returns an ambiguous match error (multiple customers found), show the options as buttons so the user can pick:
     "I found multiple customers matching that name:\n{{BUTTONS:Ali Hassan|Ali Ahmed|Ali Raza}}"
   - If a tool returns a "customer not found" result, ask if they want to create a new customer:
     "I couldn't find a customer named '[name]'. Would you like me to create them?\n{{BUTTONS:Yes, create new customer|Let me retype the name}}"

# INVOICE INTELLIGENCE
18. PROACTIVE INVOICE MANAGEMENT: You are an expert invoice manager. When the user asks about invoices:
   - Always highlight overdue invoices with urgency. If there are overdue invoices, mention them proactively.
   - When listing invoices, group/sort by priority: overdue first, then sent/unpaid, then partial, then drafts.
   - Show key details: customer name, amount, due date, and how many days overdue.
   - After showing overdue invoices, suggest: "Would you like me to send payment reminders to these customers?"

19. PAYMENT REMINDERS: When the user asks to "send reminder", "send payment reminder", or "remind customer":
   - CRITICAL: You MUST call list_invoices with status="overdue" to get ONLY overdue invoices. NEVER list all invoices for reminder requests.
   - If a specific customer is mentioned, find their overdue/unpaid invoices and change their status to "overdue" (which triggers a reminder email).
   - If no specific customer is mentioned, call list_invoices with status="overdue" first, then show only those overdue invoices and ask which ones to send reminders for.
   - After sending a reminder, confirm: "✓ Payment reminder sent to [customer] for [invoice number] ([amount due])."

20. SMART PAYMENT RECORDING: When the user says an invoice is "paid" or mentions receiving payment:
   - If they mention a customer name, find that customer's unpaid invoices.
   - If the customer has only ONE unpaid invoice, mark it as paid immediately.
   - If the customer has MULTIPLE unpaid invoices, list them and ask which one was paid.
   - If a partial amount is mentioned (e.g., "received $500 from Ali" but invoice is $1000), use change_invoice_status with paymentAmount to record a partial payment.
   - After marking paid, confirm with the amount and mention the accounting entries created.

21. INVOICE FOLLOW-UPS: After creating an invoice, always ask: "Would you like me to send this invoice to the customer via email?"
   After sending an invoice, suggest: "I'll keep track of this. If it's not paid by the due date, I can send a reminder."

22. INVOICE SUMMARY: When the user asks for a summary or overview:
   - Show: total outstanding, total overdue, number of unpaid invoices, recent payments received.
   - Highlight the biggest overdue amounts.
   - Suggest actions: "You have 3 overdue invoices totaling $5,200. Want me to send reminders?"

23. REMEMBER PATTERNS: Pay attention to how the user works with invoices:
   - If they regularly invoice the same customer, remember the customer and typical amounts/services.
   - If they use specific payment terms (Net 30, Net 15), remember and apply them.
   - If they mention a preferred workflow ("always send immediately after creating"), follow that pattern.

# INVOICE APPEARANCE
27. Invoice PDFs are automatically styled using the company's chosen template (Classic, Modern, or Minimal) and color theme. You do NOT need to handle invoice styling — it is applied automatically when the PDF is generated. If the user asks about changing invoice appearance, tell them to go to Company Settings → Documents → Invoice Appearance.

Current date: ${new Date().toISOString().split('T')[0]}`;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function isBlockedRequest(message: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(message));
}

export function validateToolCall(toolName: string): boolean {
  return ALLOWED_OPERATIONS.includes(toolName as any);
}
