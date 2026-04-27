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
  Tab,
  Tabs,
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
  EditNote as EditNoteIcon,
  RestaurantMenu as RestaurantMenuIcon,
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
import { ManualFoodDialog } from './ManualFoodDialog';
import { MealBuilderDialog } from './MealBuilderDialog';
import { MealTemplatePreviewDialog } from './MealTemplatePreviewDialog';

interface AddFoodDialogProps {
  open: boolean;
  mealType: MealType;
  onClose: () => void;
}

type Tab = 'foods' | 'meals';

export const AddFoodDialog = ({ open, mealType, onClose }: AddFoodDialogProps) => {
  const [tab, setTab] = useState<Tab>('foods');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [picked, setPicked] = useState<Doc<'foods'> | null>(null);
  const [quantityG, setQuantityG] = useState<number>(0);
  const [manualOpen, setManualOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [quickLoggingId, setQuickLoggingId] = useState<string | null>(null);
  const {
    addEntry,
    relogEntry,
    recentFoods,
    mealTemplates,
    logMealTemplate,
  } = useDiary();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const previewTemplate = previewTemplateId
    ? mealTemplates.find((t) => t.id === previewTemplateId) ?? null
    : null;

  const resetState = useCallback(() => {
    setSearch('');
    setPicked(null);
    setQuantityG(0);
    setTab('foods');
  }, []);

  const handleQuickLogTemplate = (templateId: string, templateName: string) => {
    setQuickLoggingId(templateId);
    void logMealTemplate(mealType, templateId)
      .then((result) => {
        const noun = result.loggedCount === 1 ? 'item' : 'items';
        const msg =
          result.missingCount > 0
            ? `${templateName} added (${result.loggedCount} ${noun}, ${result.missingCount} missing)`
            : `${templateName} added (${result.loggedCount} ${noun})`;
        toast.success(msg);
        onClose();
      })
      .catch((error: unknown) => {
        toast.error(errorMessage(error, `Could not add ${templateName}`));
      })
      .finally(() => {
        setQuickLoggingId(null);
      });
  };

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
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            minHeight: 0,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value: Tab) => setTab(value)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
          >
            <Tab
              value="foods"
              label="Foods"
              sx={{ minHeight: 40, fontWeight: 600, textTransform: 'none' }}
            />
            <Tab
              value="meals"
              label={`Meals${mealTemplates.length > 0 ? ` (${mealTemplates.length})` : ''}`}
              sx={{ minHeight: 40, fontWeight: 600, textTransform: 'none' }}
            />
          </Tabs>

          {tab === 'foods' ? (
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
                      Type to search — try "banana", "chicken breast", or "Weet-Bix".
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
                  <Stack sx={{ p: 3, alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No foods found for "{trimmedSearch}".
                    </Typography>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={<EditNoteIcon />}
                      onClick={() => setManualOpen(true)}
                    >
                      Add "{trimmedSearch}" as a custom food
                    </Button>
                  </Stack>
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minHeight: 0,
              }}
            >
              <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0, pt: 1 }}>
                {mealTemplates.length === 0 ? (
                  <Stack
                    sx={{
                      p: 4,
                      gap: 1.5,
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <RestaurantMenuIcon
                      sx={{ fontSize: 40, color: 'text.disabled' }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      No saved meals yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Combine foods you eat together (like a breakfast bowl) and log
                      them in one tap. Build one below, or save a meal section from
                      your diary.
                    </Typography>
                  </Stack>
                ) : (
                  <List disablePadding>
                    {mealTemplates.map((template) => (
                      <ListItem
                        key={template.id}
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            color="secondary"
                            aria-label={`Add ${template.name} to ${MEAL_LABELS[mealType]}`}
                            onClick={() =>
                              handleQuickLogTemplate(template.id, template.name)
                            }
                            disabled={quickLoggingId === template.id}
                          >
                            <AddIcon />
                          </IconButton>
                        }
                      >
                        <ListItemButton
                          sx={{ pr: 7 }}
                          onClick={() => setPreviewTemplateId(template.id)}
                        >
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                              noWrap
                            >
                              {template.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {template.items.length} item
                              {template.items.length === 1 ? '' : 's'} ·{' '}
                              {template.totals.calories} kcal ·{' '}
                              <Box
                                component="span"
                                sx={{
                                  color: theme.palette.success.main,
                                  fontWeight: 600,
                                }}
                              >
                                {Math.round(template.totals.proteinG)}P
                              </Box>{' '}
                              ·{' '}
                              <Box
                                component="span"
                                sx={{
                                  color: theme.palette.warning.dark,
                                  fontWeight: 600,
                                }}
                              >
                                {Math.round(template.totals.carbsG)}C
                              </Box>{' '}
                              ·{' '}
                              <Box
                                component="span"
                                sx={{
                                  color: theme.palette.error.light,
                                  fontWeight: 600,
                                }}
                              >
                                {Math.round(template.totals.fatG)}F
                              </Box>
                            </Typography>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Button
                  fullWidth
                  variant={mealTemplates.length === 0 ? 'contained' : 'outlined'}
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={() => setBuilderOpen(true)}
                >
                  New meal
                </Button>
              </Box>
            </Box>
          )}
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
      <ManualFoodDialog
        open={manualOpen}
        mealType={mealType}
        initialName={trimmedSearch}
        onClose={() => setManualOpen(false)}
        onLogged={onClose}
      />
      <MealBuilderDialog
        key={builderOpen ? 'builder-open' : 'builder-closed'}
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
      />
      <MealTemplatePreviewDialog
        key={previewTemplateId ?? 'preview-closed'}
        open={Boolean(previewTemplateId)}
        template={previewTemplate}
        mealType={mealType}
        onClose={() => setPreviewTemplateId(null)}
        onLogged={onClose}
      />
    </Dialog>
  );
};
