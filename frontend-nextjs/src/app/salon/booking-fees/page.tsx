import { Suspense } from 'react';
import BookingFeesPage from '@/page-components/salon/BookingFeesPage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function BookingFeesRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookingFeesPage />
    </Suspense>
  );
}
