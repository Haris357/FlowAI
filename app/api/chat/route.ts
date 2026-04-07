import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Timestamp } from 'firebase-admin/firestore';
import { FLOW_AI_TOOLS, FLOW_AI_SYSTEM_PROMPT, isBlockedRequest, validateToolCall } from '@/lib/ai-config';
import {
  getConversationMemory,
  createConversationMemory,
  addMessageToMemory,
  buildContextFromMemory,
  needsCompaction,
  compactConversation,
  estimateTokens,
} from '@/lib/ai-memory-admin';
import {
  getUserBusinessContext,
  updateUserBusinessContext,
  extractBusinessContext,
  buildBusinessContextPrompt,
} from '@/services/userContext';
import { checkUsageBudgetAdmin, trackUsageAdmin, type UsageBudgetResult } from '@/services/subscription-admin';
import { getCompanySnapshot, invalidateCompanySnapshot, buildSnapshotPrompt, FIRESTORE_SCHEMA } from '@/services/company-snapshot';
import { formatDuration } from '@/lib/plans';
import { trackServer } from '@/lib/analytics-server';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

// ==========================================
// CONFIGURATION
// ==========================================

// Available models — change DEFAULT_MODEL or pass "model" in request body
// | Model              | Input $/1M | Output $/1M | Notes                    |
// |--------------------|-----------|-------------|--------------------------|
// | gpt-4o-mini        |    0.15   |    0.60     | Cheap, good for tools    |
// | gpt-4o             |    2.50   |   10.00     | Most capable             |
// | gpt-4.1-nano       |    0.10   |    0.40     | Cheapest, fast           |
// | gpt-4.1-mini       |    0.40   |    1.60     | Balanced                 |
const DEFAULT_MODEL = 'gpt-4.1-mini';

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini':   { input: 0.15, output: 0.60 },
  'gpt-4o':        { input: 2.50, output: 10.00 },
  'gpt-4.1-nano':  { input: 0.10, output: 0.40 },
  'gpt-4.1-mini':  { input: 0.40, output: 1.60 },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: any;
  tokens: number;
}

/**
 * Inject a context reminder only when the user is explicitly telling the AI to retry a failed task.
 * (e.g. "he's there check again", "try again", "it exists")
 * The model handles all other follow-up context naturally from conversation history.
 */
function buildContextReminder(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentMessage: string
): Array<{ role: 'system'; content: string }> {
  if (history.length < 2) return [];

  const isRetryRequest = /check again|try again|exists?|it'?s there|he'?s there|she'?s there|look again|search again|find (him|her|it|them)|bro .* exist/i.test(currentMessage);
  if (!isRetryRequest) return [];

  return [{
    role: 'system' as const,
    content: `[CONTEXT REMINDER: The user is telling you to retry or that the entity exists. Look at the ORIGINAL task from earlier in the conversation (e.g., "create invoice", "create bill"). Do NOT just look up the entity — COMPLETE THE ORIGINAL TASK. For example, if the user originally asked "create invoice for X for $100" and you couldn't find customer X, and now the user says "X exists check again", you must call create_invoice with customerName=X and amount=100. Resume and finish the pending task.]`,
  }];
}

// ==========================================
// INPUT SANITIZATION
// ==========================================

/** Fix common email typos like ",com" → ".com" */
function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return email;
  let fixed = email.trim().toLowerCase();
  // Fix comma-for-dot typos in TLD: ,com ,org ,net ,io ,co
  fixed = fixed.replace(/,(com|org|net|io|co|edu|gov|info)$/i, '.$1');
  // Fix common domain typos
  fixed = fixed.replace(/@gmial\./i, '@gmail.');
  fixed = fixed.replace(/@gmai\./i, '@gmail.');
  fixed = fixed.replace(/@gamil\./i, '@gmail.');
  fixed = fixed.replace(/@gnail\./i, '@gmail.');
  fixed = fixed.replace(/@yaho\./i, '@yahoo.');
  fixed = fixed.replace(/@yahooo\./i, '@yahoo.');
  fixed = fixed.replace(/@hotmal\./i, '@hotmail.');
  fixed = fixed.replace(/@outloo\./i, '@outlook.');
  // Fix .con → .com, .cmo → .com
  fixed = fixed.replace(/\.con$/i, '.com');
  fixed = fixed.replace(/\.cmo$/i, '.com');
  fixed = fixed.replace(/\.ocm$/i, '.com');
  return fixed;
}

/** Sanitize all email-like fields in tool call arguments */
function sanitizeToolArgs(args: Record<string, any>): Record<string, any> {
  const emailFields = ['email', 'customerEmail', 'vendorEmail'];
  const sanitized = { ...args };
  for (const field of emailFields) {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeEmail(sanitized[field]);
    }
  }
  // Also sanitize nested updates object
  if (sanitized.updates && typeof sanitized.updates === 'object') {
    for (const field of emailFields) {
      if (sanitized.updates[field] && typeof sanitized.updates[field] === 'string') {
        sanitized.updates[field] = sanitizeEmail(sanitized.updates[field]);
      }
    }
  }
  return sanitized;
}

function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL];
  return (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
}

// ==========================================
// REQUEST VALIDATION
// ==========================================

const MAX_BODY_BYTES = 64 * 1024; // 64 KB — prevents huge payload attacks
const MAX_MESSAGE_LENGTH = 8_000;  // characters
const MAX_ID_LENGTH = 128;

/** Safe alphanumeric + dash/underscore/dot ID validator (Firebase IDs, UUIDs, etc.) */
const SAFE_ID_RE = /^[a-zA-Z0-9_\-\.]+$/;

function validateId(value: unknown, field: string): string | null {
  if (typeof value !== 'string' || value.length === 0) return `${field} is required`;
  if (value.length > MAX_ID_LENGTH) return `${field} is too long`;
  if (!SAFE_ID_RE.test(value)) return `${field} contains invalid characters`;
  return null;
}

/** Extract real client IP from common proxy headers */
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// ==========================================
// RATE LIMIT CONFIGS
// ==========================================

// Per-IP: 30 requests / minute  (covers unauthenticated hammering)
const IP_LIMIT = { max: 30, windowMs: 60_000 };
// Per-user: 20 requests / minute  (fine-grained control per account)
const USER_LIMIT = { max: 20, windowMs: 60_000 };
// Follow-up tool rounds don't count against user quota (they're triggered by the app, not the human)
const FOLLOWUP_LIMIT = { max: 60, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  try {
    // ── Body size guard (read raw before JSON parse) ──────────────────────
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 },
      );
    }

    // Parse JSON — but don't trust the content-length alone; clone + measure
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { message, companyId, userId, chatId, model: requestModel, toolResults, originalAssistant } = body;
    const isFollowUp = !!(toolResults && originalAssistant);

    // ── IP-level rate limit (always enforced, before auth) ────────────────
    const ip = getClientIP(request);
    const ipResult = rateLimit(`chat:ip:${ip}`, IP_LIMIT.max, IP_LIMIT.windowMs);
    if (!ipResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: rateLimitHeaders(ipResult),
        },
      );
    }

    // ── Field validation ──────────────────────────────────────────────────
    if (!isFollowUp) {
      const idErr = validateId(companyId, 'companyId') || validateId(userId, 'userId');
      if (idErr) return NextResponse.json({ error: idErr }, { status: 400 });
      if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'message is required' }, { status: 400 });
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
      }
    } else {
      const idErr =
        validateId(companyId, 'companyId') ||
        validateId(userId, 'userId') ||
        validateId(chatId, 'chatId');
      if (idErr) return NextResponse.json({ error: idErr }, { status: 400 });
    }

    // ── Per-user rate limit (authenticated traffic) ───────────────────────
    const userLimitCfg = isFollowUp ? FOLLOWUP_LIMIT : USER_LIMIT;
    const userResult = rateLimit(`chat:user:${userId}`, userLimitCfg.max, userLimitCfg.windowMs);
    if (!userResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before sending another message.' },
        {
          status: 429,
          headers: rateLimitHeaders(userResult),
        },
      );
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: 'OpenAI not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    // Security check (skip for follow-up rounds)
    if (!isFollowUp && isBlockedRequest(message)) {
      return NextResponse.json({
        message: "I can only help with accounting-related tasks like managing customers, invoices, expenses, and reports. How can I assist you with your business finances?",
        toolCalls: [],
      });
    }

    // ==========================================
    // FAST PATH: Instant response for simple greetings (skip OpenAI entirely)
    // ==========================================
    if (!isFollowUp && message) {
      const trimmed = message.trim().toLowerCase().replace(/[!?.,']+$/g, '');
      // Only pure greetings — never intercept words that could be confirmations (yes, no, ok, sure)
      const GREETING_RESPONSES: Record<string, string[]> = {
        'hi': ['Hi there! How can I help you with your accounting today?', 'Hello! What can I assist you with?', 'Hi! Ready to help with your finances.'],
        'hello': ['Hello! How can I assist you today?', 'Hi there! What would you like to do?', 'Hello! Ready to help with your accounting needs.'],
        'hey': ['Hey! What can I help you with today?', 'Hey there! How can I assist you?'],
        'good morning': ['Good morning! How can I help you today?', 'Morning! What can I assist you with?'],
        'good evening': ['Good evening! How can I assist you?', 'Evening! What would you like to help with?'],
        'good night': ['Good night! Let me know if you need anything before you go.'],
        'thanks': ['You\'re welcome! Let me know if you need anything else.', 'Happy to help! Anything else?'],
        'thank you': ['You\'re welcome! Is there anything else I can help with?', 'Glad I could help! Let me know if you need more.'],
        'bye': ['Goodbye! Feel free to come back anytime you need help.', 'See you later! Your data is all saved.'],
      };
      const responses = GREETING_RESPONSES[trimmed];
      if (responses) {
        const reply = responses[Math.floor(Math.random() * responses.length)];
        return NextResponse.json({
          message: reply,
          toolCalls: [],
          rawToolCalls: [],
          rawContent: reply,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, model: 'instant', sessionRemaining: undefined, weeklyRemaining: undefined },
        });
      }
    }

    // ==========================================
    // SUBSCRIPTION USAGE CHECK (Session + Weekly)
    // ==========================================

    let usageBudget: UsageBudgetResult | null = null;
    try {
      usageBudget = await checkUsageBudgetAdmin(userId);
      if (!usageBudget.canSend) {
        trackServer(userId, 'usage_limit_hit', { blocked_by: usageBudget.blockedBy, plan: usageBudget.planId });
        const timeLeft = formatDuration(Math.max(0, usageBudget.session.resetsAt - Date.now()));
        const msg = usageBudget.blockedBy === 'trial_expired'
          ? 'Your free trial has ended. Subscribe to continue using Flowbooks.'
          : usageBudget.blockedBy === 'session'
          ? `You've reached your session usage limit. Resets in ${timeLeft}.`
          : `You've reached your weekly usage limit. Resets Monday.`;
        return NextResponse.json({
          error: 'message_limit_reached',
          blockedBy: usageBudget.blockedBy,
          message: msg,
          upgradeUrl: '/settings/billing',
          session: usageBudget.session,
          weekly: usageBudget.weekly,
        }, { status: 403 });
      }
    } catch (err) {
      // Graceful degradation — if subscription check fails, allow with free limits
      console.warn('[Flow AI] Subscription check failed, defaulting to free tier:', err);
    }

    // ==========================================
    // AI MEMORY SYSTEM
    // ==========================================

    // Resolve model — use requested model if valid, otherwise default
    // Also enforce plan's allowed models
    let resolvedModel = (requestModel && MODEL_PRICING[requestModel]) ? requestModel : DEFAULT_MODEL;
    if (usageBudget?.allowedModels && !usageBudget.allowedModels.includes(resolvedModel)) {
      // Fall back to the best model allowed on the plan
      resolvedModel = usageBudget.allowedModels[usageBudget.allowedModels.length - 1] || DEFAULT_MODEL;
    }
    const MODEL = resolvedModel;
    console.log(`[Flow AI] Model: ${MODEL}${isFollowUp ? ' (follow-up)' : ''}`);
    let memory = await getConversationMemory(companyId, userId, chatId);
    let conversationId: string;

    if (isFollowUp) {
      // Follow-up round: just load memory, don't add a user message
      if (!memory) {
        return NextResponse.json(
          { error: 'Conversation not found for follow-up' },
          { status: 400 }
        );
      }
      conversationId = memory.id;
    } else if (!memory) {
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: Timestamp.now(),
        tokens: estimateTokens(message),
      };

      try {
        conversationId = await createConversationMemory(companyId, userId, userMessage, chatId);
        memory = {
          id: conversationId,
          companyId,
          userId,
          messages: [userMessage],
          totalTokens: userMessage.tokens,
          lastActivity: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
      } catch (createError: any) {
        console.error('[Flow AI] Failed to create conversation:', createError);
        throw new Error(`Failed to create conversation memory: ${createError.message}`);
      }
    } else {
      conversationId = memory.id;

      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: Timestamp.now(),
        tokens: estimateTokens(message),
      };
      await addMessageToMemory(companyId, conversationId, userMessage);

      // CRITICAL: Update in-memory object so buildContextFromMemory includes current message
      memory.messages = [...(memory.messages || []), userMessage];
      memory.totalTokens = (memory.totalTokens || 0) + userMessage.tokens;

      if (needsCompaction(memory)) {
        console.log('[Flow AI] Compacting conversation memory...');
        memory = await compactConversation(companyId, conversationId);
        console.log(`[Flow AI] Compaction complete. Tokens: ${memory.totalTokens}`);

        // Extract and save business context from the new summary
        if (memory.summary) {
          extractBusinessContext(memory.summary).then(ctx => {
            if (ctx) {
              updateUserBusinessContext(companyId, userId, ctx).catch(err =>
                console.warn('[Flow AI] Failed to save business context:', err)
              );
            }
          }).catch(err => console.warn('[Flow AI] Business context extraction failed:', err));
        }
      }
    }

    // Build optimized context from memory
    const recentHistory = buildContextFromMemory(memory);

    // Build context reminder (skip for follow-up)
    const contextMessages = isFollowUp ? [] : buildContextReminder(recentHistory, message);

    // Load business snapshot (L1→L2→build) and persistent user context in parallel
    let systemPrompt = FLOW_AI_SYSTEM_PROMPT + '\n\n' + FIRESTORE_SCHEMA;
    const [snapshot, businessCtx] = await Promise.allSettled([
      getCompanySnapshot(companyId),
      getUserBusinessContext(companyId, userId),
    ]);

    if (snapshot.status === 'fulfilled') {
      systemPrompt += buildSnapshotPrompt(snapshot.value);
    }
    if (businessCtx.status === 'fulfilled' && businessCtx.value) {
      const ctxSnippet = buildBusinessContextPrompt(businessCtx.value);
      if (ctxSnippet) systemPrompt += ctxSnippet;
    }

    // ==========================================
    // OPENAI API CALL
    // ==========================================

    // Build messages — for follow-up, include assistant tool_calls + tool results
    const openAIMessages = isFollowUp
      ? [
          { role: 'system' as const, content: systemPrompt },
          ...recentHistory,
          {
            role: 'assistant' as const,
            content: originalAssistant.content || null,
            tool_calls: originalAssistant.toolCalls,
          },
          ...toolResults.map((tr: any) => ({
            role: 'tool' as const,
            tool_call_id: tr.toolCallId,
            content: tr.result,
          })),
        ]
      : [
          { role: 'system' as const, content: systemPrompt },
          ...recentHistory,
          ...contextMessages,
        ];

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: openAIMessages as any,
      tools: FLOW_AI_TOOLS as any,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 4096,
    });

    const choice = response.choices[0];

    // Extract token usage
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;

    let responseText = '';
    let toolCalls: any[] = [];

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== 'function') continue;
        const functionName = toolCall.function.name;
        if (!validateToolCall(functionName)) {
          console.warn(`Blocked invalid tool call: ${functionName}`);
          continue;
        }
        try {
          const functionArgs = sanitizeToolArgs(JSON.parse(toolCall.function.arguments));
          toolCalls.push({
            id: toolCall.id,
            name: functionName,
            args: functionArgs,
          });
        } catch (parseError) {
          console.error(`Failed to parse arguments for ${functionName}:`, parseError);
        }
      }
      if (choice.message.content) {
        responseText = choice.message.content;
      }
    } else if (choice.message.content) {
      responseText = choice.message.content;
    } else {
      responseText = "I'm here to help with your accounting needs. What would you like to do?";
    }

    // ==========================================
    // PERSIST ASSISTANT RESPONSE TO MEMORY
    // ==========================================

    // Store a descriptive memory — use natural language so the AI doesn't copy technical syntax
    let memoryContent = responseText;
    if (toolCalls.length > 0 && !memoryContent) {
      memoryContent = 'Proceeding with the requested action.';
    }

    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: memoryContent,
      timestamp: Timestamp.now(),
      tokens: completionTokens || estimateTokens(memoryContent),
    };
    await addMessageToMemory(companyId, conversationId, assistantMessage);

    const cost = calculateCost(promptTokens, completionTokens, MODEL);

    // Invalidate snapshot cache if any write tool was called
    const READ_ONLY_TOOLS = new Set([
      'list_customers', 'get_customer', 'search_customers',
      'list_vendors', 'get_vendor', 'search_vendors',
      'list_employees', 'get_employee',
      'list_invoices', 'get_invoice', 'search_invoices',
      'list_bills', 'get_bill',
      'list_transactions', 'get_transaction', 'search_transactions',
      'list_accounts', 'get_account_balance',
      'list_journal_entries', 'get_journal_entry',
      'list_quotes', 'get_quote',
      'list_purchase_orders', 'get_purchase_order',
      'list_credit_notes', 'get_credit_note',
      'list_recurring_transactions',
      'list_bank_accounts',
      'list_salary_slips',
      'generate_report', 'get_dashboard_summary',
      'query_records',
    ]);
    const hasWriteCall = toolCalls.some(tc => !READ_ONLY_TOOLS.has(tc.name));
    if (hasWriteCall) invalidateCompanySnapshot(companyId);

    // Track usage for subscription billing (session + weekly, token-weighted)
    let trackResult: { sessionRemaining: number; weeklyRemaining: number; tokensUsed: number } | undefined;
    try {
      trackResult = await trackUsageAdmin(userId, totalTokens, MODEL, cost);
    } catch (err) {
      console.warn('[Flow AI] Failed to track usage:', err);
    }

    console.log(`[Flow AI] ${MODEL} — ${promptTokens}+${completionTokens}=${totalTokens} tokens, $${cost.toFixed(6)}`);

    // Track analytics
    trackServer(userId, 'message_sent', { model: MODEL, company_id: companyId, conversation_id: conversationId });
    trackServer(userId, 'ai_response_received', {
      model: MODEL,
      tokens: totalTokens,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      cost,
      tool_calls_count: toolCalls.length,
    });

    return NextResponse.json({
      message: responseText,
      toolCalls,
      // Include raw OpenAI tool_calls for follow-up rounds
      rawToolCalls: choice.message.tool_calls || [],
      rawContent: choice.message.content || null,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        model: MODEL,
        sessionRemaining: trackResult?.sessionRemaining,
        weeklyRemaining: trackResult?.weeklyRemaining,
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);

    let errorMessage = 'Failed to process request';

    if (error?.message?.includes('API key') || error?.message?.includes('Incorrect API key')) {
      errorMessage = 'Invalid API key. Please check your AI configuration.';
    } else if (error?.message?.includes('rate limit') || error?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (error?.message?.includes('insufficient_quota') || error?.message?.includes('billing')) {
      errorMessage = 'API quota exceeded. Please check your billing/credits.';
    } else if (error?.message?.includes('tool_use_failed') || error?.error?.code === 'tool_use_failed' || error?.status === 400) {
      console.warn('Tool use failed, returning conversational fallback');
      return NextResponse.json({
        message: "I'd be happy to help! Could you please provide the details more clearly? For example:\n- To add a customer: \"Add customer John Smith, email john@example.com\"\n- To create an invoice: \"Create invoice for John Smith for $500 web design\"",
        toolCalls: [],
      });
    } else if (error?.message?.includes('model')) {
      errorMessage = 'AI model error. Please try again.';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
