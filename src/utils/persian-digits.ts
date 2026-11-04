/**
 * Utility functions for Persian digits and currency/number formatting
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = toEnglishDigits(input);
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function toEnglishDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return input
    .toString()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * Strips all non-digits and converts Persian/Arabic digits to standard English digits (0-9).
 * Safe for use in controlled TextInput state and API payloads.
 */
export function sanitizeDigitsInput(
  input: string | number | null | undefined,
  maxLength?: number
): string {
  const english = toEnglishDigits(input).replace(/[^0-9]/g, '');
  return typeof maxLength === 'number' ? english.slice(0, maxLength) : english;
}

/**
 * Normalizes an Iranian mobile phone number into standard 11-digit English format (09xxxxxxxxx)
 * for backend API submission.
 */
export function formatPhoneForApi(input: string | number | null | undefined): string {
  let digits = sanitizeDigitsInput(input, 14);
  if (digits.startsWith('0098')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('98') && digits.length >= 12) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('9') && digits.length === 10) {
    digits = '0' + digits;
  }
  return digits.slice(0, 11);
}

/**
 * Normalizes a 10-digit Iranian national code into clean English digits for backend API submission.
 */
export function formatNationalCodeForApi(input: string | number | null | undefined): string {
  return sanitizeDigitsInput(input, 10);
}

/**
 * Normalizes a bank card (16 digits) or IBAN/Shaba (24 digits without IR) into clean English digits.
 */
export function formatBankNumberForApi(
  input: string | number | null | undefined,
  maxLength = 24
): string {
  return sanitizeDigitsInput(input, maxLength);
}

/**
 * Normalizes a price string or number into a clean positive integer for backend API submission.
 */
export function formatPriceForApi(input: string | number | null | undefined): number {
  const digits = sanitizeDigitsInput(input, 12);
  if (!digits) return 0;
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function formatNumberWithCommas(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '۰';
  const cleaned = sanitizeDigitsInput(num);
  if (!cleaned) return '۰';
  const withCommas = Number(cleaned).toLocaleString('en-US');
  return toPersianDigits(withCommas);
}

export function format4DigitGroups(input: string | null | undefined): string {
  if (!input) return '';
  const digits = sanitizeDigitsInput(input);
  if (!digits) return '';
  const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  return toPersianDigits(grouped);
}

export function formatDistance(km: number | string): string {
  return `${toPersianDigits(km)} کیلومتر`;
}

export function formatTime(timeStr: string): string {
  return toPersianDigits(timeStr);
}

export function formatScore(score: number): string {
  return `${toPersianDigits(score)} / ${toPersianDigits(100)}`;
}
