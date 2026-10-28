/**
 * Gitiseir Driver App - Theme & Design Tokens
 * Supports Dual Luxury Themes: Dark Luxury Gold and Light Milky Gold
 */

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    name: 'dark' as const,
    bg: '#0B0F19',
    background: '#0B0F19',
    backgroundElement: '#111827',
    backgroundSelected: '#1E293B',
    card: '#111827',
    cardSubtle: '#1E293B',
    cardElevated: '#182234',
    gold: '#D4AF37',
    goldSoft: '#E8C766',
    goldBg: 'rgba(212, 175, 55, 0.12)',
    goldGlow: 'rgba(212, 175, 55, 0.25)',
    goldButtonText: '#0B0F19',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.09)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderGold: 'rgba(212, 175, 55, 0.35)',
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.14)',
    warning: '#D4AF37',
    warningBg: 'rgba(212, 175, 55, 0.14)',
    danger: '#FB7185',
    dangerBg: 'rgba(251, 113, 133, 0.14)',
    info: '#60A5FA',
    infoBg: 'rgba(96, 165, 250, 0.14)',
    shadow: '#000000',
  },
  light: {
    name: 'light' as const,
    bg: '#FAF7F2', // شیری لوکس (Warm Milky Cream)
    background: '#FAF7F2',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F3EFE6',
    card: '#FFFFFF', // کارت تمیز سفید با سایه نرم
    cardSubtle: '#F3EFE6', // پس‌زمینه شیری ثانویه
    cardElevated: '#FFFFFF',
    gold: '#C59B27', // طلایی چشم‌نواز با کنتراست بهینه روی شیری
    goldSoft: '#D4AF37',
    goldBg: 'rgba(197, 155, 39, 0.12)',
    goldGlow: 'rgba(197, 155, 39, 0.22)',
    goldButtonText: '#FFFFFF',
    text: '#0F172A', // سرمه‌ای تیره برای حداکثر خوانایی
    textSecondary: '#334155',
    textMuted: '#64748B',
    border: 'rgba(197, 155, 39, 0.22)',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    borderGold: 'rgba(197, 155, 39, 0.45)',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.12)',
    warning: '#D97706',
    warningBg: 'rgba(217, 119, 6, 0.12)',
    danger: '#EF4444',
    dangerBg: 'rgba(239, 68, 68, 0.12)',
    info: '#2563EB',
    infoBg: 'rgba(37, 99, 235, 0.12)',
    shadow: 'rgba(148, 120, 60, 0.15)',
  },
} as const;

export type ThemeType = 'dark' | 'light';
export type ThemeColors = (typeof Colors)[ThemeType];
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Typography = {
  fontFamily: {
    light: 'Vazirmatn_300Light',
    regular: 'Vazirmatn_400Regular',
    medium: 'Vazirmatn_500Medium',
    semiBold: 'Vazirmatn_600SemiBold',
    bold: 'Vazirmatn_700Bold',
  },
  fallbackFont: Platform.select({
    ios: 'Tahoma, Arial',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Vazirmatn_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Vazirmatn_400Regular',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Vazirmatn, Tahoma, sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  // Starter template backward compatibility
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export const TouchTarget = {
  min: 44, // Minimum touch target size (WCAG & mobile UX standard)
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
