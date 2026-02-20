import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import Layout from '@/components/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Flowbooks - AI-First Accounting',
  description: 'Just say it. Done. - AI-powered accounting that understands natural language.',
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
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
            <SubscriptionProvider>
              <Layout>
                {children}
              </Layout>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
