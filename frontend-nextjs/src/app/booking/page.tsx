import { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata } from '@/utils/metadata';
import BookingPage from '@/page-components/BookingPage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata: Metadata = generateMetadata({
  title: 'Book Appointment | CutQ',
  description: 'Book your beauty appointment online. Choose your preferred salon, service, and time slot.',
  keywords: ['book appointment', 'salon booking', 'beauty appointment', 'online booking']
});

export default function BookingPageRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookingPage />
    </Suspense>
  );
}
