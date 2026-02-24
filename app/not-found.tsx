import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1A1915] px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-brand-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-600 dark:text-[#A8A29E] mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
