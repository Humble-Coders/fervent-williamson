'use client';

import React, { useState, useEffect } from 'react';
import { Star, Heart } from 'lucide-react';
// import { useRouter } from 'next/navigation'; // Removed unused import
import Badge from '../ui/Badge';
import { getAbsoluteImageUrl } from '../../utils/imageUtils';

// Salon Header Image Carousel Component
const SalonHeaderImageCarousel: React.FC<{
  images: string[];
  alt: string;
}> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <img
        src="https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200"
        alt={alt}
        className="w-full h-full object-cover smooth-transform gpu-accelerated smooth-scale group-hover:scale-105"
      />
    );
  }

  return (
    <>
      {images.map((image, index) => (
        <img
          key={index}
          src={getAbsoluteImageUrl(image)}
          alt={`${alt} ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 smooth-transform gpu-accelerated smooth-scale group-hover:scale-105 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            // Set fallback image if loading fails
            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200';
          }}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </>
  );
};

export interface SalonHeaderProps {
  salon: {
    id: string;
    name: string;
    image: string;
    images?: string[]; // Add images array
    rating: number;
    reviewCount: number;
    address: string;
    phone: string;
    isOpen: boolean;
    distance?: string;
    specialties?: string[];
    teamSize?: number;
    yearsInBusiness?: number;
  };
  onBookNow: () => void;
  isAuthenticated: boolean;
}

const SalonHeader: React.FC<SalonHeaderProps> = ({
  salon,
  onBookNow: _onBookNow,
  isAuthenticated: _isAuthenticated,
}) => {
  // const _router = useRouter(); // Removed unused variable



  return (
    <div className="relative">
      {/* Hero Image with Overlay - More compact for mobile */}
      <div className="relative h-40 sm:h-48 md:h-64 lg:h-80 overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl">
        <SalonHeaderImageCarousel
          images={salon.images || [salon.image]}
          alt={salon.name}
        />

        {/* Minimal Gradient Overlay - Only at bottom for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Floating Emojis - reduced on mobile */}
        {/* <div className="absolute top-4 right-4 lg:top-6 lg:right-6 text-2xl lg:text-4xl animate-bounce-soft opacity-80">✨</div>
        <div className="hidden sm:block absolute bottom-6 left-6 lg:bottom-8 lg:left-8 text-2xl lg:text-3xl animate-float opacity-70">💄</div>
        <div className="hidden lg:block absolute top-1/3 right-1/4 text-2xl animate-pulse-soft opacity-60">💅</div> */}

        {/* Navigation */}
        {/* <div className="absolute top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4 flex items-center gap-2">
          <button
            onClick={() => router.push(-1)}
            className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 smooth-hover focus-ring"
          >
            <ArrowLeft className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          </button>
        </div> */}

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 flex items-center gap-1 sm:gap-2">
          <button className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 smooth-hover focus-ring">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4" />
          </button>
          {/* <button className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 smooth-hover focus-ring">
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4" />
          </button> */}
        </div>
        
        {/* Minimal Salon Info Overlay - Just name and status */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white font-heading">
              {salon.name}
            </h1>
          </div>

          {/* Rating only - minimal */}
          <div className="flex items-center justify-between" >
            <div className="flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-xl rounded-full px-2 py-1 sm:px-3 sm:py-1.5 self-start mt-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(salon.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-white/40'
                      }`}
                  />
                ))}
              </div>
              <span className="text-white font-semibold text-xs sm:text-sm">{salon.rating > 0 ? salon.rating.toFixed(1) : '0.0'}</span>
              <span className="text-white/80 text-xs">({salon.reviewCount})</span>
            </div>
            {salon.isOpen && (
              <Badge variant="success" size="sm" className="bg-green-500 text-white">
                <span className="text-xs">Open</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonHeader;