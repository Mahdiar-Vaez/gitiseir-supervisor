// Automated integration verification test for Auth API endpoints
const { sendOtpApi, loginApi } = require('../src/services/api/auth');

async function runTests() {
  console.log('--- Testing Auth API Client ---');
  
  // Test 1: Send OTP to test mobile
  try {
    console.log('1. Testing sendOtpApi with 09043793424...');
    const otpRes = await sendOtpApi('09043793424');
    console.log('✓ sendOtpApi success:', otpRes);
    if (!otpRes.success) throw new Error('Expected success to be true');
  } catch (err) {
    console.error('✗ sendOtpApi failed:', err.message);
  }

  // Test 2: Login with wrong OTP (expected 401 error with Persian message)
  try {
    console.log('\n2. Testing loginApi with wrong OTP...');
    await loginApi('09043793424', '0000');
    console.error('✗ Expected loginApi to fail with wrong code');
  } catch (err) {
    console.log('✓ loginApi correctly rejected with error:', err.message, `(Status: ${err.statusCode})`);
    if (err.statusCode !== 401) {
      console.warn('Note: Expected 401, got', err.statusCode);
    }
  }

  console.log('\n--- Auth API Client Tests Completed ---');
}

runTests().catch(console.error);
