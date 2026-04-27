import { useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  BookmarkAddOutlined,
  BreakfastDining,
  Cookie,
  DeleteOutline,
  DinnerDining,
  LunchDining,
  MoreVert,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { MealLog, MealType } from './types';
import { MEAL_LABELS } from './types';
import { mealTotals, otherMealTypes } from './diaryUtils';
import { useDiary } from './useDiary';
import { AddFoodDialog } from './AddFoodDialog';
import { EditEntryDialog } from './EditEntryDialog';
import { SaveAsMealDialog } from './SaveAsMealDialog';
import { friendlyFoodName } from './addFoodDialogUtils';
import { errorMessage } from '@/lib/errors';

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
  onEdit: () => void;
  onMove: (to: MealType) => void;
  onDelete: () => void;
}

const EntryRow = ({ entry, onEdit, onMove, onDelete }: EntryRowProps) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => setMenuAnchor(null);

  const handleMove = (to: MealType) => {
    closeMenu();
    onMove(to);
  };
  const handleDelete = () => {
    closeMenu();
    onDelete();
  };

  const moveTargets = otherMealTypes(entry.mealType);

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
      <ButtonBase
        onClick={onEdit}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          textAlign: 'left',
          py: 0.5,
          px: 0.5,
          mx: -0.5,
          borderRadius: 1,
          justifyContent: 'flex-start',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {friendlyFoodName({ name: entry.foodName })}
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
      </ButtonBase>
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
        {moveTargets.map((to) => (
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
  const [editEntry, setEditEntry] = useState<MealLog | null>(null);
  const [saveMealOpen, setSaveMealOpen] = useState(false);
  const entries = meals[mealType];
  const totals = mealTotals(entries);

  const handleAdd = () => setDialogOpen(true);
  const handleSaveAsMeal = () => setSaveMealOpen(true);

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
          <Tooltip
            title={entries.length > 0 ? 'Save as meal' : 'Add foods first'}
          >
            <span>
              <IconButton
                size="small"
                onClick={handleSaveAsMeal}
                disabled={entries.length === 0}
                aria-label={`Save ${MEAL_LABELS[mealType]} as meal`}
              >
                <BookmarkAddOutlined
                  fontSize="small"
                  sx={{
                    color: entries.length > 0 ? 'secondary.main' : undefined,
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
          <Stack
            direction="row"
            sx={{ alignItems: 'baseline', gap: 1, flexGrow: 1, minWidth: 0 }}
          >
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
              onEdit={() => setEditEntry(entry)}
              onMove={(to) => {
                void moveEntry(entry.id, to).catch((error: unknown) =>
                  toast.error(errorMessage(error, 'Could not move meal')),
                );
              }}
              onDelete={() => {
                void deleteEntry(entry.id).catch((error: unknown) =>
                  toast.error(errorMessage(error, `Could not delete ${entry.foodName}`)),
                );
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
      <EditEntryDialog
        key={editEntry?.id ?? 'closed'}
        open={Boolean(editEntry)}
        entry={editEntry}
        onClose={() => setEditEntry(null)}
      />
      <SaveAsMealDialog
        key={saveMealOpen ? `open-${mealType}` : 'closed'}
        open={saveMealOpen}
        mealType={mealType}
        itemCount={entries.length}
        onClose={() => setSaveMealOpen(false)}
      />
    </Card>
  );
};
