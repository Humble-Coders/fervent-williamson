import { execSync } from 'child_process';
import { logger } from '../src/config/logger';

export default async () => {
  logger.info('🔧 Setting up test environment...');

  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/cutq_test';

  try {
    // Reset test database
    logger.info('📊 Resetting test database...');
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });

    // Run migrations
    logger.info('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });

    // Generate Prisma client
    logger.info('⚙️ Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    logger.info('✅ Test environment setup complete!');
  } catch (error) {
    logger.error('❌ Test setup failed:', { error });
    throw error;
  }
};
