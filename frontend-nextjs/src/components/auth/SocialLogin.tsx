import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { Chrome, Twitter, Facebook, Github, Apple } from 'lucide-react';
// import Button from '../ui/Button'; // Removed unused import
import { buildApiUrl, buildBackendUrl } from '../../config/env';

interface SocialProvider {
  name: string;
  displayName: string;
  authUrl: string;
  icon: string;
}

export interface SocialLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

const SocialLogin: React.FC<SocialLoginProps> = ({
  onSuccess,
  onError,
  className = '',
}) => {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
    
    // Listen for auth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'SOCIAL_AUTH_SUCCESS') {
        onSuccess?.();
      } else if (event.data.type === 'SOCIAL_AUTH_ERROR') {
        onError?.(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(buildApiUrl('auth/providers'));
      const data = await response.json();

      if (data.success) {
        setProviders(data.providers);
      } else {
        // Fallback to default providers for demo
        setProviders([
          { name: 'google', displayName: 'Google', authUrl: '/api/v1/auth/google', icon: '🔍' },
          { name: 'twitter', displayName: 'X (Twitter)', authUrl: '/api/v1/auth/twitter', icon: '🐦' },
          { name: 'facebook', displayName: 'Facebook', authUrl: '/api/v1/auth/facebook', icon: '📘' },
          { name: 'github', displayName: 'GitHub', authUrl: '/api/v1/auth/github', icon: '🐙' },
        ]);
      }
    } catch (error) {
      logger.error('Failed to fetch social providers:', error);
      // Fallback to default providers for demo
      setProviders([
        { name: 'google', displayName: 'Google', authUrl: '/api/v1/auth/google', icon: '🔍' },
        { name: 'twitter', displayName: 'X (Twitter)', authUrl: '/api/v1/auth/twitter', icon: '🐦' },
        { name: 'facebook', displayName: 'Facebook', authUrl: '/api/v1/auth/facebook', icon: '📘' },
        { name: 'github', displayName: 'GitHub', authUrl: '/api/v1/auth/github', icon: '🐙' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    const authUrl = `${buildBackendUrl('')}${provider.authUrl}`;
    
    // Open popup window for authentication
    const popup = window.open(
      authUrl,
      'social-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    // Monitor popup for completion
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        // Check URL for auth result
        checkAuthResult();
      }
    }, 1000);
  };

  const checkAuthResult = () => {
    // Check URL parameters for auth result
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      onError?.(error === 'auth_failed' ? 'Authentication failed' : 'Authentication error');
    }
  };

  const getProviderIcon = (provider: SocialProvider) => {
    const iconClass = "w-5 h-5 sm:w-6 sm:h-6";

    switch (provider.name) {
      case 'google':
        return <Chrome className={iconClass} />;
      case 'twitter':
        return <Twitter className={iconClass} />;
      case 'facebook':
        return <Facebook className={iconClass} />;
      case 'github':
        return <Github className={iconClass} />;
      case 'apple':
        return <Apple className={iconClass} />;
      default:
        return <span className="text-lg sm:text-xl">{provider.icon}</span>;
    }
  };

  const getProviderColor = (provider: SocialProvider) => {
    switch (provider.name) {
      case 'google':
        return 'bg-white hover:bg-gray-50 text-red-500 border border-gray-200 hover:border-red-300 shadow-sm hover:shadow-md';
      case 'twitter':
        return 'bg-white hover:bg-gray-50 text-blue-500 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md';
      case 'facebook':
        return 'bg-white hover:bg-gray-50 text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md';
      case 'github':
        return 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-md';
      case 'apple':
        return 'bg-white hover:bg-gray-50 text-black border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-md';
      default:
        return 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md';
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center gap-3 ${className}`}>
        <div className="animate-pulse">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="animate-pulse">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="animate-pulse">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className={`flex justify-center gap-3 ${className}`}>
      {providers.map((provider) => (
        <button
          key={provider.name}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${getProviderColor(provider)}`}
          onClick={() => handleSocialLogin(provider)}
          title={`Continue with ${provider.displayName}`}
        >
          {getProviderIcon(provider)}
        </button>
      ))}
    </div>
  );
};

export default SocialLogin;
