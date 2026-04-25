import { useAuth } from '@workos-inc/authkit-react';
import { Box, Button, Stack } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { BodyStatsCard } from './BodyStatsCard';
import { WeightGoalCard } from './WeightGoalCard';
import { DailyTargetsCard } from './DailyTargetsCard';

export const SettingsPage = () => {
  const { user, signIn, signOut } = useAuth();

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', width: '100%', p: { xs: 2, sm: 3 } }}>
      <Stack sx={{ gap: 2 }}>
        <BodyStatsCard />
        <WeightGoalCard />
        <DailyTargetsCard />

        {user ? (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        ) : (
          <Button variant="contained" onClick={() => void signIn()}>
            Sign in
          </Button>
        )}
      </Stack>
    </Box>
  );
};
