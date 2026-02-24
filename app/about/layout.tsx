import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about the team and mission behind Flowbooks, the AI-first accounting platform.',
  openGraph: {
    title: 'About - Flowbooks',
    description: 'Learn about the team and mission behind Flowbooks, the AI-first accounting platform.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
