import { logger } from '../src/config/logger';

export default async () => {
  logger.info('🧹 Cleaning up test environment...');

  // Any global cleanup can be done here
  // The database cleanup is handled in individual test files

  logger.info('✅ Test environment cleanup complete!');
};
