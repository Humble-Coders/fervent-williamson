import { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata } from '@/utils/metadata';
import BookingConfirmationPage from '@/page-components/BookingConfirmationPage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata: Metadata = generateMetadata({
  title: 'Booking Confirmation | CutQ',
  description: 'Your appointment has been successfully booked. Check your booking details and confirmation.',
  noIndex: true // Don't index confirmation pages
});

export default function BookingConfirmationPageRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookingConfirmationPage />
    </Suspense>
  );
}
