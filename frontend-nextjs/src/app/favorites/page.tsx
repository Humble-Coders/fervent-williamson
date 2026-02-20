import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import FavoritesPage from '@/page-components/customer/FavoritesPage';

export const metadata: Metadata = generateMetadata({
  title: 'My Favorites | CutQ',
  description: 'View and manage your favorite salons and services.',
  noIndex: true
});

export default function FavoritesRoute() {
  return <FavoritesPage />;
}

