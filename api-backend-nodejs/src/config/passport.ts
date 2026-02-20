import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

const prisma = new PrismaClient();

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
      },
    });
    done(null, user || false);
  } catch (error) {
    done(error, null);
  }
});

// Helper function to find or create user
const findOrCreateUser = async (profile: any, provider: string) => {
  try {
    // Extract user info from profile
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName;
    const avatar = profile.photos?.[0]?.value;
    const providerId = profile.id;

    if (!email) {
      throw new Error('Email not provided by social provider');
    }

    // Check if user exists with this email
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Update social provider info if not already linked
      const existingSocialAccount = await prisma.socialAccount.findFirst({
        where: {
          userId: user.id,
          provider,
        },
      });

      if (!existingSocialAccount) {
        await prisma.socialAccount.create({
          data: {
            userId: user.id,
            provider,
            providerId,
            email,
            name,
            avatar,
          },
        });
      }

      // Update user avatar if not set
      if (!user.avatar && avatar) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          avatar,
          role: 'CUSTOMER',
          isActive: true,
          emailVerified: true, // Social accounts are pre-verified
        },
      });

      // Create social account link
      await prisma.socialAccount.create({
        data: {
          userId: user.id,
          provider,
          providerId,
          email,
          name,
          avatar,
        },
      });

      // Create loyalty account for new user
      await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          points: 0,
          totalSpent: 0,
          level: 'Bronze',
        },
      });

      logger.info('New user created via social auth', { 
        userId: user.id, 
        email: user.email, 
        provider 
      });
    }

    return user;
  } catch (error) {
    logger.error('Error in findOrCreateUser', { error, provider, profileId: profile.id });
    throw error;
  }
};

// Google OAuth Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser(profile, 'google');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Twitter OAuth Strategy
if (env.TWITTER_CONSUMER_KEY && env.TWITTER_CONSUMER_SECRET) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: env.TWITTER_CONSUMER_KEY,
        consumerSecret: env.TWITTER_CONSUMER_SECRET,
        callbackURL: '/api/v1/auth/twitter/callback',
        includeEmail: true,
      },
      async (token, tokenSecret, profile, done) => {
        try {
          const user = await findOrCreateUser(profile, 'twitter');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: env.FACEBOOK_APP_ID,
        clientSecret: env.FACEBOOK_APP_SECRET,
        callbackURL: '/api/v1/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'photos', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser(profile, 'facebook');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser(profile, 'github');
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

export default passport;
