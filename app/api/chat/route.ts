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

function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL];
  return (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
}

export async function POST(request: NextRequest) {
  try {
    const { message, companyId, userId, model: requestModel } = await request.json();

    if (!message || !companyId || !userId) {
      return NextResponse.json(
        { error: 'Message, companyId, and userId are required' },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: 'OpenAI not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    // Security check
    if (isBlockedRequest(message)) {
      return NextResponse.json({
        message: "I can only help with accounting-related tasks like managing customers, invoices, expenses, and reports. How can I assist you with your business finances?",
        toolCalls: [],
      });
    }

    // ==========================================
    // AI MEMORY SYSTEM
    // ==========================================

    // Resolve model — use requested model if valid, otherwise default
    const MODEL = (requestModel && MODEL_PRICING[requestModel]) ? requestModel : DEFAULT_MODEL;
    console.log(`[Flow AI] Model: ${MODEL}`);
    let memory = await getConversationMemory(companyId, userId);
    let conversationId: string;

    if (!memory) {
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: Timestamp.now(),
        tokens: estimateTokens(message),
      };

      try {
        conversationId = await createConversationMemory(companyId, userId, userMessage);
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
      }
    }

    // Build optimized context from memory
    const recentHistory = buildContextFromMemory(memory);

    // ==========================================
    // OPENAI API CALL
    // ==========================================

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: FLOW_AI_SYSTEM_PROMPT },
        ...recentHistory,
      ],
      tools: FLOW_AI_TOOLS as any,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 2048,
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
          const functionArgs = JSON.parse(toolCall.function.arguments);
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

    // When tool calls are present, store a descriptive memory so the AI remembers what it did
    let memoryContent = responseText;
    if (toolCalls.length > 0) {
      const toolSummaries = toolCalls.map(tc => {
        const argsStr = Object.entries(tc.args || {})
          .filter(([k]) => !['companyId', 'userId'].includes(k))
          .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join(', ');
        return `[Action: ${tc.name}(${argsStr})]`;
      }).join(' ');
      memoryContent = memoryContent
        ? `${memoryContent}\n${toolSummaries}`
        : toolSummaries;
    }

    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: memoryContent,
      timestamp: Timestamp.now(),
      tokens: completionTokens || estimateTokens(memoryContent),
    };
    await addMessageToMemory(companyId, conversationId, assistantMessage);

    const cost = calculateCost(promptTokens, completionTokens, MODEL);

    console.log(`[Flow AI] ${MODEL} — ${promptTokens}+${completionTokens}=${totalTokens} tokens, $${cost.toFixed(6)}`);

    return NextResponse.json({
      message: responseText,
      toolCalls,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        model: MODEL,
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
