import { Authenticated, Unauthenticated } from 'convex/react';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { SignedOutCard } from '@/components/SignedOutCard';

export const ReportsRoute = () => (
  <>
    <Authenticated>
      <ReportsPage />
    </Authenticated>
    <Unauthenticated>
      <SignedOutCard
        title="Reports are for signed-in users."
        subtitle="Sign in to see your weight, calorie, and macro trends."
      />
    </Unauthenticated>
  </>
);
