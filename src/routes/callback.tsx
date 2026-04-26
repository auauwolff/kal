import { createFileRoute } from '@tanstack/react-router';
import { CallbackPage } from '@/components/CallbackPage';

export const Route = createFileRoute('/callback')({
  component: CallbackPage,
});
