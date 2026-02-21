'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { isValidEmail, VALIDATION_MESSAGES } from '../../utils/validation';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
}

type AuthStep = 'login' | 'register' | 'forgot-password';

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Sign in to continue",
  message = "Please sign in to complete your booking"
}) => {
  const { isAuthenticated } = useAuthStore();

  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [nameValue, setNameValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  const resetModal = useCallback(() => {
    setAuthStep('login');
    setEmailValue('');
    setPasswordValue('');
    setConfirmPasswordValue('');
    setNameValue('');
    setAuthError('');
    setSuccessMessage('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setNameError('');
    setShowPassword(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    onSuccess();
    setTimeout(() => resetModal(), 100);
  }, [onSuccess, resetModal]);

  // Auto-close when user becomes authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      handleLoginSuccess();
    }
  }, [isOpen, isAuthenticated, handleLoginSuccess]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Handlers
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
      // onAuthStateChanged will handle setting the user and triggering handleLoginSuccess
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
    if (!emailValue.trim()) { setEmailError('Email is required'); return; }
    if (!isValidEmail(emailValue)) { setEmailError(VALIDATION_MESSAGES.EMAIL_INVALID); return; }
    if (!passwordValue.trim()) { setPasswordError('Password is required'); return; }
    if (passwordValue.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    if (passwordValue !== confirmPasswordValue) { setConfirmPasswordError('Passwords do not match'); return; }

    setIsSubmitting(true);
    try {
      await authService.register({ name: nameValue, email: emailValue, password: passwordValue });
      // onAuthStateChanged will handle setting the user and triggering handleLoginSuccess
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Login Form */}
          {authStep === 'login' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in with your email and password</p>
              </div>

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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {authError && <Alert type="error" message={authError} className="text-sm" />}

              <Button
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="text-center space-y-2">
                <button
                  onClick={() => { setAuthStep('forgot-password'); setAuthError(''); }}
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors block w-full"
                >
                  Forgot password?
                </button>
                <button
                  onClick={() => { setAuthStep('register'); setAuthError(''); }}
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors block w-full"
                >
                  Don&apos;t have an account? Sign up
                </button>
              </div>
            </div>
          )}

          {/* Register Form */}
          {authStep === 'register' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <button onClick={() => { setAuthStep('login'); setAuthError(''); }} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                <p className="text-gray-600">Sign up with your email</p>
              </div>

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
                onChange={(e) => { setConfirmPasswordValue(e.target.value); setConfirmPasswordError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
                error={confirmPasswordError}
                className="w-full"
              />

              {authError && <Alert type="error" message={authError} className="text-sm" />}

              <Button
                onClick={handleRegister}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          )}

          {/* Forgot Password */}
          {authStep === 'forgot-password' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <button onClick={() => { setAuthStep('login'); setAuthError(''); setSuccessMessage(''); }} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-600">Enter your email to receive a reset link</p>
              </div>

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

              <Button
                onClick={handleForgotPassword}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
