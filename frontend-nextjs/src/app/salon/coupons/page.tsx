import { Metadata } from 'next';
import { SalonCouponsPage } from '../../../page-components';

export const metadata: Metadata = {
  title: 'Coupons & Offers | Salon Dashboard | CutQ',
  description: 'Create and manage special offers and coupons for your salon customers',
  keywords: 'salon coupons, offers, discounts, promotions, salon management',
};

export default function CouponsPage() {
  return <SalonCouponsPage />;
}
