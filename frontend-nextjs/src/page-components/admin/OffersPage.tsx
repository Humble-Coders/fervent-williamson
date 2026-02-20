'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  X,
  Gift
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { offerService, Offer } from '../../services/offerService';
import { adminSalonService } from '../../services/adminSalonService';

interface Salon {
  id: string;
  name: string;
}

const OffersPage: React.FC = () => {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalon, setSelectedSalon] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [offersData, salonsData] = await Promise.all([
        offerService.getAllOffers(),
        adminSalonService.getAllSalons()
      ]);

      setOffers(offersData);
      setSalons(salonsData.map(salon => ({ id: salon.id, name: salon.name })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: Offer) => {
    router.push(`/admin/offers/${offer.id}/edit`);
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      await offerService.deleteOffer(offerId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete offer');
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSalon = !selectedSalon || offer.salonId === selectedSalon;
    const matchesType = !selectedType || offer.type === selectedType;
    
    return matchesSearch && matchesSalon && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-2 text-text-secondary">Loading offers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Offers & Coupons Management</h1>
          <p className="text-text-secondary">Create and manage promotional offers and discount coupons</p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/admin/offers/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Offer
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="hidden md:block absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <Input
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 md:pl-10"
            />
          </div>
          
          <select
            value={selectedSalon}
            onChange={(e) => setSelectedSalon(e.target.value)}
            className="input"
          >
            <option value="">All Salons</option>
            {salons.map(salon => (
              <option key={salon.id} value={salon.id}>{salon.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input"
          >
            <option value="">All Types</option>
            <option value="PERCENTAGE">Percentage Discount</option>
            <option value="FIXED_AMOUNT">Fixed Amount</option>
            <option value="FREE_SERVICE">Free Service</option>
            <option value="BOGO">Buy One Get One</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedSalon('');
              setSelectedType('');
            }}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map(offer => (
          <Card key={offer.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{offer.title}</h3>
                  <p className="text-sm text-text-muted">{offer.salon?.name || 'All Salons'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge
                  variant={offerService.getOfferStatusColor(offer).includes('green') ? 'success' : 
                          offerService.getOfferStatusColor(offer).includes('red') ? 'error' : 
                          offerService.getOfferStatusColor(offer).includes('yellow') ? 'warning' : 'default'}
                  size="sm"
                >
                  {offerService.getOfferStatusText(offer)}
                </Badge>
                {offer.isFeatured && (
                  <Badge variant="warning" size="sm">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-text-secondary text-sm mb-4 line-clamp-2">
              {offer.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Discount:</span>
                <span className="font-medium text-primary-600">
                  {offerService.formatOfferValue(offer)}
                </span>
              </div>
              
              {offer.code && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Code:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                    {offer.code}
                  </code>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Valid Until:</span>
                <span className="text-text-primary">
                  {new Date(offer.validUntil).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Used:</span>
                <span className="text-text-primary">
                  {offer._count?.usedBy || 0} / {offer.usageLimit || '∞'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-text-muted">
                {offerService.formatOfferDates(offer)}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(offer)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(offer.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No offers found</h3>
          <p className="text-text-secondary">
            {searchTerm || selectedSalon || selectedType
              ? 'Try adjusting your filters'
              : 'Get started by creating your first offer'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default OffersPage;
