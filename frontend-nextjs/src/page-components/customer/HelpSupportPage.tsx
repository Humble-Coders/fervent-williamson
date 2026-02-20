'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { HelpCircle, ArrowLeft, MessageCircle, Mail, Phone, BookOpen } from 'lucide-react';
import Card from '@/components/ui/Card';

const HelpSupportPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/welcome');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const supportOptions = [
    { icon: BookOpen, title: 'FAQ', description: 'Find answers to common questions', action: () => router.push('/help') },
    { icon: MessageCircle, title: 'Live Chat', description: 'Chat with our support team', action: () => {} },
    { icon: Mail, title: 'Email Support', description: 'Send us an email', action: () => window.location.href = 'mailto:support@cutq.store' },
    { icon: Phone, title: 'Call Support', description: '+91 8197970532', action: () => window.location.href = 'tel:+918197970532' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 md:rounded-2xl md:mt-6">
          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">❓</div>
          <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">✨</div>
          <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">💬</div>

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
                <HelpCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Help & Support</h1>
              <p className="text-white/80 text-sm">Get help and contact support</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">How can we help you?</h2>
              <p className="text-sm text-gray-600">Choose a support option below</p>
            </div>
            <div className="p-6 space-y-3">
              {supportOptions.map((option, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-gray-50 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border-2 border-transparent hover:border-green-200 transition-all cursor-pointer group"
                  onClick={option.action}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <option.icon className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{option.title}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportPage;

