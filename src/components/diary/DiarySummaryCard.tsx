import { Card, CardContent, Stack } from '@mui/material';
import { EnergySummary } from '@/components/diary/EnergySummary';
import { MacroRings } from '@/components/diary/MacroRings';

export const DiarySummaryCard = () => (
  <Card variant="outlined">
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack sx={{ gap: 2 }}>
        <EnergySummary />
        <MacroRings />
      </Stack>
    </CardContent>
  </Card>
);
