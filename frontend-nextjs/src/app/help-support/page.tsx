import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import HelpSupportPage from '@/page-components/customer/HelpSupportPage';

export const metadata: Metadata = generateMetadata({
  title: 'Help & Support | CutQ',
  description: 'Get help and support for your CutQ account.',
  noIndex: true
});

export default function HelpSupportRoute() {
  return <HelpSupportPage />;
}

