import { useAuth } from '@workos-inc/authkit-react';
import { Box, Button, Stack } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { SignedOutCard } from '@/components/SignedOutCard';
import { BodyStatsCard } from './BodyStatsCard';
import { WeightGoalCard } from './WeightGoalCard';
import { DailyTargetsCard } from './DailyTargetsCard';

export const SettingsPage = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <SignedOutCard
        title="Settings are saved to your Kal account."
        subtitle="Sign in to edit your body stats, goal, and daily targets."
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', width: '100%', p: { xs: 2, sm: 3 } }}>
      <Stack sx={{ gap: 2 }}>
        <BodyStatsCard />
        <WeightGoalCard />
        <DailyTargetsCard />

        <Button
          variant="outlined"
          color="error"
          startIcon={<Logout />}
          onClick={() => void signOut()}
        >
          Sign out
        </Button>
      </Stack>
    </Box>
  );
};
