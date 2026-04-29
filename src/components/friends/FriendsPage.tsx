import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { GroupAdd, PersonAdd } from '@mui/icons-material';
import { useQuery } from 'convex/react';
import { useAuth } from '@workos-inc/authkit-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { userInitials } from '../appHeaderUtils';
import { AddFriendDialog } from './AddFriendDialog';
import { FriendStreakCard } from './FriendStreakCard';
import { FriendRow } from './FriendRow';
import { PendingRequestsSection } from './PendingRequestsSection';
import { PublicProfileSheet } from './PublicProfileSheet';

const CHEERS_PER_FRIEND_PER_DAY = 3;

export const FriendsPage = () => {
  const { user } = useAuth();
  const friends = useQuery(api.friendships.listFriends, {});
  const requests = useQuery(api.friendships.listPendingRequests, {});
  const cheersReceived = useQuery(api.cheers.listReceivedToday, {});

  const [addOpen, setAddOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<Id<'users'> | null>(null);

  const myInitials = useMemo(() => userInitials(user), [user]);

  const cheersByFriend = useMemo(() => {
    const map = new Map<Id<'users'>, number>();
    for (const entry of cheersReceived ?? []) {
      map.set(entry.friendUserId, entry.count);
    }
    return map;
  }, [cheersReceived]);

  const streaksFriends = (friends ?? []).filter((f) => f.streak?.alive);
  const otherFriends = (friends ?? []).filter((f) => !f.streak?.alive);

  const isLoading =
    friends === undefined || requests === undefined;

  const empty = !isLoading && (friends?.length ?? 0) === 0;

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      <Stack gap={2} sx={{ maxWidth: 600, mx: 'auto' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Friends
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keep each other showing up.
            </Typography>
          </Stack>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PersonAdd />}
            onClick={() => setAddOpen(true)}
          >
            Add
          </Button>
        </Stack>

        {requests && (
          <PendingRequestsSection
            incoming={requests.incoming}
            outgoing={requests.outgoing}
          />
        )}

        {streaksFriends.length > 0 && (
          <Stack gap={1.5}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ letterSpacing: 0.6 }}
            >
              Active streaks
            </Typography>
            {streaksFriends.map((entry) => (
              <FriendStreakCard
                key={entry.friendshipId}
                friendId={entry.friend._id}
                friendDisplayName={entry.friend.displayName}
                friendUsername={entry.friend.username}
                myInitials={myInitials}
                currentDays={entry.streak?.currentDays ?? 0}
                longestDays={entry.streak?.longestDays ?? 0}
                alive={Boolean(entry.streak?.alive)}
                bothLoggedToday={Boolean(entry.streak?.bothLoggedToday)}
                cheersSentToday={entry.cheersSentToday}
                cheersDailyLimit={CHEERS_PER_FRIEND_PER_DAY}
                onOpenProfile={() => setProfileUserId(entry.friend._id)}
              />
            ))}
          </Stack>
        )}

        {(otherFriends.length > 0 || streaksFriends.length === 0) &&
          !empty && (
            <Card
              elevation={0}
              sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack gap={0.5}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ letterSpacing: 0.6, px: 0.5 }}
                  >
                    All friends
                  </Typography>
                  {otherFriends.map((entry) => (
                    <FriendRow
                      key={entry.friendshipId}
                      friendshipId={entry.friendshipId}
                      friendId={entry.friend._id}
                      displayName={entry.friend.displayName}
                      username={entry.friend.username}
                      currentStreak={entry.friend.currentStreak}
                      cheersReceivedToday={
                        cheersByFriend.get(entry.friend._id) ?? 0
                      }
                      onOpenProfile={() => setProfileUserId(entry.friend._id)}
                    />
                  ))}
                  {otherFriends.length === 0 && streaksFriends.length > 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ px: 0.5, py: 1 }}
                    >
                      Everyone's on a streak with you. Nice.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

        {empty && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <GroupAdd
                sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                No friends yet
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 2 }}
              >
                Add a friend by username to start a duo streak. You both log
                each day to keep it alive.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PersonAdd />}
                onClick={() => setAddOpen(true)}
              >
                Find a friend
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        )}
      </Stack>

      <AddFriendDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <PublicProfileSheet
        open={profileUserId !== null}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </Box>
  );
};
