import { sendEmail, sendSMS, verifyOTP } from '../services/otpService';

async function testOTPService() {
  console.log('🧪 Testing OTP Service...\n');

  try {
    // Test Email OTP
    console.log('📧 Testing Email OTP...');
    const emailResult = await sendEmail('test@example.com');
    console.log('Email Result:', emailResult);
    console.log('');

    // Test SMS OTP
    console.log('📱 Testing SMS OTP...');
    const smsResult = await sendSMS('+1234567890');
    console.log('SMS Result:', smsResult);
    console.log('');

    // Test OTP Verification
    console.log('🔐 Testing OTP Verification...');
    const verifyResult1 = await verifyOTP('111111', 'test');
    console.log('Verify 111111:', verifyResult1);
    
    const verifyResult2 = await verifyOTP('123456', 'test');
    console.log('Verify 123456:', verifyResult2);
    console.log('');

    console.log('✅ OTP Service test completed!');

  } catch (error) {
    console.error('❌ Error testing OTP service:', error);
  }
}

// Run the test
testOTPService();
