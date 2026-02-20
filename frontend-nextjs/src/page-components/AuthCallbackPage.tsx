'use client';
import React, { useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

const AuthCallbackPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        // Handle authentication error
        logger.error('Social authentication error:', error);
        
        // Send error message to parent window if in popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_AUTH_ERROR',
            error: error === 'auth_failed' ? 'Authentication failed' : 'Authentication error'
          }, window.location.origin);
          window.close();
          return;
        }

        // Redirect to welcome page with error
        router.push('/welcome?error=' + error);
        return;
      }

      if (token && userParam) {
        try {
          // Parse user data
          const user = JSON.parse(decodeURIComponent(userParam));
          
          // Store token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Update auth store
          setUser(user);

          // Send success message to parent window if in popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'SOCIAL_AUTH_SUCCESS',
              user,
              token
            }, window.location.origin);
            window.close();
            return;
          }

          // Redirect to home page or intended page
          router.push('/');
        } catch (error) {
          logger.error('Error processing auth callback:', error);
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'SOCIAL_AUTH_ERROR',
              error: 'Failed to process authentication'
            }, window.location.origin);
            window.close();
            return;
          }

          router.push('/welcome?error=auth_error');
        }
      } else {
        // Missing required parameters
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_AUTH_ERROR',
            error: 'Invalid authentication response'
          }, window.location.origin);
          window.close();
          return;
        }

        router.push('/welcome?error=auth_error');
      }
    };

    handleAuthCallback();
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Authentication...
        </h2>
        <p className="text-gray-600">
          Please wait while we sign you in.
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
