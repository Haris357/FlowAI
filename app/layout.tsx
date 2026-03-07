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

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Flowbooks - AI-First Accounting',
    template: '%s | Flowbooks',
  },
  description: 'Just say it. Done. - AI-powered accounting that understands natural language.',
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
    siteName: 'Flowbooks',
    title: 'Flowbooks - AI-First Accounting',
    description: 'AI-powered accounting that understands natural language.',
  },
  twitter: {
    card: 'summary_large_image',
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
