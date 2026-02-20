'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { CreditCard, ArrowLeft, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

const PaymentMethodsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/welcome');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 md:rounded-2xl md:mt-6">
          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">💳</div>
          <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">✨</div>
          <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">💰</div>

          <div className="relative z-10 px-4 py-6">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="mb-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {/* Header Content */}
            <div className="text-center text-white mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Payment Methods</h1>
              <p className="text-white/80 text-sm">Manage your payment options</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <CreditCard className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Payment Methods</h3>
            <p className="text-gray-600 mb-6">Add a payment method for faster checkout</p>
            <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsPage;

