import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Flowbooks account to manage your business finances.',
  openGraph: {
    title: 'Sign In - Flowbooks',
    description: 'Sign in to your Flowbooks account to manage your business finances.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
