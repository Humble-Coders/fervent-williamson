import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import PrivacyPolicyPage from '@/page-components/PrivacyPolicyPage';

export const metadata: Metadata = generateMetadata({
  title: 'Privacy Policy | CutQ',
  description: 'Read CutQ\'s privacy policy to understand how we collect, use, and protect your personal information.',
  keywords: ['privacy policy', 'data protection', 'user privacy', 'cutq policy']
});

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
