'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Gift,
  Percent,
  Tag,
  TrendingUp
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { offerService, CreateOfferData } from '../../services/offerService';
import { useAuthStore } from '../../store/authStore';

const CreateOfferPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    isActive: true,
    isFeatured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Get salon ID from user's owned salons
      const salonId = (user as any)?.ownedSalons?.[0]?.id;

      if (!salonId) {
        setError('No salon found for current user');
        return;
      }

      const offerData = {
        ...formData,
        salonId, // Associate with current salon
      };
      
      await offerService.createOffer(offerData);
      setSuccess(true);
      
      // Redirect back to coupons page after a short delay
      setTimeout(() => {
        router.push('/salon/coupons');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create offer');
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormData = (field: keyof CreateOfferData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getOfferTypeIcon = (type: string) => {
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

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Offer Created Successfully!</h2>
          <p className="text-text-secondary mb-4">
            Your new offer has been created and is now available to customers.
          </p>
          <p className="text-sm text-text-tertiary">
            Redirecting you back to the coupons page...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Create New Offer</h1>
          <p className="text-text-secondary">Create a special offer to attract more customers</p>
        </div>
      </div>

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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            {getOfferTypeIcon(formData.type)}
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Offer Title *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="e.g., Weekend Special"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Offer Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => updateFormData('type', e.target.value)}
                className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="PERCENTAGE">Percentage Discount</option>
                <option value="FIXED_AMOUNT">Fixed Amount Discount</option>
                <option value="FREE_SERVICE">Free Service</option>
                <option value="BOGO">Buy One Get One</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Describe your offer in detail..."
              rows={3}
              className="w-full px-3 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
        </Card>

        {/* Value and Limits */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Value & Limits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {formData.type === 'PERCENTAGE' ? 'Discount %' : 'Amount (₹)'} *
              </label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => updateFormData('value', parseFloat(e.target.value) || 0)}
                placeholder={formData.type === 'PERCENTAGE' ? '20' : '500'}
                min="0"
                step={formData.type === 'PERCENTAGE' ? '1' : '0.01'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Min. Purchase (₹)
              </label>
              <Input
                type="number"
                value={formData.minPurchase}
                onChange={(e) => updateFormData('minPurchase', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            {formData.type === 'PERCENTAGE' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Max Discount (₹)
                </label>
                <Input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => updateFormData('maxDiscount', parseFloat(e.target.value) || 0)}
                  placeholder="1000"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Coupon Code and Usage */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Coupon Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Coupon Code
              </label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => updateFormData('code', e.target.value.toUpperCase())}
                placeholder="SAVE20"
                style={{ textTransform: 'uppercase' }}
              />
              <p className="text-xs text-text-tertiary mt-1">
                Leave empty for auto-generated code
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Usage Limit
              </label>
              <Input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => updateFormData('usageLimit', parseInt(e.target.value) || 0)}
                placeholder="100"
                min="1"
              />
            </div>
          </div>
        </Card>

        {/* Validity Period */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Validity Period</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Valid From *
              </label>
              <Input
                type="date"
                value={formData.validFrom}
                onChange={(e) => updateFormData('validFrom', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Valid Until *
              </label>
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) => updateFormData('validUntil', e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {/* Options */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Options</h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateFormData('isActive', e.target.checked)}
                className="rounded border-border-primary text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Active</span>
              <span className="text-xs text-text-tertiary">(Customers can use this offer)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => updateFormData('isFeatured', e.target.checked)}
                className="rounded border-border-primary text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">Featured</span>
              <span className="text-xs text-text-tertiary">(Highlight this offer)</span>
            </label>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
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
            disabled={submitting}
            className="flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            Create Offer
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOfferPage;
