import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Diamond,
  EmojiEvents,
  LocalFireDepartment,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatJoinedAt, friendInitials } from './friendsUtils';

interface PublicProfileSheetProps {
  open: boolean;
  userId: Id<'users'> | null;
  onClose: () => void;
}

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <Stack alignItems="center" gap={0.5} sx={{ flex: 1 }}>
    <Box sx={{ color: 'primary.main', display: 'inline-flex' }}>{icon}</Box>
    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
      {value}
    </Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
    >
      {label}
    </Typography>
  </Stack>
);

export const PublicProfileSheet = ({
  open,
  userId,
  onClose,
}: PublicProfileSheetProps) => {
  const profile = useQuery(
    api.users.getPublicProfile,
    open && userId ? { userId } : 'skip',
  );

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          pb: 'env(safe-area-inset-bottom, 0px)',
        },
      }}
    >
      <Stack sx={{ p: 3 }} gap={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="overline" color="text.secondary">
            Profile
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close profile">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {profile === undefined ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : profile === null ? (
          <Typography color="text.secondary">
            Profile unavailable.
          </Typography>
        ) : (
          <>
            <Stack direction="row" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  fontSize: 24,
                }}
              >
                {friendInitials(profile.displayName, profile.username)}
              </Avatar>
              <Stack sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {profile.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  @{profile.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Joined {formatJoinedAt(profile.joinedAt)}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" sx={{ pt: 1 }}>
              <Stat
                icon={<LocalFireDepartment />}
                label="Streak"
                value={`${profile.currentStreak}d`}
              />
              <Stat
                icon={<EmojiEvents />}
                label="Best"
                value={`${profile.longestStreak}d`}
              />
              <Stat
                icon={<Diamond />}
                label="Gems"
                value={String(profile.gemBalance)}
              />
            </Stack>
          </>
        )}
      </Stack>
    </Drawer>
  );
};
