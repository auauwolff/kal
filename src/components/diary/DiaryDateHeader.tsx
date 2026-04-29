import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  ContentCopy,
  Description,
  LocalFireDepartment,
  MoreVert,
  PictureAsPdf,
  TableChart,
} from '@mui/icons-material';
import { useMutation, useQuery } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import { getTodayISO, useDiaryStore } from '@/stores/diaryStore';
import { formatDayLabel, shiftISODate, todayISO } from '@/lib/date';
import { errorMessage } from '@/lib/errors';
import { getWeighInStatus, humanizeDaysSince } from '@/lib/weighIn';
import { WeightLogDialog } from '@/components/weight/WeightLogDialog';

export const DiaryDateHeader = () => {
  const { selectedDate, goPrevDay, goNextDay, goToday } = useDiaryStore();
  const copyDay = useMutation(api.meal_logs.copyDay);
  const user = useQuery(api.users.get, {});
  const streak = user?.currentStreak ?? 0;
  const isToday = selectedDate === getTodayISO();
  const isTodayOrFuture = selectedDate >= getTodayISO();
  const streakActive = streak > 0;
  const streakColor = streakActive ? 'primary.main' : 'text.disabled';

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const latestWeight = useQuery(api.weights.latest, {});
  const settingsWeight = user?.bodyStats?.weightKg ?? null;
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const showWeightChip = latestWeight !== undefined && (latestWeight !== null || settingsWeight != null);
  const weighInStatus = getWeighInStatus(latestWeight?.date ?? null, todayISO());
  const chipWeightKg = latestWeight?.weightKg ?? settingsWeight;
  const weightTooltip = !latestWeight
    ? 'Log your first weigh-in'
    : `last ${formatDayLabel(latestWeight.date)} · ${humanizeDaysSince(weighInStatus.kind === 'never' ? 0 : weighInStatus.daysSince)}`;

  const runAction = () => {
    closeMenu();
  };

  const handleCopyYesterday = () => {
    closeMenu();
    const fromDate = shiftISODate(selectedDate, -1);
    void copyDay({ fromDate, toDate: selectedDate }).catch((error: unknown) => {
      toast.error(errorMessage(error, 'Could not copy yesterday'));
    });
  };

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Tooltip title={streakActive ? `${streak}-day streak` : 'No streak yet'}>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ position: 'absolute', left: 0, alignItems: 'center', px: 1 }}
        >
          <LocalFireDepartment sx={{ color: streakColor, fontSize: 28 }} />
          <Typography
            sx={{ color: streakColor, fontWeight: 800, fontSize: 20, lineHeight: 1 }}
          >
            {streak}
          </Typography>
        </Stack>
      </Tooltip>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <IconButton onClick={goPrevDay} size="small">
          <ChevronLeft />
        </IconButton>
        <Tooltip title={isToday ? '' : 'Jump to today'}>
          <Button
            variant="text"
            onClick={goToday}
            sx={{ fontWeight: 700, fontSize: 16, textTransform: 'none', minWidth: 0, px: 1 }}
          >
            {formatDayLabel(selectedDate)}
          </Button>
        </Tooltip>
        <IconButton onClick={goNextDay} size="small" disabled={isTodayOrFuture}>
          <ChevronRight />
        </IconButton>
      </Stack>
      <Stack
        direction="row"
        sx={{ position: 'absolute', right: 0, alignItems: 'center', gap: 0.25 }}
      >
        {showWeightChip && chipWeightKg != null && (
          <Tooltip title={weightTooltip}>
            <Button
              size="small"
              variant="text"
              onClick={() => setWeightDialogOpen(true)}
              sx={{
                minWidth: 0,
                px: 1,
                color: 'primary.main',
                fontWeight: 700,
                fontSize: 16,
                lineHeight: 1,
                textTransform: 'none',
              }}
            >
              {`${chipWeightKg.toFixed(1)} kg`}
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Day actions">
          <IconButton size="small" color="secondary" onClick={openMenu}>
            <MoreVert />
          </IconButton>
        </Tooltip>
      </Stack>
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={closeMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        <MenuItem onClick={handleCopyYesterday}>
          <ListItemIcon>
            <ContentCopy fontSize="small" sx={{ color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText>Copy from yesterday</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={runAction}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" sx={{ color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={runAction}>
          <ListItemIcon>
            <TableChart fontSize="small" sx={{ color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={runAction}>
          <ListItemIcon>
            <Description fontSize="small" sx={{ color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText>Export as text</ListItemText>
        </MenuItem>
      </Menu>
      <WeightLogDialog
        open={weightDialogOpen}
        onClose={() => setWeightDialogOpen(false)}
        defaultWeightKg={chipWeightKg}
      />
    </Box>
  );
};
