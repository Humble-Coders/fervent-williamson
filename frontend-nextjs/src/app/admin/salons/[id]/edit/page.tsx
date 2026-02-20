import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SalonFormPage from '@/page-components/admin/SalonFormPage';

export const metadata: Metadata = generateMetadata({
  title: 'Edit CutQ | Admin | CutQ',
  description: 'Edit CutQ details, services, and staff information.',
  noIndex: true
});

export default function AdminEditSalonPage() {
  return <SalonFormPage />;
}
