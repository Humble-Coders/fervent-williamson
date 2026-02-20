'use client';

import React, { useState } from 'react';
import { Tag, Check, X, Gift, Percent, TrendingUp } from 'lucide-react';
// import Card from '../ui/Card'; // Removed unused import
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { Offer } from '../../services/offerService';
import Button from '../ui/Button';

interface PaymentMethodConfig {
  id: string;
  name: string;
  type: string;
  icon: string;
  emoji: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

interface PaymentSectionProps {
  selectedPaymentMethod: string | null;
  onPaymentMethodSelect: (method: string) => void;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromo: () => void;
  discount: number;
  appliedOffer?: Offer | null;
  couponValidationError?: string | null;
  paymentMethods?: PaymentMethodConfig[];
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  selectedPaymentMethod,
  onPaymentMethodSelect,
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  discount,
  appliedOffer,
  couponValidationError,
  paymentMethods = [],
}) => {
  const [isApplying, setIsApplying] = useState(false);

  // Fallback payment methods if none provided
  const defaultPaymentMethods = [
    // {
    //   id: 'card',
    //   name: 'Credit/Debit Card',
    //   type: 'card',
    //   icon: 'CreditCard',
    //   emoji: '💳',
    //   description: 'Visa, Mastercard, Amex',
    //   isActive: true,
    //   sortOrder: 1
    // },
    // {
    //   id: 'wallet',
    //   name: 'Digital Wallet',
    //   type: 'wallet',
    //   icon: 'Wallet',
    //   emoji: '📱',
    //   description: 'Apple Pay, Google Pay',
    //   isActive: true,
    //   sortOrder: 2
    // },
    {
      id: 'cash',
      name: 'Pay at Salon',
      type: 'cash',
      icon: 'IndianRupee',
      description: 'Cash or card at location',
      isActive: true,
      sortOrder: 3
    }
  ];

  const availablePaymentMethods = paymentMethods.length > 0 ? paymentMethods : defaultPaymentMethods;

  // Icon mapping for dynamic icons
  // const iconMap: { [key: string]: React.ComponentType } = {
  //   CreditCard,
  //   Wallet,
  //   IndianRupee,
  // };

  const handleApplyPromo = async () => {
    setIsApplying(true);
    try {
      await onApplyPromo();
    } finally {
      setIsApplying(false);
    }
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="w-4 h-4" />;
      case 'FIXED_AMOUNT':
        return <Tag className="w-4 h-4" />;
      case 'FREE_SERVICE':
        return <Gift className="w-4 h-4" />;
      case 'BOGO':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const formatOfferValue = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENTAGE':
        return `${offer.value}% OFF`;
      case 'FIXED_AMOUNT':
        return `₹${offer.value} OFF`;
      case 'FREE_SERVICE':
        return 'FREE SERVICE';
      case 'BOGO':
        return 'Buy 1 Get 1';
      default:
        return `${offer.value}`;
    }
  };

  return (
    <div className="mb-4 bg-white rounded-lg p-3 sm:p-4 shadow-soft">
      <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
        <span className="text-lg sm:text-2xl">💳</span>
        <h3 className="text-base sm:text-lg font-semibold text-text-primary">
          Payment Method
        </h3>
        <span className="text-lg sm:text-2xl">💰</span>
        {paymentMethods.length > 0 && (
          <span className="text-xs bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-auto">
            {paymentMethods.length} available
          </span>
        )}
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
        {availablePaymentMethods.map((method) => {
          // const _IconComponent = iconMap[method.icon] || CreditCard; // Removed unused variable
          return (
            <div
              key={method.id}
              onClick={() => onPaymentMethodSelect(method.type)}
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-soft ${
                selectedPaymentMethod === method.type
                  ? 'border-primary-500 bg-primary-50 shadow-soft'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <div className="text-center">
                {/* <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <span className="text-lg sm:text-2xl">{method.emoji}</span>
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                </div> */}
                <h4 className="font-semibold text-text-primary mb-0.5 sm:mb-1 text-xs sm:text-sm">
                  {method.name}
                </h4>
                <p className="text-xs text-text-muted">
                  {method.description}
                </p>
                {selectedPaymentMethod === method.type && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full">
                      ✓ Selected
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon Code Section */}
      <div className="border-t border-neutral-200 pt-3 sm:pt-4">
        <h4 className="font-semibold text-text-primary mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
          Coupon Code
        </h4>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter coupon code"
              value={promoCode}
              onChange={(e) => onPromoCodeChange(e.target.value)}
              leftIcon={<Tag className="w-4 h-4" />}
              className={appliedOffer ? 'border-green-500' : couponValidationError ? 'border-red-500' : ''}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleApplyPromo}
            disabled={!promoCode.trim() || isApplying}
            className="px-4 text-sm"
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </Button>
        </div>

        {/* Applied Coupon Success */}
        {appliedOffer && discount > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 text-green-600">
                  {getOfferIcon(appliedOffer.type)}
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-green-800">{appliedOffer.title}</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {formatOfferValue(appliedOffer)}
                    </Badge>
                  </div>
                  <p className="text-green-700 text-sm">{appliedOffer.description}</p>
                  <p className="text-green-600 text-sm font-medium mt-1">
                    🎉 You saved ₹{discount}!
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onPromoCodeChange('');
                  // This will trigger a re-validation and clear the applied offer
                }}
                className="text-green-600 hover:text-green-700 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Validation Error */}
        {couponValidationError && (
          <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-800 text-sm">
              <X className="w-4 h-4" />
              <span>{couponValidationError}</span>
            </div>
          </div>
        )}

        {/* Coupon Info */}
        {!appliedOffer && !couponValidationError && (
          <div className="mt-2 text-xs text-text-tertiary">
            💡 Have a coupon? Enter the code above to save on your booking!
          </div>
        )}
      </div>

      {/* Security Notice */}
      {/* <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800 text-sm">
          <span className="text-lg">🔒</span>
          <p>
            <strong>Secure Payment:</strong> Your payment information is encrypted and secure
          </p>
        </div>
      </div> */}
    </div>
  );
};

export default PaymentSection;