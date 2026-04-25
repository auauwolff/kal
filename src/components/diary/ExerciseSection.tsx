import { useState, type ReactElement } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  FitnessCenter,
  DirectionsRun,
  SportsSoccer,
  DirectionsWalk,
  Bolt,
  DeleteOutline,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { ExerciseIntensity, ExerciseType } from './types';
import { EXERCISE_LABELS } from './types';
import {
  EXERCISE_INTENSITIES,
  EXERCISE_TYPES,
  parsedExerciseDuration,
  totalExerciseMinutes,
} from './diaryUtils';
import { useDiary } from './useDiary';
import { errorMessage } from '@/lib/errors';

const iconByType: Record<ExerciseType, ReactElement> = {
  strength: <FitnessCenter fontSize="small" />,
  cardio: <DirectionsRun fontSize="small" />,
  sports: <SportsSoccer fontSize="small" />,
  walk: <DirectionsWalk fontSize="small" />,
  other: <Bolt fontSize="small" />,
};

export const ExerciseSection = () => {
  const { exercise, addExercise, deleteExercise } = useDiary();
  const totalMin = totalExerciseMinutes(exercise);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ExerciseType>('strength');
  const [durationMin, setDurationMin] = useState('45');
  const [intensity, setIntensity] = useState<ExerciseIntensity>('moderate');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setType('strength');
    setDurationMin('45');
    setIntensity('moderate');
    setNotes('');
  };

  const closeDialog = () => {
    setOpen(false);
    resetForm();
  };

  const handleAdd = () => {
    const parsedDuration = parsedExerciseDuration(durationMin);
    if (parsedDuration === null) {
      toast.error('Duration must be greater than 0 minutes');
      return;
    }

    void addExercise({
      type,
      durationMin: parsedDuration,
      intensity,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    })
      .then(() => {
        toast('Exercise logged', { icon: '💪' });
        closeDialog();
      })
      .catch((error: unknown) => {
        toast.error(errorMessage(error, 'Could not log exercise'));
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
              Exercise
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalMin > 0 ? `${totalMin} min` : 'No activity logged'}
            </Typography>
          </Stack>
          <IconButton size="small" color="secondary" onClick={() => setOpen(true)}>
            <AddIcon />
          </IconButton>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5 }}
        >
          Exercise feeds Kal's strength — never subtracted from your food budget.
        </Typography>

        {exercise.length > 0 && <Divider sx={{ my: 1 }} />}

        <Stack sx={{ gap: 1 }}>
          {exercise.map((entry) => (
            <Stack
              key={entry.id}
              direction="row"
              sx={{ alignItems: 'center', gap: 1 }}
            >
              <Box sx={{ color: 'primary.main', display: 'flex' }}>
                {iconByType[entry.type]}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                  {EXERCISE_LABELS[entry.type]} · {entry.durationMin} min
                </Typography>
                {entry.notes && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {entry.notes}
                  </Typography>
                )}
              </Box>
              <Chip
                label={entry.intensity}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
              <IconButton
                size="small"
                color="error"
                aria-label={`Delete ${EXERCISE_LABELS[entry.type]}`}
                onClick={() => {
                  void deleteExercise(entry.id)
                    .then(() => toast('Exercise deleted', { icon: '🗑️' }))
                    .catch((error: unknown) => {
                      toast.error(errorMessage(error, 'Could not delete exercise'));
                    });
                }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          {exercise.length === 0 && (
            <Button
              variant="text"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
            >
              Log exercise
            </Button>
          )}
        </Stack>
      </CardContent>

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>Log exercise</DialogTitle>
        <DialogContent>
          <Stack sx={{ gap: 2, pt: 1 }}>
            <TextField
              select
              label="Type"
              value={type}
              onChange={(event) => setType(event.target.value as ExerciseType)}
              fullWidth
            >
              {EXERCISE_TYPES.map((option) => (
                <MenuItem key={option} value={option}>
                  {EXERCISE_LABELS[option]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Duration"
              type="number"
              value={durationMin}
              onChange={(event) => setDurationMin(event.target.value)}
              slotProps={{
                input: { endAdornment: 'min' },
                htmlInput: { min: 1, inputMode: 'numeric' },
              }}
              fullWidth
            />
            <TextField
              select
              label="Intensity"
              value={intensity}
              onChange={(event) =>
                setIntensity(event.target.value as ExerciseIntensity)
              }
              fullWidth
            >
              {EXERCISE_INTENSITIES.map((option) => (
                <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Push day, beach walk, soccer…"
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={closeDialog}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAdd}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
