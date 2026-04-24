import { createFileRoute } from '@tanstack/react-router';
import { ReportsRoute } from '@/components/reports/ReportsRoute';

export const Route = createFileRoute('/reports')({
  component: ReportsRoute,
});
