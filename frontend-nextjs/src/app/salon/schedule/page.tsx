import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SchedulePage from '@/page-components/salon/SchedulePage';

export const metadata: Metadata = generateMetadata({
  title: 'Schedule | Salon Portal | CutQ',
  description: 'Manage your salon schedule and time slots.',
  noIndex: true
});

export default function SalonScheduleRoute() {
  return <SchedulePage />;
}
