/**
 * Utility functions for Persian digits and currency/number formatting
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function toEnglishDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return input
    .toString()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function formatNumberWithCommas(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '۰';
  const cleaned = String(num).replace(/[^0-9]/g, '');
  if (!cleaned) return '۰';
  const withCommas = Number(cleaned).toLocaleString('en-US');
  return toPersianDigits(withCommas);
}

export function format4DigitGroups(input: string | null | undefined): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
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
