import { extendTheme } from '@mui/joy/styles';

// Flowbooks custom theme
export const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        success: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        danger: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#f44336',
          600: '#e53935',
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
        },
        warning: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        background: {
          body: '#fafafa',
          surface: '#ffffff',
          popup: '#ffffff',
          level1: '#f5f5f5',
          level2: '#eeeeee',
          level3: '#e0e0e0',
        },
        text: {
          primary: '#212121',
          secondary: '#616161',
          tertiary: '#9e9e9e',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        success: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        danger: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#f44336',
          600: '#e53935',
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
        },
        warning: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },
        neutral: {
          50: '#212121',
          100: '#303030',
          200: '#424242',
          300: '#616161',
          400: '#757575',
          500: '#9e9e9e',
          600: '#bdbdbd',
          700: '#e0e0e0',
          800: '#eeeeee',
          900: '#fafafa',
        },
        background: {
          body: '#121212',
          surface: '#1e1e1e',
          popup: '#2d2d2d',
          level1: '#2d2d2d',
          level2: '#3d3d3d',
          level3: '#4d4d4d',
        },
        text: {
          primary: '#ffffff',
          secondary: '#b0b0b0',
          tertiary: '#808080',
        },
      },
    },
  },
  fontFamily: {
    display: '"Inter", var(--joy-fontFamily-fallback)',
    body: '"Inter", var(--joy-fontFamily-fallback)',
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    'title-lg': {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    'title-md': {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    'title-sm': {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    'body-lg': {
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    'body-md': {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    'body-sm': {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    'body-xs': {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
          textTransform: 'none',
        },
      },
    },
    JoyCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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

export default theme;
