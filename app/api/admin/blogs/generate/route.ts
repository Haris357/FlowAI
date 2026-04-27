import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyAdminRequest } from '@/lib/admin-server';
import {
  BLOG_SYSTEM_PROMPT,
  buildBlogUserPrompt,
  normaliseGenerated,
} from '@/lib/blog-ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req, 'blogs:create');
    if (!authResult.authorized) return authResult.response;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { topic, category, tone, length } = await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const wordTarget =
      length === 'short' ? '400-600' : length === 'long' ? '1200-1600' : '700-1000';

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: BLOG_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildBlogUserPrompt({ topic, category, tone, wordTarget }),
        },
      ],
      temperature: 0.75,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';

    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/```json\s*|```/g, '').trim());
    } catch {
      return NextResponse.json(
        { error: 'AI generated invalid content. Please try again.', raw },
        { status: 500 },
      );
    }

    let post;
    try {
      post = normaliseGenerated(parsed);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Generation failed' }, { status: 500 });
    }

    return NextResponse.json({ generated: post });
  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json({ error: 'Blog generation failed' }, { status: 500 });
  }
}
