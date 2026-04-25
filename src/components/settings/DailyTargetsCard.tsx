import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { RestartAlt } from '@mui/icons-material';
import { calorieTargetForGoal, macroTargets } from '@/lib/nutrition';
import type { UserTargets } from '@/lib/userTypes';
import { useUserStore } from '@/stores/userStore';

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface FieldDef {
  key: keyof UserTargets;
  label: string;
  unit: string;
}

const FIELDS: FieldDef[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'proteinG', label: 'Protein', unit: 'g' },
  { key: 'carbsG', label: 'Carbs', unit: 'g' },
  { key: 'fatG', label: 'Fat', unit: 'g' },
];

export const DailyTargetsCard = () => {
  const stats = useUserStore((s) => s.bodyStats);
  const goal = useUserStore((s) => s.goal);
  const targets = useUserStore((s) => s.targets);
  const setTarget = useUserStore((s) => s.setTarget);
  const resetTargetsToAuto = useUserStore((s) => s.resetTargetsToAuto);

  const targetsKey = `${targets.calories.value}|${targets.proteinG.value}|${targets.carbsG.value}|${targets.fatG.value}`;

  // Local string state so users can clear a field without it snapping back.
  const [draft, setDraft] = useState<Record<keyof UserTargets, string>>({
    calories: String(targets.calories.value),
    proteinG: String(targets.proteinG.value),
    carbsG: String(targets.carbsG.value),
    fatG: String(targets.fatG.value),
  });
  const [lastKey, setLastKey] = useState(targetsKey);

  // Re-sync drafts when the store mutates from outside (auto-calc, reset,
  // body-stat recalc). The "adjust state during render" idiom — see
  // https://react.dev/learn/you-might-not-need-an-effect — avoids the
  // cascading-render risk of doing the same in useEffect.
  if (lastKey !== targetsKey) {
    setLastKey(targetsKey);
    setDraft({
      calories: String(targets.calories.value),
      proteinG: String(targets.proteinG.value),
      carbsG: String(targets.carbsG.value),
      fatG: String(targets.fatG.value),
    });
  }

  const autoTargets = useMemo(() => {
    if (!stats || !goal) return null;
    const targetWeightKg =
      goal.type === 'maintain' ? stats.weightKg : goal.targetWeightKg;
    const { calories } = calorieTargetForGoal({
      ...stats,
      targetWeightKg,
      targetDateISO: goal.targetDateISO,
      todayISO: todayISO(),
    });
    const macros = macroTargets({
      weightKg: stats.weightKg,
      calorieTarget: calories,
      goal: goal.type,
    });
    return {
      calories,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
    };
  }, [stats, goal]);

  const commitField = (key: keyof UserTargets, raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setTarget(key, Math.round(parsed));
  };

  const anyOverride = FIELDS.some((f) => targets[f.key].isOverride);
  const canAutoCalc = !!autoTargets;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack sx={{ gap: 0.5, mb: 2 }}>
          <Typography variant="subtitle2" color="secondary">
            Daily targets
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Auto-derived from body stats and goal. Edit any field to override.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 2,
          }}
        >
          {FIELDS.map((f) => {
            const t = targets[f.key];
            const auto = autoTargets?.[f.key];
            const showAutoCaption =
              t.isOverride && auto !== undefined && auto !== t.value;
            return (
              <TextField
                key={f.key}
                label={f.label}
                type="number"
                inputMode="numeric"
                value={draft[f.key]}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                onBlur={() => commitField(f.key, draft[f.key])}
                slotProps={{ input: { endAdornment: f.unit } }}
                helperText={showAutoCaption ? `Auto: ${auto}` : ' '}
                fullWidth
              />
            );
          })}
        </Box>

        {anyOverride && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              color="inherit"
              startIcon={<RestartAlt />}
              onClick={() => resetTargetsToAuto()}
              disabled={!canAutoCalc}
            >
              Reset to auto
            </Button>
          </Box>
        )}

        {!canAutoCalc && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            Add body stats and a weight goal to enable auto-calc.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
