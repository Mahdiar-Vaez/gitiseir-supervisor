import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SECURITY_CONFIG,
  checkMobileLockout,
  recordFailedVerification,
  resetVerificationAttempts,
} from '@/utils/security';
import { toPersianDigits } from '@/utils/persian-digits';

/**
 * Format raw seconds into MM:SS with Persian numerals
 */
export function formatSecondsToPersianTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return toPersianDigits(`${mm}:${ss}`);
}

export interface UseOtpTimerReturn {
  secondsLeft: number;
  formattedTime: string;
  canResend: boolean;
  isLocked: boolean;
  lockRemainingSeconds: number;
  formattedLockTime: string;
  startCooldown: (durationSeconds?: number) => void;
  resetCooldown: () => void;
  recordFailure: () => boolean;
  resetLockout: () => void;
}

/**
 * Hook to manage OTP countdown cooldown timer and anti-brute force lockout
 */
export function useOtpTimer(targetMobile = ''): UseOtpTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState<number>(0);

  const targetTimeRef = useRef<number | null>(null);

  // Sync lockout state
  const refreshLockout = useCallback(() => {
    if (!targetMobile) {
      setIsLocked(false);
      setLockRemainingSeconds(0);
      return;
    }
    const { isLocked: locked, remainingSeconds } = checkMobileLockout(targetMobile);
    setIsLocked(locked);
    setLockRemainingSeconds(remainingSeconds);
  }, [targetMobile]);

  // Start cooldown timer (default 120s)
  const startCooldown = useCallback((durationSeconds = SECURITY_CONFIG.RESEND_COOLDOWN_SECONDS) => {
    targetTimeRef.current = Date.now() + durationSeconds * 1000;
    setSecondsLeft(durationSeconds);
  }, []);

  // Reset cooldown timer
  const resetCooldown = useCallback(() => {
    targetTimeRef.current = null;
    setSecondsLeft(0);
  }, []);

  // Record a failed attempt
  const recordFailure = useCallback((): boolean => {
    if (!targetMobile) return false;
    const res = recordFailedVerification(targetMobile);
    setIsLocked(res.isLocked);
    setLockRemainingSeconds(res.remainingSeconds);
    return res.isLocked;
  }, [targetMobile]);

  // Reset lockout
  const resetLockout = useCallback(() => {
    if (targetMobile) {
      resetVerificationAttempts(targetMobile);
    }
    setIsLocked(false);
    setLockRemainingSeconds(0);
  }, [targetMobile]);

  // Timer interval ticker
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Tick cooldown
      if (targetTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          targetTimeRef.current = null;
        }
      }

      // 2. Tick lockout if active
      refreshLockout();
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshLockout]);

  const canResend = secondsLeft === 0 && !isLocked;

  return {
    secondsLeft,
    formattedTime: formatSecondsToPersianTime(secondsLeft),
    canResend,
    isLocked,
    lockRemainingSeconds,
    formattedLockTime: formatSecondsToPersianTime(lockRemainingSeconds),
    startCooldown,
    resetCooldown,
    recordFailure,
    resetLockout,
  };
}
