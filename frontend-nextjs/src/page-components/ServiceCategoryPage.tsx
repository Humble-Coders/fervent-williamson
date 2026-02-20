'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Clock, ArrowRight, Users } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import GenderFilter from '../components/salon/GenderFilter';

import { buildApiUrl } from '../config/env';
import { getAbsoluteImageUrl } from '../utils/imageUtils';

// import SEOHead from '../components/seo/SEOHead';
import Breadcrumb from '../components/seo/Breadcrumb';
import { getServiceCategorySEO, getServiceSEO } from '../utils/seoUtils';

interface Service {
  id: string;
  displayId?: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  popular: boolean;
  emoji: string;
  categoryId: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  images?: string[];
  salon: {
    id: string;
    displayId?: number;
    name: string;
    address: string;
    rating: number;
    reviewCount: number;
    image?: string;
    images?: string[];
    distance?: string;
  };
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  emoji: string;
  icon: string;
}

const ServiceCategoryPage: React.FC = () => {
  const { category, serviceId } = useParams<{ category: string; serviceId?: string }>();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE' | 'UNISEX' | 'ALL'>('ALL');


  useEffect(() => {
    fetchCategoryServices();
  }, [category]);

  const fetchCategoryServices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch category info and services
      const [categoryResponse, servicesResponse] = await Promise.all([
        fetch(buildApiUrl(`categories/by-slug/${category}`)),
        fetch(buildApiUrl(`services/category/${category}`))
      ]);

      if (!categoryResponse.ok || !servicesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const categoryData = await categoryResponse.json();
      const servicesData = await servicesResponse.json();

      if (categoryData.success) {
        setCategoryInfo(categoryData.data);
      }

      if (servicesData.success) {
        setServices(servicesData.data);
      }
    } catch (err) {
      setError('Failed to load services. Please try again.');
      logger.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedServices = services
    .filter(service => {
      // Gender filter
      const matchesGender = selectedGender === 'ALL' ||
                           service.gender === selectedGender ||
                           service.gender === 'UNISEX' ||
                           !service.gender; // Include services without gender specified

      return matchesGender;
    })
    .sort((a, b) => {
      // Sort by popular first, then by rating, then by price
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      if (a.salon.rating !== b.salon.rating) return b.salon.rating - a.salon.rating;
      return a.price - b.price;
    });

  const handleBookService = (service: Service) => {
    const salonId = service.salon.displayId || service.salon.id;
    const bookingServiceId = service.displayId || service.id;
    router.push(`/booking?salonId=${salonId}&serviceId=${bookingServiceId}`);
  };

  // If serviceId is provided in URL, scroll to that service or highlight it
  useEffect(() => {
    if (serviceId && services.length > 0) {
      const serviceElement = document.getElementById(`service-${serviceId}`);
      if (serviceElement) {
        serviceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a highlight effect
        serviceElement.classList.add('ring-2', 'ring-primary-500', 'ring-opacity-50');
        setTimeout(() => {
          serviceElement.classList.remove('ring-2', 'ring-primary-500', 'ring-opacity-50');
        }, 3000);
      }
    }
  }, [serviceId, services]);

  const getCategoryTitle = () => {
    if (categoryInfo) return categoryInfo.name;
    
    switch (category) {
      case 'hair': return 'Hair Services';
      case 'facial': return 'Facial Treatments';
      case 'nails': return 'Nail Services';
      case 'massage': return 'Massage Therapy';
      default: return 'Services';
    }
  };

  const getCategoryEmoji = () => {
    if (categoryInfo) return categoryInfo.emoji;
    
    switch (category) {
      case 'hair': return '💇‍♀️';
      case 'facial': return '🧴';
      case 'nails': return '💅';
      case 'massage': return '💆‍♀️';
      default: return '✨';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCategoryServices}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { name: 'Services', url: '/services' },
    { name: getCategoryTitle(), url: '', isActive: true }
  ];

  // Determine SEO data based on whether we're showing a specific service or category
  const seoData = serviceId && filteredAndSortedServices.length > 0
    ? getServiceSEO(filteredAndSortedServices.find(s => (s.displayId || s.id).toString() === serviceId), category || '')
    : getServiceCategorySEO(category || '', filteredAndSortedServices);

  return (
    <>
      {/* <SEOHead
        seoData={seoData}
        path={serviceId ? `/services/${category}/${serviceId}` : `/services/${category}`}
      /> */}
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">{getCategoryEmoji()}</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{getCategoryTitle()}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {categoryInfo?.description || `Discover the best ${getCategoryTitle().toLowerCase()} in your area`}
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom px-4 py-8">
        {/* Breadcrumb Navigation */}
        {/* <Breadcrumb items={breadcrumbItems} className="mb-6" /> */}

        {/* Gender Filter */}
        <div className="flex justify-center mb-8">
          <GenderFilter
            selectedGender={selectedGender}
            onGenderChange={setSelectedGender}
          />
        </div>

        {/* Services Grid */}
        {filteredAndSortedServices.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedServices.map((service) => (
              <div key={service.id} id={`service-${service.displayId || service.id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                {/* Service Image */}
                <div className="relative h-48 overflow-hidden">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={getAbsoluteImageUrl(service.images[0])}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        logger.error('Service image failed to load:', service.images?.[0]);
                        // Fallback to gradient background
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-6xl opacity-50">{service.emoji}</span>
                    </div>
                  )}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                  {/* Popular badge */}
                  {service.popular && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="accent" className="bg-primary-500 text-white text-xs px-2 py-1">
                        Popular
                      </Badge>
                    </div>
                  )}

                  {/* Price overlay */}
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                      <span className="text-lg font-bold text-primary-600">₹{service.price}</span>
                    </div>
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-5">
                  {/* Service Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{service.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 ml-2">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration}min</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{service.description}</p>
                  </div>

                  {/* Salon Information */}
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="flex items-start gap-3">
                      {/* Salon Image */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        {service.salon.images && service.salon.images.length > 0 ? (
                          <img
                            src={getAbsoluteImageUrl(service.salon.images[0])}
                            alt={service.salon.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to gradient
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : service.salon.image ? (
                          <img
                            src={getAbsoluteImageUrl(service.salon.image)}
                            alt={service.salon.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to gradient
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Salon Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{service.salon.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="line-clamp-1">{service.salon.address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-current text-yellow-400" />
                            <span className="font-medium">{service.salon.rating}</span>
                            {service.salon.reviewCount && (
                              <span className="text-gray-500">({service.salon.reviewCount})</span>
                            )}
                          </div>
                          {service.salon.distance && (
                            <span className="text-gray-500">{service.salon.distance}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button
                    variant="primary"
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    onClick={() => handleBookService(service)}
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default ServiceCategoryPage;
