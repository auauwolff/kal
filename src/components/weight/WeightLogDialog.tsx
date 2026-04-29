import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from 'convex/react';
import toast from 'react-hot-toast';
import { api } from '../../../convex/_generated/api';
import { todayISO } from '@/lib/date';
import { errorMessage } from '@/lib/errors';
import { stripLeadingZeros } from '@/lib/numericInput';

interface WeightLogDialogProps {
  open: boolean;
  onClose: () => void;
  defaultWeightKg?: number | null;
  defaultDate?: string;
}

interface WeightLogDialogBodyProps {
  defaultWeightKg: number | null;
  defaultDate: string;
  onClose: () => void;
}

const WeightLogDialogBody = ({
  defaultWeightKg,
  defaultDate,
  onClose,
}: WeightLogDialogBodyProps) => {
  const logForDate = useMutation(api.weights.logForDate);
  const [date, setDate] = useState(defaultDate);
  const [weight, setWeight] = useState(
    defaultWeightKg != null ? String(defaultWeightKg) : '',
  );
  const [busy, setBusy] = useState(false);

  const parsedWeight = Number.parseFloat(weight);
  const valid =
    Number.isFinite(parsedWeight) && parsedWeight > 0 && parsedWeight < 500 && date.length > 0;

  const handleSave = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const result = await logForDate({ date, weightKg: parsedWeight });
      toast.success(result.replaced ? 'Weight updated' : 'Weight logged');
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save weight'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogTitle>Log weight</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Tap once a week to keep your trend honest. We&rsquo;ll feed it into your Stats chart.
          </Typography>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{
              input: { inputProps: { max: todayISO() } },
              inputLabel: { shrink: true },
            }}
            fullWidth
          />
          <TextField
            autoFocus
            label="Weight"
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(stripLeadingZeros(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && valid && !busy) {
                e.preventDefault();
                void handleSave();
              }
            }}
            slotProps={{ input: { endAdornment: 'kg' } }}
            fullWidth
          />
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
          disabled={!valid || busy}
        >
          Save
        </Button>
      </DialogActions>
    </>
  );
};

export const WeightLogDialog = ({
  open,
  onClose,
  defaultWeightKg,
  defaultDate,
}: WeightLogDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    {open ? (
      <WeightLogDialogBody
        defaultWeightKg={defaultWeightKg ?? null}
        defaultDate={defaultDate ?? todayISO()}
        onClose={onClose}
      />
    ) : null}
  </Dialog>
);
