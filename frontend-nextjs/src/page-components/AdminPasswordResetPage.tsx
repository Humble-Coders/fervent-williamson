'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { authService } from '../services/authService';
import { isValidEmail, VALIDATION_MESSAGES } from '../utils/validation';

const AdminPasswordResetPage: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setError('');

    if (!email.trim()) { setEmailError('Email is required'); return; }
    if (!isValidEmail(email)) { setEmailError(VALIDATION_MESSAGES.EMAIL_INVALID); return; }

    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
      setTimeout(() => {
        router.push('/welcome');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Email Sent!</h1>
            <p className="text-gray-600 mb-6">
              Check your inbox for password reset instructions. Redirecting to login...
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Admin Password</h1>
            <p className="text-gray-600">
              Enter your admin email to receive a password reset link
            </p>
          </div>

          {error && <Alert type="error" message={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(''); }}
              placeholder="Admin email address"
              label="Email Address"
              leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
              error={emailError}
              required
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/welcome')}
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminPasswordResetPage;
