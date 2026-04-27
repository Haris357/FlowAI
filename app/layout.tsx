import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { Suspense } from 'react';
import Layout from '@/components/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { SettingsModalProvider } from '@/contexts/SettingsModalContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import PostHogProvider from '@/components/PostHogProvider';
import JsonLd from '@/components/JsonLd';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://flowbooksai.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Flowbooks — AI-First Accounting. Just say it. Done.',
    template: '%s | Flowbooks',
  },
  description:
    'Flowbooks is AI-first accounting software for small businesses and freelancers. Send invoices, track expenses, manage taxes, and get instant financial insights — just by asking.',
  applicationName: 'Flowbooks',
  authors: [{ name: 'Flowbooks' }],
  creator: 'Flowbooks',
  publisher: 'Flowbooks',
  keywords: [
    'AI accounting software',
    'AI bookkeeping',
    'small business accounting',
    'freelancer accounting',
    'invoice software',
    'expense tracking',
    'natural language accounting',
    'AI invoicing',
    'automated bookkeeping',
    'Flowbooks',
  ],
  category: 'Business Software',
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Flowbooks',
    title: 'Flowbooks — AI-First Accounting. Just say it. Done.',
    description:
      'AI-first accounting software for small businesses and freelancers. Invoicing, expenses, taxes, and reports — just by asking.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flowbooks — AI-First Accounting',
    description:
      'AI-first accounting software for small businesses and freelancers. Just say it. Done.',
    creator: '@flowbooksai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION,
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '',
      'facebook-domain-verification':
        process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION || '',
    },
  },
};

// NOTE: viewport / themeColor live in <head> via globals + manifest in this Next version.

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Flowbooks',
  url: SITE_URL,
  logo: `${SITE_URL}/web-app-manifest-512x512.png`,
  description:
    'AI-first accounting software for small businesses and freelancers.',
  sameAs: [
    'https://twitter.com/flowbooksai',
    'https://www.linkedin.com/company/flowbooksai',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hello@flowbooksai.com',
    contactType: 'Customer Support',
    availableLanguage: ['English'],
  },
};

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Flowbooks',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/blog?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const softwareApplicationLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Flowbooks',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Accounting',
  operatingSystem: 'Web, iOS, Android',
  url: SITE_URL,
  description:
    'AI-first accounting software for small businesses and freelancers. Invoicing, expenses, taxes, and financial reports — just by asking.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <JsonLd data={[organizationLd, websiteLd, softwareApplicationLd]} />
        <NextTopLoader
          color="#D97757"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #D97757,0 0 5px #D97757"
          crawlSpeed={200}
          speed={200}
        />
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <PostHogProvider>
                <SubscriptionProvider>
                  <SettingsModalProvider>
                    <Layout>
                      {children}
                    </Layout>
                  </SettingsModalProvider>
                </SubscriptionProvider>
              </PostHogProvider>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
