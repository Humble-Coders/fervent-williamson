import express, { Request, Response } from 'express';
import passport from '../config/passport';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { generateAccessToken } from '../utils/auth';

const router = express.Router();

// Helper function to handle successful authentication
const handleAuthSuccess = (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.redirect(`${env.FRONTEND_URL}/welcome?error=auth_failed`);
    }

    // Generate JWT token
    const token = generateAccessToken(user);
    
    // Log successful authentication
    logger.info('Social authentication successful', {
      userId: user.id,
      email: user.email,
    });

    // Redirect to frontend with token
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    }))}`);
  } catch (error) {
    logger.error('Error in social auth success handler', error);
    res.redirect(`${env.FRONTEND_URL}/welcome?error=auth_error`);
  }
};

// Helper function to handle authentication failure
const handleAuthFailure = (err: any, req: Request, res: Response) => {
  logger.error('Social authentication failed', err);
  res.redirect(`${env.FRONTEND_URL}/welcome?error=auth_failed`);
};

// Google OAuth Routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  handleAuthSuccess
);

// Twitter OAuth Routes
router.get('/twitter',
  passport.authenticate('twitter')
);

router.get('/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/auth/failure' }),
  handleAuthSuccess
);

// Facebook OAuth Routes
router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email'] 
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/failure' }),
  handleAuthSuccess
);

// GitHub OAuth Routes
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'] 
  })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/failure' }),
  handleAuthSuccess
);

// Apple Sign In Routes (Note: Apple requires special setup)
router.get('/apple', (req: Request, res: Response) => {
  // Apple Sign In is typically handled client-side
  // This endpoint can be used for server-side validation if needed
  res.json({
    message: 'Apple Sign In should be handled client-side',
    clientId: env.APPLE_CLIENT_ID,
    redirectUri: `${req.protocol}://${req.get('host')}/api/v1/auth/apple/callback`
  });
});

router.post('/apple/callback', async (req: Request, res: Response) => {
  try {
    // Handle Apple Sign In callback
    // This would typically validate the Apple ID token
    const { id_token, user } = req.body;
    
    // TODO: Implement Apple ID token validation
    // For now, return a placeholder response
    res.json({
      success: false,
      message: 'Apple Sign In validation not yet implemented'
    });
  } catch (error) {
    logger.error('Apple Sign In error', error);
    res.status(500).json({
      success: false,
      message: 'Apple Sign In failed'
    });
  }
});

// Authentication failure route
router.get('/failure', (req: Request, res: Response) => {
  res.redirect(`${env.FRONTEND_URL}/welcome?error=auth_failed`);
});

// Get available social providers
router.get('/providers', (req: Request, res: Response) => {
  const providers = [];
  
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push({
      name: 'google',
      displayName: 'Google',
      authUrl: '/api/v1/auth/google',
      icon: '🔍'
    });
  }
  
  if (env.TWITTER_CONSUMER_KEY && env.TWITTER_CONSUMER_SECRET) {
    providers.push({
      name: 'twitter',
      displayName: 'X (Twitter)',
      authUrl: '/api/v1/auth/twitter',
      icon: '🐦'
    });
  }
  
  if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
    providers.push({
      name: 'facebook',
      displayName: 'Facebook',
      authUrl: '/api/v1/auth/facebook',
      icon: '📘'
    });
  }
  
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.push({
      name: 'github',
      displayName: 'GitHub',
      authUrl: '/api/v1/auth/github',
      icon: '🐙'
    });
  }
  
  if (env.APPLE_CLIENT_ID) {
    providers.push({
      name: 'apple',
      displayName: 'Apple',
      authUrl: '/api/v1/auth/apple',
      icon: '🍎'
    });
  }
  
  res.json({
    success: true,
    providers
  });
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error', err);
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

export default router;
