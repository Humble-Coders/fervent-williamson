#!/usr/bin/env node

/**
 * Test database connection script
 */

const { Client } = require('pg');
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

// Load environment
require('dotenv').config({ path: '.env.dev.local' });

async function testConnection() {
  logger.info('🔍 Testing database connection...');
  logger.info(`📍 Host: ${process.env.DATABASE_URL}`);
  
  // Parse DATABASE_URL
  const url = new URL(process.env.DATABASE_URL);
  
  logger.info(`🏠 Host: ${url.hostname}`);
  logger.info(`🔌 Port: ${url.port}`);
  logger.info(`👤 User: ${url.username}`);
  logger.info(`🗄️  Database: ${url.pathname.slice(1)}`);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000, // 5 second timeout
  });

  try {
    logger.info('\n⏳ Attempting to connect...');
    await client.connect();
    logger.info('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    logger.info(`🕐 Server time: ${result.rows[0].current_time}`);
    
  } catch (error) {
    logger.error('❌ Database connection failed:');
    logger.error(`Error Code: ${error.code}`);
    logger.error(`Error Message: ${error.message}`);
    
    // Provide specific troubleshooting based on error
    if (error.code === 'ECONNREFUSED') {
      logger.info('\n🔧 Troubleshooting ECONNREFUSED:');
      logger.info('1. Check if PostgreSQL server is running');
      logger.info('2. Verify the host and port are correct');
      logger.info('3. Check firewall settings');
    } else if (error.code === 'ENOTFOUND') {
      logger.info('\n🔧 Troubleshooting ENOTFOUND:');
      logger.info('1. Check if the hostname is correct');
      logger.info('2. Verify DNS resolution');
    } else if (error.code === 'ETIMEDOUT') {
      logger.info('\n🔧 Troubleshooting ETIMEDOUT:');
      logger.info('1. Check network connectivity');
      logger.info('2. Verify firewall allows connections');
    }
    
  } finally {
    await client.end();
  }
}

testConnection().catch(error => logger.error('Database connection test failed:', { error }));
