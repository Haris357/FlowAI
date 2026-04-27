import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Flowbooks — Support, sales & partnerships',
  description:
    'Reach out to the Flowbooks team. Email hello@flowbooksai.com for support, sales, partnership, or press inquiries — we usually reply within one business day.',
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    url: '/contact',
    title: 'Contact Flowbooks',
    description: 'Get in touch with the Flowbooks team for support, sales, or partnership inquiries.',
  },
  twitter: {
    title: 'Contact Flowbooks',
    description: 'Get in touch with the Flowbooks team.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
