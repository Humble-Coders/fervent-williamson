import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import NotificationsPage from '@/page-components/customer/NotificationsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Notifications | CutQ',
  description: 'Manage your notification preferences.',
  noIndex: true
});

export default function NotificationsRoute() {
  return <NotificationsPage />;
}

