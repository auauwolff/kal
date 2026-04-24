import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Add as AddIcon, MoreHoriz } from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { MealLog, MealType } from '@/types/diary';
import { MEAL_LABELS } from '@/types/diary';

interface MealSectionProps {
  mealType: MealType;
  entries: MealLog[];
}

export const MealSection = ({ mealType, entries }: MealSectionProps) => {
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const handleAdd = () => {
    toast(`Add to ${MEAL_LABELS[mealType]} — coming in Phase 2 food search`, {
      icon: '🍽️',
    });
  };

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
              {Math.round(totals.calories)} kcal · {Math.round(totals.proteinG)}P ·{' '}
              {Math.round(totals.carbsG)}C · {Math.round(totals.fatG)}F
            </Typography>
          </Stack>
          <IconButton size="small" color="secondary" onClick={handleAdd}>
            <AddIcon />
          </IconButton>
        </Stack>

        {entries.length > 0 && <Divider sx={{ my: 1 }} />}

        <Stack sx={{ gap: 1 }}>
          {entries.map((entry) => (
            <Stack
              key={entry.id}
              direction="row"
              sx={{ alignItems: 'center', gap: 1 }}
            >
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
              <IconButton size="small" edge="end">
                <MoreHoriz fontSize="small" />
              </IconButton>
            </Stack>
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
    </Card>
  );
};
