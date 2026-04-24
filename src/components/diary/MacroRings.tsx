import { Box, Stack, Typography, useTheme } from '@mui/material';
import type { DailyTargets, DailyTotals } from '@/types/diary';

interface RingProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

const Ring = ({ label, current, target, unit, color }: RingProps) => {
  const theme = useTheme();
  const size = 88;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(current / target, 1.2) : 0;
  const dash = circumference * Math.min(pct, 1);
  const over = pct > 1;

  return (
    <Stack sx={{ alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.palette.divider}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={over ? theme.palette.error.main : color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 16 }}>
            {Math.round(current)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            / {Math.round(target)}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label} {unit && <Box component="span" sx={{ opacity: 0.6 }}>({unit})</Box>}
      </Typography>
    </Stack>
  );
};

interface MacroRingsProps {
  totals: DailyTotals;
  targets: DailyTargets;
}

export const MacroRings = ({ totals, targets }: MacroRingsProps) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      sx={{
        gap: { xs: 0.5, sm: 1 },
        justifyContent: 'space-between',
      }}
    >
      <Ring
        label="Protein"
        current={totals.proteinG}
        target={targets.proteinG}
        unit="g"
        color={theme.palette.success.main}
      />
      <Ring
        label="Carbs"
        current={totals.carbsG}
        target={targets.carbsG}
        unit="g"
        color={theme.palette.warning.main}
      />
      <Ring
        label="Fat"
        current={totals.fatG}
        target={targets.fatG}
        unit="g"
        color={theme.palette.error.light}
      />
    </Stack>
  );
};
