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
        primary: {
          ...darkTheme.primary,
          outlinedBorder: '#5C3F30',
          softBg: '#2A1F1A',
          softHoverBg: '#3D2C22',
          softActiveBg: '#5C3F30',
        },
        success: {
          ...darkTheme.success,
          outlinedBorder: '#166534',
          softBg: '#14532d',
          softHoverBg: '#166534',
        },
        danger: {
          ...darkTheme.danger,
          outlinedBorder: '#991b1b',
          softBg: '#7f1d1d',
          softHoverBg: '#991b1b',
        },
        warning: {
          ...darkTheme.warning,
          outlinedBorder: '#92400e',
          softBg: '#78350f',
          softHoverBg: '#92400e',
        },
        neutral: {
          ...darkTheme.neutral,
          outlinedBorder: '#3D3A37',
          plainHoverBg: '#2D2B28',
          plainActiveBg: '#3D3A37',
          softBg: '#2D2B28',
          softHoverBg: '#3D3A37',
          softActiveBg: '#454240',
        },
        background: darkTheme.background,
        text: darkTheme.text,
        divider: '#2D2B28',
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
          '[data-joy-color-scheme="dark"] &': {
            '--variant-outlinedBorder': '#3D3A37',
            borderColor: ownerState.variant === 'outlined' ? '#3D3A37' : undefined,
          },
          '&:hover': {
            transform: ownerState.variant === 'outlined' ? 'translateY(-2px)' : undefined,
            boxShadow: ownerState.variant === 'outlined' ? theme.shadow.md : undefined,
          },
        }),
      },
    },
    JoyDivider: {
      styleOverrides: {
        root: {
          '[data-joy-color-scheme="dark"] &': {
            borderColor: '#2D2B28',
          },
        },
      },
    },
    JoyModalDialog: {
      styleOverrides: {
        root: {
          '[data-joy-color-scheme="dark"] &': {
            borderColor: '#3D3A37',
          },
        },
      },
    },
    JoySheet: {
      styleOverrides: {
        root: {
          '[data-joy-color-scheme="dark"] &[variant="outlined"]': {
            borderColor: '#3D3A37',
          },
        },
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
          '[data-joy-color-scheme="dark"] &': {
            '--Input-focusedHighlight': 'var(--joy-palette-primary-500)',
          },
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
    JoyMenu: {
      styleOverrides: {
        root: {
          '[data-joy-color-scheme="dark"] &': {
            borderColor: '#3D3A37',
          },
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
