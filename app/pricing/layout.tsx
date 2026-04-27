import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Simple plans for small businesses & freelancers',
  description:
    'Flowbooks pricing: a free plan for getting started and affordable paid plans with unlimited invoices, expense tracking, AI assistant, and more. Cancel anytime.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    type: 'website',
    url: '/pricing',
    title: 'Flowbooks Pricing — Simple, transparent plans',
    description:
      'Free plan available. Paid plans starting low with unlimited invoices and AI-powered bookkeeping.',
  },
  twitter: {
    title: 'Flowbooks Pricing',
    description: 'Simple, transparent plans for AI-powered accounting.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
