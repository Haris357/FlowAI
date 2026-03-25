import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function POST(req: NextRequest) {
  try {
    const { messages, existingSummary } = await req.json();

    const messagesText = (messages as Array<{ role: string; content: string }>)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const summaryPrompt = existingSummary
      ? `Previous summary:\n${existingSummary}\n\nNew messages:\n${messagesText}\n\nCombine into a comprehensive updated summary. You MUST preserve ALL details from the previous summary and add new information.`
      : `Create a detailed summary of this conversation.\n\nConversation:\n${messagesText}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `Create a detailed conversation summary for an AI accounting assistant. You MUST capture ALL of the following:
1. CUSTOMER/VENDOR NAMES: Every name mentioned and their relationship
2. PRICING & RATES: All pricing structures, per-unit rates, discount rules
3. SERVICES & ITEMS: What services/products were discussed, with quantities and amounts
4. ACTIONS TAKEN: What was created, updated, deleted (with IDs if available)
5. PENDING TASKS: Any incomplete requests or tasks
6. USER PREFERENCES: Patterns in how the user works, preferred payment methods, recurring clients
7. BUSINESS RULES: Any business rules the user stated
Be thorough — if you omit a detail, the AI will permanently forget it.`,
        },
        { role: 'user', content: summaryPrompt },
      ],
    });

    const summary = response.choices[0]?.message?.content;
    if (!summary) throw new Error('No summary generated');

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('[Memory] Summarize API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate summary' }, { status: 500 });
  }
}
