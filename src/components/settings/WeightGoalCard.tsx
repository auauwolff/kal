import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { calorieTargetForGoal, type GoalType } from '@/lib/nutrition';
import { stripLeadingZeros } from '@/lib/numericInput';
import { todayISO } from '@/lib/date';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useProfileDraft } from '@/hooks/useProfileDraft';
import {
  GOAL_OPTIONS,
  weightGoalFromForm,
  weightGoalSourceKey,
  weightGoalToForm,
} from './settingsUtils';

export const WeightGoalCard = () => {
  const { bodyStats: stats, goal, setGoal } = useProfileDraft();

  const currentWeightKg = stats?.weightKg;

  const { form, setField, commit, commitWith } = useFormDraft({
    source: { goal, currentWeightKg },
    sourceKey: weightGoalSourceKey({ goal, currentWeightKg }),
    toForm: weightGoalToForm,
    fromForm: weightGoalFromForm(currentWeightKg),
    onCommit: setGoal,
  });

  // Live preview of the implied weekly rate, only when we have full info.
  const ratePreview = useMemo(() => {
    if (!stats) return null;
    const parsed = weightGoalFromForm(stats.weightKg)(form);
    if (!parsed) return null;
    const { weeklyDeltaKg, clamped } = calorieTargetForGoal({
      ...stats,
      targetWeightKg: parsed.targetWeightKg,
      targetDateISO: parsed.targetDateISO,
      todayISO: todayISO(),
    });
    return { weeklyDeltaKg, clamped };
  }, [stats, form]);

  const showTargetWeight = form.type !== 'maintain';

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack sx={{ gap: 0.5, mb: 2 }}>
          <Typography variant="subtitle2" color="secondary">
            Weight goal
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sets the calorie deficit or surplus used in auto-calc.
          </Typography>
        </Stack>

        <Stack sx={{ gap: 2 }}>
          <ToggleButtonGroup
            value={form.type}
            exclusive
            fullWidth
            color="primary"
            size="small"
            onChange={(_, value: GoalType | null) => {
              if (value) commitWith({ type: value });
            }}
          >
            {GOAL_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: showTargetWeight
                ? 'repeat(2, minmax(0, 1fr))'
                : 'minmax(0, 1fr)',
              gap: 2,
            }}
          >
            {showTargetWeight && (
              <TextField
                label="Target weight"
                type="number"
                inputMode="decimal"
                value={form.targetWeightKg}
                onChange={(e) =>
                  setField('targetWeightKg', stripLeadingZeros(e.target.value))
                }
                onBlur={commit}
                slotProps={{ input: { endAdornment: 'kg' } }}
                fullWidth
              />
            )}
            <TextField
              label="Target date"
              type="date"
              value={form.targetDateISO}
              onChange={(e) =>
                commitWith({ targetDateISO: e.target.value })
              }
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Box>

          {ratePreview && (
            <Typography variant="caption" color="text.secondary">
              {(() => {
                const { weeklyDeltaKg, clamped } = ratePreview;
                if (Math.abs(weeklyDeltaKg) < 0.01) {
                  return 'Maintenance pace — no weekly weight change.';
                }
                const sign = weeklyDeltaKg > 0 ? '+' : '−';
                const mag = Math.abs(weeklyDeltaKg).toFixed(2);
                const note = clamped
                  ? ' — clamped to a safe rate'
                  : ' — within safe range';
                return `${sign}${mag} kg/week${note}.`;
              })()}
            </Typography>
          )}

          {!stats && (
            <Typography variant="caption" color="warning.main">
              Enter your body stats above to see the implied weekly rate.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
