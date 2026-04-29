import { useState } from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Diamond,
  Favorite as CheerIcon,
  LocalFireDepartment,
} from '@mui/icons-material';
import { useMutation } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { errorMessage } from '@/lib/errors';
import { friendInitials } from './friendsUtils';

interface FriendStreakCardProps {
  friendId: Id<'users'>;
  friendDisplayName: string;
  friendUsername: string;
  myInitials: string;
  currentDays: number;
  longestDays: number;
  alive: boolean;
  bothLoggedToday: boolean;
  cheersSentToday: number;
  cheersDailyLimit: number;
  onOpenProfile: () => void;
}

export const FriendStreakCard = ({
  friendId,
  friendDisplayName,
  friendUsername,
  myInitials,
  currentDays,
  longestDays,
  alive,
  bothLoggedToday,
  cheersSentToday,
  cheersDailyLimit,
  onOpenProfile,
}: FriendStreakCardProps) => {
  const sendCheer = useMutation(api.cheers.sendCheer);
  const [busy, setBusy] = useState(false);

  const remaining = Math.max(0, cheersDailyLimit - cheersSentToday);
  const cheerDisabled = busy || remaining === 0;
  const cheerLabel =
    remaining === 0
      ? 'Cheered'
      : cheersSentToday > 0
        ? `Cheer (${remaining} left)`
        : 'Cheer · 1 gem';

  const handleCheer = async () => {
    setBusy(true);
    try {
      const result = await sendCheer({ toUserId: friendId });
      toast.success(
        result.sentTodayCount === result.dailyLimit
          ? `Cheered ${friendDisplayName} · daily limit reached`
          : `Cheered ${friendDisplayName}!`,
      );
    } catch (error) {
      toast.error(errorMessage(error, 'Could not send cheer'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: 1,
        borderColor: alive ? 'warning.light' : 'divider',
        bgcolor: alive ? 'warning.50' : 'background.paper',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Box sx={{ position: 'relative' }}>
            <AvatarGroup
              max={2}
              spacing="medium"
              sx={{
                '& .MuiAvatar-root': {
                  width: 44,
                  height: 44,
                  fontSize: 16,
                  border: '2px solid',
                  borderColor: 'background.paper',
                },
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main' }}>{myInitials}</Avatar>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {friendInitials(friendDisplayName, friendUsername)}
              </Avatar>
            </AvatarGroup>
          </Box>

          <Stack
            sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={onOpenProfile}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
              noWrap
            >
              {friendDisplayName}
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.5 }}>
              <LocalFireDepartment
                fontSize="small"
                sx={{ color: alive ? 'warning.main' : 'text.disabled' }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: alive ? 'warning.dark' : 'text.secondary',
                }}
              >
                {alive
                  ? `${currentDays}-day duo streak`
                  : 'Ready to restart together'}
              </Typography>
              {longestDays > 0 && (
                <Tooltip title="Best duo streak">
                  <Chip
                    size="small"
                    label={`best ${longestDays}d`}
                    sx={{
                      height: 20,
                      fontSize: 11,
                      bgcolor: 'transparent',
                    }}
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </Stack>
            {alive && !bothLoggedToday && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                Log today to keep it going
              </Typography>
            )}
          </Stack>

          <Tooltip
            title={
              remaining === 0
                ? 'Daily cheer limit reached'
                : 'Send a 1-gem cheer'
            }
          >
            <span>
              <Button
                variant={cheerDisabled ? 'outlined' : 'contained'}
                size="small"
                color="secondary"
                disabled={cheerDisabled}
                onClick={() => void handleCheer()}
                startIcon={
                  remaining === 0 ? (
                    <CheerIcon fontSize="small" />
                  ) : (
                    <Diamond fontSize="small" />
                  )
                }
                sx={{ whiteSpace: 'nowrap' }}
              >
                {cheerLabel}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
};
