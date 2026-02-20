import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import AdminSignupPage from '@/page-components/AdminSignupPage';

export const metadata: Metadata = generateMetadata({
  title: 'Admin Signup | CutQ',
  description: 'Create an admin account for CutQ platform management.',
  noIndex: true // Don't index signup pages
});

export default function AdminSignupPageRoute() {
  return <AdminSignupPage />;
}
