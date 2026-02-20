import { Metadata } from 'next';
import { generateMetadata, getHomeSEO } from '@/utils/metadata';
// import ComingSoonPage from '@/page-components/ComingSoonPage';
import HomePage from '@/page-components/HomePage';

export const metadata: Metadata = generateMetadata(getHomeSEO());


// export const metadata: Metadata = generateMetadata({
//   title: 'Coming Soon | CutQ - The Future of Beauty Booking',
//   description: 'CutQ is launching soon! Join our exclusive early access waitlist and be among the first to experience the ultimate beauty booking platform. Get priority access, exclusive discounts, and special rewards.',
//   keywords: [
//     'coming soon',
//     'early access',
//     'beauty booking',
//     'salon appointments',
//     'cutq launch',
//     'waitlist',
//     'beauty platform',
//     'exclusive access',
//     'early bird',
//     'beauty services'
//   ],
//   ogTitle: 'Coming Soon | CutQ - The Future of Beauty Booking',
//   ogDescription: 'Join our exclusive early access waitlist for CutQ - the ultimate beauty booking platform launching Monday, November 13th!',
//   ogType: 'website',
//   ogImage: '/images/coming-soon-og.jpg',
//   twitterCard: 'summary_large_image',
//   twitterTitle: 'Coming Soon | CutQ - The Future of Beauty Booking',
//   twitterDescription: 'Join our exclusive early access waitlist for CutQ - launching Monday, November 13th!',
//   twitterImage: '/images/coming-soon-twitter.jpg',
//   canonical: '/'
// });

export default function Home() {
  return <HomePage />;
  // return <ComingSoonPage />;
}
