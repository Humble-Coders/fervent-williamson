import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import CouponsPage from '@/page-components/CouponsPage';

export const metadata: Metadata = generateMetadata({
  title: 'Deals & Coupons | CutQ',
  description: 'Discover amazing deals and exclusive coupons for beauty services. Save big on your favorite salon treatments with our special offers.',
  keywords: ['beauty coupons', 'salon deals', 'discount offers', 'beauty discounts', 'salon coupons', 'hair deals', 'spa offers'],
  ogTitle: 'Amazing Deals & Coupons | CutQ',
  ogDescription: 'Save big on beauty services with exclusive coupons and special offers from top salons.',
  ogType: 'website',
  twitterTitle: 'Amazing Deals & Coupons | CutQ',
  twitterDescription: 'Save big on beauty services with exclusive coupons and special offers from top salons.'
});

export default function CouponsRoute() {
  return <CouponsPage />;
}
