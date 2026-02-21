'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Mail, Eye, EyeOff, ArrowLeft, Sparkles, Star, Zap, Crown, Gem } from 'lucide-react';
import { FaMars, FaVenus } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { isValidEmail, VALIDATION_MESSAGES } from '../utils/validation';

import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { UserRole } from '../types';

type AuthStep = 'method' | 'login' | 'register' | 'forgot-password';

const OnboardingPage: React.FC = () => {
  const router = useRouter();

  const [authStep, setAuthStep] = useState<AuthStep>('method');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [genderValue, setGenderValue] = useState<'MALE' | 'FEMALE' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  // Check if user is already authenticated and redirect accordingly
  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const { user, isAuthenticated, isLoading } = useAuthStore.getState();
      if (isLoading) return;
      if (isAuthenticated && user) {
        handleLoginSuccess();
      }
    };

    checkAuthAndRedirect();

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.isLoading && state.isAuthenticated && state.user) {
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

  const handleLoginSuccess = () => {
    const user = useAuthStore.getState().user;
    if (user) {
      switch (user.role) {
        case UserRole.ADMIN:
          router.replace('/admin');
          break;
        case UserRole.SALON_OWNER:
          router.replace('/salon');
          break;
        case UserRole.CUSTOMER:
        default:
          router.replace('/');
          break;
      }
    } else {
      router.replace('/');
    }
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setAuthError('');

    if (!emailValue.trim()) { setEmailError('Email is required'); return; }
    if (!isValidEmail(emailValue)) { setEmailError(VALIDATION_MESSAGES.EMAIL_INVALID); return; }
    if (!passwordValue.trim()) { setPasswordError('Password is required'); return; }

    setIsSubmitting(true);
    try {
      await authService.login({ email: emailValue, password: passwordValue });
      // onAuthStateChanged will handle the redirect
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setAuthError('');

    if (!nameValue.trim()) { setNameError('Name is required'); return; }
    if (nameValue.trim().length < 2) { setNameError('Name must be at least 2 characters'); return; }
    if (!emailValue.trim()) { setEmailError('Email is required'); return; }
    if (!isValidEmail(emailValue)) { setEmailError(VALIDATION_MESSAGES.EMAIL_INVALID); return; }
    if (!passwordValue.trim()) { setPasswordError('Password is required'); return; }
    if (passwordValue.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    if (passwordValue !== confirmPasswordValue) { setConfirmPasswordError('Passwords do not match'); return; }

    setIsSubmitting(true);
    try {
      await authService.register({
        name: nameValue,
        email: emailValue,
        password: passwordValue,
        gender: genderValue || undefined,
      } as any);
      // onAuthStateChanged will handle the redirect
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setEmailError('');
    setAuthError('');
    setSuccessMessage('');

    if (!emailValue.trim()) { setEmailError('Email is required'); return; }
    if (!isValidEmail(emailValue)) { setEmailError(VALIDATION_MESSAGES.EMAIL_INVALID); return; }

    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(emailValue);
      setSuccessMessage('Password reset email sent. Check your inbox.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToMethod = () => {
    setAuthStep('method');
    setEmailValue('');
    setPasswordValue('');
    setConfirmPasswordValue('');
    setNameValue('');
    setGenderValue('');
    setAuthError('');
    setSuccessMessage('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setNameError('');
  };

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
        <div className="absolute top-10 left-10 w-32 h-32 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-gradient-to-r from-primary-200/20 to-accent-200/20 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 sm:w-80 sm:h-80 lg:w-[500px] lg:h-[500px] bg-gradient-to-l from-accent-200/15 to-primary-300/15 rounded-full blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="hidden sm:block absolute top-1/4 right-1/4 w-16 h-16 lg:w-32 lg:h-32 border border-primary-200/30 rounded-2xl lg:rounded-3xl animate-pulse"></div>
        <div className="hidden sm:block absolute bottom-1/4 left-1/4 w-12 h-12 lg:w-24 lg:h-24 border border-accent-200/30 rounded-xl lg:rounded-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Enhanced Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
          <div className="max-w-lg text-center animate-fade-in">
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

            <div className="mt-16 p-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl animate-slide-up" style={{ animationDelay: '1200ms' }}>
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-3">&quot;Absolutely revolutionary! The best salon booking experience I&apos;ve ever had.&quot;</p>
              <p className="text-sm text-gray-500 font-medium">&mdash; Sarah M., Beauty Enthusiast</p>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-6 lg:p-12">
          <div className="w-full max-w-sm sm:max-w-md animate-scale-in" style={{ animationDelay: '400ms' }}>
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg mb-3 sm:mb-4">
                <Scissors className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent font-display">
                CutQ
              </h1>
            </div>

            {/* Glass Card */}
            <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 lg:p-8 relative overflow-hidden group hover:bg-white/25 transition-all duration-500">
              <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-bl from-primary-200/20 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-tr from-accent-200/15 to-transparent rounded-full transform -translate-x-10 translate-y-10"></div>

              <div className="relative z-10">
                <div className="space-y-4 sm:space-y-6">
                  {/* Method Selection */}
                  {authStep === 'method' && (
                    <>
                      <div className="text-center mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                          Welcome to CutQ
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 px-2">
                          Sign in or create an account to get started
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => setAuthStep('login')}
                          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                        >
                          <Mail className="w-5 h-5" />
                          <span className="font-medium">Sign In with Email</span>
                        </button>

                        <button
                          onClick={() => setAuthStep('register')}
                          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 hover:border-primary-500 text-gray-700 rounded-xl transition-all"
                        >
                          <span className="font-medium">Create New Account</span>
                        </button>
                      </div>

                      <div className="relative animate-slide-down" style={{ animationDelay: '200ms' }}>
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/30"></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <Link
                          href="/"
                          className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-300 font-medium"
                        >
                          Continue as Guest &rarr;
                        </Link>
                      </div>
                    </>
                  )}

                  {/* Login Form */}
                  {authStep === 'login' && (
                    <>
                      <div className="flex items-center mb-4">
                        <button onClick={handleBackToMethod} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </button>
                      </div>

                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-600">Sign in with your email and password</p>
                      </div>

                      <div className="space-y-4">
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={emailValue}
                          onChange={(e) => { setEmailValue(e.target.value); setEmailError(''); setAuthError(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                          error={emailError}
                          className="w-full"
                        />

                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={passwordValue}
                            onChange={(e) => { setPasswordValue(e.target.value); setPasswordError(''); setAuthError(''); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                            error={passwordError}
                            className="w-full pr-12"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        {authError && <Alert type="error" message={authError} className="text-sm" />}

                        <Button onClick={handleLogin} disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600">
                          {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </Button>

                        <div className="text-center space-y-2">
                          <button onClick={() => { setAuthStep('forgot-password'); setAuthError(''); }} className="text-sm text-gray-600 hover:text-primary-600 transition-colors block w-full">
                            Forgot password?
                          </button>
                          <button onClick={() => { setAuthStep('register'); setAuthError(''); setEmailError(''); setPasswordError(''); }} className="text-sm text-gray-600 hover:text-primary-600 transition-colors block w-full">
                            Don&apos;t have an account? Sign up
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Register Form */}
                  {authStep === 'register' && (
                    <>
                      <div className="flex items-center mb-4">
                        <button onClick={handleBackToMethod} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </button>
                      </div>

                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                        <p className="text-gray-600">Sign up with your email</p>
                      </div>

                      <div className="space-y-4">
                        <Input
                          type="text"
                          placeholder="Full Name"
                          value={nameValue}
                          onChange={(e) => { setNameValue(e.target.value); setNameError(''); }}
                          error={nameError}
                          className="w-full"
                        />

                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={emailValue}
                          onChange={(e) => { setEmailValue(e.target.value); setEmailError(''); }}
                          error={emailError}
                          className="w-full"
                        />

                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password (min 8 characters)"
                            value={passwordValue}
                            onChange={(e) => { setPasswordValue(e.target.value); setPasswordError(''); }}
                            error={passwordError}
                            className="w-full pr-12"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          value={confirmPasswordValue}
                          onChange={(e) => { setConfirmPasswordValue(e.target.value); setConfirmPasswordError(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
                          error={confirmPasswordError}
                          className="w-full"
                        />

                        {/* Gender Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gender (Optional)</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setGenderValue('MALE')}
                              className={`flex-1 p-3 border-2 rounded-xl transition-all ${genderValue === 'MALE' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                              <div className="flex flex-col items-center space-y-1">
                                <FaMars className={`w-5 h-5 ${genderValue === 'MALE' ? 'text-primary-600' : 'text-gray-600'}`} />
                                <span className={`text-sm font-medium ${genderValue === 'MALE' ? 'text-primary-700' : 'text-gray-700'}`}>Male</span>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setGenderValue('FEMALE')}
                              className={`flex-1 p-3 border-2 rounded-xl transition-all ${genderValue === 'FEMALE' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                              <div className="flex flex-col items-center space-y-1">
                                <FaVenus className={`w-5 h-5 ${genderValue === 'FEMALE' ? 'text-primary-600' : 'text-gray-600'}`} />
                                <span className={`text-sm font-medium ${genderValue === 'FEMALE' ? 'text-primary-700' : 'text-gray-700'}`}>Female</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {authError && <Alert type="error" message={authError} className="text-sm" />}

                        <Button onClick={handleRegister} disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600">
                          {isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </Button>

                        <div className="text-center">
                          <button onClick={() => { setAuthStep('login'); setAuthError(''); }} className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                            Already have an account? Sign in
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Forgot Password */}
                  {authStep === 'forgot-password' && (
                    <>
                      <div className="flex items-center mb-4">
                        <button onClick={() => { setAuthStep('login'); setAuthError(''); setSuccessMessage(''); }} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </button>
                      </div>

                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                        <p className="text-gray-600">Enter your email to receive a reset link</p>
                      </div>

                      <div className="space-y-4">
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={emailValue}
                          onChange={(e) => { setEmailValue(e.target.value); setEmailError(''); setAuthError(''); setSuccessMessage(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleForgotPassword(); }}
                          error={emailError}
                          className="w-full"
                        />

                        {authError && <Alert type="error" message={authError} className="text-sm" />}
                        {successMessage && <Alert type="success" message={successMessage} className="text-sm" />}

                        <Button onClick={handleForgotPassword} disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600">
                          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
