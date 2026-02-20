import { Metadata } from 'next';
import { generateMetadata, getSalonListSEO } from '@/utils/metadata';
import SalonListPage from '@/page-components/SalonListPage';

export const metadata: Metadata = generateMetadata(getSalonListSEO());

export default function SalonsPage() {
  return <SalonListPage />;
}
