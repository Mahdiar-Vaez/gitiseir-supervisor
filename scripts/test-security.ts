import {
  normalizeDigits,
  normalizeIranMobile,
  isValidIranMobile,
  checkMobileLockout,
  recordFailedVerification,
  resetVerificationAttempts,
} from '../src/utils/security';
import { formatSecondsToPersianTime } from '../src/hooks/useOtpTimer';

function runTests() {
  console.log('--- Testing Security Utilities ---');

  // Test 1: Normalize Persian/Arabic digits
  const persStr = '۰۹۰۴۳۷۹۳۴۲۴';
  const normDigits = normalizeDigits(persStr);
  console.log('1. normalizeDigits:', persStr, '->', normDigits);
  if (normDigits !== '09043793424') throw new Error('normalizeDigits failed');

  // Test 2: Normalize mobile formats
  const mobiles = [
    '+989043793424',
    '00989043793424',
    '9043793424',
    '0904 379 3424',
    '۰۹۰۴۳۷۹۳۴۲۴',
  ];
  mobiles.forEach((m) => {
    const norm = normalizeIranMobile(m);
    const valid = isValidIranMobile(norm);
    console.log(`2. normalizeIranMobile("${m}") -> "${norm}" (Valid: ${valid})`);
    if (norm !== '09043793424' || !valid) throw new Error(`Normalization failed for ${m}`);
  });

  // Test 3: Formatting timer
  const formatted = formatSecondsToPersianTime(119);
  console.log('3. formatSecondsToPersianTime(119):', formatted);
  if (formatted !== '۰۱:۵۹') throw new Error(`Timer format failed: got ${formatted}`);

  // Test 4: Anti-Brute-Force Lockout (5 attempts)
  const testPhone = '09120000000';
  resetVerificationAttempts(testPhone);
  console.log('4. Testing lockout threshold for', testPhone);

  for (let i = 1; i <= 4; i++) {
    const res = recordFailedVerification(testPhone);
    console.log(`   Attempt ${i}: locked = ${res.isLocked}, count = ${res.attemptsCount}`);
    if (res.isLocked) throw new Error(`Should not be locked at attempt ${i}`);
  }

  // 5th attempt must trigger lockout
  const fifth = recordFailedVerification(testPhone);
  console.log(`   Attempt 5: locked = ${fifth.isLocked}, remaining = ${fifth.remainingSeconds}s`);
  if (!fifth.isLocked) throw new Error('Attempt 5 should trigger lockout');

  const check = checkMobileLockout(testPhone);
  if (!check.isLocked) throw new Error('checkMobileLockout should report locked');
  console.log('✓ Lockout confirmed');

  resetVerificationAttempts(testPhone);
  const resetCheck = checkMobileLockout(testPhone);
  if (resetCheck.isLocked) throw new Error('Lockout was not cleared after reset');
  console.log('✓ Reset lockout confirmed');

  console.log('\n--- All Security Tests Passed! ---');
}

runTests();
