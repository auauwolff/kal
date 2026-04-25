import {
  Box,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ACTIVITY_LABELS,
  type ActivityLevel,
  type Sex,
} from '@/lib/nutrition';
import type { BodyStats } from '@/lib/userTypes';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useUserStore } from '@/stores/userStore';

const ACTIVITY_ORDER: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

const toFieldString = (v: number | undefined): string =>
  v === undefined || Number.isNaN(v) ? '' : String(v);

interface FormState {
  heightCm: string;
  weightKg: string;
  age: string;
  sex: Sex;
  activity: ActivityLevel;
}

const toForm = (stats: BodyStats | null): FormState => ({
  heightCm: toFieldString(stats?.heightCm),
  weightKg: toFieldString(stats?.weightKg),
  age: toFieldString(stats?.age),
  sex: stats?.sex ?? 'male',
  activity: stats?.activity ?? 'moderate',
});

const fromForm = (s: FormState): BodyStats | null => {
  const heightCm = Number(s.heightCm);
  const weightKg = Number(s.weightKg);
  const age = Number(s.age);
  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(age) ||
    heightCm <= 0 ||
    weightKg <= 0 ||
    age <= 0
  ) {
    return null;
  }
  return { heightCm, weightKg, age, sex: s.sex, activity: s.activity };
};

export const BodyStatsCard = () => {
  const stats = useUserStore((s) => s.bodyStats);
  const setBodyStats = useUserStore((s) => s.setBodyStats);

  const { form, setField, commit, commitWith } = useFormDraft({
    source: stats,
    sourceKey: `${stats?.heightCm}|${stats?.weightKg}|${stats?.age}|${stats?.sex}|${stats?.activity}`,
    toForm,
    fromForm,
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
              onChange={(e) => setField('heightCm', e.target.value)}
              onBlur={commit}
              slotProps={{ input: { endAdornment: 'cm' } }}
              fullWidth
            />
            <TextField
              label="Weight"
              type="number"
              inputMode="decimal"
              value={form.weightKg}
              onChange={(e) => setField('weightKg', e.target.value)}
              onBlur={commit}
              slotProps={{ input: { endAdornment: 'kg' } }}
              fullWidth
            />
            <TextField
              label="Age"
              type="number"
              inputMode="numeric"
              value={form.age}
              onChange={(e) => setField('age', e.target.value)}
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
