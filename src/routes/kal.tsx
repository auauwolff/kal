import { createFileRoute } from '@tanstack/react-router';
import { KalRoute } from '@/components/Kal/KalRoute';

export const Route = createFileRoute('/kal')({
  component: KalRoute,
});
