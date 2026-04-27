import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { MEAL_LABELS, type MealType } from './types';
import { useDiary } from './useDiary';
import { errorMessage } from '@/lib/errors';

interface SaveAsMealDialogProps {
  open: boolean;
  mealType: MealType;
  itemCount: number;
  onClose: () => void;
}

export const SaveAsMealDialog = ({
  open,
  mealType,
  itemCount,
  onClose,
}: SaveAsMealDialogProps) => {
  const { saveSectionAsMealTemplate } = useDiary();
  const [name, setName] = useState(() => `My ${MEAL_LABELS[mealType].toLowerCase()}`);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await saveSectionAsMealTemplate({ name: trimmed, mealType });
      toast.success(`"${trimmed}" saved`);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save meal'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Save as meal</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Snapshot the {itemCount} item{itemCount === 1 ? '' : 's'} in your{' '}
            {MEAL_LABELS[mealType].toLowerCase()} as a reusable meal you can log in one tap.
          </Typography>
          <TextField
            autoFocus
            label="Meal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ maxLength: 60 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !busy && name.trim()) {
                e.preventDefault();
                void handleSave();
              }
            }}
          />
          <Box sx={{ minHeight: 4 }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => void handleSave()}
          disabled={!name.trim() || busy}
        >
          Save meal
        </Button>
      </DialogActions>
    </Dialog>
  );
};
