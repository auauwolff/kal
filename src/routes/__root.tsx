import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { createAppTheme } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const RootLayout = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const theme = createAppTheme(isDarkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDarkMode ? '#1e1e1e' : '#fff',
            color: isDarkMode ? '#fff' : '#333',
            border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
          },
        }}
      />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-left" />}
    </ThemeProvider>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
