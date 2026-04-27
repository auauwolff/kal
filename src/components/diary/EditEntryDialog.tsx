import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, DeleteOutline } from '@mui/icons-material';
import { useQuery } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { MealLog } from './types';
import { MEAL_LABELS } from './types';
import {
  friendlyFoodName,
  portionOptionsForFood,
  scaledNutritionForQuantity,
} from './addFoodDialogUtils';
import { useDiary } from './useDiary';
import { errorMessage } from '@/lib/errors';

interface EditEntryDialogProps {
  open: boolean;
  entry: MealLog | null;
  onClose: () => void;
}

export const EditEntryDialog = ({ open, entry, onClose }: EditEntryDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { updateEntry, deleteEntry } = useDiary();
  const [quantityG, setQuantityG] = useState<number>(() => entry?.quantityG ?? 0);
  const [servingLabel, setServingLabel] = useState<string | null>(
    () => entry?.servingLabel ?? null,
  );
  const [saving, setSaving] = useState(false);

  const food = useQuery(
    api.foods.getById,
    entry ? { id: entry.foodId as Id<'foods'> } : 'skip',
  );

  const portionOptions = useMemo(
    () => (food ? portionOptionsForFood(food) : []),
    [food],
  );

  const scaled = scaledNutritionForQuantity(food ?? null, quantityG);

  const pickPortion = (label: string, grams: number) => {
    setQuantityG(grams);
    setServingLabel(label);
  };

  const onGramsChange = (value: number) => {
    setQuantityG(Math.max(0, value));
    const matching = portionOptions.find((p) => p.grams === value);
    setServingLabel(matching ? matching.label : null);
  };

  const handleSave = async () => {
    if (!entry || quantityG <= 0) return;
    setSaving(true);
    try {
      await updateEntry(entry.id, { quantityG, servingLabel });
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not update entry'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteEntry(entry.id);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, `Could not delete ${entry.foodName}`));
    }
  };

  return (
    <Dialog
      fullScreen={isMobile}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { display: 'flex', flexDirection: 'column' } } }}
    >
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" color="secondary" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            {entry ? friendlyFoodName({ name: entry.foodName }) : 'Edit'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {entry && (
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Chip size="small" label={MEAL_LABELS[entry.mealType]} />
            {entry.brand && (
              <Typography variant="body2" color="text.secondary">
                {entry.brand}
              </Typography>
            )}
          </Stack>
        )}

        {food === undefined ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : food === null ? (
          <Typography variant="body2" color="error">
            This food could not be loaded. Try deleting and re-adding.
          </Typography>
        ) : (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Choose a portion
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {portionOptions.map((portion) => {
                  const selected = portion.grams === quantityG;
                  return (
                    <Chip
                      key={`${portion.label}-${portion.grams}`}
                      clickable
                      color={selected ? 'secondary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      label={portion.label}
                      onClick={() => pickPortion(portion.label, portion.grams)}
                      sx={{ fontWeight: selected ? 700 : 500 }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <TextField
              label="Or enter grams"
              type="number"
              value={quantityG}
              onChange={(e) => onGramsChange(Number(e.target.value))}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">g</InputAdornment>,
                },
                htmlInput: { min: 0, inputMode: 'decimal' },
              }}
            />

            {scaled && (
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  This serving
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {scaled.calories} kcal
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <Box
                    component="span"
                    sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                  >
                    {scaled.proteinG}P
                  </Box>
                  {' · '}
                  <Box
                    component="span"
                    sx={{ color: theme.palette.warning.dark, fontWeight: 600 }}
                  >
                    {scaled.carbsG}C
                  </Box>
                  {' · '}
                  <Box
                    component="span"
                    sx={{ color: theme.palette.error.light, fontWeight: 600 }}
                  >
                    {scaled.fatG}F
                  </Box>
                </Typography>
              </Box>
            )}

            <Divider />

            <Button
              variant="contained"
              color="secondary"
              size="large"
              disabled={quantityG <= 0 || saving}
              onClick={() => {
                void handleSave();
              }}
            >
              Save changes
            </Button>
            <Button
              startIcon={<DeleteOutline />}
              color="error"
              onClick={() => {
                void handleDelete();
              }}
            >
              Delete entry
            </Button>
          </>
        )}
      </Box>
    </Dialog>
  );
};
