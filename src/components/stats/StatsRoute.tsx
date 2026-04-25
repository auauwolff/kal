import { Authenticated, Unauthenticated } from 'convex/react';
import { StatsPage } from '@/components/stats/StatsPage';
import { SignedOutCard } from '@/components/SignedOutCard';

export const StatsRoute = () => (
  <>
    <Authenticated>
      <StatsPage />
    </Authenticated>
    <Unauthenticated>
      <SignedOutCard
        title="Stats are for signed-in users."
        subtitle="Sign in to see your weight, calorie, and macro trends."
      />
    </Unauthenticated>
  </>
);
