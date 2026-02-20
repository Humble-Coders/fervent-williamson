import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import ServicesPage from '@/page-components/salon/ServicesPage';

export const metadata: Metadata = generateMetadata({
  title: 'Services Management | Salon | CutQ',
  description: 'Manage your salon services, pricing, and categories.',
  noIndex: true // Don't index salon pages
});

export default function SalonServicesPage() {
  return <ServicesPage />;
}
