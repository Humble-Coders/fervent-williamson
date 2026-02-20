import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import PrivacySecurityPage from '@/page-components/customer/PrivacySecurityPage';

export const metadata: Metadata = generateMetadata({
  title: 'Privacy & Security | CutQ',
  description: 'Manage your privacy and security settings.',
  noIndex: true
});

export default function PrivacySecurityRoute() {
  return <PrivacySecurityPage />;
}

