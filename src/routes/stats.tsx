import { createFileRoute } from '@tanstack/react-router';
import { StatsRoute } from '@/components/stats/StatsRoute';

export const Route = createFileRoute('/stats')({
  component: StatsRoute,
});
