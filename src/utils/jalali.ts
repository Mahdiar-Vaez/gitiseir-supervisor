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

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  const gy2 = gm > 2 ? gy + 1 : gy;
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
  timeText: string;
  formattedText: string;
  formattedWithTime: string;
  numericDate: string;
}

/**
 * Extracts exact date and time components in Iran Standard Time (Asia/Tehran, UTC+03:30)
 * regardless of the device, browser, or emulator's local timezone setting.
 */
export function getIranDateParts(date: Date = new Date()): {
  gy: number;
  gm: number;
  gd: number;
  jsDay: number;
  hour: number;
  minute: number;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }
    const gy = Number(map.year);
    const gm = Number(map.month);
    const gd = Number(map.day);
    let hour = Number(map.hour);
    if (hour === 24) hour = 0;
    const minute = Number(map.minute);

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const jsDay = weekdayMap[map.weekday] ?? new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay();

    if (gy > 2000 && gm >= 1 && gm <= 12 && gd >= 1 && gd <= 31) {
      return { gy, gm, gd, jsDay, hour, minute };
    }
  } catch {
    // Fallback to deterministic UTC + 03:30 calculation below
  }

  // Fallback: Iran Standard Time is permanently UTC + 3 hours 30 minutes (210 minutes)
  const iranEpochMs = date.getTime() + 210 * 60 * 1000;
  const iranUtcDate = new Date(iranEpochMs);
  return {
    gy: iranUtcDate.getUTCFullYear(),
    gm: iranUtcDate.getUTCMonth() + 1,
    gd: iranUtcDate.getUTCDate(),
    jsDay: iranUtcDate.getUTCDay(),
    hour: iranUtcDate.getUTCHours(),
    minute: iranUtcDate.getUTCMinutes(),
  };
}

export function getCurrentJalaliDate(date: Date = new Date()): JalaliDateInfo {
  const { gy, gm, gd, jsDay, hour, minute } = getIranDateParts(date);
  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);

  const persianDayIndex = (jsDay + 1) % 7;
  const weekdayName = PERSIAN_WEEKDAYS[persianDayIndex];
  const monthName = JALALI_MONTH_NAMES[jm - 1];

  const padMonth = String(jm).padStart(2, '0');
  const padDay = String(jd).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const timeText = toPersianDigits(`${hh}:${mm}`);
  const formattedText = `${weekdayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;

  return {
    year: jy,
    month: jm,
    day: jd,
    monthName,
    weekdayName,
    timeText,
    formattedText,
    formattedWithTime: `${formattedText} • ساعت ${timeText}`,
    numericDate: toPersianDigits(`${jy}/${padMonth}/${padDay}`),
  };
}

export function getCurrentPersianTime(date: Date = new Date()): string {
  const { hour, minute } = getIranDateParts(date);
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return toPersianDigits(`${hh}:${mm}`);
}

/**
 * Converts a UTC ISO string (even if missing trailing 'Z') to exact Iran local time (HH:mm)
 */
export function formatUtcToIranTime(utcStr?: string | null): string {
  if (!utcStr) return '';
  try {
    const trimmed = utcStr.trim();
    const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
    const normalizedIso = hasTz ? trimmed : `${trimmed}Z`;
    const d = new Date(normalizedIso);
    if (!Number.isNaN(d.getTime())) {
      const { hour, minute } = getIranDateParts(d);
      const hh = String(hour).padStart(2, '0');
      const mm = String(minute).padStart(2, '0');
      return `${hh}:${mm}`;
    }
  } catch {
    // ignore
  }
  const match = utcStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : '';
}

export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const isLeap = ((year - (year > 0 ? 474 : 473)) % 2820 + 474 + 38) * 682 % 2816 < 682;
  return isLeap ? 30 : 29;
}

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

export function getJalaliMonthStartWeekday(year: number, month: number): number {
  const [gy, gm, gd] = jalaliToGregorian(year, month, 1);
  const d = new Date(gy, gm - 1, gd);
  return (d.getDay() + 1) % 7;
}
