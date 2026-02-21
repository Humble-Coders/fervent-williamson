'use client';
import React, { useState } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import { Shield, User, Mail, Lock, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import {
  isValidEmail,
  isValidName,
  isPasswordStrong,
  VALIDATION_MESSAGES
} from '../utils/validation';

interface AdminSignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AdminSignupPage: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<AdminSignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof AdminSignupForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) setError('');
  };

  const handleFieldBlur = (field: keyof AdminSignupForm) => {
    const fieldError = validateField(field, formData[field]);
    setFieldErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const validateForm = (): boolean => {
    const newFieldErrors: {[key: string]: string} = {};
    let hasErrors = false;

    (Object.keys(formData) as (keyof AdminSignupForm)[]).forEach(field => {
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
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: UserRole.ADMIN,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error) {
      logger.error('Admin signup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create admin user');
    } finally {
      setLoading(false);
    }
  };

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

          {error && <Alert type="error" message={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button type="submit" className="w-full" disabled={loading}>
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
