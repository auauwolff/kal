import { Authenticated, Unauthenticated } from 'convex/react';
import { DiaryPage } from '@/components/diary/DiaryPage';
import { SignedOutCard } from '@/components/SignedOutCard';

export const DiaryRoute = () => (
  <>
    <Authenticated>
      <DiaryPage />
    </Authenticated>
    <Unauthenticated>
      <SignedOutCard />
    </Unauthenticated>
  </>
);
