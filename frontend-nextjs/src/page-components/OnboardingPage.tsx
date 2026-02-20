'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Scissors, Mail, Phone, Eye, EyeOff, ArrowLeft, Sparkles, Star, Zap, Crown, Gem } from 'lucide-react';
import { FaWhatsapp, FaMars, FaVenus } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useFormValidation } from '../hooks/useFormValidation';
import {
  contactInputSchema,
  otpVerificationSchema,
  passwordSetupSchema,
  nameInputSchema,
  isValidEmail,
  isValidPhone,
  isValidOTP,
  isPasswordStrong,
  formatPhoneNumber,
  VALIDATION_MESSAGES
} from '../utils/validation';

import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { configService } from '../services/configService';
import { signinConfigService, SigninConfig } from '../services/signinConfigService';
import { buildApiUrl } from '../config/env';
import { UserRole } from '../types';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { error, clearError } = useAuth();

  // Remove isSignUp state as we'll determine this automatically
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Remove formData state as we use individual state variables

  // Auth Flow States
  const [authStep, setAuthStep] = useState<'method' | 'phone' | 'email' | 'whatsapp' | 'otp' | 'password' | 'set-password' | 'name-input' | 'reset-password'>('method');
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

  // Form validation hooks
  const contactValidation = useFormValidation(contactInputSchema);
  const otpValidation = useFormValidation(otpVerificationSchema);
  const passwordValidation = useFormValidation(passwordSetupSchema);
  const nameValidation = useFormValidation(nameInputSchema);

  // Individual field errors
  const [contactError, setContactError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [verificationSkipped, setVerificationSkipped] = useState(false);
  const [developmentMode, setDevelopmentMode] = useState(false);
  const [staticOtpCode, setStaticOtpCode] = useState('111111');

  // Signin configuration state
  const [signinConfig, setSigninConfig] = useState<SigninConfig>({
    emailEnabled: true,
    phoneEnabled: true,
    whatsappEnabled: false,
  });
  const [configLoading, setConfigLoading] = useState(true);

  // Load signin configuration on component mount
  useEffect(() => {
    const loadSigninConfig = async () => {
      try {
        setConfigLoading(true);
        const config = await signinConfigService.getSigninConfig();
        setSigninConfig(config);
      } catch (error) {
        logger.error('Failed to load signin config:', error);
        // Keep default config on error
      } finally {
        setConfigLoading(false);
      }
    };

    loadSigninConfig();
  }, []);

  // Clear errors when switching between steps
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [authStep, error, clearError]);

  // Check if user is already authenticated and redirect accordingly
  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const { user, isAuthenticated, isLoading } = useAuthStore.getState();

      // Don't redirect if still loading
      if (isLoading) {
        logger.info('🔄 Auth still loading, waiting...');
        return;
      }

      if (isAuthenticated && user) {
        logger.info('🔄 User already authenticated, redirecting...', user.role);
        handleLoginSuccess();
      }
    };

    // Check immediately
    checkAuthAndRedirect();

    // Subscribe to auth store changes
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.isLoading && state.isAuthenticated && state.user) {
        logger.info('🔄 Auth state changed, user authenticated, redirecting...', state.user.role);
        handleLoginSuccess();
      }
    });

    return unsubscribe;
  }, [router]);

  // Track mouse movement for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Remove unused handleInputChange and handleSubmit functions

  // Remove unused handlePasswordSubmit function

  const handleSignInWithPhone = () => {
    setAuthType('phone');
    setAuthStep('phone');
    setAuthError('');
  };

  const handleSignInWithEmail = () => {
    setAuthType('email');
    setAuthStep('email');
    setAuthError('');
  };

  const handleSignInWithWhatsApp = () => {
    setAuthType('whatsapp');
    setAuthStep('whatsapp');
    setAuthError('');
  };

  // Validation helper functions
  const validateContact = (value: string): string => {
    if (!value.trim()) {
      return `Please enter your ${authType === 'phone' ? 'phone number' : authType === 'email' ? 'email address' : 'WhatsApp number'}`;
    }

    if (authType === 'email' && !isValidEmail(value)) {
      return VALIDATION_MESSAGES.EMAIL_INVALID;
    }

    if ((authType === 'phone' || authType === 'whatsapp') && !isValidPhone(value)) {
      return VALIDATION_MESSAGES.PHONE_INVALID;
    }

    return '';
  };

  const validateOTP = (value: string): string => {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.OTP_REQUIRED;
    }

    if (!isValidOTP(value)) {
      return VALIDATION_MESSAGES.OTP_INVALID;
    }

    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    }

    const strengthCheck = isPasswordStrong(value);
    if (!strengthCheck.isStrong) {
      return strengthCheck.message;
    }

    return '';
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword.trim()) {
      return 'Please confirm your password';
    }

    if (password !== confirmPassword) {
      return VALIDATION_MESSAGES.PASSWORD_MISMATCH;
    }

    return '';
  };

  const validateName = (value: string): string => {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.NAME_REQUIRED;
    }

    if (value.trim().length < 2) {
      return VALIDATION_MESSAGES.NAME_MIN_LENGTH;
    }

    if (!/^[a-zA-Z0-9\s]{2,50}$/.test(value.trim())) {
      return VALIDATION_MESSAGES.NAME_INVALID;
    }

    return '';
  };

  const handleSendOTP = async () => {
    const contactErr = validateContact(contactValue);
    setContactError(contactErr);

    if (contactErr) {
      setAuthError(contactErr);
      return;
    }

    setIsOtpLoading(true);
    setAuthError('');

    try {
      // Format phone number if needed
      let formattedContact = contactValue;
      if (authType === 'phone' || authType === 'whatsapp') {
        formattedContact = formatPhoneNumber(contactValue);
      }

      // Always check if user exists first
      const checkResponse = await fetch(buildApiUrl('auth/check-user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formattedContact,
          type: authType === 'whatsapp' ? 'phone' : authType // Treat WhatsApp as phone for user check
        })
      });

      const checkData = await checkResponse.json();

      if (checkData.success && checkData.data?.exists) {
        // User exists, check if they have a password set
        if (checkData.data?.hasPassword) {
          // User has password, go to password step
          setAuthStep('password');
        } else {
          // User doesn't have password, send OTP for login
          const otpResponse = await fetch(buildApiUrl('auth/send-otp'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contact: contactValue,
              type: authType // Send actual type (whatsapp, phone, email)
            })
          });

          const otpData = await otpResponse.json();

          if (otpData.success) {
            // Always show OTP step, even if verification is disabled
            setVerificationSkipped(otpData.data?.verificationDisabled || false);
            setDevelopmentMode(otpData.data?.isDevelopmentMode || false);
            if (otpData.data?.otp) {
              setStaticOtpCode(otpData.data.otp);
            }
            setAuthStep('otp');
          } else {
            setAuthError(otpData.message || 'Failed to send verification code');
          }
        }
      } else {
        // User doesn't exist, send OTP for signup
        const response = await fetch(buildApiUrl('auth/send-otp'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact: contactValue,
            type: authType // Send actual type (whatsapp, phone, email)
          })
        });

        const data = await response.json();

        if (data.success) {
          // Always show OTP step, even if verification is disabled
          setVerificationSkipped(data.data?.verificationDisabled || false);
          setDevelopmentMode(data.data?.isDevelopmentMode || false);
          if (data.data?.otp) {
            setStaticOtpCode(data.data.otp);
          }
          setAuthStep('otp');
        } else {
          setAuthError(data.message || 'Failed to send verification code');
        }
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

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
          type: authType === 'whatsapp' ? 'phone' : authType, // Treat WhatsApp as phone for backend
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



  const handleBackToMethod = () => {
    setAuthStep('method');
    setContactValue('');
    setOtpValue('');
    setPasswordValue('');
    setConfirmPasswordValue('');
    setAuthError('');
    setIsResettingPassword(false);
  };

  const handleResetPassword = async () => {
    setIsOtpLoading(true);
    setAuthError('');

    try {
      // Send OTP to the existing contact
      const response = await fetch(buildApiUrl('auth/send-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: contactValue,
          type: authType // Send actual type (whatsapp, phone, email)
        })
      });

      const data = await response.json();

      if (data.success) {
        // Always show OTP step, even if verification is disabled
        setVerificationSkipped(data.data?.verificationDisabled || false);
        setDevelopmentMode(data.data?.isDevelopmentMode || false);
        if (data.data?.otp) {
          setStaticOtpCode(data.data.otp);
        }
        setIsResettingPassword(true);
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

  const handleLoginViaOTP = async () => {
    setIsOtpLoading(true);
    setAuthError('');

    try {
      // Send OTP to the existing contact
      const response = await fetch(buildApiUrl('auth/send-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: contactValue,
          type: authType // Send actual type (whatsapp, phone, email)
        })
      });

      const data = await response.json();

      if (data.success) {
        // Always show OTP step, even if verification is disabled
        setVerificationSkipped(data.data?.verificationDisabled || false);
        setDevelopmentMode(data.data?.isDevelopmentMode || false);
        if (data.data?.otp) {
          setStaticOtpCode(data.data.otp);
        }
        setIsResettingPassword(false);
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

  const handlePasswordLogin = async () => {
    const passwordErr = passwordValue.trim() ? '' : VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    setPasswordError(passwordErr);

    if (passwordErr) {
      setAuthError(passwordErr);
      return;
    }

    setIsOtpLoading(true);
    setAuthError('');

    try {
      // For email login, use the simple auth format
      if (authType === 'email') {
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
          // Set user in auth store
          const { user, token } = data.data;
          localStorage.setItem('auth_token', token);
          useAuthStore.getState().setUser(user);
          handleLoginSuccess();
        } else {
          setAuthError(data.error?.message || data.message || 'Login failed. Please try again.');
        }
      } else {
        // For phone login, use the OTP auth format
        const response = await fetch(buildApiUrl('auth/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact: contactValue,
            type: authType === 'whatsapp' ? 'phone' : authType, // Treat WhatsApp as phone for backend
            password: passwordValue
          })
        });

        const data = await response.json();

        if (data.success) {
          // Set user in auth store
          const { user, token } = data.data;
          localStorage.setItem('auth_token', token);
          useAuthStore.getState().setUser(user);
          handleLoginSuccess();
        } else {
          if (data.needsOTP) {
            // User needs OTP login, redirect to OTP flow
            setAuthError('');
            const otpResponse = await fetch(buildApiUrl('auth/send-otp'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contact: contactValue,
                type: authType // Send actual type (whatsapp, phone, email)
              })
            });

            const otpData = await otpResponse.json();

            if (otpData.success) {
              // Always show OTP step, even if verification is disabled
              setVerificationSkipped(otpData.data?.verificationDisabled || false);
              setDevelopmentMode(otpData.data?.isDevelopmentMode || false);
              if (otpData.data?.otp) {
                setStaticOtpCode(otpData.data.otp);
              }
              setAuthStep('otp');
            } else {
              setAuthError(otpData.message || 'Failed to send verification code');
            }
          } else {
            setAuthError(data.message || 'Invalid credentials');
          }
        }
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    const nameErr = validateName(nameValue);
    setNameError(nameErr);

    if (nameErr) {
      setAuthError(nameErr);
      return;
    }

    // For email users, require password setup
    if (authType === 'email') {
      setAuthStep('set-password');
      return;
    }

    // For phone/whatsapp users, create account without password
    setIsOtpLoading(true);
    setAuthError('');

    try {
      // Check if verification is enabled
      const verificationAuthType = authType === 'whatsapp' ? 'phone' : authType;
      const isVerificationEnabled = await configService.isVerificationEnabled(verificationAuthType as 'email' | 'phone');

      if (!isVerificationEnabled) {
        // Create a dummy OTP entry for verification bypass
        await fetch(buildApiUrl('auth/send-otp'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact: contactValue,
            type: authType // Send actual type (whatsapp, phone, email)
          })
        });
      }

      // At this point, authType is either 'phone' or 'whatsapp', never 'email'
      const formattedContact = formatPhoneNumber(contactValue);

      const response = await fetch(buildApiUrl('auth/complete-signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formattedContact,
          type: authType === 'whatsapp' ? 'phone' : authType, // Treat WhatsApp as phone for user management
          password: undefined, // No password for phone/whatsapp users
          name: nameValue,
          gender: genderValue || undefined // Optional gender
        })
      });

      const data = await response.json();

      if (data.success) {
        // Set user in auth store
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

  const handleSetPassword = async () => {
    // For email users, password is required
    if (!passwordValue.trim()) {
      const error = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
      setPasswordError(error);
      setAuthError(error);
      return;
    }

    // Validate password
    const passwordErr = validatePassword(passwordValue);
    setPasswordError(passwordErr);

    if (passwordErr) {
      setAuthError(passwordErr);
      return;
    }

    const confirmPasswordErr = validateConfirmPassword(passwordValue, confirmPasswordValue);
    setConfirmPasswordError(confirmPasswordErr);

    if (confirmPasswordErr) {
      setAuthError(confirmPasswordErr);
      return;
    }

    setIsOtpLoading(true);
    setAuthError('');

    try {
      // Check if verification is enabled
      const verificationAuthType = authType === 'whatsapp' ? 'phone' : authType;
      const isVerificationEnabled = await configService.isVerificationEnabled(verificationAuthType as 'email' | 'phone');

      if (!isVerificationEnabled) {
        // Create a dummy OTP entry for verification bypass
        await fetch(buildApiUrl('auth/send-otp'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact: contactValue,
            type: authType // Send actual type (whatsapp, phone, email)
          })
        });
      }

      const formattedContact = authType === 'email' ? contactValue : formatPhoneNumber(contactValue);

      const response = await fetch(buildApiUrl('auth/complete-signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: formattedContact,
          type: authType === 'whatsapp' ? 'phone' : authType, // Treat WhatsApp as phone for user management
          password: passwordValue, // Required password for email users
          name: nameValue,
          gender: genderValue || undefined // Optional gender
        })
      });

      const data = await response.json();

      if (data.success) {
        // Set user in auth store
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

  const handleResetPasswordSubmit = async () => {
    // Validate password
    const passwordErr = validatePassword(passwordValue);
    setPasswordError(passwordErr);

    if (passwordErr) {
      setAuthError(passwordErr);
      return;
    }

    const confirmPasswordErr = validateConfirmPassword(passwordValue, confirmPasswordValue);
    setConfirmPasswordError(confirmPasswordErr);

    if (confirmPasswordErr) {
      setAuthError(confirmPasswordErr);
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
        // Set user in auth store
        const { user, token } = data.data;
        localStorage.setItem('auth_token', token);
        useAuthStore.getState().setUser(user);
        setIsResettingPassword(false);
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

  const handleLoginSuccess = () => {
    // Get user from auth store to determine role-based redirect
    const user = useAuthStore.getState().user;

    logger.info('🔄 Login success - User data:', user);

    if (user) {
      // Redirect based on user role
      logger.info('👤 User role:', user.role);
      switch (user.role) {
        case UserRole.ADMIN:
          logger.info('🔄 Redirecting to admin dashboard');
          router.replace('/admin');
          break;
        case UserRole.SALON_OWNER:
          logger.info('🔄 Redirecting to salon dashboard');
          router.replace('/salon');
          break;
        case UserRole.CUSTOMER:
        default:
          logger.info('🔄 Redirecting to customer home');
          // For customers, redirect to intended page or home
          const from = '/';
          router.replace(from);
          break;
      }
    } else {
      logger.info('❌ No user found, redirecting to home');
      // Fallback to home if no user found
      router.replace('/');
    }
  };

  // Remove unused fillDemoCredentials function

  // Floating particles component
  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-1 h-1 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full animate-particle opacity-30`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );

  // Interactive cursor follower
  const CursorFollower = () => (
    <div
      className="fixed w-6 h-6 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full pointer-events-none z-50 opacity-20 blur-sm transition-all duration-300"
      style={{
        left: mousePosition.x - 12,
        top: mousePosition.y - 12,
      }}
    />
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50">
      <CursorFollower />
      <FloatingParticles />
      
      {/* Mobile-Optimized Background */}
      <div className="absolute inset-0">
        {/* Simplified gradient orbs for mobile */}
        <div className="absolute top-10 left-10 w-32 h-32 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-gradient-to-r from-primary-200/20 to-accent-200/20 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 sm:w-80 sm:h-80 lg:w-[500px] lg:h-[500px] bg-gradient-to-l from-accent-200/15 to-primary-300/15 rounded-full blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Reduced geometric shapes for mobile */}
        <div className="hidden sm:block absolute top-1/4 right-1/4 w-16 h-16 lg:w-32 lg:h-32 border border-primary-200/30 rounded-2xl lg:rounded-3xl animate-pulse"></div>
        <div className="hidden sm:block absolute bottom-1/4 left-1/4 w-12 h-12 lg:w-24 lg:h-24 border border-accent-200/30 rounded-xl lg:rounded-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>

        {/* Minimal floating elements for mobile */}
        <div className="hidden lg:block absolute top-32 right-1/3 w-3 h-3 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full animate-pulse opacity-60"></div>
        <div className="hidden lg:block absolute bottom-1/3 left-1/5 w-2 h-2 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Enhanced Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
          <div className="max-w-lg text-center animate-fade-in">
            {/* Premium Logo with advanced effects */}
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 rounded-4xl blur-2xl opacity-30 group-hover:opacity-60 transition-all duration-1000 animate-glow-pulse"></div>
              <div className="relative w-28 h-28 mx-auto bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-4xl flex items-center justify-center shadow-glow transform group-hover:scale-110 transition-all duration-700 backdrop-blur-xl border border-white/20">
                <Scissors className="h-14 w-14 text-white transform group-hover:rotate-12 transition-transform duration-700" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-accent-400 to-accent-500 rounded-full flex items-center justify-center animate-pulse-soft">
                  <Crown className="h-3 w-3 text-white" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-2 w-2 text-white animate-pulse-soft" />
                </div>
              </div>
            </div>

            {/* Enhanced Brand Text with text reveal animation */}
            <div className="overflow-hidden mb-6">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-accent-600 bg-clip-text text-transparent mb-4 font-display animate-text-reveal">
                CutQ
              </h1>
            </div>
            <div className="overflow-hidden mb-8">
              <p className="text-2xl bg-gradient-to-r from-gray-700 to-primary-600 bg-clip-text text-transparent font-medium animate-text-reveal" style={{ animationDelay: '300ms' }}>
                Luxury Beauty, Redefined
              </p>
            </div>
            <div className="overflow-hidden mb-12">
              <p className="text-gray-600 leading-relaxed text-lg animate-text-reveal" style={{ animationDelay: '600ms' }}>
                Experience premium salon services with cutting-edge technology. 
                Book instantly, enjoy luxury, and transform your beauty routine.
              </p>
            </div>

            {/* Enhanced Features with icons and animations */}
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: '900ms' }}>
              <div className="flex items-center text-gray-700 group hover:text-primary-600 transition-colors duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Crown className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-lg font-medium">Premium salon partners worldwide</span>
              </div>
              <div className="flex items-center text-gray-700 group hover:text-primary-600 transition-colors duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-100 to-primary-100 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-accent-600" />
                </div>
                <span className="text-lg font-medium">Instant booking & confirmation</span>
              </div>
              <div className="flex items-center text-gray-700 group hover:text-primary-600 transition-colors duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Gem className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-lg font-medium">AI-powered beauty recommendations</span>
              </div>
            </div>

            {/* Testimonial preview */}
            <div className="mt-16 p-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl animate-slide-up" style={{ animationDelay: '1200ms' }}>
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-3">&quot;Absolutely revolutionary! The best salon booking experience I&apos;ve ever had.&quot;</p>
              <p className="text-sm text-gray-500 font-medium">— Sarah M., Beauty Enthusiast</p>
            </div>
          </div>
        </div>

        {/* Right Side - Mobile-Optimized Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-6 lg:p-12">
          <div className="w-full max-w-sm sm:max-w-md animate-scale-in" style={{ animationDelay: '400ms' }}>
            {/* Mobile Logo - Compact */}
            <div className="lg:hidden text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg mb-3 sm:mb-4">
                <Scissors className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent font-display">
                CutQ
              </h1>
            </div>

            {/* Mobile-Optimized Glass Card */}
            <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 lg:p-8 relative overflow-hidden group hover:bg-white/25 transition-all duration-500">
              {/* Simplified decorations for mobile */}
              <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-bl from-primary-200/20 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-tr from-accent-200/15 to-transparent rounded-full transform -translate-x-10 translate-y-10"></div>

              <div className="relative z-10">
                {/* Remove tabs - smart authentication flow */}

                {/* Mobile-Optimized Authentication Content */}
                <div className="space-y-4 sm:space-y-6">
                  {authStep === 'method' && (
                    <>
                      {/* Compact Welcome Message */}
                      <div className="text-center mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                          Welcome to CutQ
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 px-2">
                          Sign in or create account with OTP verification
                        </p>
                      </div>

                      {/* Icon-Only Authentication Options */}
                      <div className="animate-slide-down">
                        {configLoading ? (
                          <div className="flex justify-center mb-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-4 mb-6">
                            {signinConfig.phoneEnabled && (
                              <button
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 border border-white/30 hover:bg-white/40 backdrop-blur-xl transition-all duration-500 rounded-2xl flex items-center justify-center transform hover:scale-105 shadow-lg"
                                onClick={handleSignInWithPhone}
                                title="Continue with Phone Number"
                              >
                                <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                              </button>
                            )}
                            {signinConfig.emailEnabled && (
                              <button
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 border border-white/30 hover:bg-white/40 backdrop-blur-xl transition-all duration-500 rounded-2xl flex items-center justify-center transform hover:scale-105 shadow-lg"
                                onClick={handleSignInWithEmail}
                                title="Continue with Email"
                              >
                                <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                              </button>
                            )}
                            {signinConfig.whatsappEnabled && (
                              <button
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-white/30 border border-white/30 hover:bg-white/40 backdrop-blur-xl transition-all duration-500 rounded-2xl flex items-center justify-center transform hover:scale-105 shadow-lg"
                                onClick={handleSignInWithWhatsApp}
                                title="Continue with WhatsApp"
                              >
                                <FaWhatsapp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Mobile-Optimized Divider */}
                      <div className="relative animate-slide-down" style={{ animationDelay: '200ms' }}>
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/30"></div>
                        </div>
                        {/* <div className="relative flex justify-center text-xs sm:text-sm">
                          <span className="px-3 sm:px-4 bg-white/20 backdrop-blur-xl text-gray-500 rounded-full">
                            🔐 OTP Verification
                          </span>
                        </div> */}
                      </div>

                      {/* Compact Benefits for Mobile */}
                      {/* <div className="animate-slide-down" style={{ animationDelay: '300ms' }}>
                        <div className="bg-gradient-to-r from-primary-50/80 to-accent-50/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-primary-200/50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base sm:text-lg">🔐</span>
                            <span className="text-xs sm:text-sm font-medium text-primary-800">
                              Why OTP Verification?
                            </span>
                          </div>
                          <ul className="text-xs text-primary-700 space-y-0.5 sm:space-y-1">
                            <li>• No passwords to remember</li>
                            <li>• Enhanced security with 2-factor authentication</li>
                            <li>• Quick and seamless login experience</li>
                          </ul>
                        </div>
                      </div> */}

                      {/* Mobile-Optimized Social Login Divider */}
                      {/* <div className="animate-slide-down" style={{ animationDelay: '350ms' }}>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/30"></div>
                          </div>
                          <div className="relative flex justify-center text-xs sm:text-sm">
                            <span className="px-3 sm:px-4 bg-white/20 backdrop-blur-xl text-gray-500 rounded-full">
                              Or continue with
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="animate-slide-down" style={{ animationDelay: '400ms' }}>
                        <SocialLogin
                          onSuccess={() => {
                            // Social auth success is handled by AuthCallbackPage
                            // This is just for UI feedback
                            logger.info('Social auth initiated successfully');
                          }}
                          onError={(error) => setAuthError(error)}
                        />
                      </div> */}

                      {/* Browse as Guest Option */}
                      <div className="animate-slide-down" style={{ animationDelay: '500ms' }}>
                        <div className="text-center">
                          <Link
                            href="/"
                            className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-300 font-medium"
                          >
                            Continue as Guest →
                          </Link>
                        </div>
                      </div>
                    </>
                  )}

                  {(authStep === 'phone' || authStep === 'email' || authStep === 'whatsapp') && (
                    <>
                      {/* Back Button */}
                      <div className="flex items-center mb-4">
                        <button
                          onClick={handleBackToMethod}
                          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </button>
                      </div>

                      {/* Header */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Continue with {authType === 'phone' ? 'Phone' : authType === 'email' ? 'Email' : 'WhatsApp'}
                        </h2>
                        <p className="text-gray-600">
                          Enter your {authType === 'phone' ? 'phone number' : authType === 'email' ? 'email address' : 'WhatsApp number'} to continue
                        </p>
                      </div>

                      {/* Input Field */}
                      <div className="space-y-4">
                        <Input
                          type={authType === 'email' ? 'email' : 'tel'}
                          placeholder={authType === 'phone' ? 'Enter phone number' : authType === 'email' ? 'Enter email address' : 'Enter WhatsApp number'}
                          value={contactValue}
                          onChange={(e) => {
                            setContactValue(e.target.value);
                            // Clear error on change
                            if (contactError) {
                              setContactError('');
                              setAuthError('');
                            }
                          }}
                          onBlur={() => {
                            // Validate on blur
                            const error = validateContact(contactValue);
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

                        {authError && !contactError && (
                          <Alert type="error" message={authError} className="text-sm" />
                        )}

                        <Button
                          onClick={handleSendOTP}
                          disabled={isOtpLoading}
                          className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                        >
                          {isOtpLoading ? 'Checking...' : 'Continue'}
                        </Button>
                      </div>
                    </>
                  )}

                  {authStep === 'otp' && (
                    <>
                      {/* Back Button */}
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

                      {/* Header */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Enter Verification Code
                        </h2>
                        <p className="text-gray-600">
                          We sent a code to {contactValue}
                        </p>
                        {verificationSkipped && !developmentMode && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                              📧 {authType === 'email' ? 'Email' : authType === 'whatsapp' ? 'WhatsApp' : 'SMS'} verification is currently disabled. You can use any 6-digit code.
                            </p>
                          </div>
                        )}
                        {developmentMode && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700">
                              💡 Development Mode: Use code <strong>{staticOtpCode}</strong>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* OTP Input */}
                      <div className="space-y-4">
                        <Input
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={otpValue}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                            setOtpValue(value);
                            // Clear error on change
                            if (otpError) {
                              setOtpError('');
                              setAuthError('');
                            }
                          }}
                          onBlur={() => {
                            // Validate on blur
                            const error = validateOTP(otpValue);
                            setOtpError(error);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isOtpLoading && otpValue.trim()) {
                              handleVerifyOTP();
                            }
                          }}
                          error={otpError}
                          className="w-full text-center text-lg tracking-widest"
                          maxLength={6}
                        />

                        {authError && !otpError && (
                          <Alert type="error" message={authError} className="text-sm" />
                        )}

                        <Button
                          onClick={handleVerifyOTP}
                          disabled={isOtpLoading}
                          className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                        >
                          {isOtpLoading ? 'Verifying...' : 'Verify Code'}
                        </Button>

                        <div className="text-center">
                          <button
                            onClick={handleSendOTP}
                            className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                          >
                            Didn&apos;t receive code? Resend
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {authStep === 'password' && (
                    <>
                      {/* Back Button */}
                      <div className="flex items-center mb-4">
                        <button
                          onClick={() => setAuthStep(authType)}
                          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </button>
                      </div>

                      {/* Header */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Enter Your Password
                        </h2>
                        <p className="text-gray-600">
                          Welcome back! Please enter your password for {contactValue}
                        </p>
                      </div>

                      {/* Password Input */}
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

                  {authStep === 'name-input' && (
                    <>
                      {/* Back Button */}
                      <div className="flex items-center mb-6">
                        <button
                          onClick={() => setAuthStep('otp')}
                          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5 mr-2" />
                          <span className="text-lg">Back</span>
                        </button>
                      </div>

                      {/* Header */}
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">
                          Complete Your Profile
                        </h1>
                        <p className="text-gray-600 text-lg">
                          Please enter your details to complete your profile
                        </p>
                      </div>

                      {/* Profile Form */}
                      <div className="space-y-6">
                        {/* Full Name Input */}
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">
                            Full Name
                          </label>
                          <Input
                            type="text"
                            placeholder="Enter your full name"
                            value={nameValue}
                            onChange={(e) => {
                              setNameValue(e.target.value);
                              // Clear error on change
                              if (nameError) {
                                setNameError('');
                                setAuthError('');
                              }
                            }}
                            onBlur={() => {
                              // Validate on blur
                              const error = validateName(nameValue);
                              setNameError(error);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isOtpLoading && nameValue.trim()) {
                                handleNameSubmit();
                              }
                            }}
                            error={nameError}
                            className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                          />
                        </div>

                        {/* Gender Selection */}
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">
                            Gender (Optional)
                          </label>
                          <div className="flex gap-4">
                            {/* Male Option */}
                            <button
                              type="button"
                              onClick={() => setGenderValue('MALE')}
                              className={`flex-1 p-6 border-2 rounded-xl transition-all ${
                                genderValue === 'MALE'
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex flex-col items-center space-y-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  genderValue === 'MALE' ? 'bg-primary-500' : 'bg-gray-200'
                                }`}>
                                  <FaMars className={`w-6 h-6 ${genderValue === 'MALE' ? 'text-white' : 'text-gray-600'}`} />
                                </div>
                                <span className={`text-lg font-medium ${
                                  genderValue === 'MALE' ? 'text-primary-700' : 'text-gray-700'
                                }`}>
                                  Male
                                </span>
                              </div>
                            </button>

                            {/* Female Option */}
                            <button
                              type="button"
                              onClick={() => setGenderValue('FEMALE')}
                              className={`flex-1 p-6 border-2 rounded-xl transition-all ${
                                genderValue === 'FEMALE'
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex flex-col items-center space-y-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  genderValue === 'FEMALE' ? 'bg-primary-500' : 'bg-gray-200'
                                }`}>
                                  <FaVenus className={`w-6 h-6 ${genderValue === 'FEMALE' ? 'text-white' : 'text-gray-600'}`} />
                                </div>
                                <span className={`text-lg font-medium ${
                                  genderValue === 'FEMALE' ? 'text-primary-700' : 'text-gray-700'
                                }`}>
                                  Female
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {authError && !nameError && (
                          <Alert type="error" message={authError} className="text-sm" />
                        )}

                        <Button
                          onClick={handleNameSubmit}
                          disabled={!nameValue.trim() || isOtpLoading || !!nameError}
                          className="w-full py-4 text-lg bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {isOtpLoading ? 'Creating Account...' : 'Continue'}
                        </Button>
                      </div>
                    </>
                  )}

                  {authStep === 'set-password' && (
                    <>
                      {/* Back Button */}
                      <div className="flex items-center mb-4">
                        <button
                          onClick={() => setAuthStep('name-input')}
                          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </button>
                      </div>

                      {/* Header */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Set Your Password
                        </h2>
                        <p className="text-gray-600">
                          Create a secure password for your account
                        </p>
                      </div>

                      {/* Password Inputs */}
                      <div className="space-y-4">
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create password (min 8 characters)"
                            value={passwordValue}
                            onChange={(e) => {
                              setPasswordValue(e.target.value);
                              // Clear error on change
                              if (passwordError) {
                                setPasswordError('');
                                setAuthError('');
                              }
                            }}
                            onBlur={() => {
                              // Validate on blur if password is provided
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
                            // Clear error on change
                            if (confirmPasswordError) {
                              setConfirmPasswordError('');
                              setAuthError('');
                            }
                          }}
                          onBlur={() => {
                            // Validate on blur if confirm password is provided
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

                  {authStep === 'reset-password' && (
                    <>
                      {/* Back Button */}
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

                      {/* Header */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          Set New Password
                        </h2>
                        <p className="text-gray-600">
                          Create a new password for your account
                        </p>
                      </div>

                      {/* Password Inputs */}
                      <div className="space-y-4">
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter new password (min 8 characters)"
                            value={passwordValue}
                            onChange={(e) => {
                              setPasswordValue(e.target.value);
                              // Clear error on change
                              if (passwordError) {
                                setPasswordError('');
                                setAuthError('');
                              }
                            }}
                            onBlur={() => {
                              // Validate on blur
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
                            // Clear error on change
                            if (confirmPasswordError) {
                              setConfirmPasswordError('');
                              setAuthError('');
                            }
                          }}
                          onBlur={() => {
                            // Validate on blur
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

            {/* Enhanced Skip Option */}
          </div>
        </div>
      </div>


    </div>
  );
};

export default OnboardingPage;