'use client';
import React, { useState } from 'react';
import { Gift, Star, Crown, Zap, Calendar, Clock, ChevronRight } from 'lucide-react';

const RewardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'offers'>('rewards');

  const rewards = [
    {
      id: 1,
      title: '10% Off Next Service',
      points: 500,
      description: 'Get 10% off your next salon service',
      type: 'discount',
      icon: <Star className="w-6 h-6" />,
      color: 'bg-yellow-500',
    },
    {
      id: 2,
      title: 'Free Hair Wash',
      points: 300,
      description: 'Complimentary hair wash with any service',
      type: 'service',
      icon: <Gift className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      id: 3,
      title: 'VIP Treatment',
      points: 1000,
      description: 'Premium VIP salon experience',
      type: 'premium',
      icon: <Crown className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
  ];

  const offers = [
    {
      id: 1,
      title: 'Weekend Special',
      discount: '20% OFF',
      description: 'All services 20% off on weekends',
      validUntil: '2024-12-31',
      salon: 'Glamour Studio',
      type: 'limited',
    },
    {
      id: 2,
      title: 'New Customer Bonus',
      discount: '30% OFF',
      description: 'First visit discount for new customers',
      validUntil: '2024-12-25',
      salon: 'Beauty Haven',
      type: 'new',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Rewards & Offers</h1>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold">1,250 Points</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-3 mb-2">
          <div className="bg-yellow-400 h-3 rounded-full w-3/4"></div>
        </div>
        <p className="text-sm opacity-90">250 points to next reward level</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'rewards'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500'
            }`}
          >
            Rewards
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'offers'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500'
            }`}
          >
            Special Offers
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'rewards' ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Rewards</h2>
            {rewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${reward.color} rounded-full p-2 text-white`}>
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{reward.title}</h3>
                      <p className="text-sm text-gray-600">{reward.description}</p>
                      <div className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium text-gray-700">{reward.points} points</span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                    Redeem
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Special Offers</h2>
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {offer.discount}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {offer.type === 'limited' ? 'Limited Time' : 'New Customer'}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                
                <h3 className="font-semibold text-gray-800 mb-1">{offer.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                <p className="text-sm font-medium text-purple-600 mb-2">{offer.salon}</p>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Valid until {offer.validUntil}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Points History */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Points Activity</h2>
          <div className="space-y-3">
            {[
              { action: 'Appointment completed', points: '+50', date: '2 days ago', salon: 'Glamour Studio' },
              { action: 'Review submitted', points: '+25', date: '1 week ago', salon: 'Beauty Haven' },
              { action: 'Reward redeemed', points: '-300', date: '2 weeks ago', salon: 'Style Lounge' },
            ].map((activity, index) => (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.salon}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${activity.points.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.points}
                    </p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;