import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import AdminPasswordResetPage from '@/page-components/AdminPasswordResetPage';

export const metadata: Metadata = generateMetadata({
    title: 'Admin Password Reset | CutQ',
    description: 'Reset admin account password.',
    noIndex: true
});

export default function AdminPasswordResetPageRoute() {
    return <AdminPasswordResetPage />;
}
