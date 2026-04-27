import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate } from '@/lib/email-templates';
import { canSendEmail } from '@/lib/email-preferences';
import {
  BLOG_SYSTEM_PROMPT,
  buildBlogUserPrompt,
  normaliseGenerated,
  estimateReadTime as sharedEstimateReadTime,
} from '@/lib/blog-ai';

export const dynamic = 'force-dynamic';

initAdmin();
const db = getFirestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

/**
 * Automated blog-post cron job.
 * Runs twice a week (Tue + Fri at 15:00 UTC / 10:00 AM ET) via GitHub Actions.
 *
 *   1. Generate a blog post via OpenAI (varied categories for rotation)
 *   2. Save it to Firestore `blogPosts` (published: true, automated: true)
 *   3. Email opted-in users (notifyBlogs + notifyEmail = true)
 *   4. Record a summary in `newsletters`-style way on `blogPosts` +
 *      log activity for the admin panel
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` — same header your newsletter
 * cron uses. The GitHub Actions workflow passes both URL and secret in.
 */

const CATEGORIES = ['News', 'Updates', 'Guides', 'Tips', 'Engineering'];

const TOPIC_PROMPTS: Record<string, string[]> = {
  News: [
    'a recent trend in small-business accounting',
    'how AI is reshaping bookkeeping for solo operators',
    'a common tax-season mistake and how to avoid it',
  ],
  Updates: [
    'best practices when picking an accounting platform',
    'an under-used Flowbooks workflow that saves hours per week',
    'how to stay organized when juggling multiple companies',
  ],
  Guides: [
    'a step-by-step guide to managing recurring invoices',
    'how to reconcile a bank account without losing your mind',
    'setting up a clean chart of accounts from scratch',
    'getting payroll right as a small team',
  ],
  Tips: [
    'five invoicing mistakes small businesses keep making',
    'how to politely chase unpaid invoices and actually get paid',
    'cashflow forecasting for freelancers in under 20 minutes a week',
    'writing clear line-items that reduce client disputes',
  ],
  Engineering: [
    'why we chose Firestore + Next.js for Flowbooks',
    'how we designed our AI chat assistant for accounting accuracy',
    'how Flowbooks keeps user data safe behind the scenes',
  ],
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// Read-time estimator delegated to the shared lib so admin + cron stay in sync.
const estimateReadTime = sharedEstimateReadTime;

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || `post-${Date.now()}`;
  let n = 0;
  // Try base, base-2, base-3, … up to 10 attempts.
  while (n < 10) {
    const candidate = n === 0 ? slug : `${slug}-${n + 1}`;
    const snap = await db.collection('blogPosts').where('slug', '==', candidate).limit(1).get();
    if (snap.empty) return candidate;
    n++;
  }
  return `${slug}-${Date.now()}`;
}

export async function GET(req: Request) {
  try {
    // Auth
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // 1. Pick a category + topic for variety
    const category = randomFrom(CATEGORIES);
    const topicHint = randomFrom(TOPIC_PROMPTS[category] || ['a useful small-business tip']);

    // Fetch recent post titles so AI doesn't repeat itself
    let recentTitles = '';
    try {
      const recentSnap = await db.collection('blogPosts')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      recentTitles = recentSnap.docs
        .map(d => `- ${d.data().title}`)
        .join('\n');
    } catch { /* ignore */ }

    // 2. Generate post via OpenAI using the shared editorial prompt
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: BLOG_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildBlogUserPrompt({
            topic: topicHint,
            category,
            wordTarget: '700-1000',
            recentTitles,
          }),
        },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/```json\s*|```/g, '').trim());
    } catch {
      console.error('[Cron Blog] AI generated invalid JSON:', raw);
      return NextResponse.json({ error: 'AI generated invalid content' }, { status: 500 });
    }

    let post;
    try {
      post = normaliseGenerated(parsed);
    } catch (err: any) {
      console.error('[Cron Blog] AI output invalid:', err?.message);
      return NextResponse.json({ error: err?.message || 'AI output invalid' }, { status: 500 });
    }
    const { title, excerpt, content, tags } = post;

    // 3. Save to Firestore
    const slug = await uniqueSlug(slugify(title));
    const readTime = estimateReadTime(content);
    const now = FieldValue.serverTimestamp();

    const postRef = await db.collection('blogPosts').add({
      title,
      slug,
      excerpt,
      content,
      coverImage: '',
      author: {
        name: 'Flowbooks',
        email: 'hello@flowbooksai.com',
        avatar: '',
      },
      category,
      tags,
      published: true,
      featured: false,
      views: 0,
      readTime,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      automated: true,
    });

    // 4. Fetch users + send email
    const usersSnap = await db.collection('users').limit(5000).get();
    const users = usersSnap.docs
      .map(d => ({
        id: d.id,
        email: d.data().email as string,
        name: (d.data().name || d.data().displayName || '') as string,
      }))
      .filter(u => u.email);

    const templateData = {
      blogTitle: title,
      blogExcerpt: excerpt,
      blogSlug: slug,
      blogCategory: category,
      blogReadTime: readTime,
      blogTags: tags,
    };

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const batchSize = 10;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (user) => {
          const allowed = await canSendEmail(user.id, 'blog');
          if (!allowed) {
            skipped++;
            return 'skipped';
          }
          const { subject, html } = getEmailTemplate('new_blog', {
            ...templateData,
            userName: user.name || user.email.split('@')[0],
          });
          await sendEmail(user.email, subject, html);
          return 'sent';
        })
      );
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value === 'sent') sent++;
        else if (r.status === 'rejected') failed++;
      });
    }

    // 5. Update the post with delivery stats
    await postRef.update({
      autoEmailStats: {
        sent, failed, skipped, total: users.length,
        sentAt: FieldValue.serverTimestamp(),
      },
    });

    // 6. Log to admin activity
    await db.collection('adminActivity').add({
      action: 'blog_auto_published',
      details: `Auto-published "${title}" (${category}) — emailed ${sent}/${users.length} users (${skipped} skipped, ${failed} failed)`,
      timestamp: FieldValue.serverTimestamp(),
      actor: 'system',
      meta: { postId: postRef.id, slug, category },
    });

    console.log(`[Cron Blog] Published "${title}" · emails sent ${sent}/${users.length} (skipped ${skipped}, failed ${failed})`);

    return NextResponse.json({
      message: 'Blog post auto-published and emailed',
      postId: postRef.id,
      title,
      slug,
      category,
      emails: { sent, failed, skipped, total: users.length },
    });
  } catch (error) {
    console.error('[Cron Blog] Error:', error);
    return NextResponse.json({ error: 'Blog cron failed' }, { status: 500 });
  }
}
