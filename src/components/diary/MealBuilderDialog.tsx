import { useCallback, useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  DeleteOutline,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import {
  SOURCE_LABELS,
  friendlyFoodName,
  portionOptionsForFood,
  scaledNutritionForQuantity,
  servingCaloriesForFood,
} from './addFoodDialogUtils';
import { useDiary } from './useDiary';
import { useDebounce } from '@/hooks/useDebounce';
import { errorMessage } from '@/lib/errors';

interface MealItemDraft {
  foodId: string;
  foodName: string;
  brand?: string;
  quantityG: number;
  servingLabel?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const itemNutrition = (item: MealItemDraft) => {
  const scale = item.quantityG / 100;
  return {
    calories: Math.round(item.caloriesPer100g * scale),
    proteinG: round1(item.proteinPer100g * scale),
    carbsG: round1(item.carbsPer100g * scale),
    fatG: round1(item.fatPer100g * scale),
  };
};

export interface ExistingTemplateItem {
  foodId: string;
  foodName: string;
  brand?: string;
  quantityG: number;
  servingLabel?: string;
  // Pre-computed macros for the item's current quantity. Used to derive
  // per-100g values for further scaling.
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface ExistingTemplate {
  id: string;
  name: string;
  items: ExistingTemplateItem[];
}

interface MealBuilderDialogProps {
  open: boolean;
  onClose: () => void;
  existing?: ExistingTemplate | null;
}

const itemDraftFromExisting = (item: ExistingTemplateItem): MealItemDraft => {
  const safeQty = item.quantityG > 0 ? item.quantityG : 100;
  const scale = 100 / safeQty;
  return {
    foodId: item.foodId,
    foodName: item.foodName,
    ...(item.brand ? { brand: item.brand } : {}),
    quantityG: item.quantityG,
    ...(item.servingLabel ? { servingLabel: item.servingLabel } : {}),
    caloriesPer100g: item.calories * scale,
    proteinPer100g: item.proteinG * scale,
    carbsPer100g: item.carbsG * scale,
    fatPer100g: item.fatG * scale,
  };
};

export const MealBuilderDialog = ({
  open,
  onClose,
  existing = null,
}: MealBuilderDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { createMealTemplate, updateMealTemplate } = useDiary();

  const [view, setView] = useState<'builder' | 'pick'>('builder');
  const [name, setName] = useState(() => existing?.name ?? '');
  const [items, setItems] = useState<MealItemDraft[]>(() =>
    existing ? existing.items.map(itemDraftFromExisting) : [],
  );
  const [busy, setBusy] = useState(false);

  // Pick view state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [picked, setPicked] = useState<Doc<'foods'> | null>(null);
  const [pickedQuantityG, setPickedQuantityG] = useState(0);

  const trimmedSearch = debouncedSearch.trim();
  const results = useQuery(
    api.foods.searchFoods,
    view === 'pick' && trimmedSearch.length > 0
      ? { query: trimmedSearch, limit: 25 }
      : 'skip',
  );

  const portionOptions = useMemo(
    () => (picked ? portionOptionsForFood(picked) : []),
    [picked],
  );
  const pickedScaled = scaledNutritionForQuantity(picked, pickedQuantityG);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const n = itemNutrition(item);
          return {
            calories: acc.calories + n.calories,
            proteinG: round1(acc.proteinG + n.proteinG),
            carbsG: round1(acc.carbsG + n.carbsG),
            fatG: round1(acc.fatG + n.fatG),
          };
        },
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      ),
    [items],
  );

  const openPicker = () => {
    setSearch('');
    setPicked(null);
    setPickedQuantityG(0);
    setView('pick');
  };

  const handlePickFood = (food: Doc<'foods'>) => {
    setPicked(food);
    const options = portionOptionsForFood(food);
    const initial = options[0]?.grams ?? food.defaultServingG;
    setPickedQuantityG(initial);
  };

  const confirmAddItem = () => {
    if (!picked || pickedQuantityG <= 0) return;
    const matching = portionOptions.find((p) => p.grams === pickedQuantityG);
    setItems((prev) => [
      ...prev,
      {
        foodId: picked._id,
        foodName: picked.name,
        ...(picked.brand ? { brand: picked.brand } : {}),
        quantityG: pickedQuantityG,
        ...(matching ? { servingLabel: matching.label } : {}),
        caloriesPer100g: picked.nutrientsPer100g.calories,
        proteinPer100g: picked.nutrientsPer100g.proteinG,
        carbsPer100g: picked.nutrientsPer100g.carbsG,
        fatPer100g: picked.nutrientsPer100g.fatG,
      },
    ]);
    setPicked(null);
    setPickedQuantityG(0);
    setSearch('');
    setView('builder');
  };

  const removeItemAt = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantityAt = useCallback((index: number, quantityG: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, quantityG: Math.max(0, quantityG) };
        // Custom grams clears the serving label
        if (item.servingLabel && quantityG !== item.quantityG) {
          delete next.servingLabel;
        }
        return next;
      }),
    );
  }, []);

  const canSave = name.trim().length > 0 && items.length > 0 && items.every((i) => i.quantityG > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        items: items.map((item) => ({
          foodId: item.foodId,
          quantityG: item.quantityG,
          ...(item.servingLabel ? { servingLabel: item.servingLabel } : {}),
        })),
      };
      if (existing) {
        await updateMealTemplate(existing.id, payload);
        toast.success(`"${name.trim()}" updated`);
      } else {
        await createMealTemplate(payload);
        toast.success(`"${name.trim()}" saved`);
      }
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save meal'));
    } finally {
      setBusy(false);
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
          <IconButton
            edge="start"
            color="secondary"
            onClick={view === 'pick' ? () => setView('builder') : onClose}
          >
            {view === 'pick' ? <ArrowBackIcon /> : <CloseIcon />}
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            {view === 'pick'
              ? picked
                ? friendlyFoodName(picked)
                : 'Add ingredient'
              : existing
                ? 'Edit meal'
                : 'New meal'}
          </Typography>
        </Toolbar>
      </AppBar>

      {view === 'builder' ? (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, minHeight: 0 }}>
          <TextField
            label="Meal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!existing}
            inputProps={{ maxLength: 60 }}
          />

          <Stack gap={1.5} sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
            {items.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Add ingredients below to build your meal.
              </Typography>
            ) : (
              items.map((item, index) => {
                const n = itemNutrition(item);
                return (
                  <Box
                    key={`${item.foodId}-${index}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                        {friendlyFoodName({ name: item.foodName })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.brand ? `${item.brand} · ` : ''}
                        {item.servingLabel ?? `${item.quantityG} g`} · {n.calories} kcal
                      </Typography>
                    </Box>
                    <TextField
                      type="number"
                      value={item.quantityG}
                      onChange={(e) => updateQuantityAt(index, Number(e.target.value))}
                      size="small"
                      sx={{ width: 100 }}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end">g</InputAdornment>,
                        },
                        htmlInput: { min: 0, inputMode: 'decimal' },
                      }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeItemAt(index)}
                      aria-label="Remove ingredient"
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })
            )}

            <Button
              startIcon={<AddIcon />}
              onClick={openPicker}
              color="secondary"
              sx={{ alignSelf: 'flex-start' }}
            >
              Add ingredient
            </Button>
          </Stack>

          {items.length > 0 && (
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totals.calories} kcal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                  {totals.proteinG}P
                </Box>
                {' · '}
                <Box component="span" sx={{ color: theme.palette.warning.dark, fontWeight: 600 }}>
                  {totals.carbsG}C
                </Box>
                {' · '}
                <Box component="span" sx={{ color: theme.palette.error.light, fontWeight: 600 }}>
                  {totals.fatG}F
                </Box>
              </Typography>
            </Box>
          )}

          <Divider />

          <Button
            variant="contained"
            color="secondary"
            size="large"
            disabled={!canSave || busy}
            onClick={() => void handleSave()}
          >
            {existing ? 'Save changes' : 'Save meal'}
          </Button>
        </Box>
      ) : !picked ? (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, minHeight: 0 }}>
          <TextField
            fullWidth
            placeholder="Search foods…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
            {trimmedSearch.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                Type to search for an ingredient.
              </Typography>
            ) : results === undefined ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                Searching…
              </Typography>
            ) : results.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No foods found.
              </Typography>
            ) : (
              <List disablePadding>
                {results.map((food) => {
                  const displayName = friendlyFoodName(food);
                  const primaryPortion = portionOptionsForFood(food)[0] ?? {
                    label: `${food.defaultServingG} g`,
                    grams: food.defaultServingG,
                  };
                  const servingKcal = servingCaloriesForFood(food, primaryPortion.grams);
                  return (
                    <ListItemButton key={food._id} onClick={() => handlePickFood(food)}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" gap={1} alignItems="center" sx={{ minWidth: 0, mb: 0.25 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, minWidth: 0, flexGrow: 1 }}
                            noWrap
                          >
                            {displayName}
                          </Typography>
                          <Chip
                            size="small"
                            label={SOURCE_LABELS[food.source]}
                            sx={{ height: 20, '& .MuiChip-label': { px: 0.75 } }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {food.brand ? `${food.brand} · ` : ''}
                          {primaryPortion.label} · {servingKcal} kcal
                        </Typography>
                      </Box>
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Chip size="small" label={SOURCE_LABELS[picked.source]} />
            {picked.brand && (
              <Typography variant="body2" color="text.secondary">
                {picked.brand}
              </Typography>
            )}
          </Stack>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Choose a portion
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {portionOptions.map((portion) => {
                const selected = portion.grams === pickedQuantityG;
                return (
                  <Chip
                    key={`${portion.label}-${portion.grams}`}
                    clickable
                    color={selected ? 'secondary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    label={portion.label}
                    onClick={() => setPickedQuantityG(portion.grams)}
                    sx={{ fontWeight: selected ? 700 : 500 }}
                  />
                );
              })}
            </Stack>
          </Box>

          <TextField
            label="Or enter grams"
            type="number"
            value={pickedQuantityG}
            onChange={(e) => setPickedQuantityG(Math.max(0, Number(e.target.value)))}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">g</InputAdornment>,
              },
              htmlInput: { min: 0, inputMode: 'decimal' },
            }}
          />

          {pickedScaled && (
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                This serving
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {pickedScaled.calories} kcal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                  {pickedScaled.proteinG}P
                </Box>
                {' · '}
                <Box component="span" sx={{ color: theme.palette.warning.dark, fontWeight: 600 }}>
                  {pickedScaled.carbsG}C
                </Box>
                {' · '}
                <Box component="span" sx={{ color: theme.palette.error.light, fontWeight: 600 }}>
                  {pickedScaled.fatG}F
                </Box>
              </Typography>
            </Box>
          )}

          <Divider />

          <Button
            variant="contained"
            color="secondary"
            size="large"
            disabled={pickedQuantityG <= 0}
            onClick={confirmAddItem}
          >
            Add to meal
          </Button>
        </Box>
      )}
    </Dialog>
  );
};
