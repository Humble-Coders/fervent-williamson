/**
 * Queue System Initialization
 * Initialize all queue processors and setup
 */

import { BookingNotificationJobs } from './jobs/BookingNotificationJobs';
import { AnalyticsJobs } from './jobs/AnalyticsJobs';
import { BulkImportJobs } from './jobs/BulkImportJobs';
import { testRedisConnection, getRedisInfo } from '../config/redis';
import { isDevelopment } from '../config/env';

export class QueueSystem {
  private static initialized = false;

  /**
   * Initialize the queue system
   */
  public static async init(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ Queue system already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing queue system...');
      console.log(`📊 Redis Configuration: ${getRedisInfo()}`);

      // Test Redis connection
      const redisConnected = await testRedisConnection();
      if (!redisConnected) {
        throw new Error('Redis connection failed');
      }

      // Initialize job processors
      BookingNotificationJobs.init();
      AnalyticsJobs.init();
      BulkImportJobs.init();

      this.initialized = true;
      console.log('✅ Queue system initialized successfully');

      if (isDevelopment) {
        console.log('📋 Available queues:');
        console.log('  - booking-notifications (booking-created, booking-confirmed)');
        console.log('  - analytics-events (analytics-event, communication-tracking, communication-status-update)');
        console.log('  - bulk-import (bulk-import-services, bulk-import-stylists)');
      }

    } catch (error) {
      console.error('❌ Failed to initialize queue system:', error);
      throw error;
    }
  }

  /**
   * Check if queue system is initialized
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown the queue system
   */
  public static async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      console.log('🔒 Shutting down queue system...');
      
      // Import queueManager here to avoid circular dependencies
      const { queueManager } = await import('./QueueManager');
      await queueManager.closeAll();
      
      this.initialized = false;
      console.log('✅ Queue system shutdown complete');
    } catch (error) {
      console.error('❌ Error during queue system shutdown:', error);
      throw error;
    }
  }
}

// Export for convenience
export { BookingNotificationJobs } from './jobs/BookingNotificationJobs';
export { AnalyticsJobs } from './jobs/AnalyticsJobs';
export { queueManager } from './QueueManager';
