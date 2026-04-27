/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  env: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    POSTHOG_KEY: process.env.POSTHOG_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
    APP_URL: process.env.APP_URL,
    LEMON_SQUEEZY_PRO_VARIANT_ID: process.env.LEMON_SQUEEZY_PRO_VARIANT_ID,
    LEMON_SQUEEZY_MAX_VARIANT_ID: process.env.LEMON_SQUEEZY_MAX_VARIANT_ID,
    LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID: process.env.LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID,
    LEMON_SQUEEZY_MAX_YEARLY_VARIANT_ID: process.env.LEMON_SQUEEZY_MAX_YEARLY_VARIANT_ID,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Reverse-proxy the Firebase Auth handler so signInWithRedirect works on
  // modern browsers that partition third-party storage. With this, the auth
  // handler page is served from our own origin (same as the app), so Firebase
  // can read the sign-in result without hitting cross-origin storage limits.
  //
  // Required: set FIREBASE_AUTH_DOMAIN to your app's own domain
  // (e.g. flowbooksai.com) on Vercel — NOT the default <project>.firebaseapp.com.
  async rewrites() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) return [];
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${projectId}.firebaseapp.com/__/auth/:path*`,
      },
      {
        source: '/__/firebase/:path*',
        destination: `https://${projectId}.firebaseapp.com/__/firebase/:path*`,
      },
    ];
  },
  async headers() {
    // In dev, Next.js HMR (React Fast Refresh) requires 'unsafe-eval'.
    // In production it is not needed — keep it out for a tighter policy.
    // PostHog dynamically loads scripts (session recording, feature flags) from us-assets.i.posthog.com.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://us-assets.i.posthog.com"
      : "script-src 'self' 'unsafe-inline' https://apis.google.com https://us-assets.i.posthog.com";

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
          },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Google APIs (Firebase Sign-In) + PostHog dynamic scripts
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              // Google user profile photos from lh3.googleusercontent.com
              "img-src 'self' data: blob: https:",
              // Firebase, OpenAI, PostHog analytics, Lemon Squeezy, exchange rates, Google OAuth
              "connect-src 'self' https://api.openai.com https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.firebasestorage.googleapis.com wss://*.firebaseio.com https://accounts.google.com https://oauth2.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://us.i.posthog.com https://us-assets.i.posthog.com https://app.posthog.com https://api.lemonsqueezy.com https://api.frankfurter.app https://v6.exchangerate-api.com https://api.resend.com",
              "object-src 'none'",
              // Google OAuth popup requires framing accounts.google.com
              "frame-src https://accounts.google.com https://*.firebaseapp.com",
              "frame-ancestors 'none'",
              "worker-src 'self' blob:",
              "form-action 'self' https://accounts.google.com",
              "base-uri 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
