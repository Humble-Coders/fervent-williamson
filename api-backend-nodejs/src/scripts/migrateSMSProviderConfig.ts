/**
 * Migration Script: Update SMS Provider Configuration
 * 
 * This script migrates the SMS provider configuration from the old 'sms_provider' key
 * to the new 'sms_service_provider' key and ensures BulkSMS configuration is properly set.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSMSProviderConfig() {
  try {
    console.log('🔄 Starting SMS provider configuration migration...');

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
      console.log(`✅ Migrated SMS provider from '${oldConfig.value}' to new configuration key`);
    } else if (!newConfig) {
      // Create new config with default value
      await prisma.systemConfig.create({
        data: {
          key: 'sms_service_provider',
          value: 'fast2sms'
        }
      });
      console.log('✅ Created new SMS service provider configuration with default value');
    } else {
      console.log('✅ SMS service provider configuration already exists');
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
        console.log(`✅ Created ${config.key} configuration entry`);
      } else {
        console.log(`✅ ${config.key} configuration already exists`);
      }
    }

    // Display current SMS provider configuration
    const currentProvider = await prisma.systemConfig.findUnique({
      where: { key: 'sms_service_provider' }
    });

    console.log('\n📋 Current SMS Configuration:');
    console.log(`   SMS Provider: ${currentProvider?.value || 'Not set'}`);

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

      console.log('   BulkSMS Configuration:');
      console.log(`     Username: ${bulkUsername?.value || 'Not set (will use BULKSMS_USERNAME env var)'}`);
      console.log(`     API Key: ${bulkApiKey?.value ? '***' + bulkApiKey.value.slice(-4) : 'Not set (will use BULKSMS_API_KEY env var)'}`);
      console.log(`     Sender ID: ${bulkSenderId?.value || 'Not set (will use BULKSMS_SENDER_ID env var)'}`);
    }

    console.log('\n✅ SMS provider configuration migration completed successfully!');
    console.log('\n💡 Note: BulkSMS credentials should be configured via environment variables:');
    console.log('   - BULKSMS_USERNAME');
    console.log('   - BULKSMS_API_KEY');
    console.log('   - BULKSMS_SENDER_ID');

  } catch (error) {
    console.error('❌ Error during SMS provider configuration migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateSMSProviderConfig()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateSMSProviderConfig };
