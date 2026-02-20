'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Bell, ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [settings, setSettings] = useState({
    appointmentReminders: true,
    specialOffers: true,
    newSalonAlerts: false,
    smsNotifications: true,
    emailNotifications: true
  });

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
          <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">🔔</div>
          <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">✨</div>
          <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">📱</div>

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
                <Bell className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Notifications</h1>
              <p className="text-white/80 text-sm">Manage your notification preferences</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
              <p className="text-sm text-gray-600">Choose how you want to be notified</p>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <p className="text-sm text-gray-600">Receive notifications for this</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

