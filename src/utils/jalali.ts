/**
 * Jalali (Shamsi) Calendar Utilities
 */

import { toPersianDigits } from './persian-digits';

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export const PERSIAN_WEEKDAYS_SHORT = [
  'ش',
  'ی',
  'د',
  'س',
  'چ',
  'پ',
  'ج',
];

// Gregorian to Jalali conversion algorithm
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

export interface JalaliDateInfo {
  year: number;
  month: number;
  day: number;
  monthName: string;
  weekdayName: string;
  formattedText: string; // e.g. "چهارشنبه ۲۹ مهر ۱۴۰۳"
}

export function getCurrentJalaliDate(): JalaliDateInfo {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Day of week in Persian: Saturday is 0
  // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  const jsDay = now.getDay();
  const persianDayIndex = (jsDay + 1) % 7;
  const weekdayName = PERSIAN_WEEKDAYS[persianDayIndex];
  const monthName = JALALI_MONTH_NAMES[jm - 1];

  return {
    year: jy,
    month: jm,
    day: jd,
    monthName,
    weekdayName,
    formattedText: `${weekdayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`,
  };
}

/**
 * Returns number of days in a Jalali month
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Is leap year?
  const isLeap = ((year - (year > 0 ? 474 : 473)) % 2820 + 474 + 38) * 682 % 2816 < 682;
  return isLeap ? 30 : 29;
}

/**
 * Jalali to Gregorian conversion algorithm
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  while (gm < 12 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  const gd = days + 1;
  return [gy, gm, gd];
}

/**
 * Returns the day of the week for the 1st of a Jalali month (0: Saturday .. 6: Friday)
 */
export function getJalaliMonthStartWeekday(year: number, month: number): number {
  const [gy, gm, gd] = jalaliToGregorian(year, month, 1);
  const d = new Date(gy, gm - 1, gd);
  return (d.getDay() + 1) % 7;
}

