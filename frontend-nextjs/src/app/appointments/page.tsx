import { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata } from '@/utils/metadata';
import AppointmentsPage from '@/page-components/AppointmentsPage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata: Metadata = generateMetadata({
  title: 'My Appointments | CutQ',
  description: 'View and manage your upcoming and past beauty appointments.',
  noIndex: true // Don't index personal appointment pages
});

export default function AppointmentsPageRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppointmentsPage />
    </Suspense>
  );
}
