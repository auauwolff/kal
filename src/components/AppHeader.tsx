import { useEffect, useRef, useState } from 'react';
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
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import {
  Diamond,
  Logout,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '@workos-inc/authkit-react';
import { useMutation, useQuery } from 'convex/react';
import { useNavigate } from '@tanstack/react-router';
import { useWebHaptics } from 'web-haptics/react';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { useParticles } from '@/components/ParticlesProvider';
import { playGemSound } from '@/lib/gemSound';
import { useGemsStore } from '@/stores/gemsStore';
import { api } from '../../convex/_generated/api';
import { GEM_EMOJIS, gemParticleCount, userInitials } from './appHeaderUtils';

const shake = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  20%      { transform: translate(-3px, 2px) rotate(-12deg); }
  40%      { transform: translate(3px, -2px) rotate(12deg); }
  60%      { transform: translate(-2px, 1px) rotate(-8deg); }
  80%      { transform: translate(2px, -1px) rotate(6deg); }
`;

const pop = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.6); }
  100% { transform: scale(1); }
`;

export const AppHeader = () => {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const convexUser = useQuery(api.users.get, {});
  const backfillMyGems = useMutation(api.users.backfillMyGems);
  const balance = useGemsStore((s) => s.balance);
  const setGemBalance = useGemsStore((s) => s.setBalance);
  const serverUserId = convexUser?._id;
  const serverGemBalance = convexUser?.gemBalance;
  const gemBalanceBackfilledAt = convexUser?.gemBalanceBackfilledAt;
  const backfillRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (convexUser === undefined) return;
    setGemBalance(serverGemBalance ?? 0);
  }, [convexUser, serverGemBalance, setGemBalance]);

  useEffect(() => {
    if (!serverUserId) {
      backfillRequestRef.current = null;
      return;
    }
    if (gemBalanceBackfilledAt) return;
    if (backfillRequestRef.current === serverUserId) return;

    backfillRequestRef.current = serverUserId;
    void backfillMyGems().catch(() => {
      backfillRequestRef.current = null;
    });
  }, [backfillMyGems, gemBalanceBackfilledAt, serverUserId]);

  const { trigger } = useWebHaptics();
  const triggerRef = useRef(trigger);
  useEffect(() => {
    triggerRef.current = trigger;
  }, [trigger]);

  const { createHoming } = useParticles();
  const createHomingRef = useRef(createHoming);
  useEffect(() => {
    createHomingRef.current = createHoming;
  }, [createHoming]);

  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const reduceMotionRef = useRef(reduceMotion);
  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);

  const chipRef = useRef<HTMLDivElement>(null);
  const [animKey, setAnimKey] = useState(0);

  // Drive sound + haptic + particles + chip self-animation from the store.
  // Phase 3 earn rules will call addGems(n) too and inherit all of this for
  // free. Using subscribe avoids React 19's set-state-in-effect warning.
  useEffect(() => {
    const unsub = useGemsStore.subscribe((state, prev) => {
      if (state.addEventNonce === prev.addEventNonce) return;

      // Sound
      try {
        playGemSound();
      } catch {
        // AudioContext blocked or unsupported — silent fallback.
      }
      // Haptic — buzz preset gives the dramatic long-vibration feel from the demo
      try {
        void triggerRef.current('buzz');
      } catch {
        // Vibration API unsupported — silent fallback.
      }
      const shouldReduceMotion = reduceMotionRef.current;

      // Chip self-animation. Keep this even in reduced-motion mode so mobile/PWA
      // users still get visible feedback instead of vibration only.
      setAnimKey((k) => k + 1);

      // Center-pop → free scatter → fly to the counter, buzzing along the way.
      // Particle count scales with amount so a +1 nudge feels different from
      // a +50 reward. In reduced-motion mode, use a tiny sparkle near the chip
      // instead of the full-screen flight.
      const rect = chipRef.current?.getBoundingClientRect();
      const targetX = rect ? rect.left + rect.width / 2 : 32;
      const targetY = rect ? rect.top + rect.height / 2 : 32;
      const amount = gemParticleCount(state.lastAddedAmount);

      if (shouldReduceMotion) {
        createHomingRef.current(
          targetX,
          targetY + 24,
          targetX,
          targetY,
          GEM_EMOJIS,
          Math.min(amount, 6),
        );
        return;
      }

      const viewport = window.visualViewport;
      const originX = (viewport?.width ?? window.innerWidth) / 2;
      const originY = (viewport?.height ?? window.innerHeight) / 2;
      createHomingRef.current(
        originX,
        originY,
        targetX,
        targetY,
        GEM_EMOJIS,
        amount,
      );
    });
    return unsub;
  }, []);

  const gemsActive = balance > 0;
  const gemColor = gemsActive ? 'info.main' : 'text.disabled';

  const initials = userInitials(user);

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
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ flexGrow: 1 }}
        >
          <Tooltip
            title={
              gemsActive
                ? `${balance} gems`
                : 'Earn gems by logging meals'
            }
          >
            <Stack
              ref={chipRef}
              direction="row"
              alignItems="center"
              spacing={0.5}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  lineHeight: 0,
                }}
              >
                <Diamond
                  key={animKey}
                  sx={{
                    color: gemColor,
                    fontSize: 28,
                    transition: 'color 300ms ease-out',
                    animation:
                      animKey > 0 ? `${shake} 600ms ease-out` : 'none',
                  }}
                />
              </Box>
              <Typography
                key={`count-${animKey}`}
                sx={{
                  color: gemColor,
                  fontWeight: 800,
                  fontSize: 20,
                  lineHeight: 1,
                  transition: 'color 300ms ease-out',
                  animation: animKey > 0 ? `${pop} 400ms ease-out` : 'none',
                }}
              >
                {balance}
              </Typography>
            </Stack>
          </Tooltip>
        </Stack>

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
                {initials}
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
