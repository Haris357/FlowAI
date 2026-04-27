import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security — How Flowbooks protects your financial data',
  description:
    'Bank-grade security at Flowbooks: 256-bit AES encryption in transit and at rest, Google Cloud infrastructure, SOC 2-aligned controls, role-based access, and continuous monitoring.',
  alternates: { canonical: '/security' },
  openGraph: {
    type: 'website',
    url: '/security',
    title: 'Flowbooks Security',
    description:
      'How Flowbooks protects your financial data — encryption, infrastructure, and controls.',
  },
  twitter: {
    title: 'Flowbooks Security',
    description: 'How Flowbooks protects your financial data.',
  },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
