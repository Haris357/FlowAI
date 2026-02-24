import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for AI-powered accounting. Free plan available.',
  openGraph: {
    title: 'Pricing - Flowbooks',
    description: 'Simple, transparent pricing for AI-powered accounting. Free plan available.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
