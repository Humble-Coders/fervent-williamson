import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SalonDashboard from '@/page-components/salon/SalonDashboard';

export const metadata: Metadata = generateMetadata({
  title: 'Salon Dashboard | CutQ',
  description: 'Manage your salon bookings, services, and customers with CutQ.',
  noIndex: true // Don't index salon owner pages
});

export default function SalonDashboardPage() {
  return <SalonDashboard />;
}
