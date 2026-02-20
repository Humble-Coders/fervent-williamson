import { MetadataRoute } from 'next';
// import { buildApiUrl } from '@/config/env'; // Removed unused import

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  
  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/salons`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/coupons`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  // In a real application, you would fetch dynamic routes from your API
  // For example, salon pages, service pages, etc.
  // const salons = await fetch(`${buildApiUrl()}/api/salons`).then(res => res.json());
  // const salonRoutes = salons.map((salon: any) => ({
  //   url: `${baseUrl}/salons/${salon.slug}/${salon.displayId}`,
  //   lastModified: new Date(salon.updatedAt),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.8,
  // }));

  return [
    ...staticRoutes,
    // ...salonRoutes,
  ];
}
