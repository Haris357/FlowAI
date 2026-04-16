import posthog from 'posthog-js';

export const POSTHOG_KEY = process.env.POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (typeof window === 'undefined' || initialized || !POSTHOG_KEY || process.env.NODE_ENV === 'development') return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // We handle this manually in the provider
    capture_pageleave: true,
    autocapture: true,
  });

  initialized = true;
}

export { posthog };
