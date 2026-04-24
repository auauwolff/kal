import { Button, Stack } from '@mui/material';
import {
  ContentCopy,
  AddCircleOutline,
  Bookmark,
  History,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const actions = [
  {
    label: 'Copy yesterday',
    icon: <ContentCopy />,
    message: 'Copy Yesterday — wires up with meal_logs queries in the next task',
  },
  {
    label: 'Quick add',
    icon: <AddCircleOutline />,
    message: 'Quick-Add calories — coming with the add-food flow',
  },
  {
    label: 'Templates',
    icon: <Bookmark />,
    message: 'Meal templates — coming with the add-food flow',
  },
  {
    label: 'Recent',
    icon: <History />,
    message: 'Recent foods — coming with the add-food flow',
  },
];

export const DayActions = () => (
  <Stack
    direction="row"
    sx={{
      gap: 1,
      overflowX: 'auto',
      px: 0.5,
      py: 0.5,
      '&::-webkit-scrollbar': { display: 'none' },
    }}
  >
    {actions.map((action) => (
      <Button
        key={action.label}
        variant="outlined"
        size="small"
        startIcon={action.icon}
        onClick={() => toast(action.message, { icon: '⚡' })}
        sx={{ flexShrink: 0, borderRadius: 999 }}
      >
        {action.label}
      </Button>
    ))}
  </Stack>
);
