import 'module-alias/register';
import { Server } from 'http';
import App from './app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { initializeFirebase } from './config/firebase';
import { QueueSystem } from './queues';
import { registerServices } from './core/serviceRegistry';

class ServerManager {
  private server: Server | null = null;
  private app: App;

  constructor() {
    this.app = new App();
  }

  public async start(): Promise<void> {
    try {
      // Register services first (required by other components)
      logger.info('🔧 Registering services...');
      registerServices();
      logger.info('✅ Services registered successfully');

      // Connect to database
      await connectDatabase();

      // Initialize Firebase (optional)
      initializeFirebase();

      // Initialize Queue System
      await QueueSystem.init();

      // Start HTTP server
      this.server = this.app.getApp().listen(env.PORT, env.HOST, () => {
        logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
        logger.info(`📝 Environment: ${env.NODE_ENV}`);
        logger.info(`📊 Health check: http://${env.HOST}:${env.PORT}/health`);
        logger.info(`🔗 API base URL: http://${env.HOST}:${env.PORT}/api/v1`);
      });

      // Handle server errors
      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`❌ Port ${env.PORT} is already in use`);
        } else {
          logger.error('❌ Server error:', error);
        }
        process.exit(1);
      });

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('🛑 Shutting down server...');

    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(async () => {
          logger.info('✅ HTTP server closed');

          // Shutdown queue system
          try {
            await QueueSystem.shutdown();
          } catch (error) {
            logger.error('❌ Error shutting down queue system:', error);
          }

          await disconnectDatabase();
          resolve();
        });
      });
    }
  }
}

// Create server instance
const serverManager = new ServerManager();

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`📡 Received ${signal}, starting graceful shutdown...`);

  try {
    await serverManager.stop();
    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('💥 Unhandled Rejection', { promise: promise.toString(), reason });
  process.exit(1);
});

// Start the server
if (require.main === module) {
  serverManager.start().catch((error) => {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  });
}

export default serverManager;
