import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateMetadata as createMetadata } from '@/utils/metadata';
import ServiceCategoryPage from '@/page-components/ServiceCategoryPage';

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  
  return createMetadata({
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Services | CutQ`,
    description: `Discover professional ${category} services at top salons near you.`,
    keywords: [`${category} services`, 'beauty salon', 'professional services']
  });
}

export default async function ServiceCategoryPageRoute({ params }: PageProps) {
  const { category } = await params;
  
  if (!category) {
    notFound();
  }
  
  return <ServiceCategoryPage />;
}
