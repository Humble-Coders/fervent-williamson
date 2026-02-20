import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import ServiceCategoriesPage from '@/page-components/salon/ServiceCategoriesPage';

export const metadata: Metadata = generateMetadata({
  title: 'Service Categories | Salon | CutQ',
  description: 'Manage your salon service categories and organization.',
  noIndex: true // Don't index salon pages
});

export default function SalonServiceCategoriesPage() {
  return <ServiceCategoriesPage />;
}
