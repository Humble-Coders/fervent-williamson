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

async function addMissingConfigs() {
  try {
    // Add SMS provider configuration
    const smsProvider = await prisma.systemConfig.upsert({
      where: { key: 'sms_provider' },
      update: {
        value: 'fast2sms'
      },
      create: {
        key: 'sms_provider',
        value: 'fast2sms'
      }
    });

    // Add Fast2SMS mode configuration
    const fast2smsMode = await prisma.systemConfig.upsert({
      where: { key: 'fast2sms_mode' },
      update: {
        value: 'otp'
      },
      create: {
        key: 'fast2sms_mode',
        value: 'otp'
      }
    });

    // Add development mode configuration
    const devMode = await prisma.systemConfig.upsert({
      where: { key: 'development_mode_enabled' },
      update: {
        value: 'false'
      },
      create: {
        key: 'development_mode_enabled',
        value: 'false'
      }
    });

    logger.info('✅ SMS provider configuration added', { smsProvider });
    logger.info('✅ Fast2SMS mode configuration added', { fast2smsMode });
    logger.info('✅ Development mode configuration added', { devMode });
  } catch (error) {
    logger.error('❌ Error adding configurations', { error });
  } finally {
    await prisma.$disconnect();
  }
}

addMissingConfigs();
