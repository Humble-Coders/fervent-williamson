'use client';

import React, { useState } from 'react';
import { Clock, Star, User, Calendar, ArrowRight, Award, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { getAbsoluteImageUrl } from '../../utils/imageUtils';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  images?: string[];
  popular?: boolean;
}

interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  avatar?: string;
  images?: string[]; // Stylist images
  services: Service[];
  isAvailable: boolean;
  nextAvailable?: string;
}

interface StylistMenuProps {
  stylists: Stylist[];
  onBookService: (serviceId: string, stylistId: string) => void;
  isAuthenticated: boolean;
}

const StylistMenu: React.FC<StylistMenuProps> = ({
  stylists,
  onBookService,
  isAuthenticated: _isAuthenticated,
}) => {
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);
  const [selectedSpecialty, _setSelectedSpecialty] = useState<string>('All');

  // Get all unique specialties
  // const _allSpecialties = ['All', ...Array.from(new Set(stylists.flatMap(s => s.specialties)))]; // Removed unused variable
  
  // Filter stylists by specialty
  const filteredStylists = selectedSpecialty === 'All' 
    ? stylists 
    : stylists.filter(s => s.specialties.includes(selectedSpecialty));

  const selectedStylistData = stylists.find(s => s.id === selectedStylist);

  return (
    <section className="py-6 md:py-12 bg-gradient-to-r from-neutral-50 to-primary-50 relative overflow-hidden">
      <div className="container-custom relative px-4">
        <div className="text-center mb-6 md:mb-8 animate-slide-up">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h2 className="text-xl md:text-3xl font-bold text-text-primary font-heading">
              Choose Your Stylist
            </h2>
          </div>
          <p className="text-sm md:text-base text-text-secondary flex items-center justify-center gap-2">
            Select a stylist first, then choose from their available services
          </p>
        </div>

        {/* Specialty Filter */}
        {/* <div className="flex flex-wrap justify-center gap-3 mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {allSpecialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              className={`px-6 py-3 rounded-full font-medium smooth-hover flex items-center gap-2 ${
                selectedSpecialty === specialty
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                  : 'bg-white text-text-secondary hover:bg-primary-50 border border-neutral-200'
              }`}
            >
              <Star className="w-4 h-4" />
              {specialty}
            </button>
          ))}
        </div> */}

        {!selectedStylist ? (
          /* Stylists Grid - Compact for mobile */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredStylists.map((stylist) => (
              <Card
                key={stylist.id}
                interactive
                className="group relative overflow-hidden smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover cursor-pointer"

                onClick={() => setSelectedStylist(stylist.id)}
              >
                {/* Available Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <Badge
                    variant={stylist.isAvailable ? "success" : "warning"}
                    size="sm"
                    className={`${stylist.isAvailable ? 'bg-green-500' : 'bg-yellow-500'} text-white animate-pulse-soft flex items-center gap-1 text-xs`}
                  >
                    <Clock className="w-2 h-2" />
                    {stylist.isAvailable ? 'Available' : 'Busy'}
                  </Badge>
                </div>

                {/* Stylist Avatar/Image - Smaller for mobile */}
                <div className="h-24 sm:h-28 md:h-32 bg-gradient-to-br from-primary-100 to-accent-100 relative overflow-hidden flex items-center justify-center">
                  {/* Use images first, then avatar, then fallback */}
                  {(stylist.images && stylist.images.length > 0) || stylist.avatar ? (
                    <>
                      <img
                        src={getAbsoluteImageUrl(
                          (stylist.images && stylist.images.length > 0)
                            ? stylist.images[0]
                            : stylist.avatar!
                        )}
                        alt={stylist.name}
                        className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full object-cover border-2 md:border-4 border-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="fallback-avatar w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 items-center justify-center absolute" style={{ display: 'none' }}>
                        <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>

                    </>
                  ) : (
                    <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                      <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-4 md:p-6">
                  <div className="mb-3 md:mb-4">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-text-primary mb-1 md:mb-2 group-hover:text-primary-600 smooth-hover flex items-center gap-1 md:gap-2">
                      {stylist.name}
                      <Award className="w-4 h-4 md:w-5 md:h-5 text-accent-500" />
                    </h3>
                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 md:w-4 md:h-4 ${
                              i < Math.floor(stylist.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs md:text-sm text-text-muted">
                        {stylist.rating} ({stylist.reviewCount})
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs md:text-sm">
                      {stylist.experience} years experience
                    </p>
                  </div>

                  {/* Specialties */}
                  <div className="mb-3 md:mb-4">
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {stylist.specialties.slice(0, 2).map((specialty) => (
                        <Badge key={specialty} variant="primary" size="sm" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {stylist.specialties.length > 2 && (
                        <Badge variant="primary" size="sm" className="text-xs">
                          +{stylist.specialties.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Services Count */}
                  <div className="mb-3 md:mb-4 p-2 md:p-3 bg-primary-50 rounded-lg">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-text-muted">Services:</span>
                      <span className="font-semibold text-primary-600">{stylist.services.length}</span>
                    </div>
                  </div>

                  {/* Next Available */}
                  {!stylist.isAvailable && stylist.nextAvailable && (
                    <div className="mb-3 md:mb-4 p-2 md:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-1 md:gap-2 text-yellow-800 text-xs md:text-sm">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Next: {stylist.nextAvailable}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full flex items-center justify-center gap-1 md:gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-xs md:text-sm"
                  >
                    <User className="w-3 h-3 md:w-4 md:h-4" />
                    View Services
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 smooth-hover pointer-events-none"></div>
              </Card>
            ))}
          </div>
        ) : (
          /* Selected Stylist's Services */
          <div>
            {/* Back Button and Stylist Info */}
            <div className="mb-8 animate-slide-up">
              <button
                onClick={() => setSelectedStylist(null)}
                className="mb-4 flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Stylists
              </button>
              
              {selectedStylistData && (
                <Card className="p-6 bg-gradient-to-r from-primary-50 to-accent-50">
                  <div className="flex items-center gap-4">
                    {selectedStylistData.avatar ? (
                      <img
                        src={getAbsoluteImageUrl(selectedStylistData.avatar)}
                        alt={selectedStylistData.name}
                        className="w-16 h-16 rounded-full object-cover"

                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        {selectedStylistData.name}
                        <Award className="w-6 h-6 text-accent-500" />
                      </h3>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(selectedStylistData.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-text-muted">
                          {selectedStylistData.rating} ({selectedStylistData.reviewCount} reviews)
                        </span>
                      </div>
                      <p className="text-text-secondary">
                        {selectedStylistData.experience} years experience • {selectedStylistData.services.length} services available
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {selectedStylistData?.services.map((service) => (
                <Card
                  key={service.id}
                  interactive
                  className="group relative overflow-hidden smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover"

                >
                  {/* Popular Badge */}
                  {service.popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="accent" className="bg-primary-500 text-white animate-pulse-soft flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  {/* Service Background */}
                  <div className="h-32 bg-gradient-to-br from-primary-100 to-accent-100 relative overflow-hidden">
                    {service.images && service.images.length > 0 ? (
                      <img
                        src={getAbsoluteImageUrl(service.images[0])}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Star className="w-12 h-12 text-primary-300 opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-primary-600 smooth-hover">
                        {service.name}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-primary-600">
                          <span className="font-semibold">₹{service.price}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{service.duration}min</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => onBookService(service.id, selectedStylist)}
                    >
                      <Calendar className="w-4 h-4" />
                      Book This Service
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 smooth-hover pointer-events-none"></div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StylistMenu;
