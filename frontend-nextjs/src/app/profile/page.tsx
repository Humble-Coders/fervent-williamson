import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import UserProfilePage from '@/page-components/UserProfilePage';

export const metadata: Metadata = generateMetadata({
  title: 'My Profile | CutQ',
  description: 'Manage your CutQ profile, preferences, and account settings.',
  noIndex: true // Don't index profile pages
});

export default function ProfilePage() {
  return <UserProfilePage />;
}
