import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import ProfileDetailsPage from '@/page-components/customer/ProfileDetailsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Profile Details | CutQ',
  description: 'View and edit your profile information.',
  noIndex: true
});

export default function ProfileDetailsRoute() {
  return <ProfileDetailsPage />;
}

