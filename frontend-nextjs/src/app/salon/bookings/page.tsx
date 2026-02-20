import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import BookingsPage from '@/page-components/salon/BookingsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Bookings | Salon Portal | CutQ',
  description: 'Manage your salon bookings and appointments.',
  noIndex: true
});

export default function SalonBookingsRoute() {
  return <BookingsPage />;
}
