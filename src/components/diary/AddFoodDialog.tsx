import { useCallback, useEffect, useMemo, useState } from 'react';
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
  ListItem,
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
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import type { MealLog } from './types';
import { MEAL_LABELS, type MealType } from './types';
import { useDiary } from './useDiary';

interface AddFoodDialogProps {
  open: boolean;
  mealType: MealType;
  onClose: () => void;
}

interface PortionOption {
  label: string;
  grams: number;
  helper?: string;
}

const useDebounce = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const SOURCE_LABELS: Record<Doc<'foods'>['source'], string> = {
  afcd: 'AFCD',
  ausnut: 'AUSNUT',
  branded_au: 'Brand',
  chain: 'Chain',
  usda: 'USDA',
  user_contributed: 'Custom',
  openfoodfacts_cache: 'Barcode',
};

const normalize = (value: string) => value.toLowerCase();

const basePortionOptions = (food: Doc<'foods'>): PortionOption[] => [
  ...food.commonPortions.map((p) => ({ label: p.label, grams: p.grams })),
  { label: `${food.defaultServingG} g`, grams: food.defaultServingG, helper: 'default' },
  { label: '100 g', grams: 100, helper: 'weighed' },
];

const friendlyPortionOptions = (food: Doc<'foods'>): PortionOption[] => {
  const name = normalize(`${food.brand ?? ''} ${food.name}`);
  const options: PortionOption[] = [];

  if (name.includes('pizza')) {
    options.push(
      { label: '1 slice', grams: 107, helper: '~285 kcal if pizza is 266 kcal/100g' },
      { label: '2 slices', grams: 214 },
      { label: '1/2 pizza', grams: 400 },
      { label: 'Whole pizza', grams: 800 },
    );
  }

  if (name.includes('bread') || name.includes('toast') || name.includes('sourdough')) {
    options.push(
      { label: '1 slice', grams: 35 },
      { label: '2 slices', grams: 70 },
    );
  }

  if (name.includes('cake') || name.includes('cheesecake') || name.includes('brownie')) {
    options.push(
      { label: 'Small slice', grams: 75 },
      { label: '1 slice', grams: 100 },
      { label: 'Large slice', grams: 150 },
    );
  }

  if (name.includes('sandwich')) {
    options.push(
      { label: '1/2 sandwich', grams: 100 },
      { label: '1 sandwich', grams: 200 },
    );
  }

  if (name.includes('burger')) {
    options.push({ label: '1 burger', grams: Math.max(food.defaultServingG, 220) });
  }

  if (name.includes('wrap') || name.includes('burrito')) {
    options.push(
      { label: '1/2 wrap', grams: 150 },
      { label: '1 wrap', grams: 300 },
    );
  }

  if (name.includes('banana')) {
    options.push(
      { label: 'Small banana', grams: 100 },
      { label: 'Medium banana', grams: 118 },
      { label: 'Large banana', grams: 136 },
    );
  }

  if (name.includes('apple')) {
    options.push(
      { label: 'Small apple', grams: 150 },
      { label: 'Medium apple', grams: 180 },
      { label: 'Large apple', grams: 220 },
    );
  }

  if (name.includes('rice')) {
    options.push(
      { label: '1/2 cup cooked', grams: 80 },
      { label: '1 cup cooked', grams: 160 },
      { label: '2 cups cooked', grams: 320 },
    );
  }

  if (name.includes('pasta') || name.includes('spaghetti')) {
    options.push(
      { label: '1 cup cooked', grams: 140 },
      { label: '2 cups cooked', grams: 280 },
    );
  }

  return options;
};

const portionOptionsForFood = (food: Doc<'foods'>): PortionOption[] => {
  const seen = new Set<string>();
  const addUnique = (option: PortionOption, acc: PortionOption[]) => {
    if (!Number.isFinite(option.grams) || option.grams <= 0) return;
    const key = `${option.label.toLowerCase()}-${Math.round(option.grams)}`;
    if (seen.has(key)) return;
    seen.add(key);
    acc.push({ ...option, grams: Math.round(option.grams) });
  };

  const options: PortionOption[] = [];
  for (const option of friendlyPortionOptions(food)) addUnique(option, options);
  for (const option of basePortionOptions(food)) addUnique(option, options);
  return options.slice(0, 10);
};

export const AddFoodDialog = ({ open, mealType, onClose }: AddFoodDialogProps) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [picked, setPicked] = useState<Doc<'foods'> | null>(null);
  const [quantityG, setQuantityG] = useState<number>(0);
  const { addEntry, relogEntry, recentFoods } = useDiary();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const resetState = useCallback(() => {
    setSearch('');
    setPicked(null);
    setQuantityG(0);
  }, []);

  const trimmedSearch = debouncedSearch.trim();
  const results = useQuery(
    api.foods.searchFoods,
    trimmedSearch.length > 0 ? { query: trimmedSearch, limit: 25 } : 'skip',
  );

  const portionOptions = useMemo(
    () => (picked ? portionOptionsForFood(picked) : []),
    [picked],
  );

  const handlePick = (food: Doc<'foods'>) => {
    setPicked(food);
    const options = portionOptionsForFood(food);
    setQuantityG(options[0]?.grams ?? food.defaultServingG);
  };

  const handleRecentAdd = (entry: MealLog) => {
    void relogEntry(mealType, entry)
      .then(() => {
        toast(`Added ${entry.foodName}`, { icon: '🍽️' });
        onClose();
      })
      .catch((error: unknown) => {
        toast.error(errorMessage(error, `Could not add ${entry.foodName}`));
      });
  };

  const handleAdd = () => {
    if (!picked || quantityG <= 0) return;
    const matchedPortion = portionOptions.find((p) => p.grams === quantityG);
    void addEntry({
      mealType,
      foodId: picked._id,
      quantityG,
      servingLabel: matchedPortion?.label,
    })
      .then(() => {
        toast(`Added ${picked.name}`, { icon: '🍽️' });
        onClose();
      })
      .catch((error: unknown) => {
        toast.error(errorMessage(error, `Could not add ${picked.name}`));
      });
  };

  const scale = quantityG / 100;
  const scaled = picked && quantityG > 0
    ? {
        calories: Math.round(picked.nutrientsPer100g.calories * scale),
        proteinG: round1(picked.nutrientsPer100g.proteinG * scale),
        carbsG: round1(picked.nutrientsPer100g.carbsG * scale),
        fatG: round1(picked.nutrientsPer100g.fatG * scale),
      }
    : null;

  return (
    <Dialog
      fullScreen={isMobile}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: { display: 'flex', flexDirection: 'column' } },
        transition: { onExited: resetState },
      }}
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
            onClick={picked ? () => setPicked(null) : onClose}
          >
            {picked ? <ArrowBackIcon /> : <CloseIcon />}
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            {picked ? picked.name : `Add to ${MEAL_LABELS[mealType]}`}
          </Typography>
        </Toolbar>
      </AppBar>

      {!picked ? (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            flexGrow: 1,
            minHeight: 0,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search foods…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              recentFoods.length > 0 ? (
                <>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ px: 1, pt: 0.5, display: 'block' }}
                  >
                    Recent
                  </Typography>
                  <List disablePadding>
                    {recentFoods.map((entry) => (
                      <ListItem
                        key={entry.id}
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            color="secondary"
                            aria-label={`Add ${entry.foodName} to ${MEAL_LABELS[mealType]}`}
                            onClick={() => handleRecentAdd(entry)}
                          >
                            <AddIcon />
                          </IconButton>
                        }
                      >
                        <ListItemButton
                          sx={{ pr: 7 }}
                          onClick={() => handleRecentAdd(entry)}
                        >
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                              noWrap
                            >
                              {entry.foodName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {entry.brand ? `${entry.brand} · ` : ''}
                              {entry.servingLabel ?? `${entry.quantityG} g`} ·{' '}
                              {Math.round(entry.calories)} kcal
                            </Typography>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 2, textAlign: 'center' }}
                >
                  Type to search — try "pizza", "bread", "cheesecake", or "Weet-Bix".
                </Typography>
              )
            ) : results === undefined ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ p: 2, textAlign: 'center' }}
              >
                Searching…
              </Typography>
            ) : results.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ p: 2, textAlign: 'center' }}
              >
                No foods found.
              </Typography>
            ) : (
              <List disablePadding>
                {results.map((food) => {
                  const servingKcal = Math.round(
                    (food.nutrientsPer100g.calories * food.defaultServingG) / 100,
                  );
                  return (
                    <ListItemButton key={food._id} onClick={() => handlePick(food)}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          gap={1}
                          alignItems="center"
                          sx={{ minWidth: 0, mb: 0.25 }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, minWidth: 0, flexGrow: 1 }}
                            noWrap
                          >
                            {food.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={SOURCE_LABELS[food.source]}
                            sx={{ height: 20, '& .MuiChip-label': { px: 0.75 } }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {food.brand ? `${food.brand} · ` : ''}
                          {food.defaultServingG} g · {servingKcal} kcal
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
                const selected = portion.grams === quantityG;
                return (
                  <Chip
                    key={`${portion.label}-${portion.grams}`}
                    clickable
                    color={selected ? 'secondary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    label={portion.label}
                    onClick={() => setQuantityG(portion.grams)}
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
            onChange={(e) => setQuantityG(Math.max(0, Number(e.target.value)))}
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
            disabled={quantityG <= 0}
            onClick={handleAdd}
          >
            Add to {MEAL_LABELS[mealType]}
          </Button>
        </Box>
      )}
    </Dialog>
  );
};
