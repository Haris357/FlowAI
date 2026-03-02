import type { SxProps } from '@mui/joy/styles/types';

// Liquid glass effects matching globals.css definitions
// with dark mode variants via Joy UI color scheme selector

export const liquidGlass: SxProps = {
  background: 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  boxShadow:
    '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
  '[data-joy-color-scheme="dark"] &': {
    background: 'rgba(35, 34, 32, 0.55)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow:
      '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(255, 255, 255, 0.02)',
  },
};

export const liquidGlassSubtle: SxProps = {
  background: 'rgba(255, 255, 255, 0.3)',
  backdropFilter: 'blur(16px) saturate(150%)',
  WebkitBackdropFilter: 'blur(16px) saturate(150%)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  boxShadow:
    '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  '[data-joy-color-scheme="dark"] &': {
    background: 'rgba(35, 34, 32, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    boxShadow:
      '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  },
};

export const liquidGlassStrong: SxProps = {
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(40px) saturate(200%)',
  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  boxShadow:
    '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 2px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(255, 255, 255, 0.15)',
  '[data-joy-color-scheme="dark"] &': {
    background: 'rgba(35, 34, 32, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow:
      '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(255, 255, 255, 0.02)',
  },
};

// Reusable admin card style — glass + rounded + hover effect
export const adminCard: SxProps = {
  ...liquidGlass as Record<string, unknown>,
  borderRadius: '16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow:
      '0 12px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    transform: 'translateY(-1px)',
  },
};

// Page-level gradient background for admin content area
export const adminPageBg: SxProps = {
  background:
    'linear-gradient(135deg, #fef7f4 0%, #f8f0ed 25%, #f1f5f9 50%, #fef7f4 100%)',
  '[data-joy-color-scheme="dark"] &': {
    background:
      'linear-gradient(135deg, #1a1918 0%, #1e1d1b 25%, #1c1f24 50%, #1a1918 100%)',
  },
  minHeight: '100vh',
};
