/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
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
              "connect-src 'self' https://api.openai.com https://*.googleapis.com https://*.firebaseio.com https://*.firebasestorage.googleapis.com wss://*.firebaseio.com https://accounts.google.com https://oauth2.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://us.i.posthog.com https://us-assets.i.posthog.com https://app.posthog.com https://api.lemonsqueezy.com https://api.frankfurter.app https://v6.exchangerate-api.com https://api.resend.com",
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
