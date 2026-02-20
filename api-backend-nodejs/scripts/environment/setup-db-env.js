
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
#!/usr/bin/env node

/**
 * Database environment setup script for Prisma CLI commands
 * Sets up DATABASE_URL based on USE_REMOTE_DB flag and outputs export command
 */

const fs = require('fs');
const path = require('path');

// Load environment variables first
require('./load-env.js');

// Now set up DATABASE_URL based on the configuration
const USE_REMOTE_DB = process.env.USE_REMOTE_DB === 'true';

let databaseUrl;

if (USE_REMOTE_DB) {
  if (!process.env.REMOTE_DATABASE_URL) {
    logger.error('❌ REMOTE_DATABASE_URL is required when USE_REMOTE_DB=true');
    process.exit(1);
  }
  databaseUrl = process.env.REMOTE_DATABASE_URL;
  logger.info('🌐 Using remote database for Prisma CLI');
} else {
  if (!process.env.LOCAL_DATABASE_URL) {
    logger.error('❌ LOCAL_DATABASE_URL is required when USE_REMOTE_DB=false');
    process.exit(1);
  }
  databaseUrl = process.env.LOCAL_DATABASE_URL;
  logger.info('🏠 Using local database for Prisma CLI');
}

// Output the DATABASE_URL for shell export
logger.info(`export DATABASE_URL="${databaseUrl}"`);
logger.info('✅ DATABASE_URL configured for Prisma CLI');
