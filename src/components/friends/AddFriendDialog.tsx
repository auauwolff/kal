import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useMutation, useQuery } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { errorMessage } from '@/lib/errors';
import { friendInitials } from './friendsUtils';

interface AddFriendDialogProps {
  open: boolean;
  onClose: () => void;
}

const useDebounced = (value: string, delayMs: number): string => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
};

export const AddFriendDialog = ({ open, onClose }: AddFriendDialogProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query.trim(), 250);
  const sendRequest = useMutation(api.friendships.sendRequest);
  const [pendingId, setPendingId] = useState<Id<'users'> | null>(null);

  const trimmed = debouncedQuery.toLowerCase();
  const results = useQuery(
    api.users.searchByUsername,
    open && trimmed.length >= 2 ? { query: trimmed } : 'skip',
  );

  const handleSend = async (userId: Id<'users'>) => {
    setPendingId(userId);
    try {
      const result = await sendRequest({ toUserId: userId });
      if (result.status === 'accepted') {
        toast.success('Friend added!');
      } else {
        toast.success('Request sent');
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Could not send request'));
    } finally {
      setPendingId(null);
    }
  };

  const emptyState = useMemo(() => {
    if (!open) return null;
    if (query.trim().length < 2) {
      return 'Type at least 2 characters of a username.';
    }
    if (results === undefined) return 'Searching…';
    if (results.length === 0) return 'No matches.';
    return null;
  }, [open, query, results]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        Find a friend
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close"
          sx={{ ml: 'auto' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Search by username — your friends can find you under{' '}
            <strong>@your-username</strong> on your profile.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            placeholder="username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          {emptyState ? (
            <Typography variant="body2" color="text.secondary">
              {emptyState}
            </Typography>
          ) : (
            <Stack gap={0.5}>
              {results?.map((user) => (
                <ListItemButton
                  key={user._id}
                  sx={{ borderRadius: 1, px: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {friendInitials(user.displayName, user.username)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.displayName}
                    secondary={`@${user.username}`}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    startIcon={<PersonAdd />}
                    disabled={pendingId === user._id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleSend(user._id);
                    }}
                  >
                    Add
                  </Button>
                </ListItemButton>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
