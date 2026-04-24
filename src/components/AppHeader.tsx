import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { Logout, Settings as SettingsIcon } from '@mui/icons-material';
import { useAuth } from '@workos-inc/authkit-react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const TITLE_BY_PATH: Record<string, string> = {
  '/': 'Diary',
  '/kal': 'Kal',
  '/reports': 'Stats',
  '/settings': 'Settings',
};

export const AppHeader = () => {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const title = TITLE_BY_PATH[pathname] ?? 'Kal';

  const initials =
    (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '') ||
    user?.email?.[0]?.toUpperCase() ||
    '?';

  const openMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleSettings = () => {
    closeMenu();
    void navigate({ to: '/settings' });
  };

  const handleSignOut = () => {
    closeMenu();
    void signOut();
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar variant="dense" sx={{ gap: 1 }}>
        <Box
          component="img"
          src="/kal-fat.svg"
          alt="Kal"
          sx={{ height: 32, width: 32 }}
        />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {title}
        </Typography>

        <DarkModeToggle />

        {user ? (
          <>
            <IconButton onClick={openMenu} size="small" sx={{ ml: 0.5 }}>
              <Avatar
                src={user.profilePictureUrl ?? undefined}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {initials.toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={closeMenu}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              slotProps={{ paper: { sx: { minWidth: 180 } } }}
            >
              <MenuItem onClick={handleSettings}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut}>
                <ListItemIcon>
                  <Logout fontSize="small" sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                Sign out
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button variant="contained" size="small" onClick={() => void signIn()}>
            Sign in
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};
