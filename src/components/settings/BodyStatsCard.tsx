import {
  Box,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ACTIVITY_LABELS, type ActivityLevel, type Sex } from '@/lib/nutrition';
import { stripLeadingZeros } from '@/lib/numericInput';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useProfileDraft } from '@/hooks/useProfileDraft';
import {
  ACTIVITY_ORDER,
  bodyStatsFromForm,
  bodyStatsSourceKey,
  bodyStatsToForm,
} from './settingsUtils';

export const BodyStatsCard = () => {
  const { bodyStats: stats, setBodyStats } = useProfileDraft();

  const { form, setField, commit, commitWith } = useFormDraft({
    source: stats,
    sourceKey: bodyStatsSourceKey(stats),
    toForm: bodyStatsToForm,
    fromForm: bodyStatsFromForm,
    onCommit: setBodyStats,
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack sx={{ gap: 0.5, mb: 2 }}>
          <Typography variant="subtitle2" color="secondary">
            Body stats
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Used to estimate your daily energy needs.
          </Typography>
        </Stack>

        <Stack sx={{ gap: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 2,
            }}
          >
            <TextField
              label="Height"
              type="number"
              inputMode="numeric"
              value={form.heightCm}
              onChange={(e) => setField('heightCm', stripLeadingZeros(e.target.value))}
              onBlur={commit}
              slotProps={{ input: { endAdornment: 'cm' } }}
              fullWidth
            />
            <TextField
              label="Weight"
              type="number"
              inputMode="decimal"
              value={form.weightKg}
              onChange={(e) => setField('weightKg', stripLeadingZeros(e.target.value))}
              onBlur={commit}
              slotProps={{ input: { endAdornment: 'kg' } }}
              fullWidth
            />
            <TextField
              label="Age"
              type="number"
              inputMode="numeric"
              value={form.age}
              onChange={(e) => setField('age', stripLeadingZeros(e.target.value))}
              onBlur={commit}
              fullWidth
            />
            <TextField
              select
              label="Sex"
              value={form.sex}
              onChange={(e) => commitWith({ sex: e.target.value as Sex })}
              fullWidth
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </TextField>
          </Box>

          <TextField
            select
            label="Activity level"
            value={form.activity}
            onChange={(e) =>
              commitWith({ activity: e.target.value as ActivityLevel })
            }
            fullWidth
          >
            {ACTIVITY_ORDER.map((level) => (
              <MenuItem key={level} value={level}>
                {ACTIVITY_LABELS[level]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </CardContent>
    </Card>
  );
};
