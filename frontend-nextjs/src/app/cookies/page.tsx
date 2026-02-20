import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import CookiePolicyPage from '@/page-components/CookiePolicyPage';

export const metadata: Metadata = generateMetadata({
  title: 'Cookie Policy | CutQ',
  description: 'Learn how CutQ uses cookies to improve your experience on our website and protect your privacy.',
  keywords: ['cookie policy', 'cookies', 'website cookies', 'privacy', 'cutq cookies']
});

export default function CookiesPage() {
  return <CookiePolicyPage />;
}
