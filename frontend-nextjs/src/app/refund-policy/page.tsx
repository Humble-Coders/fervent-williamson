import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import RefundPolicyPage from '@/page-components/RefundPolicyPage';

export const metadata: Metadata = generateMetadata({
  title: 'Refund Policy | CutQ',
  description: 'Learn about CutQ\'s refund and cancellation policies for bookings and payments.',
  keywords: ['refund policy', 'cancellation policy', 'booking refunds', 'payment refunds', 'cutq refunds']
});

export default function RefundPolicyRoute() {
  return <RefundPolicyPage />;
}
