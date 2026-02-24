import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions governing the use of Flowbooks AI accounting platform.',
  openGraph: {
    title: 'Terms of Service - Flowbooks',
    description: 'Terms and conditions governing the use of Flowbooks AI accounting platform.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
