import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  FitnessCenter,
  DirectionsRun,
  SportsSoccer,
  DirectionsWalk,
  Bolt,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { ExerciseLog, ExerciseType } from '@/types/diary';
import { EXERCISE_LABELS } from '@/types/diary';

const iconByType: Record<ExerciseType, React.ReactElement> = {
  strength: <FitnessCenter fontSize="small" />,
  cardio: <DirectionsRun fontSize="small" />,
  sports: <SportsSoccer fontSize="small" />,
  walk: <DirectionsWalk fontSize="small" />,
  other: <Bolt fontSize="small" />,
};

interface ExerciseSectionProps {
  entries: ExerciseLog[];
}

export const ExerciseSection = ({ entries }: ExerciseSectionProps) => {
  const totalMin = entries.reduce((acc, e) => acc + e.durationMin, 0);

  const handleAdd = () => {
    toast('Log exercise — coming in Phase 2 exercise flow', { icon: '💪' });
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
          <IconButton size="small" color="secondary" onClick={handleAdd}>
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

        {entries.length > 0 && <Divider sx={{ my: 1 }} />}

        <Stack sx={{ gap: 1 }}>
          {entries.map((e) => (
            <Stack
              key={e.id}
              direction="row"
              sx={{ alignItems: 'center', gap: 1 }}
            >
              <Box sx={{ color: 'primary.main', display: 'flex' }}>
                {iconByType[e.type]}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                  {EXERCISE_LABELS[e.type]} · {e.durationMin} min
                </Typography>
                {e.notes && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {e.notes}
                  </Typography>
                )}
              </Box>
              <Chip
                label={e.intensity}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            </Stack>
          ))}

          {entries.length === 0 && (
            <Button
              variant="text"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
            >
              Log exercise
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
