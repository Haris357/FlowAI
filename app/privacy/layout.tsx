import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Flowbooks',
  description:
    'Flowbooks Privacy Policy. How we collect, use, store, and protect your personal information and financial data, plus your rights and choices.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    type: 'website',
    url: '/privacy',
    title: 'Privacy Policy — Flowbooks',
    description: 'How Flowbooks collects, uses, and protects your data.',
  },
  twitter: {
    title: 'Privacy Policy — Flowbooks',
    description: 'How Flowbooks collects, uses, and protects your data.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
