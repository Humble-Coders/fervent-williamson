import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SettingsPage from '@/page-components/admin/SettingsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Admin Settings | CutQ',
  description: 'Configure platform settings and system configurations.',
  noIndex: true
});

export default function AdminSettingsPage() {
  return <SettingsPage />;
}
