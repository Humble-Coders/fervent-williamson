'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { Heart, Users, Calendar, Gift, Mail, Phone, Sparkles, Star, Trophy, Crown, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { cn } from '@/utils/cn';

// Generate a unique session ID for analytics
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Analytics tracking helper (no-op: backend removed during Firebase migration)
const trackEvent = async (_eventType: string, _action?: string, _metadata?: Record<string, unknown>) => {
  // Tracking disabled — early-users API no longer exists
};

interface EarlyUser {
  id: string;
  email?: string;
  phone?: string;
  position: number;
  createdAt: string;
}

const ComingSoonPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(1247); // Mock initial count
  const [loveCount, setLoveCount] = useState(892);
  const [hasLoved, setHasLoved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Countdown to Monday, November 13th
  const launchDate = new Date('2024-11-13T00:00:00');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLoveClick = () => {
    if (!hasLoved) {
      setLoveCount(prev => prev + 1);
      setHasLoved(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      // Store in localStorage to persist
      localStorage.setItem('cutq_loved', 'true');

      // Track love click
      trackEvent('action', 'love_click', {
        previousLoveCount: loveCount,
        newLoveCount: loveCount + 1
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Track form submission attempt
    trackEvent('action', 'form_submit_attempt', {
      contactType,
      hasContact: !!(contactType === 'email' ? email : phone).trim()
    });

    // Basic validation
    const contact = contactType === 'email' ? email : phone;
    if (!contact.trim()) {
      alert(`Please enter your ${contactType}`);
      trackEvent('action', 'form_validation_error', {
        errorType: 'empty_contact',
        contactType
      });
      return;
    }

    if (contactType === 'email' && !contact.includes('@')) {
      alert('Please enter a valid email address');
      trackEvent('action', 'form_validation_error', {
        errorType: 'invalid_email',
        contactType
      });
      return;
    }

    if (contactType === 'phone' && contact.length < 10) {
      alert('Please enter a valid phone number');
      trackEvent('action', 'form_validation_error', {
        errorType: 'invalid_phone',
        contactType
      });
      return;
    }

    setIsSubmitting(true);

    // Demo mode — backend API no longer exists
    const newPosition = Math.floor(Math.random() * 100) + totalUsers;
    setUserPosition(newPosition);
    setTotalUsers(prev => prev + 1);
    setIsSubmitted(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    setIsSubmitting(false);
  };

  // Check if user has already loved and track page view
  useEffect(() => {
    const hasLovedBefore = localStorage.getItem('cutq_loved');
    if (hasLovedBefore) {
      setHasLoved(true);
    }

    // Track page view
    trackEvent('page_view', 'coming_soon_visit', {
      isReturningVisitor: !!hasLovedBefore,
      referrer: document.referrer,
      pageTitle: document.title
    });
  }, []);

  const getPositionBadge = (position: number) => {
    if (position <= 10) return { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-50', text: 'VIP Early Bird' };
    if (position <= 50) return { icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-50', text: 'Super Early' };
    if (position <= 100) return { icon: Star, color: 'text-blue-500', bg: 'bg-blue-50', text: 'Early Bird' };
    return { icon: Sparkles, color: 'text-green-500', bg: 'bg-green-50', text: 'Early Supporter' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Heart className="w-4 h-4 text-red-500" />
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20 animate-pulse blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-200 to-accent-300 rounded-full opacity-20 animate-pulse blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full opacity-15 animate-pulse blur-2xl" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-gradient-to-br from-accent-100 to-primary-100 rounded-full opacity-15 animate-pulse blur-2xl" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8 min-h-screen flex flex-col justify-center max-w-6xl">
        {/* Clean Header - No Logo */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 px-4 py-2 md:px-6 md:py-3 rounded-full text-sm font-semibold mb-6 md:mb-8 shadow-lg animate-bounce border border-primary-200">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-sm md:text-base">Something Amazing is Coming</span>
            <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-gray-900 mb-4 md:mb-6 animate-fade-in leading-tight">
            <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-600 bg-clip-text text-transparent drop-shadow-sm">
              CutQ
            </span>
          </h1>

          <h2 className="text-xl md:text-2xl lg:text-3xl text-gray-700 font-medium mb-6 md:mb-8">
            Your Beauty, Our Priority
          </h2>

          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-4">
            The ultimate beauty booking platform is launching soon! Be among the first to experience
            seamless salon bookings, exclusive deals, and personalized beauty services.
          </p>
        </div>

        {/* Compact Feature Cards - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group text-center">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-1 md:mb-2">Smart Booking</h3>
            <p className="text-xs text-gray-600 leading-relaxed hidden md:block">
              Book instantly with real-time availability
            </p>
            <p className="text-xs text-gray-600 leading-relaxed md:hidden">
              Book instantly
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group text-center">
            <div className="bg-gradient-to-br from-accent-500 to-accent-600 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-1 md:mb-2">Find Nearby</h3>
            <p className="text-xs text-gray-600 leading-relaxed hidden md:block">
              Discover top-rated salons in your area
            </p>
            <p className="text-xs text-gray-600 leading-relaxed md:hidden">
              Find salons
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group text-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
              <Star className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-1 md:mb-2">Premium Services</h3>
            <p className="text-xs text-gray-600 leading-relaxed hidden md:block">
              Access exclusive beauty treatments
            </p>
            <p className="text-xs text-gray-600 leading-relaxed md:hidden">
              Premium care
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group text-center">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
              <Gift className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-1 md:mb-2">Special Offers</h3>
            <p className="text-xs text-gray-600 leading-relaxed hidden md:block">
              Enjoy exclusive discounts & rewards
            </p>
            <p className="text-xs text-gray-600 leading-relaxed md:hidden">
              Great deals
            </p>
          </div>
        </div>

        {/* Enhanced Countdown Timer */}
        <Card className="max-w-5xl mx-auto mb-16 p-6 md:p-8 lg:p-12 bg-white/90 backdrop-blur-md border-2 border-primary-200 shadow-2xl">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-full text-sm font-semibold mb-4">
              <Calendar className="w-4 h-4" />
              Launch Date
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
              Wednesday, November 15th
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6">Get ready for the beauty revolution!</p>
          </div>
        </Card>

        {/* Enhanced Early Access Form */}
        {!isSubmitted ? (
          <Card className="max-w-lg mx-auto p-6 md:p-8 lg:p-10 bg-white/95 backdrop-blur-md border-2 border-primary-200 shadow-2xl">
            <div className="text-center mb-6 md:mb-8">
              <div className="bg-gradient-to-br from-primary-100 to-accent-100 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Gift className="w-8 h-8 md:w-10 md:h-10 text-primary-600" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">Get Early Access</h3>
              <p className="text-base md:text-lg text-gray-600">Join the waitlist and get exclusive rewards!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
                <Button
                  type="button"
                  variant={contactType === 'email' ? 'primary' : 'outline'}
                  onClick={() => {
                    if (contactType !== 'email') {
                      trackEvent('action', 'contact_type_change', {
                        from: contactType,
                        to: 'email'
                      });
                    }
                    setContactType('email');
                  }}
                  className="flex-1 py-2.5 md:py-3 text-sm md:text-base font-semibold"
                >
                  <Mail className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={contactType === 'phone' ? 'primary' : 'outline'}
                  onClick={() => {
                    if (contactType !== 'phone') {
                      trackEvent('action', 'contact_type_change', {
                        from: contactType,
                        to: 'phone'
                      });
                    }
                    setContactType('phone');
                  }}
                  className="flex-1 py-2.5 md:py-3 text-sm md:text-base font-semibold"
                >
                  <Phone className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  Phone
                </Button>
              </div>

              {contactType === 'email' ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-4 py-3 md:px-6 md:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 text-base md:text-lg bg-gray-50 focus:bg-white"
                />
              ) : (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                  className="w-full px-4 py-3 md:px-6 md:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 text-base md:text-lg bg-gray-50 focus:bg-white"
                />
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                loadingText="Joining..."
                variant="gradient"
                className="w-full py-3 md:py-4 text-base md:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                🚀 Join the Waitlist
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="max-w-lg mx-auto p-6 md:p-8 lg:p-10 bg-gradient-to-br from-green-50 via-white to-primary-50 backdrop-blur-md border-2 border-green-200 shadow-2xl">
            <div className="text-center">
              {userPosition && (() => {
                const badge = getPositionBadge(userPosition);
                const BadgeIcon = badge.icon;
                return (
                  <div className={cn("inline-flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-semibold mb-4 md:mb-6 shadow-md", badge.bg, badge.color)}>
                    <BadgeIcon className="w-4 h-4 md:w-6 md:h-6" />
                    {badge.text}
                  </div>
                );
              })()}

              <div className="text-5xl md:text-7xl mb-4 md:mb-6 animate-bounce">🎉</div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Welcome to CutQ!</h3>
              <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
                You&apos;re <span className="font-bold text-primary-600 text-lg md:text-2xl">#{userPosition}</span> in line! As an early supporter, you&apos;ll get:
              </p>

              <div className="bg-white/90 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-lg border border-gray-100">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3 md:gap-4 text-gray-700">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm md:text-lg font-medium">Priority access to new features</span>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 text-gray-700">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm md:text-lg font-medium">Exclusive early bird discounts</span>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 text-gray-700">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm md:text-lg font-medium">Special rewards and bonuses</span>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 text-gray-700">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm md:text-lg font-medium">Direct line to our support team</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 rounded-xl p-3 md:p-4">
                <p className="text-blue-700 font-semibold text-sm md:text-lg">
                  📧 We&apos;ll send you updates and launch notifications!
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Footer */}
        <div className="text-center mt-20 space-y-6">
          <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>contact@cutq.store</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+91 8197970532</span>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <p className="text-gray-500 font-medium">© 2024 CutQ. Making beauty accessible to everyone.</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
