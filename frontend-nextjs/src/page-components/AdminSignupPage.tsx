'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import { Shield, User, Mail, Lock, Key, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { buildApiUrl } from '../config/env';
import { useAuth } from '../hooks/useAuth';
import { useFormValidation } from '../hooks/useFormValidation';
import {
  nameSchema,
  emailSchema,
  passwordSchema,
  isValidEmail,
  isValidName,
  isPasswordStrong,
  VALIDATION_MESSAGES
} from '../utils/validation';
import { z } from 'zod';

interface AdminSignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  setupPassword: string;
}

// Admin signup validation schema
const adminSignupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  setupPassword: z.string().min(1, 'Setup password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
  path: ['confirmPassword'],
});

const AdminSignupPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState<AdminSignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    setupPassword: '',
  });

  // Form validation
  const validation = useFormValidation(adminSignupSchema);

  // Individual field errors
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [signupAvailable, setSignupAvailable] = useState<boolean | null>(null);

  // Check if admin signup is available
  useEffect(() => {
    checkSignupAvailability();
  }, []);

  const checkSignupAvailability = async () => {
    try {
      const response = await fetch(buildApiUrl('admin/signup/available'));
      const data = await response.json();
      
      if (data.success) {
        setSignupAvailable(data.data.available);
        if (!data.data.available) {
          setError('Admin user already exists. Please login instead.');
        }
      }
    } catch (error) {
      logger.error('Error checking signup availability:', error);
      setError('Unable to check signup availability. Please try again.');
    }
  };

  // Validation helper functions
  const validateField = (field: keyof AdminSignupForm, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return VALIDATION_MESSAGES.NAME_REQUIRED;
        if (!isValidName(value)) return VALIDATION_MESSAGES.NAME_INVALID;
        return '';
      case 'email':
        if (!value.trim()) return VALIDATION_MESSAGES.EMAIL_REQUIRED;
        if (!isValidEmail(value)) return VALIDATION_MESSAGES.EMAIL_INVALID;
        return '';
      case 'password':
        if (!value.trim()) return VALIDATION_MESSAGES.PASSWORD_REQUIRED;
        const strengthCheck = isPasswordStrong(value);
        if (!strengthCheck.isStrong) return strengthCheck.message;
        return '';
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your password';
        if (value !== formData.password) return VALIDATION_MESSAGES.PASSWORD_MISMATCH;
        return '';
      case 'setupPassword':
        if (!value.trim()) return 'Setup password is required';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof AdminSignupForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleFieldBlur = (field: keyof AdminSignupForm) => {
    const value = formData[field];
    const fieldError = validateField(field, value);

    setFieldErrors(prev => ({
      ...prev,
      [field]: fieldError
    }));
  };

  const validateForm = (): boolean => {
    const newFieldErrors: {[key: string]: string} = {};
    let hasErrors = false;

    // Validate all fields
    Object.keys(formData).forEach(key => {
      const field = key as keyof AdminSignupForm;
      const fieldError = validateField(field, formData[field]);
      if (fieldError) {
        newFieldErrors[field] = fieldError;
        hasErrors = true;
      }
    });

    setFieldErrors(newFieldErrors);

    if (hasErrors) {
      setError('Please fix the errors above');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl('admin/signup/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);

        // Store the token and user data
        localStorage.setItem('auth_token', data.data.token);

        // Redirect to admin dashboard after a short delay
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        // Handle validation errors from backend
        if (data.pagination && Array.isArray(data.pagination) && data.pagination.length > 0) {
          // Show the first validation error
          setError(data.pagination[0].message);
        } else {
          setError(data.message || 'Failed to create admin user');
        }
      }
    } catch (error) {
      logger.error('Admin signup error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking availability
  if (signupAvailable === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking system status...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Show error if signup not available
  if (signupAvailable === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Already Exists</h1>
            <p className="text-gray-600 mb-6">
              An admin user has already been created for this system. Please login instead.
            </p>
            <Button
              onClick={() => router.push('/welcome')}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Created Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Your admin account has been created. Redirecting to admin dashboard...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Admin Account</h1>
            <p className="text-gray-600">
              Set up the first admin user for your salon management system
            </p>
          </div>

          {error && (
            <Alert type="error" message={error} className="mb-6" />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleFieldBlur('name')}
                placeholder="Enter your full name"
                label="Full Name"
                leftIcon={<User className="w-5 h-5 text-gray-400" />}
                error={fieldErrors.name}
                required
              />
            </div>

            <div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                placeholder="Enter your email address"
                label="Email Address"
                leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
                error={fieldErrors.email}
                required
              />
            </div>

            <div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleFieldBlur('password')}
                placeholder="Create a strong password (min 8 characters)"
                label="Password"
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                error={fieldErrors.password}
                required
              />
            </div>

            <div>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleFieldBlur('confirmPassword')}
                placeholder="Confirm your password"
                label="Confirm Password"
                leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                error={fieldErrors.confirmPassword}
                required
              />
            </div>

            <div>
              <Input
                id="setupPassword"
                type="password"
                value={formData.setupPassword}
                onChange={(e) => handleInputChange('setupPassword', e.target.value)}
                onBlur={() => handleFieldBlur('setupPassword')}
                placeholder="Enter setup password"
                label="Setup Password"
                leftIcon={<Key className="w-5 h-5 text-gray-400" />}
                helperText="This is a security password provided by your system administrator"
                error={fieldErrors.setupPassword}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Admin...
                </div>
              ) : (
                'Create Admin Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This page is only available for initial system setup
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSignupPage;
