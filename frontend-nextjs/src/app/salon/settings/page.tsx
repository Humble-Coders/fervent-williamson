import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SalonSettingsPage from '@/page-components/salon/SettingsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Salon Settings | CutQ',
  description: 'Manage your salon settings and configurations.',
  noIndex: true
});

export default function SalonSettingsPageRoute() {
  return <SalonSettingsPage />;
}
