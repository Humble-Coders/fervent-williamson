import { Metadata } from 'next';
import { CreateOfferPage } from '../../../../page-components';

export const metadata: Metadata = {
  title: 'Create New Offer | Salon Dashboard | CutQ',
  description: 'Create a new special offer or coupon for your salon customers',
  keywords: 'create offer, new coupon, salon promotion, discount, salon management',
};

export default function CreateOfferPageRoute() {
  return <CreateOfferPage />;
}
