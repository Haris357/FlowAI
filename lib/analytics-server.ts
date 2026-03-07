import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export function trackServer(userId: string, event: string, properties?: Record<string, any>) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId: userId, event, properties });
}

export async function shutdownPostHog() {
  if (client) await client.shutdown();
}
