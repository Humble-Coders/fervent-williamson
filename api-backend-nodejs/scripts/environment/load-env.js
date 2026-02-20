#!/usr/bin/env node

/**
 * Environment loader script for CutQ Backend
 * Automatically loads the appropriate .env file based on NODE_ENV or CUTQ_ENV
 *
 * Usage:
 * - Development: CUTQ_ENV=dev node scripts/load-env.js
 * - UAT: CUTQ_ENV=uat node scripts/load-env.js
 * - Production: CUTQ_ENV=prod node scripts/load-env.js
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

const fs = require('fs');
const path = require('path');

// Get environment from command line args or environment variables
const environment = process.env.CUTQ_ENV || process.env.NODE_ENV || 'dev';

// Map environment names to file names
const envFileMap = {
  'dev': '.env.dev.local',
  'development': '.env.dev.local',
  'uat': '.env.uat.local',
  'staging': '.env.uat.local',
  'prod': '.env.prod.local',
  'production': '.env.prod.local'
};

// Get the appropriate env file
const envFile = envFileMap[environment.toLowerCase()];

if (!envFile) {
  logger.error(`❌ Unknown environment: ${environment}`);
  logger.error(`Available environments: ${Object.keys(envFileMap).join(', ')}`);
  process.exit(1);
}

// Construct full path to env file (go up two levels from scripts/environment/)
const envFilePath = path.join(__dirname, '..', '..', envFile);

// Check if env file exists
if (!fs.existsSync(envFilePath)) {
  logger.error(`❌ Environment file not found: ${envFilePath}`);
  logger.error(`Please create ${envFile} in the backend directory`);
  process.exit(1);
}

// Load environment variables from the file
require('dotenv').config({ path: envFilePath });

logger.info(`✅ Loaded environment: ${environment} (${envFile})`);
logger.info(`📁 Environment file: ${envFilePath}`);
logger.info(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
logger.info(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'Not configured'}`);
logger.info(`🔧 Node Environment: ${process.env.NODE_ENV}`);
logger.info(`🏷️  Custom Environment: ${process.env.CUST_NODE_ENV}`);

// Export environment info for other scripts
module.exports = {
  environment,
  envFile,
  envFilePath
};
