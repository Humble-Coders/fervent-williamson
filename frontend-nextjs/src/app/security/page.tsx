import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import SecurityPage from '@/page-components/SecurityPage';

export const metadata: Metadata = generateMetadata({
  title: 'Security & Data Protection | CutQ',
  description: 'Learn how CutQ protects your data and ensures secure transactions with industry-standard security measures.',
  keywords: ['security', 'data protection', 'PCI compliance', 'encryption', 'privacy', 'cutq security']
});

export default function SecurityRoute() {
  return <SecurityPage />;
}
