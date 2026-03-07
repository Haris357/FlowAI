import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-server';

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

async function posthogQuery(query: string) {
  if (!POSTHOG_API_KEY) return null;

  // Derive project API host (remove /i. for API calls)
  const apiHost = POSTHOG_HOST.replace('//us.i.', '//us.').replace('//eu.i.', '//eu.');

  const res = await fetch(`${apiHost}/api/projects/@current/query/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });

  if (!res.ok) {
    console.error('PostHog query failed:', await res.text());
    return null;
  }

  return res.json();
}

export async function GET(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) return authResult.response;

    if (!POSTHOG_API_KEY) {
      return NextResponse.json({ error: 'PostHog API key not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';

    const daysMap: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 7;

    // Run all queries in parallel
    const [
      totalEvents,
      uniqueUsers,
      topEvents,
      dailyActiveUsers,
      signups,
      messagesPerDay,
      topPages,
      messageLimitHits,
      userRetention,
    ] = await Promise.all([
      // Total events in period
      posthogQuery(`
        SELECT count() as total
        FROM events
        WHERE timestamp >= now() - interval ${days} day
          AND event NOT LIKE '$%'
      `),

      // Unique users in period
      posthogQuery(`
        SELECT count(distinct distinct_id) as total
        FROM events
        WHERE timestamp >= now() - interval ${days} day
          AND event NOT LIKE '$%'
      `),

      // Top events breakdown
      posthogQuery(`
        SELECT event, count() as count
        FROM events
        WHERE timestamp >= now() - interval ${days} day
          AND event NOT LIKE '$%'
        GROUP BY event
        ORDER BY count DESC
        LIMIT 15
      `),

      // Daily active users
      posthogQuery(`
        SELECT
          toDate(timestamp) as day,
          count(distinct distinct_id) as users
        FROM events
        WHERE timestamp >= now() - interval ${days} day
        GROUP BY day
        ORDER BY day
      `),

      // Signups per day
      posthogQuery(`
        SELECT
          toDate(timestamp) as day,
          count() as signups
        FROM events
        WHERE event = 'user_signed_up'
          AND timestamp >= now() - interval ${days} day
        GROUP BY day
        ORDER BY day
      `),

      // Messages per day
      posthogQuery(`
        SELECT
          toDate(timestamp) as day,
          count() as messages
        FROM events
        WHERE event = 'message_sent'
          AND timestamp >= now() - interval ${days} day
        GROUP BY day
        ORDER BY day
      `),

      // Top pages
      posthogQuery(`
        SELECT
          properties.$current_url as url,
          count() as views
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - interval ${days} day
        GROUP BY url
        ORDER BY views DESC
        LIMIT 10
      `),

      // Message limit hits
      posthogQuery(`
        SELECT
          properties.blocked_by as blocked_by,
          properties.plan as plan,
          count() as hits
        FROM events
        WHERE event = 'message_limit_hit'
          AND timestamp >= now() - interval ${days} day
        GROUP BY blocked_by, plan
        ORDER BY hits DESC
      `),

      // User retention: users who signed up and came back
      posthogQuery(`
        SELECT
          count(distinct distinct_id) as returned_users
        FROM events
        WHERE distinct_id IN (
          SELECT distinct_id
          FROM events
          WHERE event = 'user_signed_up'
            AND timestamp >= now() - interval ${days} day
        )
        AND event = 'message_sent'
        AND timestamp >= now() - interval ${days} day
      `),
    ]);

    // Helper to extract results
    const extract = (result: any) => {
      if (!result?.results) return [];
      return result.results;
    };

    const extractScalar = (result: any) => {
      if (!result?.results?.[0]?.[0]) return 0;
      return result.results[0][0];
    };

    return NextResponse.json({
      period,
      overview: {
        totalEvents: extractScalar(totalEvents),
        uniqueUsers: extractScalar(uniqueUsers),
        totalSignups: extract(signups).reduce((sum: number, r: any[]) => sum + (r[1] || 0), 0),
        totalMessages: extract(messagesPerDay).reduce((sum: number, r: any[]) => sum + (r[1] || 0), 0),
        returnedUsers: extractScalar(userRetention),
      },
      topEvents: extract(topEvents).map((r: any[]) => ({ event: r[0], count: r[1] })),
      dailyActiveUsers: extract(dailyActiveUsers).map((r: any[]) => ({ date: r[0], users: r[1] })),
      signupsPerDay: extract(signups).map((r: any[]) => ({ date: r[0], signups: r[1] })),
      messagesPerDay: extract(messagesPerDay).map((r: any[]) => ({ date: r[0], messages: r[1] })),
      topPages: extract(topPages).map((r: any[]) => ({ url: r[0], views: r[1] })),
      messageLimitHits: extract(messageLimitHits).map((r: any[]) => ({
        blockedBy: r[0], plan: r[1], hits: r[2],
      })),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
