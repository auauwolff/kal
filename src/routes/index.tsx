import { createFileRoute } from '@tanstack/react-router';
import { DiaryRoute } from '@/components/diary/DiaryRoute';

export const Route = createFileRoute('/')({
  component: DiaryRoute,
});
