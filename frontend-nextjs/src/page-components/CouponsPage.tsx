'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { 
  Search, 
  Filter, 
  Tag, 
  Clock, 
  MapPin, 
  Copy, 
  Check, 
  Gift, 
  Percent, 
  Star,
  Calendar,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { offerService, Offer } from '../services/offerService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';

interface CouponFilters {
  search: string;
  type: string;
  salon: string;
  sortBy: 'newest' | 'expiring' | 'value' | 'featured';
}

const CouponsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  // State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filters, setFilters] = useState<CouponFilters>({
    search: '',
    type: '',
    salon: '',
    sortBy: 'featured'
  });

  // Load offers on component mount
  useEffect(() => {
    loadOffers();
  }, []);

  // Apply filters when offers or filters change
  useEffect(() => {
    applyFilters();
  }, [offers, filters]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all active offers
      const activeOffers = await offerService.getActiveOffers();
      
      // Filter only valid offers (not expired)
      const validOffers = activeOffers.filter(offer => offerService.isOfferValid(offer));
      
      setOffers(validOffers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...offers];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(offer => 
        offer.title.toLowerCase().includes(searchLower) ||
        offer.description.toLowerCase().includes(searchLower) ||
        offer.salon?.name.toLowerCase().includes(searchLower) ||
        offer.code?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(offer => offer.type === filters.type);
    }

    // Salon filter
    if (filters.salon) {
      filtered = filtered.filter(offer => offer.salonId === filters.salon);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'expiring':
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
        case 'value':
          return b.value - a.value;
        case 'featured':
        default:
          // Featured first, then by creation date
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredOffers(filtered);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      logger.error('Failed to copy code:', err);
    }
  };

  const handleUseCoupon = (offer: Offer) => {
    // Navigate to salons page with the specific salon if available
    if (offer.salonId && offer.salon) {
      router.push(`/salons/${offer.salon.name.toLowerCase().replace(/\s+/g, '-')}/${offer.salonId}?coupon=${offer.code || offer.id}`);
    } else {
      // Navigate to general salons page with coupon info
      router.push(`/salons?coupon=${offer.code || offer.id}`);
    }
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="w-5 h-5" />;
      case 'FIXED_AMOUNT':
        return <Tag className="w-5 h-5" />;
      case 'FREE_SERVICE':
        return <Gift className="w-5 h-5" />;
      case 'BOGO':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const getOfferGradient = (offer: Offer) => {
    if (offer.isFeatured) {
      return 'from-purple-500 to-pink-500';
    }
    switch (offer.type) {
      case 'PERCENTAGE':
        return 'from-blue-500 to-cyan-500';
      case 'FIXED_AMOUNT':
        return 'from-green-500 to-emerald-500';
      case 'FREE_SERVICE':
        return 'from-orange-500 to-red-500';
      case 'BOGO':
        return 'from-indigo-500 to-purple-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const uniqueSalons = Array.from(new Set(offers.map(o => o.salon?.name).filter(Boolean)));
  const offerTypes = Array.from(new Set(offers.map(o => o.type)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-text-secondary">Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Oops! Something went wrong</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={loadOffers} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-yellow-300 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold">Amazing Deals & Coupons</h1>
              <Sparkles className="w-8 h-8 text-yellow-300 ml-3" />
            </div>
            <p className="text-primary-100 text-lg">
              Save big on your favorite beauty services with exclusive offers
            </p>
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <Gift className="w-4 h-4 mr-1" />
                <span>{offers.length} Active Offers</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1" />
                <span>{offers.filter(o => o.isFeatured).length} Featured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container-custom px-4 py-6">
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
              <Input
                type="text"
                placeholder="Search coupons..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {offerTypes.map(type => (
                <option key={type} value={type}>
                  {offerService.getOfferTypeDisplayName(type)}
                </option>
              ))}
            </select>

            {/* Salon Filter */}
            <select
              value={filters.salon}
              onChange={(e) => setFilters(prev => ({ ...prev, salon: e.target.value }))}
              className="px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Salons</option>
              {uniqueSalons.map(salon => (
                <option key={salon} value={offers.find(o => o.salon?.name === salon)?.salonId}>
                  {salon}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'featured' | 'newest' | 'expiring' | 'value' }))}
              className="px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest First</option>
              <option value="expiring">Expiring Soon</option>
              <option value="value">Highest Value</option>
            </select>
          </div>
        </Card>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No coupons found</h3>
            <p className="text-text-secondary">
              {filters.search || filters.type || filters.salon 
                ? 'Try adjusting your filters to see more offers'
                : 'Check back soon for new amazing deals!'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <CouponCard
                key={offer.id}
                offer={offer}
                onCopyCode={handleCopyCode}
                onUseCoupon={handleUseCoupon}
                copiedCode={copiedCode}
                getOfferIcon={getOfferIcon}
                getOfferGradient={getOfferGradient}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Separate component for coupon card to keep main component under 300 lines
interface CouponCardProps {
  offer: Offer;
  onCopyCode: (code: string) => void;
  onUseCoupon: (offer: Offer) => void;
  copiedCode: string | null;
  getOfferIcon: (type: string) => React.ReactNode;
  getOfferGradient: (offer: Offer) => string;
}

const CouponCard: React.FC<CouponCardProps> = ({
  offer,
  onCopyCode,
  onUseCoupon,
  copiedCode,
  getOfferIcon,
  getOfferGradient
}) => {
  const isExpiringSoon = offerService.isOfferExpiringSoon(offer);
  const daysUntilExpiry = Math.ceil((new Date(offer.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden hover:shadow-hover transition-all duration-300 group">
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${getOfferGradient(offer)} p-4 text-white relative`}>
        {offer.isFeatured && (
          <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs">
            ⭐ Featured
          </Badge>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getOfferIcon(offer.type)}
            <span className="text-sm font-medium opacity-90">
              {offerService.getOfferTypeDisplayName(offer.type)}
            </span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-1">{offer.title}</h3>
        <div className="text-2xl font-bold">
          {offerService.formatOfferValue(offer)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-text-secondary text-sm mb-3 line-clamp-2">
          {offer.description}
        </p>

        {/* Salon info */}
        {offer.salon && (
          <div className="flex items-center text-sm text-text-secondary mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{offer.salon.name}</span>
          </div>
        )}

        {/* Validity */}
        <div className="flex items-center text-sm mb-4">
          <Calendar className="w-4 h-4 mr-1 text-text-tertiary" />
          <span className={isExpiringSoon ? 'text-orange-600 font-medium' : 'text-text-secondary'}>
            {isExpiringSoon ? `Expires in ${daysUntilExpiry} days` : `Valid until ${new Date(offer.validUntil).toLocaleDateString()}`}
          </span>
        </div>

        {/* Coupon code */}
        {offer.code && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-text-tertiary uppercase tracking-wide">Coupon Code</span>
                <div className="font-mono font-bold text-lg">{offer.code}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyCode(offer.code!)}
                className="flex items-center space-x-1"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Minimum purchase */}
        {offer.minPurchase && offer.minPurchase > 0 && (
          <p className="text-xs text-text-tertiary mb-3">
            *Minimum purchase of ₹{offer.minPurchase} required
          </p>
        )}

        {/* Action button */}
        <Button
          variant="primary"
          className="w-full group-hover:shadow-md transition-shadow"
          onClick={() => onUseCoupon(offer)}
        >
          <span>Use This Coupon</span>
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};

export default CouponsPage;
