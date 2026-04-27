import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Flowbooks',
  description:
    'Terms of Service that govern your use of Flowbooks. Account responsibilities, payment, acceptable use, termination, and dispute resolution.',
  alternates: { canonical: '/terms' },
  openGraph: {
    type: 'website',
    url: '/terms',
    title: 'Terms of Service — Flowbooks',
    description: 'Terms governing your use of Flowbooks.',
  },
  twitter: {
    title: 'Terms of Service — Flowbooks',
    description: 'Terms governing your use of Flowbooks.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
