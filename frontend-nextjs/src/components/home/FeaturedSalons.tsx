import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import Link from 'next/link'; import { useRouter } from 'next/navigation';
import { MapPin, Star, Award, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
// import EmptyState from '../ui/EmptyState'; // Removed unused import
import SalonRequestModal from '../modals/SalonRequestModal';
import LoginModal from '../auth/LoginModal';
import { useAuthPrompt } from '../../hooks/useAuthPrompt';
import { configService } from '../../services/configService';
import { getAbsoluteImageUrl } from '../../utils/imageUtils';
import { generateSalonUrl } from '../../utils/urlUtils';

// Salon Image Carousel Component
const SalonImageCarousel: React.FC<{
  images: string[];
  alt: string;
  className?: string;
}> = ({ images, alt, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <img
        src="https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800"
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <div className="relative overflow-hidden w-full h-full">
      {images.map((image, index) => (
        <img
          key={index}
          src={getAbsoluteImageUrl(image)}
          alt={`${alt} ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface Salon {
  id: string;
  displayId?: number; // Auto-increment ID for user-friendly URLs
  name: string;
  description?: string;
  address?: string;
  image: string;
  images?: string[]; // Add images array
  rating: number;
  reviewCount: number;
  distance?: string;
  services: string[];
  price: string;
  featured?: boolean;
  emoji: string;
  specialOffer?: string;
  openNow?: boolean;
  isOpen?: boolean;
}

export interface FeaturedSalonsProps {
  salons: Salon[];
  onBookNow: (salonId: string) => void;
  isAuthenticated: boolean;
}

const FeaturedSalons: React.FC<FeaturedSalonsProps> = ({
  salons,
  onBookNow: _onBookNow,
  isAuthenticated,
}) => {
  const [viewMode, _setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSalonRequestModal, setShowSalonRequestModal] = useState(false);
  const [salonSelfSignupEnabled, setSalonSelfSignupEnabled] = useState(false);
  const router = useRouter();

  // Use auth prompt hook for login modal
  const {
    isLoginModalOpen,
    promptOptions,
    promptLogin: _promptLogin,
    handleLoginSuccess,
    handleLoginCancel,
  } = useAuthPrompt();

  // Check if salon self-signup is enabled
  useEffect(() => {
    const checkSalonSignupConfig = async () => {
      try {
        const config = await configService.getConfig('salon_self_signup_enabled');
        const isEnabled = config.value === 'true';
        setSalonSelfSignupEnabled(isEnabled);
      } catch (error) {
        logger.error('Error checking salon signup config:', error);
      }
    };

    checkSalonSignupConfig();
  }, []);

  const onExploreNow = (salonId: string) => {
    // Navigate to salon detail page using SEO-friendly URL
    const salon = salons.find(s => s.id === salonId);
    if (salon) {
      const seoUrl = generateSalonUrl(salon.name, salon.displayId || salon.id);
      router.push(seoUrl);
    }
  };

  const handleJoinCutQ = () => {
    if (salonSelfSignupEnabled) {
      setShowSalonRequestModal(true);
    } else {
      // Navigate directly to welcome page for user signup
      router.push('/welcome');
    }
  };

  return (
    <section className="py-6 sm:py-8 md:py-16 bg-gradient-to-r from-primary-50 to-accent-50 relative overflow-hidden">
      {/* Background decorations - hidden on mobile for cleaner look */}
      <div className="hidden md:block absolute bottom-10 right-10 text-6xl opacity-10 animate-float" style={{ animationDelay: '3s' }}>✨</div>

      <div className="container-custom relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-6 md:mb-12 gap-3 sm:gap-4">
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 md:gap-3 mb-1 sm:mb-2 md:mb-4">
              <h2 className="text-xl sm:text-xl md:text-4xl font-bold text-text-primary font-heading">
                Featured CutQs
              </h2>
            </div>
            {/* <p className="text-sm md:text-lg text-text-secondary flex items-center gap-2">
              Top-rated salons in your area
            </p> */}
          </div>

          {/* <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-soft">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'text-text-muted hover:text-primary-600'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'text-text-muted hover:text-primary-600'
                }`}
                title="List View"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <Link
              href="/salons"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center group animate-slide-up self-start md:self-auto"
            >
              View All
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div> */}
        </div>

        <div className={`grid gap-4 md:gap-6 lg:gap-8 ${
          viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
        }`}>
            {salons.map((salon, index) => (
            <Link
              href={generateSalonUrl(salon.name, salon.displayId || salon.id)}
              key={salon.id}
              className="block group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <Card
                padding="none"
                className="overflow-hidden group relative smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover smooth-hover h-full"
              >
                {/* Image Section with Salon Name Overlay */}
                <div className="relative h-32 md:h-48 overflow-hidden rounded-t-lg">
                  <SalonImageCarousel
                    images={salon.images || [salon.image]}
                    alt={salon.name}
                    className="smooth-transform gpu-accelerated smooth-scale group-hover:scale-105"
                  />

                  {/* Elegant gradient overlay for salon name */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Salon name at bottom of image */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <h3 className="text-white text-lg md:text-xl font-bold drop-shadow-lg">
                      {salon.name}
                    </h3>
                  </div>
                </div>

                {/* Content Section - Clean & Minimal */}
                {/* <div className="p-4 md:p-6"> */}
                  {/* Rating and distance */}
                  {/* <div className="flex items-center justify-between text-text-muted text-sm">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                      <span className="font-medium">{salon.rating}</span>
                      <span className="ml-1">({salon.reviewCount})</span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {salon.distance || 'Nearby'}
                    </span>
                  </div> */}

                  {/* Footer - Elegant */}
                  {/* <div className="flex items-center justify-between pt-4 border-t border-border-light">
                    <span className="text-primary-600 font-semibold">
                      {salon.price}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        onExploreNow(salon.id);
                      }}
                      className="text-sm px-4 py-2"
                    >
                     Explore
                    </Button>
                  </div> */}
                {/* </div> */}
              </Card>
            </Link>
          ))}
        </div>

        {/* Call to action for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-12 text-center animate-slide-up" style={{ animationDelay: '800ms' }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-soft-lg">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h3 className="text-2xl font-bold text-text-primary">Ready to Get Started?</h3>
              </div>
              <p className="text-text-secondary mb-6 flex items-center justify-center gap-2">
                Sign in or create an account to book appointments and get exclusive offers!
                <span>🎁</span>
              </p>
              <div className="flex justify-center items-center gap-4" >
                <Button
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={handleJoinCutQ}
                >
                  <span>🚀</span>
                  Get Started
                  <span>💎</span>
                </Button>
              </div>
             
            </div>
          </div>
        )}
      </div>

      {/* Salon Request Modal */}
      <SalonRequestModal
        isOpen={showSalonRequestModal}
        onClose={() => setShowSalonRequestModal(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginCancel}
        onSuccess={handleLoginSuccess}
        title={promptOptions.title}
        message={promptOptions.message}
      />
    </section>
  );
};

export default FeaturedSalons;