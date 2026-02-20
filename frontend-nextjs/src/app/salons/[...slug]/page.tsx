import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateMetadata as createMetadata, getSalonSEO } from '@/utils/metadata';
import SalonDetailPage from '@/page-components/SalonDetailPage';

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// This function generates metadata for the salon detail page
export async function generateMetadata({ params: _params }: PageProps): Promise<Metadata> {
  // const { slug } = await params; // Removed unused variable
  
  // Handle both /salons/[id] and /salons/[name]/[id] formats
  // const salonId = slug.length === 1 ? slug[0] : slug[1]; // Removed unused variable
  
  try {
    // In a real app, you would fetch salon data here
    // For now, we'll use a default metadata
    const salonData = {
      name: 'Sample Salon',
      description: 'Professional beauty services',
      address: 'Sample Address',
      rating: 4.5,
      images: ['/images/salon-placeholder.jpg']
    };
    
    return createMetadata(getSalonSEO(salonData));
  } catch (error) {
    return createMetadata({
      title: 'Salon Not Found | CutQ',
      description: 'The salon you are looking for could not be found.',
      noIndex: true
    });
  }
}

export default async function SalonPage({ params }: PageProps) {
  const { slug } = await params;

  // Handle both /salons/[id] and /salons/[name]/[id] formats
  const salonId = slug.length === 1 ? slug[0] : slug[1];

  if (!salonId) {
    notFound();
  }

  return <SalonDetailPage />;
}
