import Image from 'next/image';

/**
 * FlowBooksLogo — Reusable logo component
 *
 * Text style: "Flow" = bold, dark text / "books" = bold, italic, terracotta (#D97757)
 * Icon: /flowbooks.png
 */

interface FlowBooksLogoProps {
  /** Show the PNG logo icon */
  showIcon?: boolean;
  /** Show the "Flowbooks" text */
  showText?: boolean;
  /** Size presets */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Light variant (white "Flow" text — for dark backgrounds like footers) */
  light?: boolean;
  /** Extra className on the wrapper */
  className?: string;
}

const sizes = {
  xs: { icon: 20, text: 'text-sm',   gap: 'gap-1.5' },
  sm: { icon: 28, text: 'text-lg',   gap: 'gap-2' },
  md: { icon: 36, text: 'text-2xl',  gap: 'gap-2.5' },
  lg: { icon: 44, text: 'text-3xl',  gap: 'gap-3' },
  xl: { icon: 56, text: 'text-4xl',  gap: 'gap-3.5' },
};

export default function FlowBooksLogo({
  showIcon = true,
  showText = true,
  size = 'md',
  light = false,
  className = '',
}: FlowBooksLogoProps) {
  const s = sizes[size];

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      {showIcon && (
        <Image
          src="/flowbooks.png"
          alt="Flowbooks"
          width={s.icon}
          height={s.icon}
          className="flex-shrink-0"
          style={{ width: s.icon, height: s.icon }}
        />
      )}
      {showText && (
        <span
          className={`font-bold tracking-tight ${s.text}`}
          style={{ letterSpacing: '-0.03em' }}
        >
          <span className={light ? 'text-white' : 'text-slate-900 dark:text-white'}>
            Flow
          </span>
          <em className="not-italic" style={{ fontStyle: 'italic', color: '#D97757' }}>
            books
          </em>
        </span>
      )}
    </span>
  );
}

/**
 * FlowBooksLogoJoy — For use inside MUI Joy UI components (sidebar, settings)
 * Uses inline styles instead of Tailwind classes
 */
export function FlowBooksLogoJoy({
  showIcon = true,
  showText = true,
  iconSize = 32,
  fontSize = '1.25rem',
}: {
  showIcon?: boolean;
  showText?: boolean;
  iconSize?: number;
  fontSize?: string;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {showIcon && (
        <Image
          src="/flowbooks.png"
          alt="Flowbooks"
          width={iconSize}
          height={iconSize}
          style={{ width: iconSize, height: iconSize, flexShrink: 0 }}
        />
      )}
      {showText && (
        <span
          style={{
            fontWeight: 700,
            fontSize,
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}
        >
          <span style={{ color: 'var(--joy-palette-text-primary)' }}>Flow</span>
          <em style={{ fontStyle: 'italic', color: '#D97757' }}>books</em>
        </span>
      )}
    </span>
  );
}
