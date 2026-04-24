import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeStore } from '@/stores/themeStore';

export const DarkModeToggle = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <Tooltip title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton color="inherit" onClick={toggleTheme} size="small">
        {isDarkMode ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};
