'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Shield, ArrowLeft, Download } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const PrivacySecurityPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [settings, setSettings] = useState({
    profileVisibility: 'public',
    dataSharing: true,
    twoFactorAuth: false
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
          <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">🔒</div>
          <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">✨</div>
          <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">🛡️</div>

          <div className="relative z-10 px-4 py-6">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="mb-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Header Content */}
            <div className="text-center text-white mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Privacy & Security</h1>
              <p className="text-white/80 text-sm">Control your privacy settings</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {/* Privacy Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Privacy Settings</h2>
              <p className="text-sm text-gray-600">Manage who can see your information</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <h4 className="font-semibold text-gray-900">Profile Visibility</h4>
                  <p className="text-sm text-gray-600">Who can see your profile</p>
                </div>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                  className="border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <h4 className="font-semibold text-gray-900">Data Sharing</h4>
                  <p className="text-sm text-gray-600">Share data for better recommendations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dataSharing}
                    onChange={(e) => setSettings(prev => ({ ...prev, dataSharing: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Data Management</h2>
              <p className="text-sm text-gray-600">Download or delete your data</p>
            </div>
            <div className="p-6">
              <button className="w-full px-6 py-3 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-all font-semibold flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download My Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySecurityPage;

