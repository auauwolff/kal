import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@workos-inc/authkit-react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const CallbackPage = () => {
  const { isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      void navigate({ to: '/', replace: true });
    }
  }, [isLoading, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: 320,
      }}
    >
      <CircularProgress />
      <Typography>Signing you in...</Typography>
    </Box>
  );
};
