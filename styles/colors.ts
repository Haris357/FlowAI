/**
 * Flowbooks Color Palette
 *
 * Brand Colors (Claude-inspired):
 * - Primary (Terracotta): #D97757
 * - Secondary (Warm Brown): #C4694D
 *
 * This file contains the centralized color configuration for the entire app.
 * To change the theme, simply update the brand colors below and all pages will reflect the changes.
 */

// ============================================
// BRAND COLORS - Change these to update theme
// ============================================
export const BRAND_COLORS = {
  primary: '#D97757',    // Claude Terracotta
  secondary: '#C4694D',  // Warm Brown
} as const;

// ============================================
// GENERATED COLOR PALETTES
// ============================================

// Primary Color Palette (Terracotta #D97757)
export const primaryPalette = {
  50: '#FEF4F0',
  100: '#FDDCCC',
  200: '#F9BC9F',
  300: '#F09B73',
  400: '#E27F52',
  500: '#D97757',  // Base
  600: '#C4694D',
  700: '#A85A42',
  800: '#8B4A37',
  900: '#6E3B2D',
} as const;

// Secondary Color Palette (Warm Brown #C4694D)
export const secondaryPalette = {
  50: '#FBF1ED',
  100: '#F5DDD3',
  200: '#E8BBA8',
  300: '#DA997E',
  400: '#CF7D5E',
  500: '#C4694D',  // Base
  600: '#AD5C43',
  700: '#934E39',
  800: '#7A402F',
  900: '#613326',
} as const;

// Neutral Palette (Warm grays - Claude style)
export const neutralPalette = {
  light: {
    50: '#FAF9F7',
    100: '#F3F2EE',
    200: '#E8E5DE',
    300: '#DBD8D0',
    400: '#A8A29E',
    500: '#78736D',
    600: '#5C5752',
    700: '#454240',
    800: '#2D2B28',
    900: '#1A1915',
  },
  dark: {
    50: '#1A1915',
    100: '#2D2B28',
    200: '#454240',
    300: '#5C5752',
    400: '#78736D',
    500: '#A8A29E',
    600: '#DBD8D0',
    700: '#E8E5DE',
    800: '#F3F2EE',
    900: '#FAF9F7',
  },
} as const;

// Success Palette
export const successPalette = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
} as const;

// Danger Palette
export const dangerPalette = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
} as const;

// Warning Palette
export const warningPalette = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
} as const;

// ============================================
// GRADIENT DEFINITIONS
// ============================================
export const gradients = {
  // Main brand gradient (horizontal)
  brand: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%)`,
  brandReverse: `linear-gradient(135deg, ${BRAND_COLORS.secondary} 0%, ${BRAND_COLORS.primary} 100%)`,

  // Vertical gradients
  brandVertical: `linear-gradient(180deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%)`,

  // Subtle gradients for backgrounds
  primarySubtle: `linear-gradient(135deg, ${primaryPalette[50]} 0%, ${primaryPalette[100]} 100%)`,
  secondarySubtle: `linear-gradient(135deg, ${secondaryPalette[50]} 0%, ${secondaryPalette[100]} 100%)`,

  // Card backgrounds
  primaryCard: `linear-gradient(135deg, rgba(217, 119, 87, 0.08) 0%, rgba(217, 119, 87, 0.02) 100%)`,
  secondaryCard: `linear-gradient(135deg, rgba(196, 105, 77, 0.08) 0%, rgba(196, 105, 77, 0.02) 100%)`,

  // Hero section gradient
  hero: `linear-gradient(135deg, ${BRAND_COLORS.primary}15 0%, ${BRAND_COLORS.secondary}15 50%, transparent 100%)`,
  heroDark: `linear-gradient(135deg, ${BRAND_COLORS.primary}25 0%, ${BRAND_COLORS.secondary}25 50%, transparent 100%)`,
} as const;

// ============================================
// LIGHT MODE THEME
// ============================================
export const lightTheme = {
  primary: primaryPalette,
  secondary: secondaryPalette,
  success: successPalette,
  danger: dangerPalette,
  warning: warningPalette,
  neutral: neutralPalette.light,
  background: {
    body: '#FAF9F7',
    surface: '#FFFFFF',
    level1: '#F3F2EE',
    level2: '#E8E5DE',
    level3: '#DBD8D0',
  },
  text: {
    primary: '#1A1915',
    secondary: '#5C5752',
    tertiary: '#78736D',
  },
} as const;

// ============================================
// DARK MODE THEME
// ============================================
export const darkTheme = {
  primary: {
    50: '#2A1F1A',
    100: '#3D2C22',
    200: '#5C3F30',
    300: '#8B4A37',
    400: '#A85A42',
    500: '#D97757',
    600: '#E89578',
    700: '#F0B49E',
    800: '#F7D3C4',
    900: '#FEF4F0',
  },
  secondary: {
    50: '#261C17',
    100: '#38281F',
    200: '#53392D',
    300: '#7A402F',
    400: '#934E39',
    500: '#C4694D',
    600: '#D48A72',
    700: '#E1A895',
    800: '#EEC7B9',
    900: '#FBF1ED',
  },
  success: {
    50: successPalette[900],
    100: successPalette[800],
    200: successPalette[700],
    300: successPalette[600],
    400: successPalette[500],
    500: successPalette[400],
    600: successPalette[300],
    700: successPalette[200],
    800: successPalette[100],
    900: successPalette[50],
  },
  danger: {
    50: dangerPalette[900],
    100: dangerPalette[800],
    200: dangerPalette[700],
    300: dangerPalette[600],
    400: dangerPalette[500],
    500: dangerPalette[400],
    600: dangerPalette[300],
    700: dangerPalette[200],
    800: dangerPalette[100],
    900: dangerPalette[50],
  },
  warning: {
    50: warningPalette[900],
    100: warningPalette[800],
    200: warningPalette[700],
    300: warningPalette[600],
    400: warningPalette[500],
    500: warningPalette[400],
    600: warningPalette[300],
    700: warningPalette[200],
    800: warningPalette[100],
    900: warningPalette[50],
  },
  neutral: neutralPalette.dark,
  background: {
    body: '#1A1915',
    surface: '#232220',
    level1: '#2D2B28',
    level2: '#3D3A37',
    level3: '#4A4745',
  },
  text: {
    primary: '#EEECE8',
    secondary: '#A8A29E',
    tertiary: '#78736D',
  },
} as const;

// ============================================
// CSS VARIABLE HELPERS
// ============================================
export const cssVars = {
  primary: {
    main: 'var(--joy-palette-primary-500)',
    light: 'var(--joy-palette-primary-300)',
    dark: 'var(--joy-palette-primary-700)',
    contrastText: '#ffffff',
  },
  secondary: {
    main: 'var(--joy-palette-secondary-500)',
    light: 'var(--joy-palette-secondary-300)',
    dark: 'var(--joy-palette-secondary-700)',
    contrastText: '#ffffff',
  },
} as const;

export default {
  BRAND_COLORS,
  primaryPalette,
  secondaryPalette,
  gradients,
  lightTheme,
  darkTheme,
};
