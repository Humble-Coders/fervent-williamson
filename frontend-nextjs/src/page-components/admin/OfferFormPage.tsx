'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Building2
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { offerService, Offer, CreateOfferData } from '../../services/offerService';
import { adminSalonService } from '../../services/adminSalonService';

interface Salon {
  id: string;
  name: string;
  displayId: number;
}

const OfferFormPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params?.id;
  const offerId = params?.id as string;

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salons, setSalons] = useState<Salon[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateOfferData>({
    title: '',
    description: '',
    type: 'PERCENTAGE',
    value: 0,
    code: '',
    minPurchase: 0,
    maxDiscount: 0,
    validFrom: '',
    validUntil: '',
    usageLimit: 100,
    salonId: '',
    isActive: true,
    isFeatured: false,
  });

  useEffect(() => {
    loadSalons();
    if (isEditing) {
      loadOffer();
    }
  }, [isEditing, offerId]);

  const loadSalons = async () => {
    try {
      const salons = await adminSalonService.getAllSalons();
      setSalons(salons || []);
    } catch (err) {
      logger.error('Failed to load salons:', err);
    }
  };

  const loadOffer = async () => {
    try {
      setLoading(true);
      const offer = await offerService.getOfferById(offerId);
      setFormData({
        title: offer.title,
        description: offer.description,
        type: offer.type,
        value: offer.value,
        code: offer.code || '',
        minPurchase: offer.minPurchase || 0,
        maxDiscount: offer.maxDiscount || 0,
        validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
        validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : '',
        usageLimit: offer.usageLimit || 100,
        salonId: offer.salonId || '',
        isActive: offer.isActive,
        isFeatured: offer.isFeatured,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        await offerService.updateOffer(offerId, formData);
      } else {
        await offerService.createOffer(formData);
      }
      router.push('/admin/offers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateOfferData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {isEditing ? 'Edit Offer' : 'Create New Offer'}
            </h1>
            <p className="text-text-secondary">
              {isEditing ? 'Update offer details' : 'Create a new promotional offer or discount coupon'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Offer Title *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Summer Special 20% Off"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Percent className="w-4 h-4 inline mr-2" />
                  Discount Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as 'PERCENTAGE' | 'FIXED')}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the offer details..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  {formData.type === 'PERCENTAGE' ? 'Discount Percentage *' : 'Discount Amount (₹) *'}
                </label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                  placeholder={formData.type === 'PERCENTAGE' ? '20' : '100'}
                  min="0"
                  max={formData.type === 'PERCENTAGE' ? '100' : undefined}
                  required
                />
              </div>

              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Promo Code
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="SUMMER20"
                />
              </div>

              {/* Min Purchase */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Min Purchase (₹)
                </label>
                <Input
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => handleInputChange('minPurchase', parseFloat(e.target.value) || 0)}
                  placeholder="500"
                  min="0"
                />
              </div>

              {/* Max Discount */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Max Discount (₹)
                </label>
                <Input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => handleInputChange('maxDiscount', parseFloat(e.target.value) || 0)}
                  placeholder="200"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Valid From */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Valid From *
                </label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => handleInputChange('validFrom', e.target.value)}
                  required
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Valid Until *
                </label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => handleInputChange('validUntil', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Usage Limit
                </label>
                <Input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => handleInputChange('usageLimit', parseInt(e.target.value) || 0)}
                  placeholder="100"
                  min="1"
                />
              </div>

              {/* Salon */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Salon (Optional)
                </label>
                <select
                  value={formData.salonId}
                  onChange={(e) => handleInputChange('salonId', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Salons</option>
                  {salons.map((salon) => (
                    <option key={salon.id} value={salon.id}>
                      {salon.name} (#{salon.displayId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-primary">Active</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-primary">Featured</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {isEditing ? 'Update Offer' : 'Create Offer'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default OfferFormPage;
