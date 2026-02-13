'use client';
import React, { createContext, useContext, useEffect } from 'react';
import { CssVarsProvider, extendTheme, useColorScheme } from '@mui/joy/styles';
import { CssBaseline } from '@mui/joy';
import {
  primaryPalette,
  secondaryPalette,
  successPalette,
  dangerPalette,
  warningPalette,
  neutralPalette,
  lightTheme,
  darkTheme,
} from '@/styles/colors';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Flowbooks Theme - Claude-inspired brand colors #D97757 (Terracotta) and #C4694D (Warm Brown)
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: primaryPalette,
        success: successPalette,
        danger: dangerPalette,
        warning: warningPalette,
        neutral: neutralPalette.light,
        background: lightTheme.background,
        text: lightTheme.text,
      },
    },
    dark: {
      palette: {
        primary: darkTheme.primary,
        success: darkTheme.success,
        danger: darkTheme.danger,
        warning: darkTheme.warning,
        neutral: darkTheme.neutral,
        background: darkTheme.background,
        text: darkTheme.text,
      },
    },
  },
  fontFamily: {
    body: 'var(--font-inter), "Inter", "Inter Placeholder", sans-serif',
    display: 'var(--font-inter), "Inter", "Inter Placeholder", sans-serif',
  },
  typography: {
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
  },
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  components: {
    JoyCard: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: ownerState.variant === 'outlined' ? 'translateY(-2px)' : undefined,
            boxShadow: ownerState.variant === 'outlined' ? theme.shadow.md : undefined,
          },
        }),
      },
    },
    JoyButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.15s ease-in-out',
          fontWeight: 500,
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    JoyInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    JoySelect: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    JoyChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        },
      },
    },
    JoyTable: {
      styleOverrides: {
        root: {
          '& thead th': {
            backgroundColor: 'var(--joy-palette-background-level1)',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          '& tbody tr:hover': {
            backgroundColor: 'var(--joy-palette-background-level1)',
          },
        },
      },
    },
  },
});

function ThemeContextWrapper({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useColorScheme();

  // Sync Tailwind dark class on <html> element with MUI Joy theme
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ mode: mode as 'light' | 'dark', toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <CssVarsProvider theme={theme} defaultMode="light" modeStorageKey="flowbooks-theme">
      <CssBaseline />
      <ThemeContextWrapper>
        {children}
      </ThemeContextWrapper>
    </CssVarsProvider>
  );
}
