'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { User, Mail, Phone, MapPin, Edit3, Save, X, Lock, ArrowLeft, Camera, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const ProfileDetailsPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.preferences?.preferredLocations?.[0] || ''
  });

  // OTP verification states
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [emailOTP, setEmailOTP] = useState('');
  const [phoneOTP, setPhoneOTP] = useState('');

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeMethod, setPasswordChangeMethod] = useState<'current' | 'email' | 'phone'>('current');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/welcome');
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Check if email or phone changed - require OTP verification
      if (formData.email !== user?.email) {
        setShowEmailOTP(true);
        setMessage({ type: 'success', text: 'OTP sent to your new email address' });
        return;
      }
      if (formData.phone !== user?.phone) {
        setShowPhoneOTP(true);
        setMessage({ type: 'success', text: 'OTP sent to your new phone number' });
        return;
      }

      // Save other changes
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditMode(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      // API call to change password based on method
      if (passwordChangeMethod === 'email' || passwordChangeMethod === 'phone') {
        // Verify OTP first
        if (!passwordData.otp) {
          setMessage({ type: 'error', text: 'Please enter OTP' });
          return;
        }
      }
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const sendOTPForPasswordChange = async () => {
    setLoading(true);
    try {
      // API call to send OTP
      setMessage({
        type: 'success',
        text: `OTP sent to your ${passwordChangeMethod === 'email' ? 'email' : 'phone'}`
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  // Determine available password change methods
  const hasEmail = !!user?.email;
  const hasPhone = !!user?.phone;
  const passwordChangeMethods = [
    { value: 'current' as const, label: 'Current Password', available: true },
    { value: 'email' as const, label: 'Email OTP', available: hasEmail },
    { value: 'phone' as const, label: 'Phone OTP', available: hasPhone }
  ].filter(method => method.available);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 md:rounded-2xl md:mt-6">
          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">✨</div>
          <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">💎</div>
          <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">🌟</div>

          <div className="relative z-10 px-4 py-6">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="mb-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {/* Profile Avatar */}
            <div className="text-center text-white mb-4">
              <div className="relative inline-block mb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-lg">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <h1 className="text-2xl font-bold mb-1">{user?.name}</h1>
              <p className="text-white/80 text-sm">Manage your personal information</p>
            </div>

            {/* Edit Button */}
            {!isEditMode && (
              <div className="flex justify-center">
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-6 py-2.5 bg-white text-purple-600 rounded-full font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-4 mt-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? '✓' : '⚠️'}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
              <p className="text-sm text-gray-600">Update your personal details</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <User className="w-5 h-5 text-purple-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditMode}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-pink-500" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditMode}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>
                {isEditMode && formData.email !== user?.email && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <span className="text-amber-600 text-sm">⚠️</span>
                    <p className="text-xs text-amber-700 font-medium">Changing email requires OTP verification</p>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Phone className="w-5 h-5 text-orange-500" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditMode}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                {isEditMode && formData.phone !== user?.phone && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <span className="text-amber-600 text-sm">⚠️</span>
                    <p className="text-xs text-amber-700 font-medium">Changing phone requires OTP verification</p>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <MapPin className="w-5 h-5 text-green-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditMode}
                    placeholder="Enter your city or area"
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditMode && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Password & Security Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Password & Security
                  </h2>
                  <p className="text-sm text-gray-600">Manage your account password</p>
                </div>
                {!showPasswordChange && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                )}
              </div>
            </div>

            {showPasswordChange && (
              <div className="p-6 space-y-5">
                {/* Password Change Method Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Verification Method</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {passwordChangeMethods.map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setPasswordChangeMethod(method.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          passwordChangeMethod === method.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            passwordChangeMethod === method.value
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {passwordChangeMethod === method.value && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="font-medium text-sm">{method.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Password Method */}
                {passwordChangeMethod === 'current' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Enter current password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email/Phone OTP Method */}
                {(passwordChangeMethod === 'email' || passwordChangeMethod === 'phone') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      OTP Verification
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={passwordData.otp}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, otp: e.target.value }))}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                          maxLength={6}
                        />
                      </div>
                      <button
                        onClick={sendOTPForPasswordChange}
                        disabled={loading}
                        className="px-6 py-3.5 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-all disabled:opacity-50"
                      >
                        Send OTP
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      OTP will be sent to your {passwordChangeMethod === 'email' ? 'email' : 'phone number'}
                    </p>
                  </div>
                )}

                {/* New Password Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
                    }}
                    className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailsPage;
