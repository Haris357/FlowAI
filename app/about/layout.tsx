import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Flowbooks — Our mission to make accounting effortless',
  description:
    'Flowbooks is on a mission to make accounting effortless for small businesses and freelancers. Learn about our team, values, and the AI behind the product.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: '/about',
    title: 'About Flowbooks — Our mission to make accounting effortless',
    description:
      'Meet the team building AI-first accounting software for small businesses and freelancers.',
  },
  twitter: {
    title: 'About Flowbooks',
    description: 'Meet the team building AI-first accounting software.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
