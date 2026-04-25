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
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  ContentCopy,
  Description,
  MoreVert,
  PictureAsPdf,
  TableChart,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { formatDayLabel, getTodayISO, useDiaryStore } from '@/stores/diaryStore';

export const DiaryDateHeader = () => {
  const { selectedDate, goPrevDay, goNextDay, goToday } = useDiaryStore();
  const isToday = selectedDate === getTodayISO();
  const isFuture = selectedDate > getTodayISO();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const runAction = (message: string, icon: string) => {
    closeMenu();
    toast(message, { icon });
  };

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <IconButton onClick={goNextDay} size="small" disabled={isFuture}>
          <ChevronRight />
        </IconButton>
      </Stack>
      <Tooltip title="Day actions">
        <IconButton
          size="small"
          color="secondary"
          onClick={openMenu}
          sx={{ position: 'absolute', right: 0 }}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={closeMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        <MenuItem
          onClick={() =>
            runAction('Copy previous day — wires up with meal_logs in Phase 2', '📋')
          }
        >
          <ListItemIcon>
            <ContentCopy fontSize="small" sx={{ color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText>Copy from yesterday</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => runAction('Export day as PDF — Phase 2 export flow', '📄')}
        >
          <ListItemIcon>
            <PictureAsPdf fontSize="small" sx={{ color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => runAction('Export day as CSV — Phase 2 export flow', '📊')}
        >
          <ListItemIcon>
            <TableChart fontSize="small" sx={{ color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => runAction('Export day as text — Phase 2 export flow', '📝')}
        >
          <ListItemIcon>
            <Description fontSize="small" sx={{ color: 'secondary.main' }} />
          </ListItemIcon>
          <ListItemText>Export as text</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
