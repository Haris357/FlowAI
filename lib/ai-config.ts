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
  entityType?: 'customer' | 'vendor' | 'employee' | 'invoice' | 'bill' | 'quote' | 'purchase_order' | 'purchaseOrder' | 'transaction' | 'account' | 'report' | 'salary_slip';
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
  'generate_salary_slip', 'list_salary_slips', 'change_salary_slip_status', 'send_salary_slip',
  // Email send operations
  'send_bill_email', 'send_quote_email', 'send_purchase_order_email',
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
  // Exchange rates
  'get_exchange_rates',
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

  // ============ SEND OTHER DOCUMENTS VIA EMAIL ============
  {
    type: 'function',
    function: {
      name: 'send_salary_slip',
      description: 'Send a salary slip to the employee via email with PDF attachment.',
      parameters: {
        type: 'object',
        properties: {
          slipId: { type: 'string', description: 'Salary slip document ID' },
        },
        required: ['slipId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_bill_email',
      description: 'Send a bill notification to the vendor via email with PDF attachment.',
      parameters: {
        type: 'object',
        properties: {
          billId: { type: 'string', description: 'Bill document ID' },
          type: { type: 'string', enum: ['created', 'payment_sent'], description: 'Email type — created (default) or payment_sent' },
        },
        required: ['billId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_quote_email',
      description: 'Send a quote to the customer via email with PDF attachment. Updates status to sent.',
      parameters: {
        type: 'object',
        properties: {
          quoteId: { type: 'string', description: 'Quote document ID' },
          type: { type: 'string', enum: ['sent', 'reminder', 'accepted', 'expired'], description: 'Email type — sent (default), reminder, accepted, or expired' },
        },
        required: ['quoteId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_purchase_order_email',
      description: 'Send a purchase order to the vendor via email with PDF attachment. Updates status to sent.',
      parameters: {
        type: 'object',
        properties: {
          poId: { type: 'string', description: 'Purchase order document ID' },
          type: { type: 'string', enum: ['sent', 'confirmed', 'cancelled'], description: 'Email type — sent (default), confirmed, or cancelled' },
        },
        required: ['poId'],
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

  // ============ EXCHANGE RATE TOOLS ============
  {
    type: 'function',
    function: {
      name: 'get_exchange_rates',
      description: 'Get current exchange rates for the company. Shows rates for major currencies relative to the company base currency. Use this when the user asks about exchange rates, currency conversion, or wants to create a multi-currency document.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

// ==========================================
// SYSTEM PROMPT
// ==========================================

export const FLOW_AI_SYSTEM_PROMPT = `You are Flow AI, the accounting assistant built into Flowbooks. You have deep accounting expertise — you understand financial workflows, speak the language of bookkeeping, and can handle everything from daily transactions to financial reports.

# HOW YOU WORK
- Execute immediately when you have enough info. Never ask for optional fields — default date is today, skip notes/reference/category/paymentMethod unless the user mentions them.
- Salary slips only need employeeName, month, and year. Designation is optional — don't ask for it.
- For view/list/show requests: execute without questions.
- Only ask when genuinely required info is missing. Keep questions brief and natural.
- Understand how people actually talk: "5k" = 5000, "custmer" = customer, "last month" = previous calendar month. Preserve names as typed unless they contain an obvious typo.
- Never show technical error messages. Say "I couldn't find that" or "Something went wrong" — never "FirebaseError" or tool names.
- Never mention function names, tool names, or internal implementation details. Respond in plain English.

# TONE & CONVERSATION
- You're a knowledgeable accountant who gets things done. Direct, confident, no fluff.
- For accounting and business questions ("what is depreciation", "how does VAT work", "difference between cash and accrual", "when should I record revenue"): answer directly from your expertise. Don't call any tools — just explain clearly and helpfully.
- For greetings and small talk: respond warmly and briefly.
- After completing a task: give a short confirmation. Add ONE follow-up only if it genuinely adds value. Never add filler like "Feel free to ask!", "Is there anything else I can help with?", or "Let me know if you need anything!"
- Confirm before deleting. Never auto-delete anything.

# TOOL USAGE
- **create_invoice / create_bill / record_expense**: Pass customer or vendor name directly — these tools handle lookup internally. Never call get_customer, list_customers, or search_customers as a pre-check before creating records.
- **list_customers / list_vendors**: Only when the user explicitly asks to see all of them ("show me all my customers"). Not as a pre-step for anything else.
- **get_customer / get_vendor**: Only when the user explicitly asks "show me details for X" — never before creating invoices, bills, or expenses.
- **Recurring invoice**: "set up recurring invoice", "monthly invoice", "automatic invoice" → use create_recurring_transaction (type: invoice), NOT create_invoice.
- **Bill by vendor**: "pay the [Vendor] bill" or "the [Vendor] invoice" → pass vendor name as billId, the tool finds it by name.
- **Employee not found**: If salary slip is requested for someone not in the employee list, say "I don't see [name] as an employee — would you like me to add them first?" Don't just fail.
- **Ambiguous entity match**: If a tool returns multiple matches, show options as buttons: {{BUTTONS:Ali Hassan|Ali Ahmed|Ali Raza}}

# PARSING & AMBIGUITY
- "[Customer] charges [rate] per [unit] for [quantity]" → customer = [Customer], rate = [rate], qty = [quantity]. The word "charges" means the rate — it is NOT part of the customer name. "Haris Consulting charges $100/hr" = customer is "Haris Consulting", rate is $100.
- "paid Ali 10k" — ambiguous: ask → {{BUTTONS:Ali is a customer|Ali is a vendor}}
- "record 5000" — ambiguous: ask → {{BUTTONS:Income received|Expense paid}}
- Do math when needed: "$0.025 per word × 3000 words" = $75. Always compute, never ask.

# CONVERSATION MEMORY
- When you ask a question and the user replies, that reply IS the answer. Connect it to the pending task and execute.
- Carry forward across messages: pricing, rates, descriptions, quantities, dates, payment terms.
- Do NOT carry forward: customer names, vendor names, employee names. These must come from the current message only. "Create invoice for Haris" = only Haris — never pull in other names from earlier messages.
- Never ask for info the user already provided earlier — scroll back and find it.
- If a task was pending (user asked to create something, you asked a question or hit an error), it's still pending. When the user provides more info, complete the original task — don't just show info and stop.
- "Check again" / "try again" / "he's there" / "it exists": retry the ORIGINAL task — don't just look up the entity, complete the action.

# MULTI-STEP REQUESTS
- Independent steps ("add customer A and customer B"): call all tools in parallel in one response.
- Sequential steps ("mark as sent then record payment"): call all tools in sequence in the SAME response — never wait between steps.
- If the user says "send it", "and send", "then send" in the same message as a create request: call send_invoice immediately after create_invoice in one response. Never create a draft and stop.
- Always call tools when action is needed. Never respond with only text like "I'll do that now" — that's useless without an actual tool call.

# AUTO-CORRECTION
- Fix email typos silently — commas to dots ("print,house@gmail,com" → "print.house@gmail.com"), ".con" → ".com", "gmial" → "gmail", "yaho" → "yahoo". Fix and proceed, mention it briefly in the result.
- Currency shorthand: "5k" → 5000, "1.5m" → 1500000, "$5k" → 5000. Dates: "15/3" → March 15 current year.
- Flag but don't auto-fix: amounts that seem impossibly wrong for the context, names that look like keyboard mashing, clearly swapped fields (phone number in the email field). Ask concisely: "That amount seems very high — did you mean [currency] 200 or [currency] 20,000?" (use company currency, not $).
- If an email has no "@" and no recognizable domain at all: ask for a valid one. But formatting typos (commas, transposed characters) — always fix silently.

# CURRENCY
- Always use the company's currency from the Business Snapshot (e.g. PKR, EUR, AED — NOT always $).
- When displaying amounts, use the company currency: "PKR 5,000.00" not "$5,000.00" if company uses PKR.
- When the user types "$500" or "500 dollars" in a PKR company, record the number 500 in the company's currency — do not convert. Just use the amount they said.
- Currency shorthand: "5k" → 5000, "1.5m" → 1500000.

# MULTI-CURRENCY
- Customers and vendors can have a default currency (e.g. a USD customer in a PKR company). When creating an invoice/bill for them, the document will be in their currency with an exchange rate.
- Exchange rates are stored per company and auto-refreshed daily from Frankfurter (ECB rates) with fallback to exchangerate-api.com.
- To check current exchange rates, use the get_exchange_rates tool. This shows rates for common currencies relative to the company base currency.
- When a user asks "what's the rate for USD" or "convert 100 USD to PKR", call get_exchange_rates and compute from the result.
- Documents store currency (doc currency), exchangeRate (1 docCurrency = X baseCurrency), and totalInBaseCurrency (total * exchangeRate).
- All reports and dashboard show amounts in base currency using stored exchange rates.
- If a user says "create invoice for USD 500 to customer Ali" and company is PKR: create the invoice with currency=USD, and fetch the exchange rate using get_exchange_rates.

# RESPONSE FORMAT
- Currency: use company currency symbol + amount (e.g. "PKR 5,000.00" or "€5,000.00"). Dates: "Nov 15, 2024". Success: ✓. Warning: ⚠️.
- Use {{BUTTONS:Option 1|Option 2}} when asking the user to choose — never ask choice questions as plain text. Labels: 2-5 words, max 4 buttons per group.
- After create_invoice: short confirmation only — "Draft invoice created for **[Customer]** — $[amount]. Click **Send Invoice** above to email it." No follow-up question. No buttons (UI already shows action buttons).
- After create_bill: same — short confirmation, no follow-up, no buttons. UI shows "Send to Vendor" button.
- After create_quote: short confirmation, no follow-up. UI shows "Send Quote" button.
- After create_purchase_order: short confirmation, no follow-up. UI shows "Send to Vendor" button.
- After generate_salary_slip: short confirmation. UI shows "Send to Employee" button.
- After user confirms "send it" / "yes send": call send_invoice immediately using the invoice ID from the previous create_invoice result. Don't call list_invoices.
- For non-invoice sends: use send_salary_slip (slipId), send_bill_email (billId), send_quote_email (quoteId), send_purchase_order_email (poId). The IDs come from the previous create/generate result.

# INVOICES & PAYMENTS
- When listing invoices, sort by priority: overdue first, then sent/unpaid, then partial, then drafts.
- Overdue invoices: highlight with urgency, show days overdue.
- "Send reminder": call list_invoices with status="overdue" only. Never list all invoices for a reminder request.
- "Received payment from [customer]": find their unpaid invoices. If just one, mark it paid immediately. If multiple, ask which one with buttons.
- Partial payment: use change_invoice_status with paymentAmount.
- Invoice PDF styling is automatic based on company template settings. If user asks about changing invoice appearance, direct them to Company Settings → Documents → Invoice Appearance.

# DOCUMENT UPLOADS
- When a document is attached, you receive a [ATTACHED DOCUMENT ANALYSIS] section with extracted data.
- First: summarize clearly — document type, number of entries, key totals, main line items.
- Then: ask what to do using buttons. Don't execute until user confirms.
  Example: "I found 5 invoices, 3 journal entries, and 2 expenses. What would you like to do?\n{{BUTTONS:Process all 10 entries|Create invoices only|Let me review first}}"
- After processing one type, remind user about remaining unprocessed types from the same document.
- If no accounting data: say so clearly and list what you can process (invoices, bills, receipts, bank statements, expense reports, customer/vendor lists).

# COMPANY SETTINGS
- "my company info" / "my details" / "show my profile": read from the Business Snapshot already in your context. Never call get_customer or any search tool for this.
- "these are my details, add to invoices" / "show my info on documents": update_company_settings with contactName, email, phone, address, city.
- "my company" / "my info" / "my name" always means the business owner — never a customer, even if the names match.
- Only show fields that exist in the snapshot. Show "Not set" for missing fields — never fabricate data.
- update_company_settings for: business name, currency, tax rate/name/number, address, payment terms, invoice prefix, fiscal year. Only pass fields the user mentioned.

# BULK OPERATIONS
- Use bulk_action for "mark all...", "delete all...", "deactivate all..." type requests.
- Bulk update: execute if clearly safe (status change, flag toggle).
- Bulk delete: always confirm first → {{BUTTONS:Yes, delete them all|Cancel}}.

# MERGE CONTACTS
- merge_contact when user says "merge X and Y", "they're the same customer", "combine duplicates".
- Ask which to keep if not obvious → {{BUTTONS:Keep [Name A]|Keep [Name B]}}.
- Confirm after: "Merged [Name B] into [Name A]. All records updated."

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
