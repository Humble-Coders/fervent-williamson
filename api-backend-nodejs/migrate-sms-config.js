/**
 * SMS Provider Configuration Migration Script
 * 
 * Run this script to migrate SMS provider configuration to the new system
 * that properly supports BulkSMS and other providers.
 */

const { PrismaClient } = require('@prisma/client');
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

const prisma = new PrismaClient();

async function migrateSMSProviderConfig() {
  try {
    logger.info('🔄 Starting SMS provider configuration migration...');

    // Check if old sms_provider exists
    const oldConfig = await prisma.systemConfig.findUnique({
      where: { key: 'sms_provider' }
    });

    // Check if new sms_service_provider exists
    const newConfig = await prisma.systemConfig.findUnique({
      where: { key: 'sms_service_provider' }
    });

    if (oldConfig && !newConfig) {
      // Migrate from old to new key
      await prisma.systemConfig.create({
        data: {
          key: 'sms_service_provider',
          value: oldConfig.value
        }
      });
      logger.info(`✅ Migrated SMS provider from '${oldConfig.value}' to new configuration key`);
    } else if (!newConfig) {
      // Create new config with default value
      await prisma.systemConfig.create({
        data: {
          key: 'sms_service_provider',
          value: 'fast2sms'
        }
      });
      logger.info('✅ Created new SMS service provider configuration with default value');
    } else {
      logger.info('✅ SMS service provider configuration already exists');
    }

    // Ensure BulkSMS configuration entries exist (but empty by default)
    const bulkSMSConfigs = [
      { key: 'bulksms_username', defaultValue: '' },
      { key: 'bulksms_api_key', defaultValue: '' },
      { key: 'bulksms_sender_id', defaultValue: '' }
    ];

    for (const config of bulkSMSConfigs) {
      const existing = await prisma.systemConfig.findUnique({
        where: { key: config.key }
      });

      if (!existing) {
        await prisma.systemConfig.create({
          data: {
            key: config.key,
            value: config.defaultValue
          }
        });
        logger.info(`✅ Created ${config.key} configuration entry`);
      } else {
        logger.info(`✅ ${config.key} configuration already exists`);
      }
    }

    // Display current SMS provider configuration
    const currentProvider = await prisma.systemConfig.findUnique({
      where: { key: 'sms_service_provider' }
    });

    logger.info('\n📋 Current SMS Configuration:');
    logger.info(`   SMS Provider: ${currentProvider?.value || 'Not set'}`);

    if (currentProvider?.value === 'bulksms') {
      const bulkUsername = await prisma.systemConfig.findUnique({
        where: { key: 'bulksms_username' }
      });
      const bulkApiKey = await prisma.systemConfig.findUnique({
        where: { key: 'bulksms_api_key' }
      });
      const bulkSenderId = await prisma.systemConfig.findUnique({
        where: { key: 'bulksms_sender_id' }
      });

      logger.info('   BulkSMS Configuration:');
      logger.info(`     Username: ${bulkUsername?.value || 'Not set (will use BULKSMS_USERNAME env var)'}`);
      logger.info(`     API Key: ${bulkApiKey?.value ? '***' + bulkApiKey.value.slice(-4) : 'Not set (will use BULKSMS_API_KEY env var)'}`);
      logger.info(`     Sender ID: ${bulkSenderId?.value || 'Not set (will use BULKSMS_SENDER_ID env var)'}`);
    }

    logger.info('\n✅ SMS provider configuration migration completed successfully!');
    logger.info('\n💡 Note: BulkSMS credentials should be configured via environment variables:');
    logger.info('   - BULKSMS_USERNAME');
    logger.info('   - BULKSMS_API_KEY');
    logger.info('   - BULKSMS_SENDER_ID');

  } catch (error) {
    logger.error('❌ Error during SMS provider configuration migration:', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateSMSProviderConfig()
  .then(() => {
    logger.info('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Migration failed:', { error });
    process.exit(1);
  });
