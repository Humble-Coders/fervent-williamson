import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import ServicesPage from '@/page-components/admin/ServicesPage';

export const metadata: Metadata = generateMetadata({
  title: 'Services Management | Admin | CutQ',
  description: 'Manage service categories, types, and configurations across the platform.',
  noIndex: true // Don't index admin pages
});

export default function AdminServicesPage() {
  return <ServicesPage />;
}
