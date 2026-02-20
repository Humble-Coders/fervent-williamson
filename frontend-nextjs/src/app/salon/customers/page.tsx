import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import CustomersPage from '@/page-components/salon/CustomersPage';

export const metadata: Metadata = generateMetadata({
  title: 'Customers | Salon Portal | CutQ',
  description: 'Manage your salon customers and client relationships.',
  noIndex: true
});

export default function SalonCustomersRoute() {
  return <CustomersPage />;
}
