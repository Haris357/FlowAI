import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { initAdmin } from '@/lib/firebase-admin';
import { verifyAdminRequest } from '@/lib/admin-server';

initAdmin();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { topic, type } = await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const typeLabel = type || 'info';

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional communication writer for Flowbooks, an AI-first accounting and invoicing platform for small businesses. Generate announcement content that is clear, concise, and appropriate for the given type. Flowbooks features include AI chat assistant, invoice creation, bill tracking, bank reconciliation, payroll, financial reports, and multi-company support.`,
        },
        {
          role: 'user',
          content: `Generate a ${typeLabel} announcement about: "${topic.trim()}"

Output JSON only:
{"title": "Short title (under 60 chars)", "message": "2-4 sentence announcement message, engaging and professional"}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/```json\s*|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'AI generated invalid content. Please try again.', raw }, { status: 500 });
    }

    return NextResponse.json({
      generated: {
        title: parsed.title || 'Announcement',
        message: parsed.message || '',
      },
    });
  } catch (error) {
    console.error('Error generating announcement:', error);
    return NextResponse.json({ error: 'Failed to generate announcement' }, { status: 500 });
  }
}
