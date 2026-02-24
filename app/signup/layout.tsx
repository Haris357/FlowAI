import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free Flowbooks account and start managing your finances with AI.',
  openGraph: {
    title: 'Sign Up - Flowbooks',
    description: 'Create your free Flowbooks account and start managing your finances with AI.',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
