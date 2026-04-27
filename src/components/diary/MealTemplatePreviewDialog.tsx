import { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  DeleteOutline,
  EditOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { friendlyFoodName } from './addFoodDialogUtils';
import { MEAL_LABELS, type MealType } from './types';
import { useDiary } from './useDiary';
import { errorMessage } from '@/lib/errors';
import { MealBuilderDialog } from './MealBuilderDialog';

interface PreviewItem {
  foodId: string;
  foodName: string;
  brand?: string;
  quantityG: number;
  servingLabel?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  missing?: boolean;
}

interface PreviewTemplate {
  id: string;
  name: string;
  items: PreviewItem[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

interface MealTemplatePreviewDialogProps {
  open: boolean;
  template: PreviewTemplate | null;
  mealType: MealType;
  onClose: () => void;
  onLogged?: () => void;
}

export const MealTemplatePreviewDialog = ({
  open,
  template,
  mealType,
  onClose,
  onLogged,
}: MealTemplatePreviewDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logMealTemplate, deleteMealTemplate } = useDiary();
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleAdd = async () => {
    if (!template) return;
    setBusy(true);
    try {
      const result = await logMealTemplate(mealType, template.id);
      const noun = result.loggedCount === 1 ? 'item' : 'items';
      const msg =
        result.missingCount > 0
          ? `${template.name} added (${result.loggedCount} ${noun}, ${result.missingCount} missing)`
          : `${template.name} added (${result.loggedCount} ${noun})`;
      toast.success(msg);
      onLogged?.();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, `Could not add ${template.name}`));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    setBusy(true);
    try {
      await deleteMealTemplate(template.id);
      toast.success(`"${template.name}" deleted`);
      setConfirmDelete(false);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete meal'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        open={open && !editOpen}
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
              {template?.name ?? 'Meal'}
            </Typography>
            <IconButton color="secondary" onClick={() => setEditOpen(true)} aria-label="Edit meal">
              <EditOutlined />
            </IconButton>
          </Toolbar>
        </AppBar>

        {template && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Total · {template.items.length} item{template.items.length === 1 ? '' : 's'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {template.totals.calories} kcal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                  {template.totals.proteinG}P
                </Box>
                {' · '}
                <Box component="span" sx={{ color: theme.palette.warning.dark, fontWeight: 600 }}>
                  {template.totals.carbsG}C
                </Box>
                {' · '}
                <Box component="span" sx={{ color: theme.palette.error.light, fontWeight: 600 }}>
                  {template.totals.fatG}F
                </Box>
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Ingredients
              </Typography>
              <List disablePadding>
                {template.items.map((item, idx) => (
                  <ListItem key={`${item.foodId}-${idx}`} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: item.missing ? 'text.disabled' : undefined }}
                          noWrap
                        >
                          {friendlyFoodName({ name: item.foodName })}
                          {item.brand && (
                            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                              {' · '}
                              {item.brand}
                            </Box>
                          )}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {item.servingLabel ?? `${item.quantityG} g`} ·{' '}
                          {item.missing ? 'removed' : `${item.calories} kcal`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider />

            <Stack gap={1}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => void handleAdd()}
                disabled={busy || template.items.every((i) => i.missing)}
              >
                Add to {MEAL_LABELS[mealType]}
              </Button>
              <Button
                color="error"
                startIcon={<DeleteOutline />}
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                Delete meal
              </Button>
            </Stack>
          </Box>
        )}
      </Dialog>

      <MealBuilderDialog
        key={editOpen ? `edit-${template?.id ?? 'none'}` : 'edit-closed'}
        open={editOpen}
        existing={template}
        onClose={() => {
          setEditOpen(false);
          onClose();
        }}
      />

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Delete this meal?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            "{template?.name}" will be removed from your saved meals. Past diary entries are not affected.
          </Typography>
          <Stack direction="row" gap={1} justifyContent="flex-end">
            <Button onClick={() => setConfirmDelete(false)} disabled={busy}>
              Cancel
            </Button>
            <Button color="error" variant="contained" onClick={() => void handleDelete()} disabled={busy}>
              Delete
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </>
  );
};
