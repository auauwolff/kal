import { useAuth } from '@workos-inc/authkit-react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { Save } from '@mui/icons-material';
import { SignedOutCard } from '@/components/SignedOutCard';
import { ProfileDraftProvider } from '@/hooks/ProfileDraftProvider';
import { useProfileDraft } from '@/hooks/useProfileDraft';
import { BodyStatsCard } from './BodyStatsCard';
import { WeightGoalCard } from './WeightGoalCard';
import { DailyTargetsCard } from './DailyTargetsCard';

const SaveBar = () => {
  const { isDirty, isSaving, saveError, save } = useProfileDraft();
  return (
    <Stack sx={{ gap: 1 }}>
      {saveError && (
        <Alert severity="error">Couldn’t save changes. Tap Save to retry.</Alert>
      )}
      <Button
        variant="contained"
        color="primary"
        startIcon={<Save />}
        disabled={!isDirty || isSaving}
        onClick={save}
      >
        {isSaving ? 'Saving…' : 'Save changes'}
      </Button>
    </Stack>
  );
};

export const SettingsPage = () => {
  const { user } = useAuth();

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
      <ProfileDraftProvider>
        <Stack sx={{ gap: 2 }}>
          <BodyStatsCard />
          <WeightGoalCard />
          <DailyTargetsCard />
          <SaveBar />
        </Stack>
      </ProfileDraftProvider>
    </Box>
  );
};
