import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import AccountSettingsPage from '@/page-components/customer/AccountSettingsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Account Settings | CutQ',
  description: 'Manage your account settings and preferences.',
  noIndex: true
});

export default function AccountSettingsRoute() {
  return <AccountSettingsPage />;
}

