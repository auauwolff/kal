import { createFileRoute } from '@tanstack/react-router';
import { Authenticated, Unauthenticated } from 'convex/react';
import { useAuth } from '@workos-inc/authkit-react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import KalPage from '@/components/Kal/KalPage';
import KalStatsInput from '@/components/Kal/KalStatsInput';

const HomePage = () => {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', width: '100%', p: { xs: 2, sm: 3 } }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Kal
        </Typography>
        <AuthButton />
      </Stack>

      <Authenticated>
        <Stack sx={{ gap: 3 }}>
          <KalPage />
          <KalStatsInput />
        </Stack>
      </Authenticated>

      <Unauthenticated>
        <Card>
          <CardContent>
            <Stack sx={{ gap: 2, alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="h6">Meet Kal — your fitness pal.</Typography>
              <Typography color="text.secondary">
                Sign in to wake Kal up and start tracking.
              </Typography>
              <AuthButton />
            </Stack>
          </CardContent>
        </Card>
      </Unauthenticated>
    </Box>
  );
};

const AuthButton = () => {
  const { user, signIn, signOut } = useAuth();
  if (user) {
    return (
      <Button variant="outlined" onClick={() => signOut()}>
        Sign out
      </Button>
    );
  }
  return (
    <Button variant="contained" onClick={() => void signIn()}>
      Sign in
    </Button>
  );
};

export const Route = createFileRoute('/')({
  component: HomePage,
});
