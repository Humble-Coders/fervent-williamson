'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Gift, ArrowLeft, Award, Star } from 'lucide-react';
import Card from '@/components/ui/Card';

const RewardsPage: React.FC = () => {
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
          <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">🎁</div>
          <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">⭐</div>
          <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">🏆</div>

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
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Rewards & Offers</h1>
              <p className="text-white/80 text-sm">Your points and exclusive offers</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {/* Points Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Your Points</h2>
              <p className="text-sm text-gray-600">Earn points with every booking</p>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Total Points</p>
                    <h2 className="text-4xl font-bold">0</h2>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Offers Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Available Offers</h2>
              <p className="text-sm text-gray-600">Exclusive deals just for you</p>
            </div>
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
                <Gift className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Offers Available</h3>
              <p className="text-gray-600">Check back later for exclusive offers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;

