# Flowbooks Launch Checklist

A pre-launch checklist of everything outside the codebase that has to be done in
the relevant dashboards before you flip flowbooksai.com to public.

---

## 1. Vercel — Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for the
**Production** environment. Without them, the new SEO + verification work will
silently no-op.

| Var | Value |
| --- | --- |
| `APP_URL` | `https://flowbooksai.com` |
| `NEXT_PUBLIC_APP_URL` | `https://flowbooksai.com` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | (paste from Search Console) |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | (paste from Bing Webmaster) |
| `NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION` | (paste from Meta Business) |
| `NEXT_PUBLIC_YANDEX_SITE_VERIFICATION` | (only if you care about Yandex) |

After setting these, **redeploy** so the build picks them up.

---

## 2. Domain configuration (Vercel → Domains)

- [ ] `flowbooksai.com` → primary
- [ ] `www.flowbooksai.com` → 301 redirect to `flowbooksai.com` (or vice-versa, but pick one and stick to it — duplicate hostnames hurt SEO)
- [ ] `admin.flowbooksai.com` → assigned to same project
- [ ] `status.flowbooksai.com` → assigned to same project
- [ ] `support.flowbooksai.com` → assigned to same project
- [ ] `docs.flowbooksai.com` → assigned to same project

---

## 3. Email deliverability (DNS)

Without proper DNS, your transactional emails (signup, password reset, invoices)
go to spam. You're using Resend per `lib/email.ts`.

In **Resend dashboard → Domains → Add `flowbooksai.com`**, then add these to
your DNS provider:

- [ ] **SPF** — `TXT` record on root: `v=spf1 include:amazonses.com ~all` (Resend will give exact value)
- [ ] **DKIM** — 3× `CNAME` records Resend gives you (named `resend._domainkey`, etc.)
- [ ] **DMARC** — `TXT` record `_dmarc`: start with `v=DMARC1; p=none; rua=mailto:dmarc@flowbooksai.com`. After 1–2 weeks of monitoring, raise to `p=quarantine` then `p=reject`.
- [ ] Verify all records show **green/verified** in Resend before launch.
- [ ] Test by sending a real signup confirmation to a Gmail + Outlook + Yahoo address.

---

## 4. Lemon Squeezy (already live — sanity check)

You said this is fully integrated in live mode. Just confirm:

- [ ] Webhook endpoint in Lemon Squeezy dashboard points to **production** URL (`https://flowbooksai.com/api/lemon/webhook` or wherever your handler lives), not localhost.
- [ ] `LEMON_SQUEEZY_WEBHOOK_SECRET` set on Vercel matches the live store's secret.
- [ ] All 4 variant IDs (`LEMON_SQUEEZY_PRO_VARIANT_ID`, `LEMON_SQUEEZY_MAX_VARIANT_ID`, plus the yearly variants) point at **live** variants, not test ones.
- [ ] Run one real $1 test purchase end-to-end: checkout → webhook → user upgraded in Firestore → confirmation email → cancel.

---

## 5. Search engine setup (do this on launch day or right after)

### Google Search Console (https://search.google.com/search-console)
- [ ] Add property — choose **Domain** type (verifies all subdomains at once). Need DNS access.
- [ ] OR add **URL prefix** for `https://flowbooksai.com` and use the meta-tag method (paste into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`).
- [ ] Submit sitemap: `https://flowbooksai.com/sitemap.xml`
- [ ] Request indexing for `/`, `/pricing`, `/blog`, `/about`, `/security`.

### Bing Webmaster Tools (https://www.bing.com/webmasters)
- [ ] Import from Google Search Console (one click) OR verify with `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
- [ ] Submit sitemap.

### Optional but easy wins
- [ ] **Google Business Profile** — if you have a US/EU address, list the business.
- [ ] **DuckDuckGo** — uses Bing's index automatically once Bing crawls you.

---

## 6. Analytics

- [ ] PostHog: confirm `POSTHOG_KEY` is the **production** project key.
- [ ] (Optional) Add Google Analytics 4 — useful because it integrates with Search Console for the "Search Performance" report.
- [ ] (Optional) Add Plausible / Fathom for a lightweight privacy-friendly counter.

---

## 7. Lighthouse / Core Web Vitals

Before launch, run Lighthouse on production-mode build:

```
npm run build && npm start
# then in Chrome devtools → Lighthouse → run on https://localhost:3000/
```

Target scores:
- [ ] Performance ≥ 90
- [ ] Accessibility ≥ 95
- [ ] Best Practices ≥ 95
- [ ] SEO = 100

Pages to test:
- [ ] `/` (home)
- [ ] `/pricing`
- [ ] `/blog`
- [ ] One blog post (`/blog/[slug]`)

Common issues to fix:
- Hero `<video>` blocking LCP — add `poster=` and `preload="metadata"`.
- Large images — convert to WebP/AVIF.
- Render-blocking JS — Next handles most, but check third-party scripts (PostHog, Lemon Squeezy).
- Missing alt text on images.

---

## 8. Social previews — sanity-check the new OG image

After deploying:
- [ ] **Facebook / LinkedIn** — https://developers.facebook.com/tools/debug/ — paste `https://flowbooksai.com` and check preview, then "Scrape Again" to refresh cache.
- [ ] **Twitter** — https://cards-dev.twitter.com/validator (or post a test tweet, delete after).
- [ ] **LinkedIn** — https://www.linkedin.com/post-inspector/
- [ ] **Slack / Discord** — paste the link in any channel and confirm the card looks right.

---

## 9. Error monitoring

Already set up via PostHog (`capture_exceptions: true` in `lib/posthog.ts`, plus
`global-error.tsx` reports critical render errors).

- [ ] Trigger one fake error in prod (e.g. visit a page that throws) and confirm it appears in **PostHog → Error Tracking**.
- [ ] (Optional, recommended at scale) Add Sentry for source-mapped stack traces and richer alerting. Skip until you actually have users.

---

## 10. Legal & compliance

- [ ] `/privacy` reflects your real data practices (Firebase, OpenAI, Lemon Squeezy, Resend, PostHog all named).
- [ ] `/terms` mentions the real entity name and jurisdiction.
- [ ] Cookie banner — required if EU/UK users. Right now there's no banner. Either add one or geo-restrict EU traffic. (PostHog has a built-in opt-in mode.)
- [ ] Add a `/dpa` (Data Processing Agreement) link in `/security` if you target B2B.

---

## 11. Operational

- [ ] Status page (`status.flowbooksai.com`) populated with the real services list.
- [ ] On-call alert for `/api/*` 5xx spikes (Vercel Notifications + PostHog Alert).
- [ ] Backup strategy: Firestore daily exports → GCS bucket.
- [ ] `robots.txt` returns 200 in prod (`curl https://flowbooksai.com/robots.txt`).
- [ ] `sitemap.xml` returns 200 with all blog posts (`curl https://flowbooksai.com/sitemap.xml`).
- [ ] OG image returns 200 (`curl -I https://flowbooksai.com/opengraph-image`).

---

## 12. Post-launch (first 7 days)

- [ ] Watch PostHog funnel: signup → first invoice. Find the drop-off.
- [ ] Check Search Console → Coverage tab daily; fix any "Discovered, not indexed" errors.
- [ ] Submit to Product Hunt, Hacker News (Show HN), Indie Hackers, your Twitter/X.
- [ ] Reply to every signup confirmation email personally for the first week. (Founders' biggest unfair advantage.)
- [ ] Schedule a 2-week follow-up to remove any launch-day-only flags or banners.
