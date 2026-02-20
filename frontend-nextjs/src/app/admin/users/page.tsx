import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import UsersPage from '@/page-components/admin/UsersPage';

export const metadata: Metadata = generateMetadata({
  title: 'Users Management | Admin | CutQ',
  description: 'Manage users, view user details, and control user access in the CutQ platform.',
  noIndex: true // Don't index admin pages
});

export default function AdminUsersPage() {
  return <UsersPage />;
}
