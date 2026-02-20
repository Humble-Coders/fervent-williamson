import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setProductionMode() {
  try {
    console.log('🔧 Setting production mode configuration...');

    // Disable development mode
    await prisma.systemConfig.upsert({
      where: { key: 'development_mode_enabled' },
      update: { value: 'false' },
      create: {
        key: 'development_mode_enabled',
        value: 'false',
      }
    });

    // Ensure email verification is enabled
    await prisma.systemConfig.upsert({
      where: { key: 'email_verification_enabled' },
      update: { value: 'true' },
      create: {
        key: 'email_verification_enabled',
        value: 'true',
      }
    });

    // Ensure SMS verification is enabled
    await prisma.systemConfig.upsert({
      where: { key: 'sms_verification_enabled' },
      update: { value: 'true' },
      create: {
        key: 'sms_verification_enabled',
        value: 'true',
      }
    });

    // Set production security settings
    await prisma.systemConfig.upsert({
      where: { key: 'max_login_attempts' },
      update: { value: '5' },
      create: {
        key: 'max_login_attempts',
        value: '5',
      }
    });

    await prisma.systemConfig.upsert({
      where: { key: 'account_lockout_duration' },
      update: { value: '30' },
      create: {
        key: 'account_lockout_duration',
        value: '30',
      }
    });

    await prisma.systemConfig.upsert({
      where: { key: 'otp_expiry_minutes' },
      update: { value: '5' },
      create: {
        key: 'otp_expiry_minutes',
        value: '5',
      }
    });

    // Set production booking settings
    await prisma.systemConfig.upsert({
      where: { key: 'booking_cancellation_hours' },
      update: { value: '24' },
      create: {
        key: 'booking_cancellation_hours',
        value: '24',
      }
    });

    await prisma.systemConfig.upsert({
      where: { key: 'max_advance_booking_days' },
      update: { value: '90' },
      create: {
        key: 'max_advance_booking_days',
        value: '90',
      }
    });

    console.log('✅ Production mode configuration completed!');
    console.log('\n📋 Production Settings Applied:');
    console.log('🔒 Development mode: DISABLED');
    console.log('📧 Email verification: ENABLED');
    console.log('📱 SMS verification: ENABLED');
    console.log('🛡️ Enhanced security settings: APPLIED');
    console.log('📅 Production booking policies: APPLIED');
    console.log('\n⚠️  IMPORTANT: Make sure to:');
    console.log('1. Configure production email service (SMTP/SendGrid/SES)');
    console.log('2. Configure production SMS service (Twilio/AWS SNS)');
    console.log('3. Set up proper environment variables');
    console.log('4. Enable SSL/HTTPS');
    console.log('5. Configure proper CORS origins');

  } catch (error) {
    console.error('❌ Error setting production mode:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the production setup if this file is executed directly
if (require.main === module) {
  setProductionMode()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default setProductionMode;
