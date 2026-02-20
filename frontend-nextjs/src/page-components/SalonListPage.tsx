'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  MapPin,
  Star,
  IndianRupee,
  Clock,
  Grid3X3,
  List,
  SlidersHorizontal,
  ChevronDown,
  Heart,
  Award,
  Zap,
  Sparkles,
  ArrowRight,
  X,
  Palette,
  Scissors,
  User,
  Hand,
  Eye,
  Gift,
  TrendingUp,
  Users,
  Building,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { salonService } from '../services/salonService';
import { getSalonMainImage } from '../utils/imageUtils';
import { generateSalonUrl } from '../utils/urlUtils';
// SEO is handled by Next.js metadata export in app/salons/page.tsx
// import SEOHead from '../components/seo/SEOHead';
import Breadcrumb from '../components/seo/Breadcrumb';
// import { getSalonListSEO } from '../utils/seoUtils';
import EnvDebug from '../components/debug/EnvDebug';
// import SearchDebug from '../components/debug/SearchDebug';
// import { testSearchLogic } from '../utils/testSearch';

interface SalonCardData {
  id: string;
  displayId?: number; // Auto-increment ID for user-friendly URLs
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance: string;
  priceRange: string;
  services: string[];
  address: string;
  featured?: boolean;
  openNow?: boolean;
  specialOffer?: string;
  nextAvailable: string;
}

interface FilterState {
  location: string;
  serviceType: string;
  priceRange: [number, number];
  rating: number;
  sortBy: string;
}

const SalonListPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    serviceType: '',
    priceRange: [0, 500],
    rating: 0,
    sortBy: 'rating'
  });
  const [salons, setSalons] = useState<SalonCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch salons from backend
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        setLoading(true);
        setError(null);

        // Search logic test removed for production

        const backendSalons = await salonService.getAllSalons();
        logger.info('🏪 Raw backend salons:', backendSalons);

        // Transform backend salon data to match our interface
        const transformedSalons: SalonCardData[] = backendSalons.map(salon => {
          const mainImage = getSalonMainImage(salon.images);

          return {
            id: salon.id,
            displayId: salon.displayId, // Include displayId for user-friendly URLs
            name: salon.name,
            image: mainImage,
            rating: salon.rating || 4.5,
            reviewCount: salon.reviewCount || 0,
            distance: `${(Math.random() * 3 + 0.5).toFixed(1)} km`, // TODO: Calculate based on user location
            priceRange: `₹${Math.floor(Math.random() * 100) + 50} - ₹${Math.floor(Math.random() * 200) + 150}`, // TODO: Calculate from services
            services: salon.specialties?.slice(0, 3) || ['Hair', 'Beauty'],
            address: salon.address,
            featured: salon.featured,
            openNow: salon.isOpen,
            specialOffer: Math.random() > 0.7 ? '20% OFF' : undefined,
            nextAvailable: 'Today 2:00 PM'
          };
        });

        setSalons(transformedSalons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch salons');
        logger.error('Error fetching salons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, []);

  // Use backend data or fallback to empty array
  const allSalons: SalonCardData[] = salons;


  const serviceTypes = [
    { id: 'all', name: 'All Services', icon: Sparkles },
    { id: 'hair', name: 'Hair', icon: Scissors },
    { id: 'nails', name: 'Nails', icon: Hand },
    { id: 'facial', name: 'Facial', icon: User },
    { id: 'massage', name: 'Massage', icon: Heart },
    { id: 'makeup', name: 'Makeup', icon: Palette },
    { id: 'eyebrows', name: 'Eyebrows', icon: Eye }
  ];

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'availability', label: 'Available Today' }
  ];

  // Filter and sort salons with improved logic
  const filteredSalons = allSalons.filter(salon => {
    // Improved search matching
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchQuery || searchLower === '' ||
                         salon.name?.toLowerCase().includes(searchLower) ||
                         salon.services?.some(service =>
                           typeof service === 'string' && service.toLowerCase().includes(searchLower)
                         ) ||
                         salon.address?.toLowerCase().includes(searchLower);

    // Improved service filtering
    const matchesService = !filters.serviceType ||
                          filters.serviceType === '' ||
                          filters.serviceType === 'all' ||
                          salon.services?.some(service =>
                            typeof service === 'string' &&
                            service.toLowerCase().includes(filters.serviceType.toLowerCase())
                          );

    // Rating filtering
    const matchesRating = !filters.rating || filters.rating === 0 || salon.rating >= filters.rating;

    return matchesSearch && matchesService && matchesRating;
  });

  // Featured salons for the top section
  const featuredSalons = allSalons.filter(salon => salon.featured);

  const handleBookNow = (salonId: string) => {
    logger.info('Booking salon:', salonId);
    // Navigate to booking page with salon ID
    router.push(`/booking?salonId=${salonId}`);
  };

  const handleFavorite = (salonId: string) => {
    logger.info('Toggle favorite:', salonId);
    // Toggle favorite logic
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-500 animate-spin" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading Salons...</h2>
          <p className="text-text-secondary">Finding the best salons for you</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error-500" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Unable to Load Salons</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto"
          >
            <Loader2 className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { name: 'Salons', url: '/salons', isActive: true }
  ];

  return (
    <>
      {/* SEO is handled by Next.js metadata export in app/salons/page.tsx */}
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50">
      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden pt-4 md:pt-0">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-4 left-4 md:top-10 md:left-10 opacity-20 animate-float">
            <Palette className="w-8 h-8 md:w-16 md:h-16 text-white/60" />
          </div>
          <div className="absolute top-8 right-8 md:top-20 md:right-20 opacity-15 animate-bounce-soft">
            <Sparkles className="w-6 h-6 md:w-12 md:h-12 text-white/50" />
          </div>
          <div className="absolute bottom-4 left-1/4 opacity-25">
            <Scissors className="w-6 h-6 md:w-10 md:h-10 text-white/40" />
          </div>
          <div className="absolute bottom-8 right-4 md:bottom-20 md:right-10 opacity-30 animate-float">
            <Star className="w-5 h-5 md:w-8 md:h-8 text-white/30" />
          </div>
        </div>

        <div className="container-custom relative z-10 py-8 md:py-16 px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-display animate-slide-up">
              Find Your Perfect Salon
            </h1>
            <p className="text-lg md:text-xl text-white/90 animate-slide-up flex items-center justify-center gap-2" style={{ animationDelay: '200ms' }}>
              Discover premium beauty services near you
              <Sparkles className="w-5 h-5 text-accent-300" />
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto animate-slide-up px-2" style={{ animationDelay: '400ms' }}>
            <Card className="backdrop-blur-xl bg-white/95 border border-white/50 shadow-glass-lg p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="hidden md:block absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search businesses, services, or stylists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 text-sm md:text-base bg-transparent border-none outline-none placeholder-text-muted"
                  />
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-3 md:p-4 rounded-xl transition-all duration-300 flex items-center gap-1 md:gap-2 ${
                    showFilters 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-neutral-100 text-text-secondary hover:bg-primary-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden md:inline">Filters</span>
                </button>


              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      {showFilters && (
        <section className="bg-white/80 backdrop-blur-xl border-b border-neutral-200 animate-slide-down">
          <div className="container-custom py-4 md:py-6 px-4">
            {/* Mobile-First Filter Layout */}
            <div className="space-y-4">
              {/* Service Type Pills - Mobile Optimized */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs md:text-sm font-medium text-text-muted">Services:</span>
                </div>
                <div className="grid grid-cols-3 md:flex md:flex-wrap gap-2">
                  {serviceTypes.slice(0, 6).map((service) => {
                    const IconComponent = service.icon;
                    return (
                      <button
                        key={service.id}
                        onClick={() => setFilters({ ...filters, serviceType: service.id })}
                        className={`px-2 py-2 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 flex flex-col md:flex-row items-center gap-1 ${
                          filters.serviceType === service.id
                            ? 'bg-primary-500 text-white shadow-soft'
                            : 'bg-neutral-100 text-text-secondary hover:bg-primary-100'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-xs md:text-sm">{service.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price and Rating Filters - Mobile Stack */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* <div>
                  <select
                    value={`${filters.priceRange[0]}-${filters.priceRange[1]}`}
                    onChange={(e) => {
                      const [min, max] = e.target.value.split('-').map(Number);
                      setFilters({ ...filters, priceRange: [min, max] });
                    }}
                    className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-xs md:text-sm font-medium border-none outline-none cursor-pointer hover:bg-primary-100 transition-colors"
                  >
                    <option value="0-500">All Prices</option>
                    <option value="0-50">₹0-50</option>
                    <option value="50-100">₹50-100</option>
                    <option value="100-200">₹100-200</option>
                    <option value="200-500">₹200+</option>
                  </select>
                </div> */}

                {/* Rating Filter */}
                <div>
                  <div className="flex items-center gap-1 mb-2 md:mb-0">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs md:text-sm text-text-muted">Min Rating:</span>
                  </div>
                  <div className="flex gap-1">
                    {[4.5, 4.0, 3.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFilters({ ...filters, rating })}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                          filters.rating === rating
                            ? 'bg-yellow-400 text-yellow-900'
                            : 'bg-neutral-100 text-text-secondary hover:bg-yellow-100'
                        }`}
                      >
                        {rating}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-xs md:text-sm font-medium border-none outline-none cursor-pointer hover:bg-primary-100 transition-colors"
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="distance">Nearest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="availability">Available Today</option>
                  </select>
                </div>
              </div>

              {/* Results and Clear Filters */}
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {filteredSalons.length} salons found
                </span>
                
                {/* Clear Filters */}
                {(filters.serviceType || filters.rating > 0 || filters.priceRange[1] < 500) && (
                  <button
                    onClick={() => setFilters({
                      location: '',
                      serviceType: '',
                      priceRange: [0, 500],
                      rating: 0,
                      sortBy: 'rating'
                    })}
                    className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Breadcrumb Navigation */}
      {/* <div className="container-custom px-4 pt-6">
        <Breadcrumb items={breadcrumbItems} />
      </div> */}

      {/* Featured Salons Section */}
      <section className="py-12">
        <div className="container-custom px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="animate-slide-up">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary font-heading flex items-center gap-3">
                <Award className="w-8 h-8 text-accent-500" />
                Featured Salons
              </h2>
              <p className="text-text-secondary mt-2">Top-rated salons with special offers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
            {featuredSalons.slice(0, 3).map((salon, index) => (
              <Link key={salon.id} href={generateSalonUrl(salon.name, salon.displayId || salon.id)}>

              <Card
                className="group relative overflow-hidden smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover"

              >
                {/* Featured Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="accent" className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                    <Award className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>

                {/* Special Offer Badge */}
                {salon.specialOffer && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="warning" className="bg-yellow-500 text-white animate-bounce-soft flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      {salon.specialOffer}
                    </Badge>
                  </div>
                )}

                {/* Salon Image */}
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <img
                    src={salon.image}
                    alt={salon.name}
                    className="w-full h-full object-cover smooth-transform gpu-accelerated smooth-scale group-hover:scale-110"
                    onError={(e) => {
                      // Set fallback image
                      (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  
                  {/* Floating icon */}
                  <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-white/80 backdrop-blur-sm rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
                  </div>
                </div>

                {/* Salon Info */}
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-text-primary group-hover:text-primary-600 smooth-hover mb-1">
                        {salon.name}
                      </h3>
                      {/* <div className="flex items-center gap-2 text-sm text-text-muted">
                        <MapPin className="w-4 h-4" />
                        <span>{salon.distance}</span>
                        {salon.openNow && (
                          <>
                            <span>•</span>
                            <Badge variant="success" size="sm" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Open Now
                            </Badge>
                          </>
                        )}
                      </div> */}
                    </div>
                    {/* <button
                      onClick={() => handleFavorite(salon.id)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <Heart className="w-5 h-5 text-text-muted hover:text-accent-500" />
                    </button> */}
                  </div>

                  {/* Rating and Price */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 md:w-4 md:h-4 ${
                              i < Math.floor(salon.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {salon.rating} ({salon.reviewCount})
                      </span>
                    </div>
                    {/* <div className="text-xs md:text-sm font-semibold text-primary-600">
                      {salon.priceRange}
                    </div> */}
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {salon.services.slice(0, 3).map((service) => (
                      <Badge key={service} variant="primary" size="sm">
                        {service}
                      </Badge>
                    ))}
                    {salon.services.length > 3 && (
                      <Badge variant="primary" size="sm">
                        +{salon.services.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Next Available */}
                  <div className="mb-4 p-2 md:p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <Zap className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="font-medium">Next available: {salon.nextAvailable}</span>
                    </div>
                  </div>

                  {/* Book Now Button */}
                    
                </div>
              </Card>
                  </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Salons Section */}
      <section className="py-12 bg-gradient-to-r from-neutral-50 to-primary-50 mb-20 md:mb-0">
        <div className="container-custom px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="animate-slide-up">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary font-heading flex items-center gap-3">
                <Building className="w-8 h-8 text-primary-500" />
                All Salons
              </h2>
              <p className="text-text-secondary mt-2">
                {filteredSalons.length} salons found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>

            {/* View Toggle */}
            {/* <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-soft">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 md:p-3 rounded-lg transition-all duration-300 flex items-center justify-center ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'text-text-muted hover:text-primary-600'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                  className={`p-2 md:p-3 rounded-lg transition-all duration-300 flex items-center justify-center ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'text-text-muted hover:text-primary-600'
                }`}
                title="List View"
              >
                <List className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div> */}
          </div>

          {filteredSalons.length === 0 ? (
            <div className="text-center py-16">
              <Building className="w-16 h-16 mx-auto mb-4 text-text-muted" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Salons Found</h3>
              <p className="text-text-secondary mb-6">
                {searchQuery ?
                  `No salons match your search for "${searchQuery}"` :
                  'No salons available at the moment'
                }
              </p>
              {/* Only show Clear Filters button if there are active filters */}
              {(searchQuery || filters.serviceType || filters.rating > 0 || filters.priceRange[1] < 500) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      location: '',
                      serviceType: '',
                      priceRange: [0, 500],
                      rating: 0,
                      sortBy: 'rating'
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'list' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-3 md:gap-4">
                  {filteredSalons.map((salon) => (
                    <Link key={salon.id} href={generateSalonUrl(salon.name, salon.displayId || salon.id)}>

                    <Card
                      className="group relative overflow-hidden smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover"
                    >
                      <div className="flex h-28 sm:h-32">
                        {/* Special Offer Badge */}
                        {/* {salon.specialOffer && (
                          <div className="absolute top-1 right-1 z-10">
                            <Badge variant="warning" className="bg-yellow-500 text-white text-xs flex items-center gap-0.5 px-1 py-0.5">
                              <Gift className="w-2 h-2" />
                              {salon.specialOffer}
                            </Badge>
                          </div>
                        )} */}

                        {/* Salon Image */}
                        <div className="relative w-28 sm:w-32 flex-shrink-0 overflow-hidden">
                          <img
                            src={salon.image}
                            alt={salon.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                          {/* Heart Icon */}
                          <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-sm rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                            <Heart className="w-3 h-3 md:w-4 md:h-4 text-primary-500" />
                          </div>

                          {/* Status indicator */}
                          {/* {salon.openNow && (
                            <div className="absolute bottom-1 left-1">
                              <Badge variant="success" size="sm" className="bg-green-500 text-white text-xs px-1 py-0.5">
                                <Clock className="w-2 h-2 mr-0.5" />
                                Open
                              </Badge>
                            </div>
                          )} */}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-text-primary mb-0.5 group-hover:text-primary-600 transition-colors duration-300 line-clamp-1">
                                  {salon.name}
                                </h3>
                                  <div className="flex items-center gap-1 pb-1 text-green-600">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span className="text-xs font-medium">{salon.nextAvailable}</span>
                                  </div>
                                {/* <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="line-clamp-1 text-xs">{salon.distance}</span>
                                </div> */}
                              </div>
                              <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded-lg ml-2 flex-shrink-0">
                                <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                                <span className="text-xs font-medium text-text-primary">
                                  {salon.rating}
                                </span>
                              </div>
                            </div>

                            {/* Services */}
                            <div className="flex flex-wrap gap-0.5 mb-1.5">
                              {salon.services.slice(0, 2).map((service, idx) => (
                                <Badge key={idx} variant="primary" className="text-xs px-1 py-0.5 bg-primary-50 text-primary-700 border-0">
                                  {service}
                                </Badge>
                              ))}
                              {salon.services.length > 2 && (
                                <Badge variant="default" className="text-xs px-1 py-0.5 bg-neutral-100 text-text-muted border-0">
                                  +{salon.services.length - 2}
                                </Badge>
                              )}
                            </div>

                            {/* Price and Availability */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1 text-text-primary">
                                <span className="text-sm font-semibold text-primary-600">{salon.priceRange}</span>
                              </div>
                             dthr
                            </div>
                              
                          </div>

                          {/* Book Button */}
                       
                        </div>
                      </div>
                    </Card>
                          </Link>
                  ))}
                </div>
              )}
            </>
          )}



          {/* Pagination */}
          {filteredSalons.length > 9 && (
            <div className="mt-12 flex justify-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1}>
                  Previous
                </Button>
                <div className="flex gap-1">
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-lg transition-all duration-300 text-sm ${
                        currentPage === page
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-text-secondary hover:bg-primary-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Debug Component - Removed for production */}
      </div>
    </>
  );
};

export default SalonListPage;