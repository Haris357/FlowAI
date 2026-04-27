import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get Started Free — Sign up for Flowbooks',
  description:
    'Create your free Flowbooks account in under a minute. Send invoices, track expenses, and chat with your AI accountant — no credit card required.',
  alternates: { canonical: '/signup' },
  openGraph: {
    type: 'website',
    url: '/signup',
    title: 'Get Started Free — Flowbooks',
    description:
      'Create your free Flowbooks account in under a minute. No credit card required.',
  },
  twitter: {
    title: 'Get Started Free — Flowbooks',
    description: 'Create your free Flowbooks account in under a minute.',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
