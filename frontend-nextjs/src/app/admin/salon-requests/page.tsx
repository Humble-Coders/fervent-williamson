import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SalonRequestsPage from '@/page-components/admin/SalonRequestsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Salon Requests | Admin | CutQ',
  description: 'Review and manage salon partnership requests and applications.',
  noIndex: true // Don't index admin pages
});

export default function AdminSalonRequestsPage() {
  return <SalonRequestsPage />;
}
