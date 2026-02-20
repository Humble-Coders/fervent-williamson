import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import StylistPage from '@/page-components/salon/StylistPage';

export const metadata: Metadata = generateMetadata({
  title: 'Stylists Management | Salon | CutQ',
  description: 'Manage your salon stylists, staff, and team members.',
  noIndex: true // Don't index salon pages
});

export default function SalonStylistsPage() {
  return <StylistPage />;
}
