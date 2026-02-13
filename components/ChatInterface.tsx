'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  IconButton,
  Input,
  Stack,
  Typography,
  Avatar,
  Button,
  Chip,
} from '@mui/joy';
import { Send, MessageCircle, Mic, MicOff, X, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useTheme } from '@/contexts/ThemeContext';
import toast from 'react-hot-toast';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, orderBy as firestoreOrderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Typing animation component
const TypingIndicator = () => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: 'primary.400',
        animation: 'typing 1.4s infinite',
        '@keyframes typing': {
          '0%, 60%, 100%': { opacity: 0.3 },
          '30%': { opacity: 1 },
        },
      }}
    />
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: 'primary.400',
        animation: 'typing 1.4s infinite 0.2s',
        '@keyframes typing': {
          '0%, 60%, 100%': { opacity: 0.3 },
          '30%': { opacity: 1 },
        },
      }}
    />
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: 'primary.400',
        animation: 'typing 1.4s infinite 0.4s',
        '@keyframes typing': {
          '0%, 60%, 100%': { opacity: 0.3 },
          '30%': { opacity: 1 },
        },
      }}
    />
  </Stack>
);

// Date separator component
const DateSeparator = ({ date }: { date: Date }) => {
  let dateText = '';

  if (isToday(date)) {
    dateText = 'Today';
  } else if (isYesterday(date)) {
    dateText = 'Yesterday';
  } else {
    dateText = format(date, 'MMMM dd, yyyy');
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{ my: 2 }}
    >
      <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
      <Chip size="sm" variant="soft" color="neutral">
        {dateText}
      </Chip>
      <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
    </Stack>
  );
};

// Tool execution functions
async function executeToolCall(toolName: string, args: any, companyId: string, userId: string): Promise<string> {
  try {
    switch (toolName) {
      case 'add_customer':
        return await addCustomer(args, companyId, userId);
      case 'add_vendor':
        return await addVendor(args, companyId, userId);
      case 'add_employee':
        return await addEmployee(args, companyId, userId);
      case 'record_expense':
        return await recordExpense(args, companyId, userId);
      case 'create_invoice':
        return await createInvoice(args, companyId, userId);
      case 'record_payment_received':
        return await recordPaymentReceived(args, companyId, userId);
      case 'create_journal_entry':
        return await createJournalEntry(args, companyId, userId);
      case 'create_account':
        return await createAccount(args, companyId, userId);
      case 'create_account_subtype':
        return await createAccountSubtype(args, companyId, userId);
      case 'list_accounts':
        return await listAccounts(args, companyId);
      default:
        return `Tool ${toolName} not implemented on client`;
    }
  } catch (error: any) {
    console.error(`Error executing ${toolName}:`, error);
    return `Failed to execute ${toolName}: ${error.message}`;
  }
}

async function addCustomer(args: any, companyId: string, userId: string): Promise<string> {
  const customersRef = collection(db, `companies/${companyId}/customers`);
  await addDoc(customersRef, {
    name: args.name,
    email: args.email || '',
    phone: args.phone || '',
    address: args.address || '',
    city: args.city || '',
    country: args.country || '',
    taxId: '',
    totalBilled: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    createdAt: serverTimestamp(),
  });
  return `Successfully added customer: ${args.name}`;
}

async function addVendor(args: any, companyId: string, userId: string): Promise<string> {
  const vendorsRef = collection(db, `companies/${companyId}/vendors`);
  await addDoc(vendorsRef, {
    name: args.name,
    email: args.email || '',
    phone: args.phone || '',
    address: args.address || '',
    totalBilled: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    createdAt: serverTimestamp(),
  });
  return `Successfully added vendor: ${args.name}`;
}

async function addEmployee(args: any, companyId: string, userId: string): Promise<string> {
  const employeeId = `EMP-${Date.now().toString().slice(-6)}`;
  const employeesRef = collection(db, `companies/${companyId}/employees`);
  await addDoc(employeesRef, {
    employeeId,
    name: args.name,
    email: args.email || '',
    designation: args.designation || '',
    department: args.department || '',
    salary: args.salary || 0,
    salaryType: 'monthly',
    joiningDate: args.joining_date ? new Date(args.joining_date) : new Date(),
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return `Successfully added employee: ${args.name} (${employeeId})`;
}

async function recordExpense(args: any, companyId: string, userId: string): Promise<string> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  await addDoc(transactionsRef, {
    type: 'expense',
    description: args.description,
    amount: Math.abs(args.amount),
    category: args.category,
    date: args.date ? new Date(args.date) : new Date(),
    paymentMethod: args.payment_method || 'cash',
    createdAt: serverTimestamp(),
  });
  return `Successfully recorded expense: ${args.description} - $${args.amount}`;
}

async function createInvoice(args: any, companyId: string, userId: string): Promise<string> {
  console.log('createInvoice args:', args);

  // Ensure items is an array and has valid data
  if (!args.items || !Array.isArray(args.items) || args.items.length === 0) {
    throw new Error('Invoice must have at least one item');
  }

  // Calculate subtotal, ensuring we have valid numbers
  const subtotal = args.items.reduce((sum: number, item: any) => {
    const quantity = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    console.log(`Item: ${item.description}, Quantity: ${quantity}, Rate: ${rate}`);
    return sum + (quantity * rate);
  }, 0);

  const taxRate = Number(args.tax_rate) || 0;
  const total = subtotal * (1 + taxRate / 100);
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  console.log(`Invoice subtotal: ${subtotal}, tax rate: ${taxRate}%, total: ${total}`);

  const invoicesRef = collection(db, `companies/${companyId}/invoices`);
  await addDoc(invoicesRef, {
    customerName: args.customer_name,
    customerEmail: args.customer_email || '',
    invoiceNumber,
    issueDate: serverTimestamp(),
    dueDate: new Date(Date.now() + (Number(args.due_days) || 30) * 24 * 60 * 60 * 1000),
    items: args.items.map((item: any) => ({
      description: item.description || 'Item',
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0
    })),
    subtotal,
    tax: total - subtotal,
    total,
    amountDue: total,
    status: 'draft',
    notes: args.notes || '',
    createdAt: serverTimestamp(),
  });
  return `Successfully created invoice ${invoiceNumber} for ${args.customer_name} - Total: $${total.toFixed(2)}`;
}

async function recordPaymentReceived(args: any, companyId: string, userId: string): Promise<string> {
  const transactionsRef = collection(db, `companies/${companyId}/transactions`);
  await addDoc(transactionsRef, {
    type: 'income',
    description: `Payment from ${args.customer_name}`,
    amount: Math.abs(args.amount),
    category: 'Customer Payment',
    date: args.date ? new Date(args.date) : new Date(),
    paymentMethod: args.payment_method || 'cash',
    reference: args.reference || '',
    createdAt: serverTimestamp(),
  });
  return `Successfully recorded payment of $${args.amount} from ${args.customer_name}`;
}

async function createJournalEntry(args: any, companyId: string, userId: string): Promise<string> {
  console.log('createJournalEntry args:', args);

  // Ensure entries array exists
  if (!args.entries || !Array.isArray(args.entries) || args.entries.length === 0) {
    throw new Error('Journal entry must have at least one entry');
  }

  // Validate that debits equal credits
  const totalDebit = args.entries.reduce((sum: number, e: any) => sum + (Number(e.debit) || 0), 0);
  const totalCredit = args.entries.reduce((sum: number, e: any) => sum + (Number(e.credit) || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Journal entry is not balanced. Debits: $${totalDebit.toFixed(2)}, Credits: $${totalCredit.toFixed(2)}`);
  }

  const entryNumber = `JE-${Date.now().toString().slice(-6)}`;

  const journalRef = collection(db, `companies/${companyId}/journalEntries`);
  await addDoc(journalRef, {
    entryNumber,
    date: args.date ? new Date(args.date) : new Date(),
    description: args.description || 'Journal Entry',
    referenceType: 'manual',
    lines: args.entries.map((e: any) => ({
      accountId: e.account_id || e.account_name?.toLowerCase().replace(/\s+/g, '_'),
      accountName: e.account_name,
      description: e.description || '',
      debit: Number(e.debit) || 0,
      credit: Number(e.credit) || 0,
    })),
    totalDebit,
    totalCredit,
    isBalanced: true,
    createdAt: serverTimestamp(),
  });

  return `Successfully created journal entry ${entryNumber}: ${args.description} (Debits: $${totalDebit.toFixed(2)}, Credits: $${totalCredit.toFixed(2)})`;
}

async function createAccount(args: any, companyId: string, userId: string): Promise<string> {
  console.log('createAccount args:', args);

  if (!args.name || !args.subtype_code) {
    throw new Error('Account name and subtype_code are required');
  }

  // Get subtypes for this company
  const subtypesRef = collection(db, `companies/${companyId}/accountSubtypes`);
  const subtypeSnapshot = await getDocs(query(subtypesRef));

  const subtype = subtypeSnapshot.docs.find(doc => doc.data().code === args.subtype_code);

  if (!subtype) {
    throw new Error(`Subtype '${args.subtype_code}' not found. Please create the subtype first.`);
  }

  const subtypeData = subtype.data();

  // Get existing accounts to generate code
  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const accountsSnapshot = await getDocs(accountsRef);

  // Generate account code if not provided
  let accountCode = args.code;
  if (!accountCode) {
    const typeAccounts = accountsSnapshot.docs.filter(
      doc => doc.data().typeCode === subtypeData.typeCode
    );
    const maxCode = Math.max(0, ...typeAccounts.map(doc => parseInt(doc.data().code) || 0));
    accountCode = String(maxCode + 10).padStart(4, '0');
  }

  await addDoc(accountsRef, {
    code: accountCode,
    name: args.name,
    typeId: subtypeData.typeId,
    typeName: subtypeData.typeName,
    typeCode: subtypeData.typeCode,
    subtypeId: subtype.id,
    subtypeName: subtypeData.name,
    subtypeCode: subtypeData.code,
    description: args.description || '',
    isActive: true,
    isSystem: false,
    balance: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return `Successfully created account: ${args.name} (Code: ${accountCode}, Type: ${subtypeData.typeName}, Subtype: ${subtypeData.name})`;
}

async function createAccountSubtype(args: any, companyId: string, userId: string): Promise<string> {
  console.log('createAccountSubtype args:', args);

  if (!args.name || !args.type_code) {
    throw new Error('Subtype name and type_code are required');
  }

  // Get master account types
  const typesRef = collection(db, 'accountTypes');
  const typesSnapshot = await getDocs(typesRef);

  const type = typesSnapshot.docs.find(doc => doc.data().code === args.type_code);

  if (!type) {
    throw new Error(`Account type '${args.type_code}' not found. Valid types: asset, liability, equity, revenue, expense`);
  }

  const typeData = type.data();

  // Get existing subtypes to calculate order
  const subtypesRef = collection(db, `companies/${companyId}/accountSubtypes`);
  const subtypesSnapshot = await getDocs(subtypesRef);

  const typeSubtypes = subtypesSnapshot.docs.filter(
    doc => doc.data().typeCode === args.type_code
  );
  const maxOrder = Math.max(0, ...typeSubtypes.map(doc => doc.data().order || 0));

  // Generate code from name
  const code = args.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  await addDoc(subtypesRef, {
    name: args.name,
    code,
    typeId: type.id,
    typeName: typeData.name,
    typeCode: typeData.code,
    order: maxOrder + 1,
    isSystem: false,
    createdAt: serverTimestamp()
  });

  return `Successfully created account subtype: ${args.name} (Type: ${typeData.name})`;
}

async function listAccounts(args: any, companyId: string): Promise<string> {
  console.log('listAccounts args:', args);

  const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
  const accountsSnapshot = await getDocs(accountsRef);

  let accounts = accountsSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }));

  // Filter by type if specified
  if (args.type_code) {
    accounts = accounts.filter((a: any) => a.typeCode === args.type_code);
  }

  // Filter by subtype if specified
  if (args.subtype_code) {
    accounts = accounts.filter((a: any) => a.subtypeCode === args.subtype_code);
  }

  if (accounts.length === 0) {
    return 'No accounts found matching your criteria.';
  }

  // Group by type for display
  const grouped: Record<string, any[]> = {};
  accounts.forEach((account: any) => {
    const typeName = account.typeName || 'Other';
    if (!grouped[typeName]) {
      grouped[typeName] = [];
    }
    grouped[typeName].push(account);
  });

  // Format the response
  let response = `Found ${accounts.length} account(s):\n\n`;

  for (const [typeName, typeAccounts] of Object.entries(grouped)) {
    response += `**${typeName}:**\n`;
    typeAccounts.forEach((account: any) => {
      const balance = account.balance || 0;
      response += `  • ${account.code} - ${account.name} ($${balance.toFixed(2)})\n`;
    });
    response += '\n';
  }

  return response;
}

export default function ChatInterface() {
  const { user } = useAuth();
  const { company, refreshData } = useCompany();
  const { mode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setHasMore(messages.length > displayCount);
  }, [messages.length, displayCount]);

  // Load chat history from Firestore when component mounts or company changes
  useEffect(() => {
    async function loadChatHistory() {
      if (!company?.id) return;

      setIsLoadingHistory(true);
      try {
        const chatRef = collection(db, `companies/${company.id}/chatMessages`);
        const q = query(chatRef, firestoreOrderBy('createdAt', 'asc'), limit(50));
        const snapshot = await getDocs(q);

        const loadedMessages: Message[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            role: data.role as 'user' | 'assistant',
            content: data.content,
            timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        });

        // Add welcome message if no history
        if (loadedMessages.length === 0) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hi! I'm your Flowbooks AI assistant. I can help you with:

- Recording expenses and income
- Creating invoices for customers
- Adding customers, vendors, and employees
- Generating financial reports
- Tracking payments and outstanding balances

Just tell me what you'd like to do in plain English!`,
            timestamp: new Date(),
          }]);
        } else {
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Show welcome message on error
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I'm your Flowbooks AI assistant. I can help you with:

- Recording expenses and income
- Creating invoices for customers
- Adding customers, vendors, and employees
- Generating financial reports
- Tracking payments and outstanding balances

Just tell me what you'd like to do in plain English!`,
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadChatHistory();
  }, [company?.id]);

  const loadMoreMessages = () => {
    setDisplayCount(prev => prev + 20);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !company) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Show typing indicator after a brief delay
    setTimeout(() => setIsTyping(true), 300);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue.trim(),
          companyId: company.id,
          userId: user?.uid,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsTyping(false);

      let finalMessage = data.message;

      // Execute tool calls if any
      if (data.toolCalls && data.toolCalls.length > 0 && company?.id && user?.uid) {
        const results: string[] = [];

        for (const toolCall of data.toolCalls) {
          const result = await executeToolCall(toolCall.name, toolCall.args, company.id, user.uid);
          results.push(result);
        }

        // Update message with execution results
        finalMessage = results.join('\n\n');

        // Refresh company data after tool execution
        refreshData();
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save both user and assistant messages to Firestore
      if (company?.id && user?.uid) {
        try {
          const chatHistoryRef = collection(db, `companies/${company.id}/chatMessages`);

          // Save user message
          await addDoc(chatHistoryRef, {
            role: 'user',
            content: userMessage.content,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          });

          // Save assistant message
          await addDoc(chatHistoryRef, {
            role: 'assistant',
            content: finalMessage,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('Error saving messages to Firestore:', error);
          // Don't show error to user - message still displayed in UI
        }
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMsg = error.message || 'Failed to send message. Please try again.';
      toast.error(errorMsg);
      setIsTyping(false);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMsg}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowWithSpeech = window as any;
    const SpeechRecognitionAPI = windowWithSpeech.webkitSpeechRecognition || windowWithSpeech.SpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
    };

    recognition.onerror = () => {
      toast.error('Voice input failed. Please try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Get messages to display (latest N messages)
  const displayedMessages = messages.slice(-displayCount);

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  displayedMessages.forEach(message => {
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && isSameDay(lastGroup.date, message.timestamp)) {
      lastGroup.messages.push(message);
    } else {
      groupedMessages.push({
        date: message.timestamp,
        messages: [message],
      });
    }
  });

  if (!isOpen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Button
          variant="solid"
          onClick={() => setIsOpen(true)}
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            minWidth: 'unset',
            boxShadow: mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
            bgcolor: 'primary.500',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: mode === 'dark' ? '0 6px 20px rgba(0, 0, 0, 0.7)' : '0 6px 20px rgba(0, 0, 0, 0.2)',
              bgcolor: 'primary.700',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          <MessageCircle size={26} />
        </Button>
      </Box>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: { xs: 'calc(100% - 48px)', sm: 420 },
        height: { xs: 'calc(100% - 100px)', sm: 650 },
        maxHeight: 650,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'divider',
        animation: 'slideIn 0.3s ease-out',
        '@keyframes slideIn': {
          from: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {/* Chat Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          p: 2,
          bgcolor: 'background.surface',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 'md',
              bgcolor: 'primary.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={18} style={{ color: 'var(--joy-palette-primary-600)' }} />
          </Box>
          <Stack spacing={0}>
            <Typography level="title-md" fontWeight="bold">
              Flowbooks AI
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              Always here to help
            </Typography>
          </Stack>
        </Stack>
        <IconButton
          size="sm"
          variant="plain"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </IconButton>
      </Stack>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: 'background.level1',
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'neutral.300',
            borderRadius: 4,
            '&:hover': {
              bgcolor: 'neutral.400',
            },
          },
        }}
      >
        {/* Load More Button */}
        {hasMore && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Button
              size="sm"
              variant="soft"
              color="neutral"
              onClick={loadMoreMessages}
              sx={{ fontSize: '12px' }}
            >
              Load previous messages
            </Button>
          </Box>
        )}

        {groupedMessages.map((group, groupIndex) => (
          <Box key={groupIndex}>
            {/* Date Separator */}
            {groupIndex > 0 && <DateSeparator date={group.date} />}

            {/* Messages */}
            {group.messages.map((message) => (
              <Stack
                key={message.id}
                direction="row"
                spacing={1.5}
                sx={{
                  mb: 2,
                  alignItems: 'flex-end',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar
                    size="sm"
                    sx={{
                      bgcolor: 'primary.500',
                      minWidth: 32,
                      minHeight: 32,
                    }}
                  >
                    <BookOpen size={16} />
                  </Avatar>
                )}

                <Box
                  sx={{
                    maxWidth: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 'lg',
                      bgcolor: message.role === 'user' ? 'primary.600' : 'background.surface',
                      color: message.role === 'user' ? 'white' : 'text.primary',
                      boxShadow: 'xs',
                      border: message.role === 'user' ? 'none' : '1px solid',
                      borderColor: message.role === 'user' ? 'transparent' : 'divider',
                      animation: 'messageIn 0.3s ease-out',
                      '@keyframes messageIn': {
                        from: {
                          opacity: 0,
                          transform: 'translateY(10px)',
                        },
                        to: {
                          opacity: 1,
                          transform: 'translateY(0)',
                        },
                      },
                    }}
                  >
                    <Typography
                      level="body-sm"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: 1.6,
                      }}
                    >
                      {message.content}
                    </Typography>
                  </Box>

                  {/* Timestamp */}
                  <Typography
                    level="body-xs"
                    sx={{
                      color: 'text.tertiary',
                      fontSize: '10px',
                      mt: 0.5,
                      px: 1,
                    }}
                  >
                    {format(message.timestamp, 'h:mm a')}
                  </Typography>
                </Box>

                {message.role === 'user' && (
                  <Avatar
                    size="sm"
                    src={user?.photoURL || undefined}
                    sx={{
                      minWidth: 32,
                      minHeight: 32,
                      border: '2px solid',
                      borderColor: 'primary.200',
                    }}
                  >
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </Avatar>
                )}
              </Stack>
            ))}
          </Box>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <Stack direction="row" spacing={1.5} sx={{ mb: 2, alignItems: 'flex-end' }}>
            <Avatar
              size="sm"
              sx={{
                bgcolor: 'primary.500',
                minWidth: 32,
                minHeight: 32,
              }}
            >
              <BookOpen size={16} />
            </Avatar>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 'lg',
                bgcolor: 'background.surface',
                boxShadow: 'xs',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <TypingIndicator />
            </Box>
          </Stack>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.surface',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Input
            ref={inputRef}
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            size="sm"
            sx={{
              flex: 1,
              '--Input-focusedThickness': '2px',
              '--Input-focusedHighlight': 'var(--joy-palette-primary-500)',
            }}
          />
          <IconButton
            color={isListening ? 'danger' : 'neutral'}
            variant={isListening ? 'solid' : 'soft'}
            onClick={startVoiceInput}
            disabled={isLoading}
            size="sm"
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </IconButton>
          <IconButton
            color="primary"
            variant="solid"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <Send size={18} />
          </IconButton>
        </Stack>
      </Box>
    </Card>
  );
}
