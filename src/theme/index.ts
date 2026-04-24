import { createTheme, type ThemeOptions } from '@mui/material/styles';

const palette = {
  primary: {
    main: '#0077B6',
    light: '#00B4D8',
    dark: '#023E8A',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#F77F00',
    light: '#FCBF49',
    dark: '#D65F00',
    contrastText: '#ffffff',
  },
  error: {
    main: '#ef476f',
    light: '#ff6b8a',
    dark: '#b71c4a',
  },
  warning: {
    main: '#ffd166',
    light: '#ffe08a',
    dark: '#c9a000',
  },
  success: {
    main: '#06d6a0',
    light: '#4aecc4',
    dark: '#00a67d',
  },
  info: {
    main: '#118ab2',
    light: '#4db8da',
    dark: '#0a5f7a',
  },
};

const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
  },
};

export const createAppTheme = (isDarkMode: boolean) =>
  createTheme({
    ...baseTheme,
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      ...palette,
      background: isDarkMode
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#f8fafc', paper: '#ffffff' },
    },
  });
