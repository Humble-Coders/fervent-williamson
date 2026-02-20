import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import PaymentMethodsPage from '@/page-components/customer/PaymentMethodsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Payment Methods | CutQ',
  description: 'Manage your saved payment methods.',
  noIndex: true
});

export default function PaymentMethodsRoute() {
  return <PaymentMethodsPage />;
}

