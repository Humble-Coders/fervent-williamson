'use client';

import React, { useState } from 'react';
import { X, CreditCard, Shield, Clock } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingDetails: {
    serviceName: string;
    salonName: string;
    totalPrice: number;
    date: string;
    time: string;
  };
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
  onPaymentSuccess: (booking: any) => void;
  onPaymentError: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingDetails,
  userDetails,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const result = await paymentService.processPayment(bookingId, userDetails);
      
      if (result.success && result.booking) {
        onPaymentSuccess(result.booking);
        onClose();
      } else {
        onPaymentError(result.error || 'Payment failed');
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{bookingDetails.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salon:</span>
                <span className="font-medium">{bookingDetails.salonName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium">
                  {new Date(bookingDetails.date).toLocaleDateString()} at {bookingDetails.time}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-medium">Total Amount:</span>
                <span className="text-lg font-bold text-primary-600">
                  ₹{bookingDetails.totalPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Razorpay</div>
                  <div className="text-sm text-gray-600">
                    Credit Card, Debit Card, UPI, Net Banking, Wallets
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">Secure Payment</div>
                <div className="text-blue-700">
                  Your payment information is encrypted and secure. Powered by Razorpay.
                </div>
              </div>
            </div>
          </div>

          {/* Payment Timeout Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-900 mb-1">Payment Timeout</div>
                <div className="text-amber-700">
                  Please complete your payment within 15 minutes to secure your booking.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Processing...
                </div>
              ) : (
                `Pay ₹${bookingDetails.totalPrice}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
