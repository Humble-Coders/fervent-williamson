import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import AnalyticsPage from '@/page-components/admin/AnalyticsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Analytics | Admin | CutQ',
  description: 'View platform analytics, user behavior, and business insights.',
  noIndex: true // Don't index admin pages
});

export default function AdminAnalyticsPage() {
  return <AnalyticsPage />;
}
