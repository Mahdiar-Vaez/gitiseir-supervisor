/**
 * Gitiseir Sarshoofer (Lead Driver) App - Theme & Design Tokens
 * Brand Family: Gitiseir Luxury Fleet
 * Visual Persona: Executive Command Slate & Emerald-Teal + Heritage Gold
 * See DESIGN.md / disign.md for full brand & role differentiation details.
 */

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    name: 'dark' as const,
    bg: '#071318', // سرمه‌ای-سبز تیره فرماندهی (Deep Command Slate)
    background: '#071318',
    backgroundElement: '#0D1F28',
    backgroundSelected: '#152F3D',
    card: '#0D1F28',
    cardSubtle: '#132B38',
    cardElevated: '#163342',
    // Heritage Brand Gold (حفظ اصالت برند گیتی‌سیر)
    gold: '#D4AF37',
    goldSoft: '#E8C766',
    goldBg: 'rgba(212, 175, 55, 0.12)',
    goldGlow: 'rgba(212, 175, 55, 0.25)',
    goldButtonText: '#071318',
    // Sarshoofer Command Accent (فیروزه‌ای-زمردی نظارتی سرشوفر)
    command: '#14B8A6',
    commandSoft: '#2DD4BF',
    commandBg: 'rgba(20, 184, 166, 0.14)',
    commandBorder: 'rgba(20, 184, 166, 0.38)',
    // Langi / Substitute Driver Accent (کهربایی ویژه لنگی)
    langi: '#F59E0B',
    langiBg: 'rgba(245, 158, 11, 0.14)',
    langiBorder: 'rgba(245, 158, 11, 0.40)',
    // Typography & Borders
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.09)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderGold: 'rgba(212, 175, 55, 0.35)',
    // Status Semantic Tokens
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.14)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.14)',
    danger: '#FB7185',
    dangerBg: 'rgba(251, 113, 133, 0.14)',
    info: '#38BDF8',
    infoBg: 'rgba(56, 189, 248, 0.14)',
    shadow: '#000000',
  },
  light: {
    name: 'light' as const,
    bg: '#F4F7F6', // مرواریدی روشن و رسمی (Executive Pearl Slate)
    background: '#F4F7F6',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6F0EE',
    card: '#FFFFFF',
    cardSubtle: '#EBF1EF',
    cardElevated: '#FFFFFF',
    // Heritage Brand Gold
    gold: '#C59B27',
    goldSoft: '#D4AF37',
    goldBg: 'rgba(197, 155, 39, 0.12)',
    goldGlow: 'rgba(197, 155, 39, 0.22)',
    goldButtonText: '#FFFFFF',
    // Sarshoofer Command Accent
    command: '#0D9488',
    commandSoft: '#14B8A6',
    commandBg: 'rgba(13, 148, 136, 0.10)',
    commandBorder: 'rgba(13, 148, 136, 0.32)',
    // Langi / Substitute Driver Accent
    langi: '#D97706',
    langiBg: 'rgba(217, 119, 6, 0.12)',
    langiBorder: 'rgba(217, 119, 6, 0.35)',
    // Typography & Borders
    text: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    border: 'rgba(13, 148, 136, 0.18)',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    borderGold: 'rgba(197, 155, 39, 0.42)',
    // Status Semantic Tokens
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.12)',
    warning: '#D97706',
    warningBg: 'rgba(217, 119, 6, 0.12)',
    danger: '#E11D48',
    dangerBg: 'rgba(225, 29, 72, 0.12)',
    info: '#0284C7',
    infoBg: 'rgba(2, 132, 199, 0.12)',
    shadow: 'rgba(15, 23, 42, 0.12)',
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
  pill: 9999,
  full: 9999,
} as const;

export const TouchTarget = {
  min: 44,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
