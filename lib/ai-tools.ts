// OpenAI function calling format
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

export const AI_TOOLS: AITool[] = [
  {
    type: 'function',
    function: {
      name: "record_expense",
      description: "Record an expense or purchase. Use this when user mentions buying something, paying for something, or any business expense like 'bought laptop', 'paid rent', 'office supplies expense'.",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Description of the expense"
          },
          amount: {
            type: "number",
            description: "Amount spent"
          },
          category: {
            type: "string",
            description: "Expense category (e.g., 'Office Equipment', 'Rent', 'Utilities', 'Travel', 'Supplies', 'Software & Subscriptions')"
          },
          vendor_name: {
            type: "string",
            description: "Vendor/supplier name if mentioned"
          },
          date: {
            type: "string",
            description: "Date of expense in ISO format (default: today)"
          },
          payment_method: {
            type: "string",
            enum: ["cash", "bank_transfer", "card", "cheque"],
            description: "How was this paid (default: cash)"
          }
        },
        required: ["description", "amount", "category"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "create_invoice",
      description: "Create a new invoice for a customer/client. Use when user wants to bill a client, create an invoice, or charge for work/services/products. IMPORTANT: You must always provide items as an array with at least one item containing description and rate. Example: items: [{description: 'Consulting services', quantity: 1, rate: 5000}]",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Name of the customer/client"
          },
          customer_email: {
            type: "string",
            description: "Customer email for sending invoice"
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description: "Description of the service or product (e.g., 'Consulting services', 'Web development')"
                },
                quantity: {
                  type: "number",
                  default: 1,
                  description: "Quantity of items (default: 1)"
                },
                rate: {
                  type: "number",
                  description: "Price per unit (e.g., 5000 for $5,000)"
                }
              },
              required: ["description", "rate"]
            },
            description: "Array of line items for the invoice. Each item must have a description and rate. Example: [{description: 'Consulting', quantity: 1, rate: 5000}]"
          },
          due_days: {
            type: "number",
            description: "Number of days until due (default: 30)"
          },
          tax_rate: {
            type: "number",
            description: "Tax percentage to apply (default: 0)"
          },
          notes: {
            type: "string",
            description: "Additional notes for the invoice"
          }
        },
        required: ["customer_name", "items"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "record_payment_received",
      description: "Record a payment received from a customer. Use when customer pays an invoice or makes a payment, like 'client paid' or 'received payment'.",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Name of the customer who paid"
          },
          amount: {
            type: "number",
            description: "Amount received"
          },
          invoice_number: {
            type: "string",
            description: "Invoice number if paying specific invoice"
          },
          payment_method: {
            type: "string",
            enum: ["cash", "bank_transfer", "card", "cheque"],
            description: "How payment was received"
          },
          date: {
            type: "string",
            description: "Date of payment in ISO format"
          },
          reference: {
            type: "string",
            description: "Reference number (cheque number, transaction ID)"
          }
        },
        required: ["customer_name", "amount"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "add_customer",
      description: "Add a new customer/client to the system. Use when user wants to add a new client or customer.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Customer/client name"
          },
          email: {
            type: "string",
            description: "Email address"
          },
          phone: {
            type: "string",
            description: "Phone number"
          },
          address: {
            type: "string",
            description: "Address"
          },
          city: {
            type: "string",
            description: "City"
          },
          country: {
            type: "string",
            description: "Country"
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "add_vendor",
      description: "Add a new vendor/supplier to the system. Use when user mentions a new supplier or vendor they buy from.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Vendor/supplier name"
          },
          email: {
            type: "string",
            description: "Email address"
          },
          phone: {
            type: "string",
            description: "Phone number"
          },
          address: {
            type: "string",
            description: "Address"
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "add_employee",
      description: "Add a new employee to the system. Use when user wants to add staff, team member, or employee.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Employee full name"
          },
          email: {
            type: "string",
            description: "Email address"
          },
          phone: {
            type: "string",
            description: "Phone number"
          },
          designation: {
            type: "string",
            description: "Job title/designation"
          },
          department: {
            type: "string",
            description: "Department"
          },
          salary: {
            type: "number",
            description: "Monthly salary amount"
          },
          joining_date: {
            type: "string",
            description: "Joining date in ISO format"
          }
        },
        required: ["name", "salary"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "get_report",
      description: "Generate a financial report. Use when user asks for P&L, profit loss, balance sheet, trial balance, expense report, or any financial summary.",
      parameters: {
        type: "object",
        properties: {
          report_type: {
            type: "string",
            enum: [
              "profit_loss",
              "balance_sheet",
              "trial_balance",
              "cash_flow",
              "expense_report",
              "revenue_report"
            ],
            description: "Type of report to generate"
          },
          start_date: {
            type: "string",
            description: "Start date for report period (ISO format)"
          },
          end_date: {
            type: "string",
            description: "End date for report period (ISO format)"
          }
        },
        required: ["report_type", "start_date", "end_date"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "get_account_balance",
      description: "Get the current balance of a specific account or overall summary. Use when user asks 'how much cash', 'what's my balance', 'receivables', 'payables'.",
      parameters: {
        type: "object",
        properties: {
          account_name: {
            type: "string",
            description: "What balance to get: 'cash', 'bank', 'receivables', 'payables', or specific account name"
          }
        },
        required: ["account_name"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "list_outstanding_invoices",
      description: "List all unpaid or partially paid invoices. Use when user asks about unpaid invoices, outstanding amounts, or who owes money.",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Filter by customer name (optional)"
          },
          status: {
            type: "string",
            enum: ["all", "overdue", "pending"],
            description: "Filter by status"
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "create_journal_entry",
      description: `Create a manual journal entry for accounting transactions. Use when user wants to record asset purchases, transfers between accounts, or any double-entry transaction.

IMPORTANT: You MUST provide entries as an array with debit and credit amounts that balance (total debits = total credits).

Common journal entry examples:
1. Buying equipment with cash: entries: [{account_name: "Office Equipment", debit: 1000, credit: 0}, {account_name: "Cash", debit: 0, credit: 1000}]
2. Paying rent: entries: [{account_name: "Rent Expense", debit: 2000, credit: 0}, {account_name: "Cash", debit: 0, credit: 2000}]
3. Owner investment: entries: [{account_name: "Cash", debit: 10000, credit: 0}, {account_name: "Owner's Equity", debit: 0, credit: 10000}]`,
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Description of the journal entry (e.g., 'Purchase of office PC', 'Monthly rent payment')"
          },
          date: {
            type: "string",
            description: "Date of entry (ISO format, default: today)"
          },
          entries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                account_name: {
                  type: "string",
                  description: "Account name (e.g., 'Cash', 'Office Equipment', 'Rent Expense', 'Bank')"
                },
                debit: {
                  type: "number",
                  description: "Debit amount (use 0 if crediting this account)"
                },
                credit: {
                  type: "number",
                  description: "Credit amount (use 0 if debiting this account)"
                }
              },
              required: ["account_name", "debit", "credit"]
            },
            description: "Array of debit/credit entries. MUST balance (total debits = total credits). Example for $1000 PC purchase: [{account_name: 'Office Equipment', debit: 1000, credit: 0}, {account_name: 'Cash', debit: 0, credit: 1000}]"
          }
        },
        required: ["description", "entries"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "create_account",
      description: `Create a new account in the chart of accounts. Use when user wants to add a new account like 'add account for vehicle expenses', 'create marketing expense account', 'add an account for inventory'.

Account types (type_code):
- asset: Things you own (cash, equipment, inventory, receivables)
- liability: Things you owe (loans, payables, credit cards)
- equity: Owner's investment and retained earnings
- revenue: Income from sales and services
- expense: Business costs and expenses

You must provide the subtype_code which determines where the account belongs:
Asset subtypes: current_asset, fixed_asset, other_asset
Liability subtypes: current_liability, long_term_liability
Equity subtypes: equity
Revenue subtypes: operating_revenue, other_revenue
Expense subtypes: operating_expense, cost_of_goods, payroll_expense, tax_expense, other_expense`,
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Account name (e.g., 'Vehicle Expenses', 'Marketing Costs', 'Inventory')"
          },
          subtype_code: {
            type: "string",
            enum: [
              "current_asset", "fixed_asset", "other_asset",
              "current_liability", "long_term_liability",
              "equity",
              "operating_revenue", "other_revenue",
              "operating_expense", "cost_of_goods", "payroll_expense", "tax_expense", "other_expense"
            ],
            description: "The subtype code that determines where this account belongs"
          },
          code: {
            type: "string",
            description: "Optional account code (e.g., '5200'). Auto-generated if not provided"
          },
          description: {
            type: "string",
            description: "Optional description of what this account is used for"
          }
        },
        required: ["name", "subtype_code"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "create_account_subtype",
      description: `Create a new account subtype/category. Use when user wants to organize accounts differently, like 'add a subtype for investments under assets', 'create a category for contractor payments'.

Type codes:
- asset: For things you own
- liability: For things you owe
- equity: For owner's investment
- revenue: For income
- expense: For costs`,
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Subtype name (e.g., 'Investments', 'Contractor Payments', 'Digital Assets')"
          },
          type_code: {
            type: "string",
            enum: ["asset", "liability", "equity", "revenue", "expense"],
            description: "The main account type this subtype belongs to"
          }
        },
        required: ["name", "type_code"]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "list_accounts",
      description: "List accounts in the chart of accounts. Use when user asks to see accounts, like 'show me all expense accounts', 'list my asset accounts', 'what accounts do I have'.",
      parameters: {
        type: "object",
        properties: {
          type_code: {
            type: "string",
            enum: ["asset", "liability", "equity", "revenue", "expense"],
            description: "Filter by account type (optional)"
          },
          subtype_code: {
            type: "string",
            description: "Filter by subtype code (optional)"
          }
        }
      }
    }
  }
];

export const SYSTEM_PROMPT = `You are Flowbooks AI, an intelligent accounting assistant. You help users manage their business finances through natural conversation.

CAPABILITIES:
- Record expenses and purchases
- Create and send invoices
- Record payments received and made
- Add customers, vendors, and employees
- Manage chart of accounts (create accounts, subtypes)
- Generate financial reports (P&L, Balance Sheet, Cash Flow, etc.)
- Answer questions about financial data
- Search transactions

BEHAVIOR GUIDELINES:
1. Be concise and friendly - respond like a helpful colleague
2. When user gives a command, execute it using the appropriate tool
3. If information is ambiguous, ask ONE clarifying question
4. After executing an action, confirm what you did in simple terms
5. Use the user's currency when mentioning amounts
6. For dates, assume today unless specified
7. Don't use accounting jargon - keep it simple

EXAMPLES OF UNDERSTANDING:
- "bought laptop 85k" → record_expense with amount 85000, category "Office Equipment"
- "invoice acme corp 50000 for consulting" → create_invoice with customer_name: "Acme Corp", items: [{description: "Consulting services", quantity: 1, rate: 50000}]
- "invoice john $5000 for web development" → create_invoice with customer_name: "John", items: [{description: "Web development", quantity: 1, rate: 5000}]
- "acme paid their invoice" → record_payment_received from Acme
- "add john as developer, 60k salary" → add_employee
- "show me P&L for last month" → get_report with type "profit_loss"
- "how much does client X owe" → get_account_balance for receivables
- "bought a $1000 PC with cash" → create_journal_entry with description: "Purchase of office PC", entries: [{account_name: "Office Equipment", debit: 1000, credit: 0}, {account_name: "Cash", debit: 0, credit: 1000}]
- "create journal for rent payment $2000" → create_journal_entry with description: "Monthly rent payment", entries: [{account_name: "Rent Expense", debit: 2000, credit: 0}, {account_name: "Cash", debit: 0, credit: 2000}]
- "add account for vehicle expenses" → create_account with name: "Vehicle Expenses", subtype_code: "operating_expense"
- "create an inventory account" → create_account with name: "Inventory", subtype_code: "current_asset"
- "add a subtype for contractor payments" → create_account_subtype with name: "Contractor Payments", type_code: "expense"
- "show me all expense accounts" → list_accounts with type_code: "expense"
- "list my asset accounts" → list_accounts with type_code: "asset"

AMBIGUITY HANDLING:
- "paid ali 10k" → Ask: "Is Ali a vendor/supplier, employee, or customer? I want to record this correctly."
- "record 5000" → Ask: "Is this income or an expense? What was it for?"

Current date: ${new Date().toISOString().split('T')[0]}

Always be helpful, accurate, and efficient. The user's time is valuable.`;
