import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SalonsPage from '@/page-components/admin/SalonsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Manage Salons | Admin | CutQ',
  description: 'Manage all salons on the CutQ platform.',
  noIndex: true
});

export default function AdminSalonsPage() {
  return <SalonsPage />;
}
