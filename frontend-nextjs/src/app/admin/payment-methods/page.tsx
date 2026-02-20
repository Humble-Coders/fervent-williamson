import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import PaymentMethodsPage from '@/page-components/admin/PaymentMethodsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Payment Methods | Admin | CutQ',
  description: 'Configure and manage payment methods available on the platform.',
  noIndex: true // Don't index admin pages
});

export default function AdminPaymentMethodsPage() {
  return <PaymentMethodsPage />;
}
