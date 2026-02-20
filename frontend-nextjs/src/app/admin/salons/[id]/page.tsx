import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SalonDetailPage from '@/page-components/admin/SalonDetailPage';

export const metadata: Metadata = generateMetadata({
  title: 'CutQ Details | Admin | CutQ',
  description: 'View and manage CutQ details, services, and staff.',
  noIndex: true
});

export default function AdminSalonDetailPage() {
  return <SalonDetailPage />;
}
