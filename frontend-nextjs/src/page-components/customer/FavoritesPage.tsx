'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Heart, ArrowLeft, Store, Scissors } from 'lucide-react';
import Card from '@/components/ui/Card';

const FavoritesPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'salons' | 'services'>('salons');

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
          <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">❤️</div>
          <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">✨</div>
          <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">⭐</div>

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
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Favorites</h1>
              <p className="text-white/80 text-sm">Your saved salons and services</p>
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex">
              <button
                onClick={() => setActiveTab('salons')}
                className={`flex-1 px-4 py-4 font-semibold text-sm transition-all ${
                  activeTab === 'salons'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-b-3 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Store className="w-4 h-4" />
                  <span>Salons</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 px-4 py-4 font-semibold text-sm transition-all ${
                  activeTab === 'services'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-b-3 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Scissors className="w-4 h-4" />
                  <span>Services</span>
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'salons' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pink-100 mb-4">
                <Heart className="w-10 h-10 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Favorite Salons Yet</h3>
              <p className="text-gray-600 mb-6">Start adding salons to your favorites</p>
              <button
                onClick={() => router.push('/salons')}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                Explore Salons
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-4">
                <Scissors className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Favorite Services Yet</h3>
              <p className="text-gray-600 mb-6">Start adding services to your favorites</p>
              <button
                onClick={() => router.push('/services')}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                Explore Services
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;

