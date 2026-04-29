import { useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import {
  Block as BlockIcon,
  LocalFireDepartment,
  MoreVert,
  PersonRemove,
  Visibility,
} from '@mui/icons-material';
import { useMutation } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { errorMessage } from '@/lib/errors';
import { friendInitials } from './friendsUtils';

interface FriendRowProps {
  friendshipId: Id<'friendships'>;
  friendId: Id<'users'>;
  displayName: string;
  username: string;
  currentStreak: number;
  cheersReceivedToday: number;
  onOpenProfile: () => void;
}

export const FriendRow = ({
  friendshipId,
  friendId,
  displayName,
  username,
  currentStreak,
  cheersReceivedToday,
  onOpenProfile,
}: FriendRowProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const removeFriend = useMutation(api.friendships.removeFriend);
  const block = useMutation(api.friendships.block);

  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleView = () => {
    handleClose();
    onOpenProfile();
  };

  const handleRemove = async () => {
    handleClose();
    if (!window.confirm(`Remove ${displayName} from your friends?`)) return;
    try {
      await removeFriend({ friendshipId });
      toast.success('Friend removed');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not remove friend'));
    }
  };

  const handleBlock = async () => {
    handleClose();
    if (
      !window.confirm(
        `Block ${displayName}? They won't be able to find you or send cheers.`,
      )
    ) {
      return;
    }
    try {
      await block({ userId: friendId });
      toast.success('Blocked');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not block'));
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1,
        px: 0.5,
        cursor: 'pointer',
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
      onClick={onOpenProfile}
    >
      <Avatar sx={{ bgcolor: 'secondary.main' }}>
        {friendInitials(displayName, username)}
      </Avatar>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          @{username}
        </Typography>
      </Stack>

      {cheersReceivedToday > 0 && (
        <Chip
          size="small"
          label={`+${cheersReceivedToday} cheer${cheersReceivedToday === 1 ? '' : 's'}`}
          color="secondary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      )}

      <Stack direction="row" alignItems="center" gap={0.25}>
        <LocalFireDepartment
          fontSize="small"
          sx={{ color: currentStreak > 0 ? 'warning.main' : 'text.disabled' }}
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: currentStreak > 0 ? 'warning.dark' : 'text.disabled',
            minWidth: 24,
          }}
        >
          {currentStreak}
        </Typography>
      </Stack>

      <IconButton size="small" onClick={handleOpen} aria-label="Friend actions">
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => void handleRemove()}>
          <ListItemIcon>
            <PersonRemove fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove friend</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => void handleBlock()}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Block</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
