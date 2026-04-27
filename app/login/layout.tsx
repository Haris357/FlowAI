import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Flowbooks account to manage your business finances.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    url: '/login',
    title: 'Sign In — Flowbooks',
    description: 'Sign in to your Flowbooks account.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
