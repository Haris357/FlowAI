import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Flowbooks collects, uses, and protects your personal information and financial data.',
  openGraph: {
    title: 'Privacy Policy - Flowbooks',
    description: 'How Flowbooks collects, uses, and protects your personal information and financial data.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
