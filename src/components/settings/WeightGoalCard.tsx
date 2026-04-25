import { useMemo, useState } from 'react';
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
import {
  calorieTargetForGoal,
  type GoalType,
} from '@/lib/nutrition';
import type { WeightGoal } from '@/lib/userTypes';
import { useUserStore } from '@/stores/userStore';

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'lose', label: 'Lose' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain' },
  { value: 'recomp', label: 'Recomp' },
];

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const defaultTargetDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface FormState {
  type: GoalType;
  targetWeightKg: string;
  targetDateISO: string;
}

const initial = (
  goal: WeightGoal | null,
  currentWeightKg: number | undefined,
): FormState => ({
  type: goal?.type ?? 'maintain',
  targetWeightKg: goal?.targetWeightKg
    ? String(goal.targetWeightKg)
    : currentWeightKg
      ? String(currentWeightKg)
      : '',
  targetDateISO: goal?.targetDateISO ?? defaultTargetDate(),
});

const tryParseGoal = (
  s: FormState,
  currentWeightKg: number | undefined,
): WeightGoal | null => {
  if (!s.targetDateISO) return null;
  if (s.type === 'maintain') {
    return {
      type: 'maintain',
      targetWeightKg: currentWeightKg ?? 0,
      targetDateISO: s.targetDateISO,
    };
  }
  const targetWeightKg = Number(s.targetWeightKg);
  if (!Number.isFinite(targetWeightKg) || targetWeightKg <= 0) return null;
  return { type: s.type, targetWeightKg, targetDateISO: s.targetDateISO };
};

export const WeightGoalCard = () => {
  const stats = useUserStore((s) => s.bodyStats);
  const goal = useUserStore((s) => s.goal);
  const setGoal = useUserStore((s) => s.setGoal);
  const [form, setForm] = useState<FormState>(() =>
    initial(goal, stats?.weightKg),
  );

  const commit = (next: FormState) => {
    const parsed = tryParseGoal(next, stats?.weightKg);
    if (parsed) setGoal(parsed);
  };

  const onTypeChange = (next: GoalType) => {
    const nextForm = { ...form, type: next };
    setForm(nextForm);
    commit(nextForm);
  };

  // Live preview of the implied weekly rate, only when we have full info.
  const ratePreview = useMemo(() => {
    if (!stats) return null;
    const parsed = tryParseGoal(form, stats.weightKg);
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
              if (value) onTypeChange(value);
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
                  setForm((prev) => ({
                    ...prev,
                    targetWeightKg: e.target.value,
                  }))
                }
                onBlur={() => commit(form)}
                slotProps={{ input: { endAdornment: 'kg' } }}
                fullWidth
              />
            )}
            <TextField
              label="Target date"
              type="date"
              value={form.targetDateISO}
              onChange={(e) => {
                const next = { ...form, targetDateISO: e.target.value };
                setForm(next);
                commit(next);
              }}
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
