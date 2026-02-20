import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import ContactPage from '@/page-components/ContactPage';

export const metadata: Metadata = generateMetadata({
  title: 'Contact Us | CutQ',
  description: 'Get in touch with CutQ support team. We\'re here to help with bookings, technical issues, and any questions you may have.',
  keywords: ['contact', 'support', 'help', 'customer service', 'cutq contact', 'get in touch']
});

export default function ContactRoute() {
  return <ContactPage />;
}
