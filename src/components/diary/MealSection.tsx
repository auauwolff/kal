import { useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  BreakfastDining,
  Cookie,
  DeleteOutline,
  DinnerDining,
  LunchDining,
  MoreVert,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { MealLog, MealType } from './types';
import { MEAL_LABELS, MEAL_TYPES } from './types';
import { useDiary } from './useDiary';
import { AddFoodDialog } from './AddFoodDialog';

interface MealSectionProps {
  mealType: MealType;
}

const MEAL_ICONS: Record<MealType, ReactNode> = {
  breakfast: <BreakfastDining fontSize="small" sx={{ color: 'secondary.main' }} />,
  lunch: <LunchDining fontSize="small" sx={{ color: 'secondary.main' }} />,
  dinner: <DinnerDining fontSize="small" sx={{ color: 'secondary.main' }} />,
  snack: <Cookie fontSize="small" sx={{ color: 'secondary.main' }} />,
};

interface EntryRowProps {
  entry: MealLog;
  onMove: (to: MealType) => void;
  onDelete: () => void;
}

const EntryRow = ({ entry, onMove, onDelete }: EntryRowProps) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const handleMove = (to: MealType) => {
    closeMenu();
    onMove(to);
  };
  const handleDelete = () => {
    closeMenu();
    onDelete();
  };

  const otherMealTypes = MEAL_TYPES.filter((t) => t !== entry.mealType);

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
          {entry.foodName}
          {entry.brand && (
            <Box
              component="span"
              sx={{ color: 'text.secondary', fontWeight: 400 }}
            >
              {' '}· {entry.brand}
            </Box>
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {entry.servingLabel ?? `${entry.quantityG} g`} ·{' '}
          {Math.round(entry.calories)} kcal
        </Typography>
      </Box>
      <IconButton size="small" edge="end" onClick={openMenu}>
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={closeMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        {otherMealTypes.map((to) => (
          <MenuItem key={to} onClick={() => handleMove(to)}>
            <ListItemIcon>{MEAL_ICONS[to]}</ListItemIcon>
            <ListItemText>Move to {MEAL_LABELS[to]}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutline fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  );
};

export const MealSection = ({ mealType }: MealSectionProps) => {
  const theme = useTheme();
  const { meals, moveEntry, deleteEntry } = useDiary();
  const [dialogOpen, setDialogOpen] = useState(false);
  const entries = meals[mealType];
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const handleAdd = () => setDialogOpen(true);

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {MEAL_LABELS[mealType]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(totals.calories)} kcal ·{' '}
              <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                {Math.round(totals.proteinG)}P
              </Box>{' '}
              ·{' '}
              <Box component="span" sx={{ color: theme.palette.warning.dark, fontWeight: 600 }}>
                {Math.round(totals.carbsG)}C
              </Box>{' '}
              ·{' '}
              <Box component="span" sx={{ color: theme.palette.error.light, fontWeight: 600 }}>
                {Math.round(totals.fatG)}F
              </Box>
            </Typography>
          </Stack>
          <IconButton size="small" color="secondary" onClick={handleAdd}>
            <AddIcon />
          </IconButton>
        </Stack>

        {entries.length > 0 && <Divider sx={{ my: 1 }} />}

        <Stack sx={{ gap: 1 }}>
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onMove={(to) => {
                moveEntry(entry.id, to);
                toast(`Moved to ${MEAL_LABELS[to]}`, { icon: '🍽️' });
              }}
              onDelete={() => {
                deleteEntry(entry.id);
                toast(`Deleted ${entry.foodName}`, { icon: '🗑️' });
              }}
            />
          ))}

          {entries.length === 0 && (
            <Button
              variant="text"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
            >
              Add {MEAL_LABELS[mealType].toLowerCase()}
            </Button>
          )}
        </Stack>
      </CardContent>
      <AddFoodDialog
        open={dialogOpen}
        mealType={mealType}
        onClose={() => setDialogOpen(false)}
      />
    </Card>
  );
};
