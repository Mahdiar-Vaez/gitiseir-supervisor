/**
 * Security and anti-brute force utilities for Sarshoofer authentication
 */

const PERSIAN_ARABIC_DIGIT_MAP: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

export function normalizeDigits(input: string): string {
  return String(input || '').replace(/[۰-۹٠-٩]/g, (char) => PERSIAN_ARABIC_DIGIT_MAP[char] || char);
}

export function normalizeIranMobile(input: string): string {
  if (!input) return '';
  let cleaned = normalizeDigits(input).trim();
  cleaned = cleaned.replace(/\D/g, '');

  if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

export function isValidIranMobile(input: string): boolean {
  const normalized = normalizeIranMobile(input);
  return /^09\d{9}$/.test(normalized);
}

interface LockoutInfo {
  failedAttempts: number;
  lockedUntil: number | null;
}

const attemptRegistry = new Map<string, LockoutInfo>();

export const SECURITY_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 60 * 1000,
  RESEND_COOLDOWN_SECONDS: 120,
};

export function checkMobileLockout(mobile: string): {
  isLocked: boolean;
  remainingSeconds: number;
} {
  const norm = normalizeIranMobile(mobile);
  const info = attemptRegistry.get(norm);
  if (!info || !info.lockedUntil) {
    return { isLocked: false, remainingSeconds: 0 };
  }

  const now = Date.now();
  if (now >= info.lockedUntil) {
    attemptRegistry.delete(norm);
    return { isLocked: false, remainingSeconds: 0 };
  }

  const remainingSeconds = Math.ceil((info.lockedUntil - now) / 1000);
  return { isLocked: true, remainingSeconds };
}

export function recordFailedVerification(mobile: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsCount: number;
} {
  const norm = normalizeIranMobile(mobile);
  const now = Date.now();
  const current = attemptRegistry.get(norm) || { failedAttempts: 0, lockedUntil: null };

  current.failedAttempts += 1;

  if (current.failedAttempts >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
    current.lockedUntil = now + SECURITY_CONFIG.LOCKOUT_DURATION_MS;
    attemptRegistry.set(norm, current);
    return {
      isLocked: true,
      remainingSeconds: Math.ceil(SECURITY_CONFIG.LOCKOUT_DURATION_MS / 1000),
      attemptsCount: current.failedAttempts,
    };
  }

  attemptRegistry.set(norm, current);
  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsCount: current.failedAttempts,
  };
}

export function resetVerificationAttempts(mobile: string): void {
  const norm = normalizeIranMobile(mobile);
  attemptRegistry.delete(norm);
}
