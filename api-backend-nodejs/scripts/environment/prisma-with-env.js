#!/usr/bin/env node

/**
 * Prisma command runner with environment loading
 * Loads the appropriate .env file based on CUTQ_ENV and then runs Prisma commands
 *
 * Usage:
 * node scripts/environment/prisma-with-env.js migrate status
 * CUTQ_ENV=prod node scripts/environment/prisma-with-env.js migrate status
 * CUTQ_ENV=uat node scripts/environment/prisma-with-env.js db push
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
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
  process.exit(1);
}

// Load environment variables from the specific file (override any existing)
require('dotenv').config({ path: envFilePath, override: true });

logger.info(`✅ Loaded environment: ${environment} (${envFile})`);
logger.info(`📁 Environment file: ${envFilePath}`);

// Set up DATABASE_URL based on USE_REMOTE_DB flag
const USE_REMOTE_DB = process.env.USE_REMOTE_DB === 'true';

if (USE_REMOTE_DB) {
  if (!process.env.REMOTE_DATABASE_URL) {
    logger.error('❌ REMOTE_DATABASE_URL is required when USE_REMOTE_DB=true');
    process.exit(1);
  }
  process.env.DATABASE_URL = process.env.REMOTE_DATABASE_URL;
  logger.info('🌐 Using remote database for Prisma CLI');
} else {
  if (!process.env.LOCAL_DATABASE_URL) {
    logger.error('❌ LOCAL_DATABASE_URL is required when USE_REMOTE_DB=false');
    process.exit(1);
  }
  process.env.DATABASE_URL = process.env.LOCAL_DATABASE_URL;
  logger.info('🏠 Using local database for Prisma CLI');
}

logger.info(`🔗 DATABASE_URL: ${process.env.DATABASE_URL}`);

// Create a temporary .env file for Prisma CLI to use (in project root)
const tempEnvPath = path.join(__dirname, '..', '..', '.env.temp');
const envContent = fs.readFileSync(envFilePath, 'utf8');

// Add DATABASE_URL to the environment content
const envContentWithDatabaseUrl = envContent + `\n# Auto-generated DATABASE_URL\nDATABASE_URL=${process.env.DATABASE_URL}\n`;

// Write the environment content to a temporary .env file
fs.writeFileSync(tempEnvPath, envContentWithDatabaseUrl);

// Backup original .env if it exists
const originalEnvPath = path.join(__dirname, '..', '..', '.env');
const backupEnvPath = path.join(__dirname, '..', '..', '.env.backup');
let hasOriginalEnv = false;

if (fs.existsSync(originalEnvPath)) {
  fs.copyFileSync(originalEnvPath, backupEnvPath);
  hasOriginalEnv = true;
}

// Replace .env with our environment-specific content
fs.copyFileSync(tempEnvPath, originalEnvPath);

// Get the Prisma command from command line arguments
const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  logger.error('❌ No Prisma command provided');
  logger.error('Usage: node scripts/prisma-with-env.js <prisma-command>');
  logger.error('Example: node scripts/prisma-with-env.js migrate status');
  process.exit(1);
}

logger.info(`🚀 Running Prisma command: prisma ${prismaArgs.join(' ')}`);

// Cleanup function to restore original .env
const cleanup = () => {
  try {
    // Remove temporary file
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }

    // Restore original .env if it existed
    if (hasOriginalEnv && fs.existsSync(backupEnvPath)) {
      fs.copyFileSync(backupEnvPath, originalEnvPath);
      fs.unlinkSync(backupEnvPath);
    } else if (!hasOriginalEnv && fs.existsSync(originalEnvPath)) {
      // Remove .env if it didn't exist originally
      fs.unlinkSync(originalEnvPath);
    }
  } catch (error) {
    logger.warn('⚠️  Warning: Failed to cleanup temporary files:', error.message);
  }
};

// Run Prisma with the loaded environment
const prismaProcess = spawn('npx', ['prisma', ...prismaArgs], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

prismaProcess.on('close', (code) => {
  cleanup();
  process.exit(code);
});

prismaProcess.on('error', (error) => {
  logger.error('❌ Failed to run Prisma command:', error);
  cleanup();
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});
