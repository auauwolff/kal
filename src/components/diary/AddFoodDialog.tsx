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

interface AddFoodDialogProps {
  open: boolean;
  mealType: MealType;
  onClose: () => void;
}

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
        onClose();
      })
      .catch((error: unknown) => {
        toast.error(errorMessage(error, `Could not add ${picked.name}`));
      });
  };

  const scaled = scaledNutritionForQuantity(picked, quantityG);

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
            {picked ? friendlyFoodName(picked) : `Add to ${MEAL_LABELS[mealType]}`}
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
                              {friendlyFoodName({ name: entry.foodName })}
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
                  const displayName = friendlyFoodName(food);
                  const primaryPortion = portionOptionsForFood(food)[0] ?? {
                    label: `${food.defaultServingG} g`,
                    grams: food.defaultServingG,
                  };
                  const servingKcal = servingCaloriesForFood(food, primaryPortion.grams);
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
