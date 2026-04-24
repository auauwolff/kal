import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useAuth } from '@workos-inc/authkit-react';

interface SignedOutCardProps {
  title?: string;
  subtitle?: string;
}

export const SignedOutCard = ({
  title = 'Meet Kal — your fitness pal.',
  subtitle = 'Sign in to wake Kal up and start tracking.',
}: SignedOutCardProps) => {
  const { signIn } = useAuth();

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', width: '100%', p: 3 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack sx={{ gap: 2, alignItems: 'center', textAlign: 'center', py: 3 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
            <Button variant="contained" onClick={() => void signIn()}>
              Sign in
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
