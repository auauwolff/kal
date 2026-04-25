import { useState } from 'react';
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
import type { UserTargets } from '@/lib/userTypes';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  DAILY_TARGET_FIELDS,
  targetsDraftFromTargets,
  targetsKey,
} from './settingsUtils';

export const DailyTargetsCard = () => {
  const { targets, autoTargets, setTarget, resetTargetsToAuto } = useUserProfile();

  const currentTargetsKey = targetsKey(targets);

  // Local string state so users can clear a field without it snapping back.
  const [draft, setDraft] = useState<Record<keyof UserTargets, string>>(() =>
    targetsDraftFromTargets(targets),
  );
  const [lastKey, setLastKey] = useState(currentTargetsKey);

  // Re-sync drafts when Convex data changes from outside (auto-calc, reset,
  // body-stat recalc). The "adjust state during render" idiom — see
  // https://react.dev/learn/you-might-not-need-an-effect — avoids the
  // cascading-render risk of doing the same in useEffect.
  if (lastKey !== currentTargetsKey) {
    setLastKey(currentTargetsKey);
    setDraft(targetsDraftFromTargets(targets));
  }

  const commitField = (key: keyof UserTargets, raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setTarget(key, Math.round(parsed));
  };

  const anyOverride = DAILY_TARGET_FIELDS.some((f) => targets[f.key].isOverride);
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
          {DAILY_TARGET_FIELDS.map((f) => {
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
