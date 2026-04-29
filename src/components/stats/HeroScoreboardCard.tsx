import { Box, ButtonBase, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import { LocalFireDepartment } from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import { useStatsData } from '@/hooks/useStatsData';
import type { WeightGoal } from '@/lib/userTypes';
import { ewma } from './statsUtils';

type CaptionColor = 'text.secondary' | 'success.main' | 'warning.main';

interface StatCellProps {
  label: string;
  value: string;
  caption?: string;
  captionColor?: CaptionColor;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const StatCell = ({
  label,
  value,
  caption,
  captionColor = 'text.secondary',
  icon,
  onClick,
}: StatCellProps) => {
  const inner = (
    <Stack sx={{ alignItems: 'flex-start', gap: 0.25, p: 1.25, width: '100%' }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          fontSize: 10,
        }}
      >
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.5 }}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </Typography>
      </Stack>
      {caption && (
        <Typography variant="caption" sx={{ color: captionColor }}>
          {caption}
        </Typography>
      )}
    </Stack>
  );

  if (!onClick) return inner;
  return (
    <ButtonBase
      onClick={onClick}
      sx={{ borderRadius: 2, justifyContent: 'flex-start', textAlign: 'left' }}
    >
      {inner}
    </ButtonBase>
  );
};

interface GoalCell {
  label: string;
  value: string;
  caption?: string;
  captionColor: CaptionColor;
  onClick?: () => void;
}

const buildGoalCell = (
  goal: WeightGoal | null,
  currentWeightKg: number | null,
  openSettings: () => void,
): GoalCell => {
  if (!goal || currentWeightKg === null) {
    return {
      label: 'Goal',
      value: '—',
      caption: 'No goal — tap to set',
      captionColor: 'text.secondary',
      onClick: openSettings,
    };
  }
  const tgtStr = `${goal.targetWeightKg.toFixed(1)} kg`;

  if (goal.type === 'recomp') {
    return { label: 'Goal', value: 'Recomp', caption: `target ${tgtStr}`, captionColor: 'text.secondary' };
  }
  if (goal.type === 'maintain') {
    const diff = currentWeightKg - goal.targetWeightKg;
    return {
      label: 'From target',
      value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} kg`,
      caption: `target ${tgtStr}`,
      captionColor: Math.abs(diff) <= 1.5 ? 'success.main' : 'warning.main',
    };
  }
  const reached =
    (goal.type === 'lose' && currentWeightKg <= goal.targetWeightKg) ||
    (goal.type === 'gain' && currentWeightKg >= goal.targetWeightKg);
  if (reached) {
    return {
      label: 'Goal',
      value: 'Reached',
      caption: `target ${tgtStr}`,
      captionColor: 'success.main',
    };
  }
  return {
    label: 'To go',
    value: `${Math.abs(currentWeightKg - goal.targetWeightKg).toFixed(1)} kg`,
    caption: `to ${tgtStr} target`,
    captionColor: 'text.secondary',
  };
};

export const HeroScoreboardCard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const stats = useStatsData();

  const weightVals = (stats?.weights ?? []).map((w) => w.weightKg);
  const ewmaVals = ewma(weightVals, 0.1);
  const latest = ewmaVals[ewmaVals.length - 1];
  const sevenAgo = ewmaVals[Math.max(0, ewmaVals.length - 8)];
  const delta7d =
    latest !== undefined && sevenAgo !== undefined && ewmaVals.length >= 2
      ? Math.round((latest - sevenAgo) * 10) / 10
      : null;

  const currentWeightKg = latest ?? stats?.currentWeightKg ?? null;
  const goalCell = buildGoalCell(stats?.goal ?? null, currentWeightKg, () =>
    void navigate({ to: '/settings' }),
  );

  const days = stats?.days ?? [];
  const onTargetDays = days.filter((d) => d.streakStatus >= 2).length;
  const range = stats?.rangeDays ?? 7;
  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;

  const weightCaption =
    delta7d !== null
      ? `Δ7d ${delta7d >= 0 ? '+' : ''}${delta7d.toFixed(1)} kg`
      : weightVals.length === 0
        ? 'no weigh-ins yet'
        : 'log more to trend';

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 0.5,
          }}
        >
          <StatCell
            label="Weight"
            value={currentWeightKg !== null ? `${currentWeightKg.toFixed(1)} kg` : '—'}
            caption={weightCaption}
          />
          <StatCell
            label={goalCell.label}
            value={goalCell.value}
            caption={goalCell.caption}
            captionColor={goalCell.captionColor}
            onClick={goalCell.onClick}
          />
          <StatCell
            label="On target"
            value={`${onTargetDays}`}
            caption={`of ${days.length || range} days`}
          />
          <StatCell
            label="Streak"
            value={`${currentStreak}d`}
            caption={longestStreak > 0 ? `best ${longestStreak}d` : undefined}
            icon={
              <LocalFireDepartment
                fontSize="small"
                sx={{
                  color:
                    currentStreak > 0 ? theme.palette.warning.main : theme.palette.text.disabled,
                }}
              />
            }
          />
        </Box>
      </CardContent>
    </Card>
  );
};
