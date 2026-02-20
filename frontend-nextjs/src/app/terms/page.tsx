import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import TermsOfServicePage from '@/page-components/TermsOfServicePage';

export const metadata: Metadata = generateMetadata({
  title: 'Terms of Service | CutQ',
  description: 'Read CutQ\'s terms of service to understand the rules and guidelines for using our platform.',
  keywords: ['terms of service', 'user agreement', 'platform rules', 'cutq terms']
});

export default function TermsPage() {
  return <TermsOfServicePage />;
}
