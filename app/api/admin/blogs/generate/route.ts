import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyAdminRequest } from '@/lib/admin-server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { topic, category, tone, length } = await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const wordTarget = length === 'short' ? '400-600' : length === 'long' ? '1200-1600' : '700-1000';

    const systemPrompt = `You are a professional blog writer for Flowbooks, an AI-first accounting and invoicing platform for small businesses.

Flowbooks helps small businesses manage invoices, bills, bank accounts, payroll, and financial reports — all powered by AI.

Write engaging, useful blog content that provides value to small business owners. Use a ${tone || 'professional yet approachable'} tone. Content should be educational and actionable.`;

    const userPrompt = `Write a blog post about: "${topic}"
Category: ${category || 'Guides'}
Target length: ${wordTarget} words

Output as JSON with this exact structure:
{
  "title": "Catchy blog title (under 70 chars)",
  "excerpt": "Brief 1-2 sentence summary for the blog listing page",
  "content": "Full HTML content with proper <h2>, <h3>, <p>, <ul>/<li>, <blockquote> tags. Use semantic HTML. Do NOT include <h1> — the title is rendered separately.",
  "tags": ["tag1", "tag2", "tag3"]
}

Only output valid JSON, no markdown code blocks.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';

    let parsed;
    try {
      const cleaned = raw.replace(/```json\s*|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'AI generated invalid content. Please try again.', raw }, { status: 500 });
    }

    return NextResponse.json({
      generated: {
        title: parsed.title || '',
        excerpt: parsed.excerpt || '',
        content: parsed.content || '',
        tags: parsed.tags || [],
      },
    });
  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json({ error: 'Blog generation failed' }, { status: 500 });
  }
}
