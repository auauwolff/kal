import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  RestaurantMenu as DiaryIcon,
  ShowChart as StatsIcon,
} from '@mui/icons-material';
import { useNavigate, useRouterState } from '@tanstack/react-router';

const KalIcon = () => (
  <img
    src="/kal-fat.svg"
    alt="Kal"
    style={{ width: 40, height: 40, display: 'block' }}
  />
);

const navItems = [
  { label: 'Diary', icon: <DiaryIcon />, path: '/' },
  { label: '', icon: <KalIcon />, path: '/kal' },
  { label: 'Stats', icon: <StatsIcon />, path: '/stats' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const currentIndex = navItems.findIndex((item) => item.path === pathname);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: 1,
        borderColor: 'divider',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(_, newIndex) => {
          void navigate({ to: navItems[newIndex].path });
        }}
        showLabels
        sx={{
          bgcolor: 'background.paper',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            py: 1,
          },
          '& .Mui-selected': {
            color: 'primary.main',
          },
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};
