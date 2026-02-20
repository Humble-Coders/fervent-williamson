import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import RewardsPage from '@/page-components/customer/RewardsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Rewards & Offers | CutQ',
  description: 'View your rewards, points, and exclusive offers.',
  noIndex: true
});

export default function RewardsRoute() {
  return <RewardsPage />;
}

