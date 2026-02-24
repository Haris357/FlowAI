import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tips, guides, and insights for small business accounting and AI-powered bookkeeping.',
  openGraph: {
    title: 'Blog - Flowbooks',
    description: 'Tips, guides, and insights for small business accounting and AI-powered bookkeeping.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
