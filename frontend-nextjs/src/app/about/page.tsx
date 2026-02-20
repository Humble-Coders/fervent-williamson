import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import AboutUsPage from '@/page-components/AboutUsPage';

export const metadata: Metadata = generateMetadata({
  title: 'About CutQ | Beauty Salon Booking Platform',
  description: 'Learn about CutQ, the leading platform for discovering and booking beauty salon appointments online.',
  keywords: ['about cutq', 'beauty platform', 'salon booking', 'company info']
});

export default function AboutPage() {
  return <AboutUsPage />;
}
