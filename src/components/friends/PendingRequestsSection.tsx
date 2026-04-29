import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Check, Close, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useMutation } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { errorMessage } from '@/lib/errors';
import { friendInitials } from './friendsUtils';

interface RequestEntry {
  friendshipId: Id<'friendships'>;
  user: {
    _id: Id<'users'>;
    displayName: string;
    username: string;
  };
}

interface PendingRequestsSectionProps {
  incoming: RequestEntry[];
  outgoing: RequestEntry[];
}

export const PendingRequestsSection = ({
  incoming,
  outgoing,
}: PendingRequestsSectionProps) => {
  const accept = useMutation(api.friendships.acceptRequest);
  const decline = useMutation(api.friendships.declineRequest);
  const [showOutgoing, setShowOutgoing] = useState(false);

  if (incoming.length === 0 && outgoing.length === 0) return null;

  const handleAccept = async (friendshipId: Id<'friendships'>) => {
    try {
      await accept({ friendshipId });
      toast.success('Friend added!');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not accept'));
    }
  };

  const handleDecline = async (friendshipId: Id<'friendships'>) => {
    try {
      await decline({ friendshipId });
    } catch (error) {
      toast.error(errorMessage(error, 'Could not decline'));
    }
  };

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack gap={1.5}>
          {incoming.length > 0 && (
            <>
              <Typography variant="overline" color="primary.main">
                {incoming.length} pending request
                {incoming.length === 1 ? '' : 's'}
              </Typography>
              <Stack gap={1}>
                {incoming.map((entry) => (
                  <Stack
                    key={entry.friendshipId}
                    direction="row"
                    alignItems="center"
                    gap={1.5}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {friendInitials(
                        entry.user.displayName,
                        entry.user.username,
                      )}
                    </Avatar>
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700 }}
                        noWrap
                      >
                        {entry.user.displayName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        @{entry.user.username}
                      </Typography>
                    </Stack>
                    <Button
                      variant="contained"
                      size="small"
                      color="secondary"
                      startIcon={<Check />}
                      onClick={() => void handleAccept(entry.friendshipId)}
                    >
                      Accept
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => void handleDecline(entry.friendshipId)}
                      aria-label="Decline"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </>
          )}

          {outgoing.length > 0 && (
            <>
              {incoming.length > 0 && <Box sx={{ height: 4 }} />}
              <Stack
                direction="row"
                alignItems="center"
                onClick={() => setShowOutgoing((v) => !v)}
                sx={{ cursor: 'pointer' }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, flex: 1 }}
                >
                  {outgoing.length} sent · waiting
                </Typography>
                {showOutgoing ? (
                  <ExpandLess fontSize="small" sx={{ color: 'text.secondary' }} />
                ) : (
                  <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} />
                )}
              </Stack>
              <Collapse in={showOutgoing}>
                <Stack gap={1}>
                  {outgoing.map((entry) => (
                    <Stack
                      key={entry.friendshipId}
                      direction="row"
                      alignItems="center"
                      gap={1.5}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'action.disabledBackground',
                          color: 'text.secondary',
                        }}
                      >
                        {friendInitials(
                          entry.user.displayName,
                          entry.user.username,
                        )}
                      </Avatar>
                      <Stack sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {entry.user.displayName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          @{entry.user.username}
                        </Typography>
                      </Stack>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => void handleDecline(entry.friendshipId)}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              </Collapse>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
