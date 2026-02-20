'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Gift,
  Percent,
  Users,
  Copy,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { offerService, Offer } from '../../services/offerService';
import { useAuthStore } from '../../store/authStore';

const SalonCouponsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get offers for the current salon
      // Get salon ID from user's owned salons
      const salonId = (user as any)?.ownedSalons?.[0]?.id;

      if (!salonId) {
        setError('No salon found for current user');
        return;
      }

      const salonOffers = await offerService.getAllOffers({
        salonId
      });

      setOffers(salonOffers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: Offer) => {
    // Navigate to edit page (we can create this later if needed)
    router.push(`/salon/coupons/edit/${offer.id}`);
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      await offerService.deleteOffer(offerId);
      await loadOffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete offer');
    }
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

  const getOfferStatusColor = (offer: Offer) => {
    if (!offer.isActive) return 'bg-gray-100 text-gray-600';
    if (!offerService.isOfferValid(offer)) return 'bg-red-100 text-red-600';
    if (offerService.isOfferExpiringSoon(offer)) return 'bg-yellow-100 text-yellow-600';
    if (offer.isFeatured) return 'bg-purple-100 text-purple-600';
    return 'bg-green-100 text-green-600';
  };

  // Filter offers based on search and type
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || offer.type === selectedType;
    return matchesSearch && matchesType;
  });

  const offerTypes = Array.from(new Set(offers.map(o => o.type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Coupons & Offers</h1>
          <p className="text-text-secondary">Create and manage special offers for your customers</p>
        </div>
        <Button
          onClick={() => router.push('/salon/coupons/create')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Offer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Gift className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Offers</p>
              <p className="text-xl font-semibold">{offers.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Active Offers</p>
              <p className="text-xl font-semibold">
                {offers.filter(o => offerService.isOfferValid(o)).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Featured</p>
              <p className="text-xl font-semibold">
                {offers.filter(o => o.isFeatured).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Usage</p>
              <p className="text-xl font-semibold">
                {offers.reduce((sum, o) => sum + (o._count?.usedBy || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
              <Input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {offerTypes.map(type => (
              <option key={type} value={type}>
                {offerService.getOfferTypeDisplayName(type)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <Card className="p-8 text-center">
          <Gift className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No offers found</h3>
          <p className="text-text-secondary mb-4">
            {searchTerm || selectedType 
              ? 'Try adjusting your filters to see more offers'
              : 'Create your first offer to attract more customers'
            }
          </p>
          {!searchTerm && !selectedType && (
            <Button onClick={() => router.push('/salon/coupons/create')}>
              Create Your First Offer
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopyCode={handleCopyCode}
              copiedCode={copiedCode}
              getOfferIcon={getOfferIcon}
              getOfferStatusColor={getOfferStatusColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Separate component for offer card to keep main component under 300 lines
interface OfferCardProps {
  offer: Offer;
  onEdit: (offer: Offer) => void;
  onDelete: (offerId: string) => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  getOfferIcon: (type: string) => React.ReactNode;
  getOfferStatusColor: (offer: Offer) => string;
}

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onEdit,
  onDelete,
  onCopyCode,
  copiedCode,
  getOfferIcon,
  getOfferStatusColor
}) => {
  const isExpired = !offerService.isOfferValid(offer);
  const isExpiringSoon = offerService.isOfferExpiringSoon(offer);

  return (
    <Card className="overflow-hidden hover:shadow-hover transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-border-primary">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getOfferStatusColor(offer)}`}>
              {getOfferIcon(offer.type)}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{offer.title}</h3>
              <p className="text-sm text-text-secondary">
                {offerService.formatOfferValue(offer)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {offer.isFeatured && (
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                ⭐ Featured
              </Badge>
            )}
            <Badge className={`text-xs ${getOfferStatusColor(offer)}`}>
              {offerService.getOfferStatusText(offer)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
          {offer.description}
        </p>

        {/* Coupon Code */}
        {offer.code && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-text-tertiary uppercase tracking-wide">Code</span>
                <div className="font-mono font-bold">{offer.code}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyCode(offer.code!)}
                className="flex items-center gap-1"
              >
                {copiedCode === offer.code ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-tertiary">Valid Until:</span>
            <span className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-text-secondary'}>
              {new Date(offer.validUntil).toLocaleDateString()}
            </span>
          </div>
          
          {offer.minPurchase && offer.minPurchase > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary">Min. Purchase:</span>
              <span className="text-text-secondary">₹{offer.minPurchase}</span>
            </div>
          )}
          
          {offer.usageLimit && (
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary">Usage Limit:</span>
              <span className="text-text-secondary">
                {offer._count?.usedBy || 0} / {offer.usageLimit}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border-primary bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(offer)}
              className="flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(offer.id)}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/coupons`, '_blank')}
            className="flex items-center gap-1 text-primary-600"
          >
            <ExternalLink className="w-3 h-3" />
            View Public
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SalonCouponsPage;
