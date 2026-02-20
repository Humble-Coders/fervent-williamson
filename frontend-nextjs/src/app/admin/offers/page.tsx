import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import OffersPage from '@/page-components/admin/OffersPage';

export const metadata: Metadata = generateMetadata({
  title: 'Offers Management | Admin | CutQ',
  description: 'Manage promotional offers, discounts, and special deals for salons.',
  noIndex: true // Don't index admin pages
});

export default function AdminOffersPage() {
  return <OffersPage />;
}
