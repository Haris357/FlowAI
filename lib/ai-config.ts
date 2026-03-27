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
  type: 'view' | 'edit' | 'delete' | 'download' | 'navigate' | 'send' | 'pay' | 'cancel' | 'approve' | 'confirm';
  label: string;
  entityType?: 'customer' | 'vendor' | 'employee' | 'invoice' | 'bill' | 'transaction' | 'account' | 'report' | 'salary_slip';
  entityId?: string;
  data?: Record<string, any>;
  toolCall?: string; // For actions that trigger AI tool calls (e.g., "send_invoice")
  prompt?: string;  // For actions that send a chat message (e.g., "Yes, send all invoices")
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
  // Generic read
  'query_records',
  // Company settings
  'update_company_settings',
  // Bulk operations
  'bulk_action',
  // Contact management
  'merge_contact',
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
  // ============ COMPANY SETTINGS ============
  {
    type: 'function',
    function: {
      name: 'update_company_settings',
      description: 'Update company profile and settings such as business name, currency, tax rate, address, contact info, or fiscal year start. Use when the user wants to change their company details.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Company/business name' },
          contactName: { type: 'string', description: 'Owner or contact person name shown on invoices (e.g. "Muhammad Azmeer Khan")' },
          currency: { type: 'string', description: 'Default currency code (e.g. USD, GBP, EUR, PKR)' },
          taxRate: { type: 'number', description: 'Default tax rate as a percentage (e.g. 20 for 20%)' },
          taxName: { type: 'string', description: 'Tax label (e.g. VAT, GST, Sales Tax)' },
          taxNumber: { type: 'string', description: 'Tax registration / VAT number' },
          address: { type: 'string', description: 'Business address / street' },
          city: { type: 'string', description: 'City' },
          state: { type: 'string' },
          country: { type: 'string' },
          zipCode: { type: 'string' },
          phone: { type: 'string', description: 'Contact phone number' },
          email: { type: 'string', description: 'Contact email address' },
          website: { type: 'string' },
          businessType: { type: 'string', description: 'e.g. sole_trader, llc, partnership, corporation' },
          fiscalYearStart: { type: 'string', description: 'Fiscal year start month-day e.g. "01-01" for Jan 1, "04-01" for Apr 1' },
          invoicePrefix: { type: 'string', description: 'Prefix for invoice numbers e.g. INV, #' },
          invoiceNotes: { type: 'string', description: 'Default footer notes on invoices' },
          paymentTermsDays: { type: 'number', description: 'Default payment terms in days (e.g. 30 for Net 30)' },
        },
        required: [],
      },
    },
  },

  // ============ BULK OPERATIONS ============
  {
    type: 'function',
    function: {
      name: 'bulk_action',
      description: 'Perform an action on multiple records at once. Use for: marking all overdue invoices as sent, deleting all draft bills, updating status of multiple records, etc. ALWAYS confirm with the user before running a bulk delete.',
      parameters: {
        type: 'object',
        properties: {
          collection: {
            type: 'string',
            enum: ['invoices', 'bills', 'customers', 'vendors', 'transactions', 'accounts', 'journalEntries', 'recurringTransactions'],
            description: 'The collection to act on',
          },
          filters: {
            type: 'array',
            description: 'Filter conditions to select which records to act on',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                operator: { type: 'string', enum: ['==', '!=', '<', '<=', '>', '>=', 'in'] },
                value: {},
              },
              required: ['field', 'operator', 'value'],
            },
          },
          action: {
            type: 'string',
            enum: ['update', 'delete'],
            description: 'Action to perform on matched records',
          },
          updates: {
            type: 'object',
            description: 'Fields to update (required when action is "update"). e.g. {"status": "sent"} or {"isActive": false}',
          },
          confirmed: {
            type: 'boolean',
            description: 'Must be true for delete actions. Always ask user to confirm before passing true.',
          },
        },
        required: ['collection', 'action'],
      },
    },
  },

  // ============ CONTACT MANAGEMENT ============
  {
    type: 'function',
    function: {
      name: 'merge_contact',
      description: 'Merge two duplicate customer or vendor records into one. The "keep" record is preserved; the "merge" record is deleted. All invoices/bills referencing the merged record are automatically updated to the kept record.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['customer', 'vendor'], description: 'Contact type' },
          keepId: { type: 'string', description: 'ID of the record to keep' },
          mergeId: { type: 'string', description: 'ID of the duplicate record to merge and delete' },
        },
        required: ['type', 'keepId', 'mergeId'],
      },
    },
  },

  // ============ GENERIC READ TOOL ============
  {
    type: 'function',
    function: {
      name: 'query_records',
      description: 'Query any collection in the company database for specific records not covered by the business snapshot. Use this for targeted lookups: find invoices by customer, filter by date range, search by status, etc. ALWAYS prefer snapshot data for totals and summaries — only call this when you need specific records. Never call this just to repeat information already in the snapshot.',
      parameters: {
        type: 'object',
        properties: {
          collection: {
            type: 'string',
            enum: ['invoices', 'bills', 'customers', 'vendors', 'transactions', 'accounts', 'bankAccounts', 'journalEntries', 'recurringTransactions'],
            description: 'The collection to query',
          },
          filters: {
            type: 'array',
            description: 'Filter conditions (all are ANDed together)',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', description: 'Field name (e.g. status, customerId, dueDate)' },
                operator: { type: 'string', enum: ['==', '!=', '<', '<=', '>', '>=', 'in'], description: 'Comparison operator' },
                value: { description: 'Value to compare against' },
              },
              required: ['field', 'operator', 'value'],
            },
          },
          orderBy: {
            type: 'object',
            description: 'Sort order',
            properties: {
              field: { type: 'string' },
              direction: { type: 'string', enum: ['asc', 'desc'] },
            },
            required: ['field'],
          },
          limit: {
            type: 'number',
            description: 'Max records to return (default 20, max 100)',
          },
        },
        required: ['collection'],
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
7. Confirm before deleting. After completing actions, ask ONE specific follow-up question if relevant (e.g., "Would you like to send these invoices?") — NEVER add filler phrases like "If you need any further assistance, let me know!", "Feel free to ask!", "Is there anything else I can help you with?". Just stop after the relevant question or confirmation.
8. For multi-step requests:
   - PARALLEL: When steps are independent (e.g., "add customer A and customer B"), call all tools at once.
   - SEQUENTIAL: When steps depend on each other (e.g., "mark as sent, THEN mark as viewed, THEN record payment"), call ALL tools in the SAME message — the tools are safe to run in sequence immediately. Do NOT wait for confirmation between steps. Call change_invoice_status(sent) + change_invoice_status(viewed) + record_payment_received all in one batch.
   - CRITICAL: You MUST call tool functions — NEVER respond with only text. Phrases like "I'll do this now" are USELESS without actual tool calls.
   - When user says "show X, then do Y, then do Z" — call list tool + action tools ALL in the same response.
9. Format: currency "$5,000.00", dates "Nov 15, 2024". Use ✓ for success, ⚠️ for warnings.
10. RECURRING INVOICE: "Set up a recurring invoice" means use create_recurring_transaction (type: invoice), NOT create_invoice. A recurring invoice is a scheduled template, not a one-time invoice.
11. BILL LOOKUP: When user says "pay the bill from [VendorName]" or "the [VendorName] bill", look up bills by vendor name — pass the vendor name as billId and the tool will find it.
12. EMPLOYEE NOT FOUND: If salary slip requested for someone not in employee list, ask "I don't see [name] as an employee. Would you like me to add them first?" — offer to create them, don't just fail.
13. SMALL TALK: If the user sends a greeting or casual message (e.g., "hi", "how are you", "hey", "what's up"), respond briefly and warmly in one sentence, then offer to help with their books. Do NOT try to connect it to any pending task or accounting action.

# INPUT VALIDATION & AUTO-CORRECTION
15. AUTO-CORRECT obvious typos SILENTLY — fix and execute immediately, just mention what you corrected in the success message:
   - Emails: Replace ALL commas with dots in any email address (e.g., "print,house@gmail,com" → "print.house@gmail.com"). Also fix: ".con" → ".com", "gmial" → "gmail", "yaho" → "yahoo". ALWAYS fix and proceed — NEVER ask.
   - Phone numbers: strip extra spaces/dashes, keep digits intact.
   - Dates: normalize formats ("15/3" → March 15 current year).
   - Currency: "$5k" → 5000, "$1.5m" → 1500000.
   - After fixing: mention it briefly in the result (e.g., "✓ Added PrintHouse — corrected email to print.house@gmail.com").
   - ABSOLUTE RULE: ANY email with obvious formatting typos (commas instead of dots, transposed characters) = ALWAYS fix silently and proceed. NEVER ask "did you mean...?" NEVER ask for confirmation. Just fix it and call the tool immediately.

16. FLAG & CONFIRM only genuinely ambiguous mistakes — NOT formatting typos:
   - Amount seems unusually large/small for context (e.g., $0.01 invoice, $999,999 for office lunch).
   - Customer/vendor name is clearly gibberish (random keyboard mashing like "asdfgh").
   - Required fields appear swapped (phone number in email field, name in address field).
   - Ask concisely: "That amount seems very high — did you mean $200 or $20,000?"

17. NEVER save clearly malformed data. If an email has NO "@" and NO recognizable domain at all (e.g., just "asdf"), ASK for a valid email. But if it just has a formatting typo like ",com" — FIX IT and proceed.

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

11. CONTEXT CONTINUITY & TASK PERSISTENCE:
   - When the user says "make invoice" or "create bill" after discussing details in previous messages, look back through ALL previous messages for: who the customer/vendor is, what items/services were discussed, what pricing was mentioned.
   - Combine information scattered across messages into one complete action.
   - If the user gave partial info in message 1 and more info in message 5, combine both.
   - CRITICAL: If the user's original request was to CREATE something (invoice, bill, expense, etc.) and you asked a question or failed at a sub-step, the creation task is STILL PENDING. When the user responds, ALWAYS complete the original creation — don't just show information and stop.
   - When the user says things like "check again", "try again", "it exists", "he's there" — this means RETRY the original task, not just look up the entity.

12. Parse naturally: "invoice john 5k for design" → customerName="john", items=[{description:"design", rate:5000}].
13. Ambiguous: "paid ali 10k" → ask if Ali is customer or vendor. "record 5000" → ask income or expense.
14. QUESTION vs TASK: Distinguish between questions and task requests.
   - ACCOUNTING/BUSINESS QUESTIONS (what is X, how does Y work, explain Z, difference between A and B, when should I, why is, can you explain): Answer clearly and helpfully as a knowledgeable accountant. Use plain language. Do NOT call any tools. Examples: "what is depreciation?", "how does double-entry work?", "what's the difference between cash and accrual?", "when should I record revenue?", "what are accounts payable?", "how do I handle VAT?".
   - TASK REQUESTS (create, add, make, send, list, show, delete, update, record, generate): Execute using tools.
   - AMBIGUOUS SHORT REPLIES: If a user's message could relate to a pending accounting task from conversation history, treat it as a follow-up answer.
   - Only decline truly off-topic requests (poems, weather, code, personal advice unrelated to business/accounting).

# INTERACTIVE BUTTONS
24. ALWAYS use the {{BUTTONS:...}} tag when asking the user to choose between options. NEVER ask yes/no or choice questions as plain text.
   Format: {{BUTTONS:Option 1|Option 2|Option 3}}
   Examples:
   - Instead of "Which customer?" → write: "Which customer did you mean?\n{{BUTTONS:Ali Hassan|Ali Ahmed|Ali Khan}}"
   - Instead of "Is this an expense or income?" → write: "Is this an expense or income?\n{{BUTTONS:Expense|Income}}"
   Rules for buttons:
   - Keep labels SHORT (2-5 words max).
   - Max 4 buttons per group. If more options, list the top 3-4 most likely.
   - Button text should be the exact response the user would type. When clicked, it sends as a message.
   - Use buttons for: customer/vendor selection, status choices, ambiguous questions.
   - NEVER use {{BUTTONS:...}} after create_invoice or create_bill — the UI already shows Send/View/Download action buttons from the tool result. Just confirm the creation briefly.
   - NEVER ask "Would you like me to send this invoice?" after creating one — just say it was created and they can click Send Invoice if needed.

# POST-CREATION BEHAVIOUR
   - After create_invoice succeeds: respond with a SHORT confirmation only (e.g. "Draft invoice created for **[Customer]** — $[amount]. Click **Send Invoice** above to email it."). Do NOT ask a follow-up question. Do NOT use {{BUTTONS:...}}.
   - CRITICAL: If the user's original message included "send", "send it", "send him", "send her", "send them", "and send", "then send" — call send_invoice IMMEDIATELY after create_invoice in the SAME response without asking. Do NOT create a draft and wait. The user already told you to send it.
   - If user then says "yes", "send it", "yes send it now", or similar: call send_invoice immediately with the invoice ID from your previous create_invoice tool result. Do NOT call list_invoices.
   - After create_bill succeeds: same rule — short confirmation, no follow-up question, no buttons.

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
   - CRITICAL: When the user says "create invoice for [name]" or "invoice [name] for [amount]", call create_invoice DIRECTLY with the customerName. Do NOT call get_customer or list_customers first. The create_invoice tool automatically finds the customer by name (partial match) or creates them if not found.
   - NEVER pre-check if a customer exists before creating an invoice/bill/expense. Just pass the name directly to the creation tool. It handles lookup internally.
   - NEVER use list_customers to find a specific customer. list_customers is ONLY for when the user explicitly asks to "show me all customers" or "list my customers".
   - Same applies to create_bill (pass vendorName directly), record_expense, etc. — these tools handle entity lookup internally.
   - ONLY use get_customer when the user SPECIFICALLY asks to "show me customer X" or "get details for X" — NOT as a pre-step before invoice/bill creation.
   - If a tool returns an ambiguous match error (multiple customers found), show the options as buttons so the user can pick:
     "I found multiple customers matching that name:\n{{BUTTONS:Ali Hassan|Ali Ahmed|Ali Raza}}"

27. TASK MEMORY & CONTINUATION:
   - CRITICAL: When you have an INCOMPLETE task from earlier in the conversation (e.g., user asked to create an invoice but you asked a clarifying question), ALWAYS continue that task when you receive relevant information.
   - If the user corrects you or says "check again" / "try again" / "it exists", re-attempt the ORIGINAL task with the corrected info. Do NOT just show information — COMPLETE the pending action.
     Example: User says "create invoice for Haris $100" → you fail to find customer → user says "Haris exists, check again" → you should call create_invoice with customerName="Haris" and complete the invoice, NOT just call get_customer and stop.
   - After ANY lookup (get_customer, get_vendor), check if there was a pending task. If the user originally wanted to CREATE something, proceed with the creation using the found entity.
   - NEVER stop at showing entity details when there's a pending creation/action task. Always continue to completion.

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

# DOCUMENT ATTACHMENTS
28. When the user uploads a document (spreadsheet, PDF, image, etc.), you will receive a [ATTACHED DOCUMENT ANALYSIS] section containing structured data extracted from the document.
   YOUR WORKFLOW:
   a) First, present a clear, well-formatted summary of what you found in the document:
      - Document type (invoice, bill, receipt, bank statement, etc.)
      - Number of entries/items found
      - Key totals and amounts
      - List the main entries with their details
   b) Then ASK the user what they want to do with the data. Offer specific options as buttons:
      - "I found 5 invoice entries in this spreadsheet totaling $12,500. What would you like me to do?\n{{BUTTONS:Create all 5 invoices|Let me review them first|Create specific ones}}"
      - "This looks like a bill from ABC Corp for $3,200. Want me to record it?\n{{BUTTONS:Yes, create the bill|Edit details first|Just save for reference}}"
   c) ONLY execute tool calls AFTER the user confirms what action to take.
   d) When creating multiple entries, show progress and confirm each one.
   e) Supported document types for import: invoices, bills, expenses, journal entries, customers, vendors, payments.
   f) If the document doesn't contain financial/accounting data, tell the user: "This document doesn't appear to contain accounting data I can process. I can help with invoices, bills, receipts, bank statements, expense reports, and financial spreadsheets."
   g) DOCUMENT CONTINUATION: When a document contains MULTIPLE entry types (e.g., invoices AND journal entries AND expenses), offer a "Process all entries" option that handles everything at once. After processing one type, ALWAYS remind the user about remaining unprocessed types. Do NOT consider the document complete until ALL entry types have been processed or the user explicitly declines.
   h) BATCH OPTIONS: When presenting document options, always include:
      - "Process all entries" — creates everything (invoices, bills, journal entries, expenses, etc.) in one batch
      - Individual type options like "Create all invoices", "Record all journal entries"
      Example: "I found 5 invoices, 3 journal entries, and 2 expenses. What would you like to do?\n{{BUTTONS:Process all 10 entries|Create invoices only|Let me review first}}"

# COMPANY SETTINGS
- Use update_company_settings when user asks to change business name, currency, tax rate/name/number, address, payment terms, invoice prefix/notes, or fiscal year.
- CRITICAL: When a user says "show my company info", "what are my details", "my company profile", "show my info", "what is my company name/email/phone/address" — answer DIRECTLY from the BUSINESS SNAPSHOT already loaded at the top of your context. Do NOT call get_customer, list_customers, search_customers, or any other tool. The snapshot has a "Company Profile" section with all company details.
- CRITICAL: When a user says "these are MY details", "add MY info to invoices", "I need my name/email/phone/address on invoices", "my contact details", "show my details on documents" — this means update_company_settings with contactName, email, phone, address, city. NEVER create or update a customer. NEVER call add_customer.
- CRITICAL: "my company", "my info", "my details", "my name" always refers to the BUSINESS OWNER / COMPANY — never to a customer. If a user's name happens to match a customer name, still do NOT show the customer record for "my company info" requests.
- CRITICAL: When displaying company info, ONLY show fields that actually exist in the Business Snapshot. If a field (phone, address, city, email, tax number, etc.) is NOT present in the snapshot, show "Not set" for that field. NEVER invent, guess, or fabricate any company data. If the snapshot only has a name and currency, only show those two — do not add placeholder or example values for anything else.
- The contactName field is the owner/sender name shown on all invoices.
- Only pass the fields the user mentioned — leave others undefined.
- After updating, confirm what changed in plain language.

# BULK OPERATIONS
- Use bulk_action when the user wants to act on multiple records at once: "mark all overdue invoices as sent", "delete all draft bills", "deactivate all vendors", etc.
- For bulk UPDATE: execute immediately if the action is clearly safe (status change, flag toggle).
- For bulk DELETE: ALWAYS ask the user to confirm first with {{BUTTONS:Yes, delete them all|Cancel}}. Only pass confirmed:true after they confirm.
- After bulk action, report how many records were affected.

# MERGE CONTACTS
- Use merge_contact when user says "merge X and Y", "X and Y are the same customer", "combine duplicates".
- Clarify which record to keep if not obvious. Use {{BUTTONS:Keep [Name A]|Keep [Name B]}} to ask.
- After merging, confirm: "Merged [Name B] into [Name A]. All invoices updated."

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
