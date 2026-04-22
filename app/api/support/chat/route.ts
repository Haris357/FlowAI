import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();
const auth = getAuth();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

async function verifyUser(req: Request) {
  const header = req.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    return await auth.verifyIdToken(header.slice(7));
  } catch {
    return null;
  }
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are Flowbooks Support AI, a friendly first-line support assistant for Flowbooks — an AI-first accounting & invoicing platform for small businesses.

Flowbooks helps users with:
- AI chat assistant for accounting questions
- Professional invoice & bill creation
- Bank account management & reconciliation
- Purchase orders, quotes, credit/debit notes
- Payroll & employee management
- Journal entries, chart of accounts, trial balance
- Financial reports (P&L, Balance Sheet, Cash Flow)
- Multiple companies & team members
- Recurring transactions
- Customer & vendor management

RULES:
1. Be warm, concise, and direct. 2–4 short paragraphs per reply.
2. For "how do I…" questions, give step-by-step instructions.
3. For bug reports / account issues / billing issues / urgent problems, acknowledge briefly and recommend creating a ticket so a human can help. Use the exact phrase "create a support ticket" so the UI can highlight it.
4. NEVER make up specific prices, limits, or legal/tax advice. If asked, say you are not sure and suggest creating a ticket.
5. If the user seems frustrated, acknowledge it, stay calm, and offer to escalate.
6. Keep answers focused on Flowbooks-related topics. Politely decline unrelated questions.

Keep replies under 200 words unless the user asks for detailed steps.`;

/**
 * POST /api/support/chat
 * Body: { messages: ChatMessage[] }
 *   messages: conversation history, last item is the user's latest turn.
 *
 * Returns: { reply: string }
 */
export async function POST(req: Request) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI assistant is temporarily unavailable. Please create a ticket instead.' },
      { status: 503 }
    );
  }

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];

  // Simple guardrails on message history
  if (messages.length === 0) {
    return NextResponse.json({ error: 'At least one message is required' }, { status: 400 });
  }
  if (messages.length > 30) {
    // Keep the last 30 to avoid runaway context
    messages.splice(0, messages.length - 30);
  }

  // Clamp each message length
  const cleaned = messages
    .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content.slice(0, 4000),
    }));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...cleaned,
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    const reply = response.choices[0]?.message?.content?.trim() ||
      'I am not sure I can help with that. Would you like to create a support ticket to talk to a human?';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[support/chat] OpenAI error:', error);
    return NextResponse.json(
      { error: 'The AI assistant hit a snag. Please try again or create a support ticket.' },
      { status: 500 }
    );
  }
}
