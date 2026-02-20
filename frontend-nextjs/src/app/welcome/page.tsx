import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import OnboardingPage from '@/page-components/OnboardingPage';

export const metadata: Metadata = generateMetadata({
  title: 'Welcome to CutQ | Sign Up',
  description: 'Join CutQ to discover and book appointments at the best beauty salons near you.',
  keywords: ['signup', 'register', 'join cutq', 'beauty salon booking']
});

export default function WelcomePage() {
  return <OnboardingPage />;
}
