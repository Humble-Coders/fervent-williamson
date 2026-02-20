'use client';

import React, { useState } from 'react';
import { Clock, Scissors, Hand, User, Heart, Star, ArrowLeft, ChevronRight, Plus, Minus, X } from 'lucide-react';
import Card from '../ui/Card';
// import Badge from '../ui/Badge'; // Removed unused import
import Button from '../ui/Button';
import GenderFilter from './GenderFilter';
import { getAbsoluteImageUrl } from '../../utils/imageUtils';

interface SubService {
  id: string;
  displayId: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  images?: string[];
  isActive: boolean;
}

interface Service {
  id: string;
  displayId: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category?: string;
  categoryEmoji?: string;
  image?: string;
  images?: string[];
  popular?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  subServices?: SubService[];
}

interface Stylist {
  id: string;
  name: string;
}

interface SelectedServiceItem {
  service: Service;
  subService?: SubService | null;
  stylist?: Stylist | null;
  quantity?: number;
}

interface ServiceMenuProps {
  services: Service[];
  onBookService: (serviceId: string, subServiceId?: string) => void;
  onRemoveService?: (serviceId: string, subServiceId?: string) => void;
  onUpdateQuantity?: (serviceId: string, subServiceId: string | undefined, quantity: number) => void;
  isAuthenticated: boolean;
  selectedServices?: SelectedServiceItem[];
}

const ServiceMenu: React.FC<ServiceMenuProps> = ({
  services,
  onBookService,
  onRemoveService,
  onUpdateQuantity,
  isAuthenticated: _isAuthenticated,
  selectedServices = [],
}) => {
  const [selectedCategory, _setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE' | 'UNISEX' | 'ALL'>('ALL');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showSubServices, setShowSubServices] = useState(false);

  // Helper function to check if a service/subservice is selected
  const isServiceSelected = (serviceId: string, subServiceId?: string) => {
    return selectedServices.some(item =>
      item.service.id === serviceId &&
      (subServiceId ? item.subService?.id === subServiceId : !item.subService)
    );
  };

  // Helper function to get quantity of a service/subservice
  const getServiceQuantity = (serviceId: string, subServiceId?: string) => {
    const item = selectedServices.find(item =>
      item.service.id === serviceId &&
      (subServiceId ? item.subService?.id === subServiceId : !item.subService)
    );
    return item?.quantity || 0;
  };

  // Get unique categories with their emojis and service counts
  const getCategoryStats = () => {
    const categoryMap = new Map<string, { emoji: string; count: number }>();

    services.forEach(service => {
      const category = service.category || 'General';
      const emoji = service.categoryEmoji || '✨';

      if (categoryMap.has(category)) {
        categoryMap.get(category)!.count++;
      } else {
        categoryMap.set(category, { emoji, count: 1 });
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      emoji: data.emoji,
      count: data.count
    }));
  };

  const categoryStats = getCategoryStats();

  // Filter services by category and gender
  const filteredServices = services.filter(service => {
    // Category filter
    const matchesCategory = selectedCategory === 'All' || (service.category || 'General') === selectedCategory;

    // Gender filter
    const matchesGender = selectedGender === 'ALL' ||
      service.gender === selectedGender ||
      service.gender === 'UNISEX' ||
      !service.gender; // Include services without gender specified

    return matchesCategory && matchesGender;
  });

  // Group services by category for category filter
  // const _categories = ['All', ...Array.from(new Set(services.map(s => s.category)))]; // Removed unused variable

  // const categoryIcons: { [key: string]: React.ComponentType } = {
  //   'All': Sparkles,
  //   'Hair': Scissors,
  //   'Nails': Hand,
  //   'Facial': User,
  //   'Massage': Heart,
  //   'Makeup': Palette,
  //   'Eyebrows': Eye
  // }; // Removed unused variable

  // Handle service selection - check if it has sub-services
  const handleServiceClick = (service: Service) => {
    if (service.subServices && service.subServices.length > 0) {
      // Show sub-services
      setSelectedService(service);
      setShowSubServices(true);
    } else {
      // Book directly
      onBookService(service.id);
    }
  };

  // Handle sub-service selection
  const handleSubServiceClick = (subService: SubService) => {
    if (selectedService) {
      onBookService(selectedService.id, subService.id);
    }
  };

  // Go back to main services view
  const handleBackToServices = () => {
    setSelectedService(null);
    setShowSubServices(false);
  };

  return (
    <section className="py-6 md:py-12 bg-gradient-to-r from-neutral-50 to-primary-50 relative overflow-hidden">
      <div className="container-custom relative px-4">
        <div className="text-center mb-6 md:mb-8 animate-slide-up">
          <div className="flex items-center justify-center gap-2 mb-3">
            {showSubServices && selectedService && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToServices}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <h2 className="text-xl md:text-3xl font-bold text-text-primary font-heading">
              {showSubServices && selectedService ? selectedService.name : 'Our Services'}
            </h2>
          </div>
          <p className="text-sm md:text-base text-text-secondary">
            {showSubServices && selectedService
              ? 'Choose a specific option for this service'
              : 'Choose from our premium beauty services'
            }
          </p>
        </div>

        {/* Gender Filter - Only show for main services */}
        {!showSubServices && (
          <div className="flex justify-center mb-6 md:mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <GenderFilter
              selectedGender={selectedGender}
              onGenderChange={setSelectedGender}
            />
          </div>
        )}

        {/* Category Filter - Compact for mobile */}
        {/* <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {categories.map((category) => {
            const IconComponent = categoryIcons[category] || Sparkles;
            return (
              <div
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium smooth-hover flex items-center gap-2 sm:px-2 sm:py-1 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                    : 'bg-white text-text-secondary hover:bg-primary-50 border border-neutral-200'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {category}
              </div>
            );
          })}
        </div> */}

        {/* Conditional Content: Services or Sub-Services */}
        {showSubServices && selectedService ? (
          /* Sub-Services Grid */
          <div className="space-y-6">
            {/* Service Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-start gap-4">
                {selectedService.images && selectedService.images.length > 0 && (
                  <img
                    src={getAbsoluteImageUrl(selectedService.images[0])}
                    alt={selectedService.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedService.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{selectedService.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-primary-600 font-semibold">₹{selectedService.price}</span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedService.duration}min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {selectedService.subServices?.map((subService) => {
                const isSelected = isServiceSelected(selectedService.id, subService.id);
                const quantity = getServiceQuantity(selectedService.id, subService.id);

                return (
                  <Card
                    key={subService.id}
                    className={`group relative overflow-hidden smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover cursor-pointer ${isSelected ? 'ring-2 ring-primary-500 shadow-lg' : ''
                      }`}
                    onClick={() => handleSubServiceClick(subService)}
                  >
                    {/* Sub-Service Image */}
                    <div className="h-24 sm:h-28 md:h-32 bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
                      {subService.images && subService.images.length > 0 ? (
                        <img
                          src={getAbsoluteImageUrl(subService.images[0])}
                          alt={subService.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Scissors className="w-8 h-8 text-primary-400" />
                        </div>
                      )}
                      {/* Selection Badge */}
                      {isSelected && quantity > 0 && (
                        <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                          ✓ {quantity}
                        </div>
                      )}
                    </div>

                    {/* Sub-Service Content */}
                    <div className="p-3 sm:p-4 md:p-6">
                      <div className="mb-3 md:mb-4">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-text-primary mb-1 md:mb-2 group-hover:text-primary-600 smooth-hover">
                          {subService.name}
                        </h3>
                        {subService.description && (
                          <p className="text-text-secondary text-xs sm:text-sm leading-relaxed line-clamp-2">
                            {subService.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-1 text-primary-600">
                            <span className="font-semibold text-sm sm:text-base">₹{subService.price}</span>
                          </div>
                          <div className="flex items-center gap-1 text-text-muted">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">{subService.duration}min</span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveService?.(selectedService.id, subService.id);
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            {/* <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> */}
                            <span className="">Cancel</span>
                          </button>
                          <div className="flex items-center bg-green-500 rounded-lg overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity?.(selectedService.id, subService.id, quantity - 1);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white p-1.5 sm:p-2 transition-colors flex items-center justify-center"
                            >
                              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <span className="text-white font-semibold px-2.5 sm:px-3 text-xs sm:text-sm min-w-[28px] sm:min-w-[32px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity?.(selectedService.id, subService.id, quantity + 1);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white p-1.5 sm:p-2 transition-colors flex items-center justify-center"
                            >
                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                        >
                          Book This Option
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          /* Main Services Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredServices.map((service) => {
              const isSelected = isServiceSelected(service.id);
              const quantity = getServiceQuantity(service.id);

              return (
                <Card
                  key={service.id}
                  className={`group relative overflow-hidden smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover ${isSelected ? 'ring-2 ring-primary-500 shadow-lg' : ''
                    }`}
                >
                  {/* Popular Badge */}
                  {/* {service.popular && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="accent" size="sm" className="bg-primary-500 text-white animate-pulse-soft flex items-center gap-1 text-xs">
                    <Sparkles className="w-2 h-2" />
                    Popular
                  </Badge>
                </div>
              )} */}

                  {/* Service Image/Background - Smaller for mobile */}
                  <div className="h-24 sm:h-28 md:h-32 bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
                    {service.images && service.images.length > 0 ? (
                      <img
                        src={getAbsoluteImageUrl(service.images[0])}
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback icon - always present but hidden when image loads */}
                    <div className={`fallback-icon w-full h-full flex items-center justify-center absolute inset-0 ${service.images && service.images.length > 0 ? 'hidden' : ''}`}>
                      <Heart className="w-12 h-12 text-primary-300 opacity-50" />
                    </div>

                    {/* Selection Badge */}
                    {isSelected && quantity > 0 && (
                      <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                        ✓ {quantity}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  <div className="p-3 sm:p-4 md:p-6">
                    <div className="mb-3 md:mb-4">
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-text-primary mb-1 md:mb-2 group-hover:text-primary-600 smooth-hover">
                        {service.name}
                      </h3>
                      <p className="text-text-secondary text-xs sm:text-sm leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 text-primary-600">
                          <span className="font-semibold text-sm sm:text-base">₹{service.price}</span>
                        </div>
                        <div className="flex items-center gap-1 text-text-muted">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">{service.duration}min</span>
                        </div>
                      </div>
                    </div>

                    {service.subServices && service.subServices.length > 0 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                        onClick={() => handleServiceClick(service)}
                      >
                        View Options
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    ) : isSelected ? (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveService?.(service.id);
                          }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Cancel</span>
                        </button>
                        <div className="flex items-center bg-green-500 rounded-lg overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity?.(service.id, undefined, quantity - 1);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white p-1.5 sm:p-2 transition-colors flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <span className="text-white font-semibold px-2.5 sm:px-3 text-xs sm:text-sm min-w-[28px] sm:min-w-[32px] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity?.(service.id, undefined, quantity + 1);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white p-1.5 sm:p-2 transition-colors flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                        onClick={() => handleServiceClick(service)}
                      >
                        Book Service
                      </Button>
                    )}
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 smooth-hover pointer-events-none"></div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Service Stats - Dynamic categories with emojis - Only show for main services */}
        {!showSubServices && (
          <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-slide-up" style={{ animationDelay: '600ms' }}>
            {categoryStats.slice(0, 3).map((category, index) => (
              <div key={category.name} className="text-center bg-white/50 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4">
                <div className="flex justify-center mb-1 md:mb-2">
                  <span className="text-2xl md:text-3xl">{category.emoji}</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-primary-600">{category.count}</div>
                <div className="text-xs md:text-sm text-text-muted">{category.name}</div>
              </div>
            ))}
            <div className="text-center bg-white/50 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4">
              <div className="flex justify-center mb-1 md:mb-2">
                <Star className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
              </div>
              <div className="text-lg md:text-xl font-bold text-green-600">4.9</div>
              <div className="text-xs md:text-sm text-text-muted">Avg Rating</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServiceMenu;