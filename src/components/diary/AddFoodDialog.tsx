import { useCallback, useEffect, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  MenuItem,
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
import { useShallow } from 'zustand/react/shallow';
import { useQuery } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { selectRecentFoods, useDiaryStore } from '@/stores/diaryStore';
import type { MealLog } from './types';
import { MEAL_LABELS, type MealType } from './types';

interface AddFoodDialogProps {
  open: boolean;
  mealType: MealType;
  onClose: () => void;
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

export const AddFoodDialog = ({ open, mealType, onClose }: AddFoodDialogProps) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [picked, setPicked] = useState<Doc<'foods'> | null>(null);
  const [quantityG, setQuantityG] = useState<number>(0);
  const addEntry = useDiaryStore((s) => s.addEntry);
  const relogEntry = useDiaryStore((s) => s.relogEntry);
  const recentFoods = useDiaryStore(useShallow(selectRecentFoods));
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

  const handlePick = (food: Doc<'foods'>) => {
    setPicked(food);
    setQuantityG(food.defaultServingG);
  };

  const handleQuickAdd = (entry: MealLog) => {
    relogEntry(mealType, entry);
    toast(`Added ${entry.foodName}`, { icon: '🍽️' });
    onClose();
  };

  const handleAdd = () => {
    if (!picked || quantityG <= 0) return;
    const matchedPortion = picked.commonPortions.find((p) => p.grams === quantityG);
    addEntry({
      mealType,
      foodId: picked._id,
      foodName: picked.name,
      brand: picked.brand,
      quantityG,
      servingLabel: matchedPortion?.label,
      nutrientsPer100g: {
        calories: picked.nutrientsPer100g.calories,
        proteinG: picked.nutrientsPer100g.proteinG,
        carbsG: picked.nutrientsPer100g.carbsG,
        fatG: picked.nutrientsPer100g.fatG,
      },
    });
    toast(`Added ${picked.name}`, { icon: '🍽️' });
    onClose();
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

  const selectedPortionValue =
    picked?.commonPortions.find((p) => p.grams === quantityG)?.grams ?? '';

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
                        key={entry.foodId}
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            color="secondary"
                            aria-label={`Add ${entry.foodName} to ${MEAL_LABELS[mealType]}`}
                            onClick={() => handleQuickAdd(entry)}
                          >
                            <AddIcon />
                          </IconButton>
                        }
                      >
                        <ListItemButton
                          sx={{ pr: 7 }}
                          onClick={() => handleQuickAdd(entry)}
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
                  Type to search — try "Weet-Bix", "GYG", or "banana".
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
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500 }}
                          noWrap
                        >
                          {food.name}
                        </Typography>
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
          {picked.brand && (
            <Typography variant="body2" color="text.secondary">
              {picked.brand}
            </Typography>
          )}

          <Stack direction="row" gap={2} alignItems="flex-start">
            <TextField
              label="Quantity"
              type="number"
              value={quantityG}
              onChange={(e) => setQuantityG(Math.max(0, Number(e.target.value)))}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">g</InputAdornment>,
                },
                htmlInput: { min: 0, inputMode: 'decimal' },
              }}
              sx={{ flex: 1 }}
            />

            {picked.commonPortions.length > 0 && (
              <TextField
                select
                label="Portion"
                value={selectedPortionValue}
                onChange={(e) => {
                  const grams = Number(e.target.value);
                  if (!Number.isNaN(grams) && grams > 0) setQuantityG(grams);
                }}
                sx={{ flex: 1 }}
              >
                {selectedPortionValue === '' && (
                  <MenuItem value="" disabled>
                    Choose…
                  </MenuItem>
                )}
                {picked.commonPortions.map((p) => (
                  <MenuItem key={p.label} value={p.grams}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>

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
