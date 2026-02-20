import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import CommunicationPolicyPage from '@/page-components/CommunicationPolicyPage';

export const metadata: Metadata = generateMetadata({
  title: 'Communication Policy | CutQ',
  description: 'Learn how CutQ communicates with you through SMS, email, and other channels. Understand our messaging practices and your communication preferences.',
  keywords: ['communication policy', 'SMS policy', 'email notifications', 'messaging', 'cutq communications', 'gem infinity estates']
});

export default function CommunicationPolicyRoute() {
  return <CommunicationPolicyPage />;
}
