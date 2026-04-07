import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { description, businessType } = await req.json();

    if (!description?.trim()) {
      return NextResponse.json({ accounts: [] });
    }

    const systemPrompt = `You are an accounting expert. Based on the user's business description, suggest additional chart of accounts entries that would be useful for their specific business.

The user already has these standard base accounts:
- Cash, Bank Account, Accounts Receivable (assets)
- Accounts Payable, Credit Card, Tax Payable (liabilities)
- Owner's Equity, Retained Earnings (equity)
- Service Revenue, Other Income (revenue)
- Standard operating expenses (marketing, bank charges, software, supplies, etc.)

Only suggest ADDITIONAL accounts specific to this business that aren't in the base set. Focus on industry-specific revenue streams, expense categories, and asset/liability accounts.`;

    const userPrompt = `Business type: ${businessType || 'Other'}
Business description: "${description}"

Suggest 3-8 additional accounts. Output as JSON array:
[
  { "code": "4xxx or 5xxx", "name": "Account Name", "type": "asset|liability|equity|revenue|expense", "subType": "current_asset|fixed_asset|current_liability|long_term_liability|owner_equity|retained_earnings|operating_revenue|other_revenue|operating_expense|cost_of_goods_sold|payroll_expense|other_expense" }
]

Use codes 4100-4199 for custom revenue, 5200-5299 for COGS, 5300-5399 for custom expenses, 1300-1399 for custom assets, 2300-2399 for custom liabilities.
Only output valid JSON array, no markdown code blocks.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';

    let parsed;
    try {
      const cleaned = raw.replace(/```json\s*|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ accounts: [] });
    }

    // Validate and sanitize
    const accounts = (Array.isArray(parsed) ? parsed : []).map((a: any) => ({
      code: String(a.code || ''),
      name: String(a.name || ''),
      type: ['asset', 'liability', 'equity', 'revenue', 'expense'].includes(a.type) ? a.type : 'expense',
      subType: String(a.subType || 'operating_expense'),
    })).filter((a: any) => a.code && a.name);

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Account suggestion error:', error);
    return NextResponse.json({ accounts: [] });
  }
}
