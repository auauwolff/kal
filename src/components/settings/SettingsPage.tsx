import { useAuth } from '@workos-inc/authkit-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  FlagOutlined,
  StraightenOutlined,
  FileDownloadOutlined,
  InfoOutlined,
  DarkMode,
  Logout,
} from '@mui/icons-material';
import { useThemeStore } from '@/stores/themeStore';

const placeholders = [
  { icon: <FlagOutlined />, label: 'Targets', caption: 'Calories, protein, carbs, fat' },
  { icon: <StraightenOutlined />, label: 'Units', caption: 'Metric / imperial' },
  { icon: <FileDownloadOutlined />, label: 'Export CSV', caption: 'All meal + weight + exercise data' },
  { icon: <InfoOutlined />, label: 'About', caption: 'Version, credits, AUSNUT attribution' },
];

export const SettingsPage = () => {
  const { user, signIn, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', width: '100%', p: { xs: 2, sm: 3 } }}>
      <Stack sx={{ gap: 2 }}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack sx={{ gap: 0.5, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Signed in as
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {user?.firstName
                  ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                  : (user?.email ?? 'Unknown')}
              </Typography>
              {user?.email && user.firstName && (
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              )}
            </Stack>

            <List disablePadding>
              <ListItem
                disableGutters
                secondaryAction={
                  <Switch checked={isDarkMode} onChange={toggleTheme} />
                }
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <DarkMode />
                </ListItemIcon>
                <ListItemText
                  primary="Dark mode"
                  secondary="Follows system at first launch"
                />
              </ListItem>
              <Divider />
              {placeholders.map((p) => (
                <ListItem key={p.label} disableGutters sx={{ opacity: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{p.icon}</ListItemIcon>
                  <ListItemText
                    primary={p.label}
                    secondary={`${p.caption} · coming soon`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {user ? (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Logout />}
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        ) : (
          <Button variant="contained" onClick={() => void signIn()}>
            Sign in
          </Button>
        )}
      </Stack>
    </Box>
  );
};
