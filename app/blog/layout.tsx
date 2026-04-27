import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Tips & guides for small business accounting',
  description:
    'Practical tips, guides, and product updates from the Flowbooks team. Learn small business accounting, AI bookkeeping, invoicing, taxes, and cash-flow basics.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: '/blog',
    title: 'Flowbooks Blog',
    description:
      'Tips, guides, and insights for small business accounting and AI-powered bookkeeping.',
  },
  twitter: {
    title: 'Flowbooks Blog',
    description: 'Tips, guides, and insights for small business accounting.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
