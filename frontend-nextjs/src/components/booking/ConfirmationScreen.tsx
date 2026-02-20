'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Download, Share2, Home, Bell, Mail, Phone, Star, Sparkles, Crown, Heart, Zap, Award, CheckCircle, ArrowRight, Copy } from 'lucide-react';
import Link from 'next/link';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export interface ConfirmationScreenProps {
  bookingId: string;
  service: {
    name: string;
    price: number;
    emoji?: string;
  };
  salon: {
    name: string;
    address: string;
    phone: string;
  };
  stylist?: {
    name: string;
    emoji: string;
  };
  date: string;
  time: string;
  total: number;
  verificationCode?: string;
  onAddToCalendar: () => void;
  onDownloadReceipt: () => void;
  onShare: () => void;
  onSetupReminders?: () => void;
  onSendConfirmation?: () => void;
  onEditBooking?: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  bookingId,
  service,
  salon,
  stylist,
  date,
  time,
  total,
  verificationCode,
  onAddToCalendar,
  onDownloadReceipt,
  onShare,
  onSetupReminders: _onSetupReminders,
  onSendConfirmation: _onSendConfirmation,
  onEditBooking,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [copiedBookingId, setCopiedBookingId] = useState(false);
  const [copiedVerificationCode, setCopiedVerificationCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Animate steps
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => prev < 2 ? prev + 1 : prev);
    }, 1000);
    return () => clearInterval(stepTimer);
  }, []);

  const copyBookingId = () => {
    navigator.clipboard.writeText(bookingId);
    setCopiedBookingId(true);
    setTimeout(() => setCopiedBookingId(false), 2000);
  };

  const copyVerificationCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      setCopiedVerificationCode(true);
      setTimeout(() => setCopiedVerificationCode(false), 2000);
    }
  };

  // const handleSendConfirmation = () => {
  //   if (onSendConfirmation) {
  //     onSendConfirmation();
  //   }
  //   alert('📧 Confirmation email sent! 📱 SMS notification sent!');
  // };

  // const handleSetupReminders = () => {
  //   if (onSetupReminders) {
  //     onSetupReminders();
  //   }
  //   alert('🔔 Reminders set! You\'ll receive notifications 24 hours and 1 hour before your appointment.');
  // };

  // Floating confetti animation
  const ConfettiParticle = ({ delay }: { delay: number }) => (
    <div
      className={`absolute w-3 h-3 animate-particle opacity-80 ${showConfetti ? 'block' : 'hidden'}`}
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${3 + Math.random() * 2}s`,
      }}
    >
      {['🎉', '✨', '🎊', '💫', '⭐', '🌟'][Math.floor(Math.random() * 6)]}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating confetti */}
        {[...Array(20)].map((_, i) => (
          <ConfettiParticle key={i} delay={i * 0.2} />
        ))}

        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-200/20 to-emerald-300/20 rounded-full blur-3xl animate-float-slow"></div>

        {/* Sparkle effects */}
        <div className="absolute top-20 left-20 text-6xl opacity-20 animate-bounce-soft">✨</div>
        <div className="absolute top-40 right-32 text-4xl opacity-30 animate-pulse-soft">🎉</div>
        <div className="absolute bottom-32 left-1/4 text-5xl opacity-25 animate-float">💫</div>
        <div className="absolute bottom-20 right-20 text-3xl opacity-40 animate-bounce-soft">🌟</div>
      </div>

      <div className="container-custom max-w-4xl relative z-10 py-8">
        {/* Hero Success Section */}
        <div className="text-center mb-12 animate-scale-in">
          {/* Success Icon with Pulse Animation */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto relative">
              {/* Pulsing rings */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-pulse opacity-30"></div>

              {/* Main success icon */}
              <div className="absolute inset-4 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-full flex items-center justify-center shadow-glow-accent">
                <CheckCircle className="w-16 h-16 text-white animate-bounce-soft" />
              </div>

              {/* Floating decorative elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce-soft" style={{ animationDelay: '0.5s' }}>
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full flex items-center justify-center animate-pulse-soft">
                <Heart className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent mb-4 font-display animate-text-reveal">
              Booking Confirmed! 🎉
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              Your beauty journey begins soon! ✨
            </p>

            {/* Booking ID with Copy Feature */}
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-2xl px-6 py-4 border border-emerald-200/50 shadow-soft-lg animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-600">Booking ID:</span>
                <code className="text-lg font-bold text-emerald-700 font-mono">#{bookingId}</code>
              </div>
              <button
                onClick={copyBookingId}
                className="p-2 hover:bg-emerald-100 rounded-lg transition-colors group"
                title="Copy booking ID"
              >
                {copiedBookingId ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-emerald-600" />
                )}
              </button>
            </div>

            {/* Verification Code for Salon */}
            {verificationCode && (
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-xl rounded-2xl px-6 py-4 border border-purple-200/50 shadow-soft-lg animate-slide-up mt-4" style={{ animationDelay: '0.8s' }}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔐</span>
                  <span className="text-sm text-purple-600 font-medium">Verification Code:</span>
                  <code className="text-2xl font-bold text-purple-700 font-mono tracking-wider">{verificationCode}</code>
                </div>
                <button
                  onClick={copyVerificationCode}
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors group"
                  title="Copy verification code"
                >
                  {copiedVerificationCode ? (
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500 group-hover:text-purple-600" />
                  )}
                </button>
              </div>
            )}

            {verificationCode && (
              <p className="text-sm text-purple-600 mt-2 animate-slide-up" style={{ animationDelay: '1.0s' }}>
                💡 Show this code to the salon staff to verify your booking
              </p>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Booking Details Card */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 border border-emerald-200/50 shadow-glass-lg animate-slide-up">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/20 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-200/15 to-transparent rounded-full transform -translate-x-12 translate-y-12"></div>

              <div className="relative z-10">
                {/* Service Header */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-emerald-100/50 to-teal-100/50 rounded-2xl border border-emerald-200/30">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-3xl shadow-soft">
                    {service.emoji || '✨'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{service.name}</h2>
                    <p className="text-emerald-600 font-semibold text-lg">{salon.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">Premium Service</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-600">₹{total}</div>
                    <Badge variant="success" className="bg-emerald-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confirmed
                    </Badge>
                  </div>
                </div>

                {/* Appointment Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 hover:shadow-soft transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Date</p>
                        <p className="text-lg font-bold text-gray-800">{date}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 hover:shadow-soft transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Time</p>
                        <p className="text-lg font-bold text-gray-800">{time}</p>
                      </div>
                    </div>
                  </div>

                  {stylist && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 hover:shadow-soft transition-all duration-300 group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Stylist</p>
                          <p className="text-lg font-bold text-gray-800">{stylist.name} {stylist.emoji}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 hover:shadow-soft transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Location</p>
                        <p className="text-sm font-semibold text-gray-800">{salon.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Need to make changes?</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Call {salon.name} at <span className="font-semibold text-blue-600">{salon.phone}</span> or manage your booking in your profile.
                    Free cancellation up to 24 hours before your appointment.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Primary Actions */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-glow animate-slide-up">
              <div className="text-center mb-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse-soft" />
                <h3 className="text-lg font-bold">Quick Actions</h3>
              </div>

              <div className="space-y-3">
                <Button
                  variant="secondary"
                  onClick={onAddToCalendar}
                  className="w-full bg-white/20 backdrop-blur-xl border-white/30 text-white hover:bg-white/30 flex items-center justify-center gap-2 group"
                >
                  <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Add to Calendar
                  <span className="text-lg">📅</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={onDownloadReceipt}
                  className="w-full bg-white/20 backdrop-blur-xl border-white/30 text-white hover:bg-white/30 flex items-center justify-center gap-2 group"
                >
                  <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Download Receipt
                  <span className="text-lg">📄</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={onShare}
                  className="w-full bg-white/20 backdrop-blur-xl border-white/30 text-white hover:bg-white/30 flex items-center justify-center gap-2 group"
                >
                  <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Share Booking
                  <span className="text-lg">📤</span>
                </Button>
              </div>
            </Card>

            {/* Status Cards */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800">Auto Reminders</h4>
                    <p className="text-sm text-blue-700">24h & 1h before appointment</p>
                  </div>
                  <div className="text-2xl">🔔</div>
                </div>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800">Confirmation Sent</h4>
                    <p className="text-sm text-green-700">Email & SMS delivered</p>
                  </div>
                  <div className="text-2xl">✅</div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 animate-slide-up">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            What happens next?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Mail, title: 'Confirmation Sent', desc: 'Check your email & SMS', completed: true },
              { icon: Bell, title: 'Reminders Set', desc: '24h & 1h before appointment', completed: currentStep >= 1 },
              { icon: Sparkles, title: 'Enjoy Your Service', desc: 'Arrive 10 minutes early', completed: currentStep >= 2 }
            ].map((step, index) => (
              <div key={index} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${step.completed ? 'bg-white/80 shadow-soft' : 'bg-white/40'
                }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${step.completed
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-110'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${step.completed ? 'text-gray-800' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Navigation Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '1s' }}>
          {onEditBooking && (
            <Button
              variant="outline"
              size="lg"
              onClick={onEditBooking}
              className="flex items-center justify-center gap-2 group hover:shadow-soft"
            >
              <span className="text-xl group-hover:animate-bounce-soft">✏️</span>
              Edit Booking
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          <Link href="/" className="block">
            <Button variant="outline" size="lg" className="w-full flex items-center justify-center gap-2 group hover:shadow-soft">
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Back to Home
              <span className="text-xl">🏠</span>
            </Button>
          </Link>

          <Link href="/profile" className="block">
            <Button variant="primary" size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-2 group shadow-glow">
              <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
              My Bookings
              <span className="text-xl">📋</span>
            </Button>
          </Link>
        </div>

        {/* Cancellation Policy */}
        <Card className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-sm">⚠️</span>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">Cancellation & Rescheduling Policy</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• Free cancellation up to 24 hours before appointment</p>
                <p>• Reschedule anytime up to 2 hours before</p>
                <p>• Late cancellations may incur a 50% service fee</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Thank You Message */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '1.4s' }}>
          <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 rounded-3xl p-8 border border-pink-200/50 shadow-soft-lg">
            <div className="text-6xl mb-4 animate-bounce-soft">💖</div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Thank you for choosing CutQ!
            </h2>
            <p className="text-gray-600 text-lg">
              We can&apos;t wait to pamper you and provide an amazing experience ✨
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <span className="text-2xl animate-bounce-soft">🌟</span>
              <span className="text-2xl animate-bounce-soft" style={{ animationDelay: '0.2s' }}>💅</span>
              <span className="text-2xl animate-bounce-soft" style={{ animationDelay: '0.4s' }}>💄</span>
              <span className="text-2xl animate-bounce-soft" style={{ animationDelay: '0.6s' }}>✨</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;