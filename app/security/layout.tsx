import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Enterprise-grade security measures protecting your financial data at Flowbooks.',
  openGraph: {
    title: 'Security - Flowbooks',
    description: 'Enterprise-grade security measures protecting your financial data at Flowbooks.',
  },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
