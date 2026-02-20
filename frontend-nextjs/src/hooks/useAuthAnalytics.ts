import { useCallback } from 'react';
import { useAnalytics } from './useAnalytics';

// Authentication-specific analytics hook
export function useAuthAnalytics() {
  const { trackAction, trackConversion, trackError } = useAnalytics();

  // Track authentication method selection
  const trackAuthMethodSelection = useCallback((
    method: 'phone' | 'email' | 'whatsapp' | 'google' | 'facebook' | 'apple'
  ) => {
    trackAction('auth_method_selected', {
      authMethod: method,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track OTP request
  const trackOtpRequest = useCallback((
    method: 'phone' | 'email' | 'whatsapp',
    contact: string
  ) => {
    trackAction('otp_requested', {
      authMethod: method,
      contactType: method,
      contactHash: btoa(contact).substring(0, 10), // Hash for privacy
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track OTP verification attempt
  const trackOtpVerification = useCallback((
    method: 'phone' | 'email' | 'whatsapp',
    success: boolean,
    attempt: number = 1
  ) => {
    const eventType = success ? 'otp_verified' : 'otp_failed';
    
    if (success) {
      trackConversion('otp_verification_success', {
        authMethod: method,
        attemptNumber: attempt,
        timestamp: new Date().toISOString()
      });
    } else {
      trackAction(eventType, {
        authMethod: method,
        attemptNumber: attempt,
        timestamp: new Date().toISOString()
      });
    }
  }, [trackAction, trackConversion]);

  // Track password login attempt
  const trackPasswordLogin = useCallback((
    method: 'email' | 'phone',
    success: boolean,
    errorType?: string
  ) => {
    if (success) {
      trackConversion('password_login_success', {
        authMethod: method,
        timestamp: new Date().toISOString()
      });
    } else {
      trackAction('password_login_failed', {
        authMethod: method,
        errorType,
        timestamp: new Date().toISOString()
      });
    }
  }, [trackAction, trackConversion]);

  // Track social login attempt
  const trackSocialLogin = useCallback((
    provider: 'google' | 'facebook' | 'apple',
    success: boolean,
    errorType?: string
  ) => {
    if (success) {
      trackConversion('social_login_success', {
        provider,
        timestamp: new Date().toISOString()
      });
    } else {
      trackAction('social_login_failed', {
        provider,
        errorType,
        timestamp: new Date().toISOString()
      });
    }
  }, [trackAction, trackConversion]);

  // Track user registration completion
  const trackRegistrationComplete = useCallback((
    method: 'phone' | 'email' | 'whatsapp' | 'social',
    userRole: 'CUSTOMER' | 'SALON_OWNER',
    profileData: {
      hasName: boolean;
      hasGender: boolean;
      hasAvatar: boolean;
    }
  ) => {
    trackConversion('user_registration_complete', {
      authMethod: method,
      userRole,
      profileData,
      timestamp: new Date().toISOString()
    });
  }, [trackConversion]);

  // Track profile completion steps
  const trackProfileStep = useCallback((
    step: 'name_input' | 'gender_selection' | 'avatar_upload' | 'preferences_setup',
    completed: boolean
  ) => {
    trackAction(`profile_${step}`, {
      completed,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track logout
  const trackLogout = useCallback((
    method: 'manual' | 'auto' | 'session_expired'
  ) => {
    trackAction('user_logout', {
      logoutMethod: method,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track forgot password flow
  const trackForgotPassword = useCallback((
    step: 'initiated' | 'otp_sent' | 'otp_verified' | 'password_reset',
    method: 'phone' | 'email'
  ) => {
    trackAction(`forgot_password_${step}`, {
      authMethod: method,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track authentication errors
  const trackAuthError = useCallback((
    errorType: 'network' | 'invalid_credentials' | 'account_locked' | 'server_error' | 'validation_error',
    errorMessage: string,
    context: {
      authMethod?: string;
      step?: string;
    }
  ) => {
    trackError(errorMessage, errorType);
    trackAction('auth_error_occurred', {
      errorType,
      errorMessage,
      context,
      timestamp: new Date().toISOString()
    });
  }, [trackError, trackAction]);

  // Track session events
  const trackSessionEvent = useCallback((
    event: 'session_started' | 'session_extended' | 'session_expired' | 'session_terminated',
    sessionData?: {
      duration?: number;
      pagesVisited?: number;
      actionsPerformed?: number;
    }
  ) => {
    trackAction(event, {
      sessionData,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track user role changes (for salon owners)
  const trackRoleChange = useCallback((
    fromRole: string,
    toRole: string,
    reason: string
  ) => {
    trackAction('user_role_changed', {
      fromRole,
      toRole,
      reason,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track account verification
  const trackAccountVerification = useCallback((
    verificationType: 'email' | 'phone' | 'identity',
    success: boolean
  ) => {
    const eventType = success ? 'account_verified' : 'account_verification_failed';
    
    if (success) {
      trackConversion('account_verification_success', {
        verificationType,
        timestamp: new Date().toISOString()
      });
    } else {
      trackAction(eventType, {
        verificationType,
        timestamp: new Date().toISOString()
      });
    }
  }, [trackAction, trackConversion]);

  // Track privacy and consent actions
  const trackPrivacyAction = useCallback((
    action: 'privacy_policy_viewed' | 'terms_accepted' | 'cookies_accepted' | 'data_export_requested' | 'account_deleted',
    details?: Record<string, unknown>
  ) => {
    trackAction(action, {
      details,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  return {
    trackAuthMethodSelection,
    trackOtpRequest,
    trackOtpVerification,
    trackPasswordLogin,
    trackSocialLogin,
    trackRegistrationComplete,
    trackProfileStep,
    trackLogout,
    trackForgotPassword,
    trackAuthError,
    trackSessionEvent,
    trackRoleChange,
    trackAccountVerification,
    trackPrivacyAction
  };
}
