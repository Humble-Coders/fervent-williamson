import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import HelpCenterPage from '@/page-components/HelpCenterPage';

export const metadata: Metadata = generateMetadata({
  title: 'Help Center | CutQ',
  description: 'Get help with booking appointments, managing your account, and using CutQ platform features.',
  keywords: ['help center', 'support', 'faq', 'customer service', 'cutq help']
});

export default function HelpPage() {
  return <HelpCenterPage />;
}
