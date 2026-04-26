import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flowbooks Docs — Guides, tutorials & how-tos',
  description:
    'Learn how to use Flowbooks. Step-by-step guides for invoicing, expenses, banking, payroll, reports, and the AI assistant.',
  openGraph: {
    title: 'Flowbooks Docs',
    description:
      'Guides, tutorials, and how-tos for Flowbooks — the AI-first accounting platform.',
  },
};

export default function DocsRouteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
