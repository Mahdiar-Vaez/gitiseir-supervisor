/**
 * Utility functions for Persian digits and text formatting
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts English/Latin digits in any string or number to Persian digits.
 * Example: toPersianDigits("08:30") -> "۰۸:۳۰"
 * Example: toPersianDigits(1403) -> "۱۴۰۳"
 */
export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

/**
 * Formats a distance number with Persian unit
 * Example: formatDistance(320) -> "۳۲۰ کیلومتر"
 */
export function formatDistance(km: number | string): string {
  return `${toPersianDigits(km)} کیلومتر`;
}

/**
 * Formats a time string in Persian
 * Example: formatTime("08:00") -> "۰۸:۰۰"
 */
export function formatTime(timeStr: string): string {
  return toPersianDigits(timeStr);
}

/**
 * Formats a rating score out of 100
 * Example: formatScore(94) -> "۹۴ از ۱۰۰"
 */
export function formatScore(score: number): string {
  return `${toPersianDigits(score)} / ${toPersianDigits(100)}`;
}
