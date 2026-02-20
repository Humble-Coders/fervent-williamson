'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, Phone, MessageCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { buildApiUrl } from '../../config/env';
import { useAuthStore } from '../../store/authStore';
import {
  isValidEmail,
  isValidPhone,
  isValidOTP,
  formatPhoneNumber,
  VALIDATION_MESSAGES
} from '../../utils/validation';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
}

type AuthStep = 'method' | 'phone' | 'email' | 'whatsapp' | 'otp' | 'password' | 'set-password' | 'name-input' | 'reset-password';

interface SigninConfig {
  emailEnabled: boolean;
  phoneEnabled: boolean;
  whatsappEnabled: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Sign in to continue",
  message = "Please sign in to complete your booking"
}) => {
  // Get auth state
  const { isAuthenticated } = useAuthStore();

  // Auth Flow States
  const [authStep, setAuthStep] = useState<AuthStep>('method');
  const [contactValue, setContactValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [genderValue, setGenderValue] = useState<'MALE' | 'FEMALE' | ''>('');
  const [authType, setAuthType] = useState<'phone' | 'email' | 'whatsapp'>('phone');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Individual field errors
  const [contactError, setContactError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);

  // Signin configuration state
  const [signinConfig, setSigninConfig] = useState<SigninConfig>({
    emailEnabled: true,
    phoneEnabled: true,
    whatsappEnabled: false,
  });

  // Reset modal state
  const resetModal = useCallback(() => {
    setAuthStep('method');
    setContactValue('');
    setOtpValue('');
    setPasswordValue('');
    setConfirmPasswordValue('');
    setNameValue('');
    setGenderValue('');
    setAuthError('');
    setContactError('');
    setOtpError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setNameError('');
    setIsResettingPassword(false);
    setShowPassword(false);
  }, []);

  // Handler: Login Success
  const handleLoginSuccess = useCallback(() => {
    console.log('[LoginModal] handleLoginSuccess called');
    console.log('[LoginModal] Calling onSuccess callback');
    // Call onSuccess first to close modal and trigger booking
    onSuccess();
    console.log('[LoginModal] onSuccess callback completed');
    // Reset modal state after a brief delay to ensure smooth transition
    setTimeout(() => {
      console.log('[LoginModal] Resetting modal state');
      resetModal();
    }, 100);
  }, [onSuccess, resetModal]);

  // Auto-close modal when user becomes authenticated
  useEffect(() => {
    console.log('[LoginModal] useEffect - isOpen:', isOpen, 'isAuthenticated:', isAuthenticated);
    if (isOpen && isAuthenticated) {
      console.log('[LoginModal] User is authenticated while modal is open - triggering handleLoginSuccess');
      handleLoginSuccess();
    }
  }, [isOpen, isAuthenticated, handleLoginSuccess]);

  // Load signin configuration on component mount
  useEffect(() => {
    const fetchSigninConfig = async () => {
      try {
        const response = await fetch(buildApiUrl('system-config/signin-options'));
        const data = await response.json();

        if (data.success && data.data) {
          setSigninConfig({
            emailEnabled: data.data.emailEnabled ?? true,
            phoneEnabled: data.data.phoneEnabled ?? true,
            whatsappEnabled: data.data.whatsappEnabled ?? false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch signin config:', error);
      }
    };

    if (isOpen) {
      fetchSigninConfig();
    }
  }, [isOpen]);

  console.log('[LoginModal] Render - isOpen:', isOpen, 'isAuthenticated:', isAuthenticated);

  if (!isOpen) {
    console.log('[LoginModal] Modal is closed, returning null');
    return null;
  }

  // Close modal and reset
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Validation functions
  const validateContact = (value: string, type: 'phone' | 'email' | 'whatsapp'): string => {
    if (!value.trim()) {
      return type === 'email' ? VALIDATION_MESSAGES.EMAIL_REQUIRED : VALIDATION_MESSAGES.PHONE_REQUIRED;
    }

    if (type === 'email') {
      if (!isValidEmail(value)) return VALIDATION_MESSAGES.EMAIL_INVALID;
    } else {
      if (!isValidPhone(value)) return VALIDATION_MESSAGES.PHONE_INVALID;
    }

    return '';
  };

  const validateOTP = (value: string): string => {
    if (!value.trim()) return VALIDATION_MESSAGES.OTP_REQUIRED;
    if (!isValidOTP(value)) return VALIDATION_MESSAGES.OTP_INVALID;
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value.trim()) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword.trim()) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const validateName = (value: string): string => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  // Handler: Check if user exists
  const handleCheckUser = async () => {
    const contactErr = validateContact(contactValue, authType);
    setContactError(contactErr);

    if (contactErr) {
      setAuthError(contactErr);
      return;
    }

    setIsOtpLoading(true);
    setAuthError('');

    try {
      const formattedContact = authType === 'email' ? contactValue : formatPhoneNumber(contactValue);

      const response = await fetch(buildApiUrl('auth/check-user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formattedContact,
          type: authType === 'whatsapp' ? 'phone' : authType
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.exists && data.data.hasPassword && authType === 'email') {
          // Existing email user with password - show password screen
          setAuthStep('password');
        } else {
          // New user or phone user - send OTP
          await handleSendOTP();
        }
      } else {
        setAuthError(data.message || 'Failed to check user');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Handler: Send OTP
  const handleSendOTP = async () => {
    const contactErr = validateContact(contactValue, authType);
    setContactError(contactErr);

    if (contactErr) {
      setAuthError(contactErr);
      return;
    }

    setIsOtpLoading(true);
    setAuthError('');

    try {
      const formattedContact = authType === 'email' ? contactValue : formatPhoneNumber(contactValue);

      const response = await fetch(buildApiUrl('auth/send-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formattedContact,
          type: authType === 'whatsapp' ? 'phone' : authType
        })
      });

      const data = await response.json();

      if (data.success) {
        setAuthStep('otp');
      } else {
        setAuthError(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Handler: Verify OTP
  const handleVerifyOTP = async () => {
    const otpErr = validateOTP(otpValue);
    setOtpError(otpErr);

    if (otpErr) {
      setAuthError(otpErr);
      return;
    }

    setIsOtpLoading(true);
    setAuthError('');

    try {
      const formattedContact = authType === 'email' ? contactValue : formatPhoneNumber(contactValue);

      const response = await fetch(buildApiUrl('auth/verify-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formattedContact,
          otp: otpValue,
          type: authType === 'whatsapp' ? 'phone' : authType,
          isResettingPassword: isResettingPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        if (isResettingPassword) {
          // Reset password flow - OTP verified, now ask for new password
          setAuthStep('reset-password');
        } else if (data.data?.token) {
          // User logged in successfully (existing user)
          const { user, token } = data.data;
          localStorage.setItem('auth_token', token);
          useAuthStore.getState().setUser(user);
          handleLoginSuccess();
        } else if (data.data?.needsSignup) {
          // New user signup - ask for name and gender first, then password
          setAuthStep('name-input');
        } else {
          // Legacy response handling
          setAuthStep('name-input');
        }
      } else {
        setAuthError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Handler: Password Login
  const handlePasswordLogin = async () => {
    const passwordErr = validatePassword(passwordValue);
    setPasswordError(passwordErr);

    if (passwordErr) {
      setAuthError(passwordErr);
      return;
    }

    setIsOtpLoading(true);
    setAuthError('');

    try {
      const response = await fetch(buildApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contactValue,
          password: passwordValue
        })
      });

      const data = await response.json();

      if (data.success) {
        const { user, token } = data.data;
        localStorage.setItem('auth_token', token);
        useAuthStore.getState().setUser(user);
        handleLoginSuccess();
      } else {
        setAuthError(data.message || data.error?.message || 'Invalid email or password');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Handler: Reset Password (send OTP)
  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    await handleSendOTP();
  };

  // Handler: Login via OTP
  const handleLoginViaOTP = async () => {
    setIsResettingPassword(false);
    await handleSendOTP();
  };

  // Handler: Submit Name and Gender
  const handleNameSubmit = async () => {
    const nameErr = validateName(nameValue);
    setNameError(nameErr);

    if (nameErr) {
      setAuthError(nameErr);
      return;
    }

    // For email users, go to set-password step
    if (authType === 'email') {
      setAuthStep('set-password');
    } else {
      // For phone/whatsapp users, create account without password
      await handleCompleteSignup();
    }
  };

  // Handler: Set Password (for new email users)
  const handleSetPassword = async () => {
    const passwordErr = validatePassword(passwordValue);
    const confirmPasswordErr = validateConfirmPassword(passwordValue, confirmPasswordValue);

    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (passwordErr || confirmPasswordErr) {
      setAuthError(passwordErr || confirmPasswordErr);
      return;
    }

    await handleCompleteSignup();
  };

  // Handler: Complete Signup
  const handleCompleteSignup = async () => {
    setIsOtpLoading(true);
    setAuthError('');

    try {
      const formattedContact = authType === 'email' ? contactValue : formatPhoneNumber(contactValue);

      const response = await fetch(buildApiUrl('auth/complete-signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formattedContact,
          type: authType === 'whatsapp' ? 'phone' : authType,
          name: nameValue,
          gender: genderValue || undefined,
          password: passwordValue || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        const { user, token } = data.data;
        localStorage.setItem('auth_token', token);
        useAuthStore.getState().setUser(user);
        handleLoginSuccess();
      } else {
        setAuthError(data.message || 'Failed to create account');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Handler: Reset Password Submit
  const handleResetPasswordSubmit = async () => {
    const passwordErr = validatePassword(passwordValue);
    const confirmPasswordErr = validateConfirmPassword(passwordValue, confirmPasswordValue);

    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (passwordErr || confirmPasswordErr) {
      setAuthError(passwordErr || confirmPasswordErr);
      return;
    }

    setIsOtpLoading(true);
    setAuthError('');

    try {
      const response = await fetch(buildApiUrl('auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: contactValue,
          type: 'email',
          newPassword: passwordValue
        })
      });

      const data = await response.json();

      if (data.success) {
        const { user, token } = data.data;
        localStorage.setItem('auth_token', token);
        useAuthStore.getState().setUser(user);
        handleLoginSuccess();
      } else {
        setAuthError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Render JSX
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Method Selection */}
          {authStep === 'method' && (
            <div className="space-y-4">
              <p className="text-center text-gray-600 mb-6">
                Choose your preferred sign-in method
              </p>

              {signinConfig.emailEnabled && (
                <button
                  onClick={() => {
                    setAuthType('email');
                    setAuthStep('email');
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Continue with Email</span>
                </button>
              )}

              {signinConfig.phoneEnabled && (
                <button
                  onClick={() => {
                    setAuthType('phone');
                    setAuthStep('phone');
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 hover:border-primary-500 text-gray-700 rounded-xl transition-all"
                >
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">Continue with Phone</span>
                </button>
              )}

              {signinConfig.whatsappEnabled && (
                <button
                  onClick={() => {
                    setAuthType('whatsapp');
                    setAuthStep('whatsapp');
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 hover:border-green-500 text-gray-700 rounded-xl transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Continue with WhatsApp</span>
                </button>
              )}
            </div>
          )}

          {/* Email Input */}
          {authStep === 'email' && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setAuthStep('method')}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enter Your Email
                </h2>
                <p className="text-gray-600">
                  We'll check if you have an account
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={contactValue}
                  onChange={(e) => {
                    setContactValue(e.target.value);
                    if (contactError) {
                      setContactError('');
                      setAuthError('');
                    }
                  }}
                  onBlur={() => {
                    const error = validateContact(contactValue, 'email');
                    setContactError(error);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOtpLoading && contactValue.trim()) {
                      handleCheckUser();
                    }
                  }}
                  error={contactError}
                  className="w-full"
                />

                {authError && (
                  <Alert type="error" message={authError} className="text-sm" />
                )}

                <Button
                  onClick={handleCheckUser}
                  disabled={isOtpLoading}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                >
                  {isOtpLoading ? 'Checking...' : 'Continue'}
                </Button>
              </div>
            </>
          )}

          {/* Phone Input */}
          {authStep === 'phone' && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setAuthStep('method')}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enter Your Phone Number
                </h2>
                <p className="text-gray-600">
                  We'll send you a verification code
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contactValue}
                  onChange={(e) => {
                    setContactValue(e.target.value);
                    if (contactError) {
                      setContactError('');
                      setAuthError('');
                    }
                  }}
                  onBlur={() => {
                    const error = validateContact(contactValue, 'phone');
                    setContactError(error);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOtpLoading && contactValue.trim()) {
                      handleSendOTP();
                    }
                  }}
                  error={contactError}
                  className="w-full"
                />

                {authError && (
                  <Alert type="error" message={authError} className="text-sm" />
                )}

                <Button
                  onClick={handleSendOTP}
                  disabled={isOtpLoading}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                >
                  {isOtpLoading ? 'Sending...' : 'Send Code'}
                </Button>
              </div>
            </>
          )}

          {/* WhatsApp Input */}
          {authStep === 'whatsapp' && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setAuthStep('method')}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enter Your WhatsApp Number
                </h2>
                <p className="text-gray-600">
                  We'll send you a verification code on WhatsApp
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contactValue}
                  onChange={(e) => {
                    setContactValue(e.target.value);
                    if (contactError) {
                      setContactError('');
                      setAuthError('');
                    }
                  }}
                  onBlur={() => {
                    const error = validateContact(contactValue, 'whatsapp');
                    setContactError(error);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOtpLoading && contactValue.trim()) {
                      handleSendOTP();
                    }
                  }}
                  error={contactError}
                  className="w-full"
                />

                {authError && (
                  <Alert type="error" message={authError} className="text-sm" />
                )}

                <Button
                  onClick={handleSendOTP}
                  disabled={isOtpLoading}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                >
                  {isOtpLoading ? 'Sending...' : 'Send Code'}
                </Button>
              </div>
            </>
          )}

          {/* OTP Verification */}
          {authStep === 'otp' && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => {
                    if (isResettingPassword) {
                      setIsResettingPassword(false);
                      setAuthStep('password');
                    } else {
                      setAuthStep(authType);
                    }
                  }}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enter Verification Code
                </h2>
                <p className="text-gray-600">
                  We sent a code to {contactValue}
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpValue}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setOtpValue(value);
                    if (otpError) {
                      setOtpError('');
                      setAuthError('');
                    }
                  }}
                  onBlur={() => {
                    const error = validateOTP(otpValue);
                    setOtpError(error);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOtpLoading && otpValue.length === 6) {
                      handleVerifyOTP();
                    }
                  }}
                  error={otpError}
                  maxLength={6}
                  className="w-full text-center text-2xl tracking-widest"
                />

                {authError && (
                  <Alert type="error" message={authError} className="text-sm" />
                )}

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isOtpLoading || otpValue.length !== 6}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                >
                  {isOtpLoading ? 'Verifying...' : 'Verify Code'}
                </Button>

                <div className="text-center">
                  <button
                    onClick={handleSendOTP}
                    className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    disabled={isOtpLoading}
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Password Input (for existing email users) */}
          {authStep === 'password' && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setAuthStep(authType)}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Enter Your Password
                </h2>
                <p className="text-gray-600">
                  Welcome back! Please enter your password for {contactValue}
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isOtpLoading && passwordValue.trim()) {
                        handlePasswordLogin();
                      }
                    }}
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {authError && (
                  <Alert type="error" message={authError} className="text-sm" />
                )}

                <Button
                  onClick={handlePasswordLogin}
                  disabled={isOtpLoading}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                >
                  {isOtpLoading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div className="text-center space-y-2">
                  <button
                    onClick={handleResetPassword}
                    className="text-sm text-gray-600 hover:text-primary-600 transition-colors block w-full"
                    disabled={isOtpLoading}
                  >
                    Reset password
                  </button>
                  <button
                    onClick={handleLoginViaOTP}
                    className="text-sm text-gray-600 hover:text-primary-600 transition-colors block w-full"
                    disabled={isOtpLoading}
                  >
                    Login via OTP
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Name and Gender Input (for new users) */}
          {authStep === 'name-input' && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setAuthStep('otp')}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Complete Your Profile
                </h2>
                <p className="text-gray-600">
                  Tell us a bit about yourself
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={nameValue}
                  onChange={(e) => {
                    setNameValue(e.target.value);
                    if (nameError) {
                      setNameError('');
                      setAuthError('');
                    }
                  }}
                  onBlur={() => {
                    const error = validateName(nameValue);
                    setNameError(error);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOtpLoading && nameValue.trim()) {
                      handleNameSubmit();
                    }
                  }}
                  error={nameError}
                  className="w-full"
                />

                <select
                  value={genderValue}
                  onChange={(e) => setGenderValue(e.target.value as 'MALE' | 'FEMALE' | '')}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all"
                >
                  <option value="">Select Gender (Optional)</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>

                {authError && (
                  <Alert type="error" message={authError} className="text-sm" />
                )}

                <Button
                  onClick={handleNameSubmit}
                  disabled={isOtpLoading || !nameValue.trim()}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                >
                  {isOtpLoading ? 'Creating Account...' : 'Continue'}
                </Button>
              </div>
            </>
          )}

          {/* Set Password (for new email users) */}
          {authStep === 'set-password' && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setAuthStep('name-input')}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Set Your Password
                </h2>
                <p className="text-gray-600">
                  Create a secure password for your account
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create password (min 8 characters)"
                    value={passwordValue}
                    onChange={(e) => {
                      setPasswordValue(e.target.value);
                      if (passwordError) {
                        setPasswordError('');
                        setAuthError('');
                      }
                    }}
                    onBlur={() => {
                      if (passwordValue.trim()) {
                        const error = validatePassword(passwordValue);
                        setPasswordError(error);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isOtpLoading && passwordValue.trim() && confirmPasswordValue.trim()) {
                        handleSetPassword();
                      }
                    }}
                    error={passwordError}
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPasswordValue}
                  onChange={(e) => {
                    setConfirmPasswordValue(e.target.value);
                    if (confirmPasswordError) {
                      setConfirmPasswordError('');
                      setAuthError('');
                    }
                  }}
                  onBlur={() => {
                    if (confirmPasswordValue.trim()) {
                      const error = validateConfirmPassword(passwordValue, confirmPasswordValue);
                      setConfirmPasswordError(error);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOtpLoading && passwordValue.trim() && confirmPasswordValue.trim()) {
                      handleSetPassword();
                    }
                  }}
                  error={confirmPasswordError}
                  className="w-full"
                />

                {authError && !passwordError && !confirmPasswordError && (
                  <Alert type="error" message={authError} className="text-sm" />
                )}

                <Button
                  onClick={handleSetPassword}
                  disabled={isOtpLoading || !passwordValue.trim() || !confirmPasswordValue.trim()}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                >
                  {isOtpLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </>
          )}

          {/* Reset Password */}
          {authStep === 'reset-password' && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => {
                    setAuthStep('otp');
                    setPasswordValue('');
                    setConfirmPasswordValue('');
                  }}
                  className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Set New Password
                </h2>
                <p className="text-gray-600">
                  Create a new password for your account
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 8 characters)"
                    value={passwordValue}
                    onChange={(e) => {
                      setPasswordValue(e.target.value);
                      if (passwordError) {
                        setPasswordError('');
                        setAuthError('');
                      }
                    }}
                    onBlur={() => {
                      if (passwordValue.trim()) {
                        const error = validatePassword(passwordValue);
                        setPasswordError(error);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isOtpLoading && passwordValue.trim() && confirmPasswordValue.trim()) {
                        handleResetPasswordSubmit();
                      }
                    }}
                    error={passwordError}
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPasswordValue}
                  onChange={(e) => {
                    setConfirmPasswordValue(e.target.value);
                    if (confirmPasswordError) {
                      setConfirmPasswordError('');
                      setAuthError('');
                    }
                  }}
                  onBlur={() => {
                    if (confirmPasswordValue.trim()) {
                      const error = validateConfirmPassword(passwordValue, confirmPasswordValue);
                      setConfirmPasswordError(error);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isOtpLoading && passwordValue.trim() && confirmPasswordValue.trim()) {
                      handleResetPasswordSubmit();
                    }
                  }}
                  error={confirmPasswordError}
                  className="w-full"
                />

                {authError && !passwordError && !confirmPasswordError && (
                  <Alert type="error" message={authError} className="text-sm" />
                )}

                <Button
                  onClick={handleResetPasswordSubmit}
                  disabled={isOtpLoading || !passwordValue.trim() || !confirmPasswordValue.trim()}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                >
                  {isOtpLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

