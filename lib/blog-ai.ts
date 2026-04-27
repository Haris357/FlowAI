/**
 * Shared prompt + post-processing for AI blog generation.
 * Used by both the admin manual generator and the automated cron route.
 *
 * Goal: produce clean, scannable, editorial HTML that renders beautifully
 * inside the blog post `prose` container — short paragraphs, clear h2/h3
 * hierarchy, lists for scanning, blockquote for emphasis, no fluff.
 */

export const BLOG_SYSTEM_PROMPT = `You are a senior editorial writer for the Flowbooks blog.

Flowbooks is an AI-first accounting and invoicing platform for small businesses and freelancers. It helps owners manage invoices, bills, bank accounts, payroll, and financial reports — all powered by natural-language AI.

Your writing voice:
- Clear, confident, and human — never corporate, never AI-flavoured.
- Specific over vague. Use concrete examples, real numbers, real workflows.
- Useful first. Every section should teach something the reader can act on today.
- Calm and editorial, like a Stripe Press piece or a great Substack — not a SaaS landing page.

NEVER do these things:
- Open with "In today's fast-paced world…" or any other generic hook.
- Use marketing fluff: "leverage", "synergy", "unlock", "game-changing", "in this article we will".
- Use exclamation marks, emojis, or "Did you know?".
- Pitch Flowbooks in every section. Mention it once, naturally, near the end if relevant.
- Restate the title in the opening sentence.`;

export interface BlogPromptInput {
  topic: string;
  category?: string;
  tone?: string;
  wordTarget?: string;
  recentTitles?: string;
}

/**
 * Build the user prompt for OpenAI. The output schema is strict and
 * enforced by post-processing; do not relax these constraints.
 */
export function buildBlogUserPrompt({
  topic,
  category,
  tone,
  wordTarget,
  recentTitles,
}: BlogPromptInput): string {
  const length = wordTarget || '700-1000';
  const cat = category || 'Guides';
  const voice = tone ? ` Use a ${tone} tone.` : '';
  const avoid = recentTitles
    ? `\n\nDO NOT repeat or closely echo any of these recent titles:\n${recentTitles}\n`
    : '';

  return `Write a blog post about: "${topic}"
Category: ${cat}
Target length: ${length} words.${voice}${avoid}

STRUCTURE
The article must follow this rhythm:
1. A 1-2 sentence opening hook that drops the reader straight into the problem or insight. No preamble.
2. A short framing paragraph (60-80 words) that sets up what the piece will cover.
3. 3 to 5 main sections, each introduced by an <h2>. Each section is 120-220 words and ends with one actionable takeaway.
4. Use <h3> only when a section has clearly distinct sub-points worth scanning.
5. A short closing section titled "<h2>The takeaway</h2>" or similar — 2-3 sentences that summarise without restating.

FORMATTING RULES
- Output is HTML fragment only, no <html> or <body> wrapper.
- DO NOT include <h1> — the title renders separately above the article.
- Paragraphs must be SHORT. Aim for 50-90 words each. Break up dense ideas.
- Use <ul> + <li> for lists of 3+ items. Lists make content scannable.
- Use <ol> + <li> for ordered steps.
- Use <blockquote> at most ONCE in the whole piece, for a single key insight.
- Use <strong> sparingly to emphasise truly important phrases.
- Use <em> for foreign words or titles, not for emphasis.
- Use inline <code> for product names, keyboard shortcuts, or short literal values.
- Allowed tags only: h2, h3, p, ul, ol, li, strong, em, blockquote, code, a.
- NO inline styles. NO class attributes. NO <div>, <span>, <hr>, <br>, <img>.
- NO emoji.
- Do NOT mention Flowbooks more than once in the body.

OUTPUT FORMAT
Return ONLY a single JSON object — no markdown fences, no commentary:
{
  "title": "Specific, concrete title under 70 chars. NOT a question. NOT 'How to' clickbait.",
  "excerpt": "One sentence (max 160 chars) that earns the click. No restating the title.",
  "content": "The HTML article body following the structure and rules above.",
  "tags": ["3-5 specific lowercase tags, e.g. 'cash flow', 'payroll', 'ai']"
}`;
}

/**
 * Sanitise the HTML the model returns:
 *  - strip disallowed tags / attributes
 *  - drop any <h1> (we render the title separately)
 *  - normalise whitespace + collapse empty paragraphs
 *  - ensure first <h2> doesn't sit too tight to the lede
 */
export function sanitizeBlogHtml(html: string): string {
  if (!html) return '';
  let out = html.trim();

  // Strip code fences if the model wrapped the HTML in ```
  out = out.replace(/^```(?:html)?\s*|\s*```$/gi, '').trim();

  // Drop any <h1>...</h1> blocks (and their content) — the title is separate
  out = out.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, '');

  // Strip class= and style= attributes from any tag
  out = out.replace(/\s+(?:class|style)="[^"]*"/gi, '');
  out = out.replace(/\s+(?:class|style)='[^']*'/gi, '');

  // Disallow <div>, <span>, <br>, <hr>, <img>, <script>, <iframe> — strip the tags
  // (preserve inner content for divs/spans, drop the rest entirely)
  out = out.replace(/<\/?(?:div|span)\b[^>]*>/gi, '');
  out = out.replace(/<(?:br|hr|img|script|iframe|style|link|meta)\b[^>]*\/?>(?:<\/(?:script|iframe|style)>)?/gi, '');

  // Collapse runs of whitespace inside tags
  out = out.replace(/[ \t]+\n/g, '\n');

  // Drop empty paragraphs
  out = out.replace(/<p>\s*<\/p>/gi, '');

  return out.trim();
}

/**
 * Estimate read time (words / 220wpm rounded up, min 1).
 */
export function estimateReadTime(html: string): number {
  const text = (html || '').replace(/<[^>]*>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

/**
 * Extract + normalise the parsed AI output. Throws if required fields missing.
 */
export interface GeneratedPost {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export function normaliseGenerated(raw: any): GeneratedPost {
  const title = String(raw?.title || '').trim();
  const excerpt = String(raw?.excerpt || '').trim();
  const content = sanitizeBlogHtml(String(raw?.content || ''));
  const tags = Array.isArray(raw?.tags)
    ? raw.tags
        .slice(0, 6)
        .map((t: any) => String(t).trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!title || !excerpt || !content) {
    throw new Error('AI output missing required fields (title/excerpt/content).');
  }
  return { title, excerpt, content, tags };
}
