#!/usr/bin/env node

/**
 * Startup script that loads environment and starts the application
 * This script is used by npm scripts to automatically load the correct environment
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

const { spawn } = require('child_process');
const path = require('path');

// Load environment first
require('./load-env.js');

// Get the command to run from command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  logger.error('❌ No command specified');
  logger.error('Usage: node scripts/start-with-env.js <command> [args...]');
  process.exit(1);
}

logger.info(`🚀 Starting command: ${command} ${args.join(' ')}`);

// Spawn the command with inherited stdio
// __dirname is scripts/environment/, so go up two levels to project root
const child = spawn(command, args, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..', '..'),
  env: process.env
});

// Handle child process events
child.on('error', (error) => {
  logger.error(`❌ Failed to start command: ${error.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    logger.error(`❌ Command exited with code ${code}`);
  }
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  logger.info('\n🛑 Received SIGINT, terminating...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  logger.info('\n🛑 Received SIGTERM, terminating...');
  child.kill('SIGTERM');
});
