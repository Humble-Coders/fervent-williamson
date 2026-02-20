#!/usr/bin/env node

/**
 * Test environment configuration
 * Loads environment and displays all configuration values
 */

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.simple()
  ),
  transports: [
    new transports.Console()
  ]
});

// Load environment first
require('../environment/load-env.js');

logger.info('========================================');
logger.info('Environment Configuration Test');
logger.info('========================================');
logger.info('');

// Display environment info
logger.info(`Environment: ${process.env.CUTQ_ENV || process.env.NODE_ENV || 'development'}`);
logger.info(`Node Environment: ${process.env.NODE_ENV}`);
logger.info(`Custom Environment: ${process.env.CUST_NODE_ENV}`);
logger.info('');

// Database configuration
logger.info('Database Configuration:');
logger.info(`  USE_REMOTE_DB: ${process.env.USE_REMOTE_DB}`);
logger.info(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
logger.info(`  LOCAL_DATABASE_URL: ${process.env.LOCAL_DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
logger.info(`  REMOTE_DATABASE_URL: ${process.env.REMOTE_DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
logger.info('');

// Server configuration
logger.info('Server Configuration:');
logger.info(`  PORT: ${process.env.PORT || 'Not set'}`);
logger.info(`  BACKEND_URL: ${process.env.BACKEND_URL || 'Not set'}`);
logger.info(`  FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);
logger.info(`  CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'Not set'}`);
logger.info('');

// Authentication
logger.info('Authentication:');
logger.info(`  JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
logger.info(`  JWT_EXPIRES_IN: ${process.env.JWT_EXPIRES_IN || 'Not set'}`);
logger.info('');

// Email configuration
logger.info('Email Configuration:');
logger.info(`  EMAIL_HOST: ${process.env.EMAIL_HOST || 'Not set'}`);
logger.info(`  EMAIL_PORT: ${process.env.EMAIL_PORT || 'Not set'}`);
logger.info(`  EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
logger.info(`  EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set'}`);
logger.info(`  EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}`);
logger.info('');

// SMS configuration
logger.info('SMS Configuration:');
logger.info(`  SMS_PROVIDER: ${process.env.SMS_PROVIDER || 'Not set'}`);
logger.info(`  TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Not set'}`);
logger.info(`  TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Not set'}`);
logger.info('');

// Payment configuration
logger.info('Payment Configuration:');
logger.info(`  RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Not set'}`);
logger.info(`  RAZORPAY_KEY_SECRET: ${process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Not set'}`);
logger.info('');

// Firebase configuration
logger.info('Firebase Configuration:');
logger.info(`  FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || 'Not set'}`);
logger.info(`  FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Not set'}`);
logger.info(`  FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL || 'Not set'}`);
logger.info('');

// Logging configuration
logger.info('Logging Configuration:');
logger.info(`  LOG_LEVEL: ${process.env.LOG_LEVEL || 'Not set'}`);
logger.info(`  LOG_MODULES: ${process.env.LOG_MODULES || 'all'}`);
logger.info(`  LOG_EXCLUDE_MODULES: ${process.env.LOG_EXCLUDE_MODULES || 'none'}`);
logger.info('');

logger.info('========================================');
logger.info('✅ Environment test completed');
logger.info('========================================');

