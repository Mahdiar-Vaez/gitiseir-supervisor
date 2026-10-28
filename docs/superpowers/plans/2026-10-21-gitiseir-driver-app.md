# Gitiseir Driver App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete cross-platform (iOS & Android) Persian RTL Gitiseir Driver Application featuring dual themes (Dark Luxury Gold and Light Milky Gold), Vazirmatn typography with Persian digits, a custom bottom tab bar, and all three core screens (Home, Work Calendar, and Driver Profile).

**Architecture:** A lightweight typed custom design system on top of React Native and Expo SDK 58. Uses React Context for real-time theme switching (Dark Luxury & Light Milky), `lucide-react-native` for crisp iconography, `react-native-reanimated` for smooth micro-interactions, and custom Jalali calendar logic for the work calendar.

**Tech Stack:** Expo SDK 58, React Native 0.88, React 19.3, `@expo-google-fonts/vazirmatn`, `lucide-react-native`, `react-native-svg`, `expo-haptics`, `react-native-reanimated`, `react-native-safe-area-context`, `expo-router`.

**Spec:** `docs/superpowers/specs/2026-10-21-gitiseir-driver-app-design.md`

## Global Constraints

- Full RTL (Right-to-Left) layout support across all screens.
- All numbers, times, dates, scores, and distances must render in Persian numerals (FaNum: ۰۱۲۳۴۵۶۷۸۹).
- Dual theme support: Dark Luxury (`#0B0F19`) and Light Milky Ivory (`#FAF7F2`) with rich gold accents (`#D4AF37` / `#C59B27`).
- Minimum touch target >= 44x44 for all buttons and interactive controls.
- Safe Area insets handled for both iOS (Home indicator, notch) and Android.
- Zero TypeScript compiler errors (`npx tsc --noEmit`).

---

### Task 1: Foundation - Theme System, Persian Number Formatter & Jalali Helpers

**Files:**
- Create: `src/constants/theme.ts`
- Create: `src/context/ThemeContext.tsx`
- Create: `src/utils/persian-digits.ts`
- Create: `src/utils/jalali.ts`

**Interfaces:**
- Produces:
  - `ThemeContext`: `{ theme: 'dark' | 'light', colors: ThemeColors, toggleTheme: () => void }`
  - `toPersianDigits(input: string | number): string`
  - `getJalaliToday(): { year: number, monthName: string, day: number, dayOfWeek: string }`

- [ ] **Step 1: Implement Persian digit converter and Jalali utilities**
- [ ] **Step 2: Implement Theme constants with full Dark and Light Milky Gold tokens**
- [ ] **Step 3: Implement ThemeContext provider and `useAppTheme` hook**
- [ ] **Step 4: Verify type safety with `npx tsc --noEmit`**

---

### Task 2: Root Layout, Vazirmatn Font Integration & Header

**Files:**
- Modify: `src/app/_layout.tsx`
- Create: `src/components/ui/AppHeader.tsx`

**Interfaces:**
- Consumes: `useAppTheme` from `src/context/ThemeContext`
- Produces: `AppHeader`: `{ driverName: string, dateText: string, onNotificationPress?: () => void }`

- [ ] **Step 1: Configure `_layout.tsx` with Vazirmatn font loading, ThemeProvider, and Status Bar**
- [ ] **Step 2: Build `AppHeader` component with driver avatar, greeting, theme toggle (Sun/Moon), and notification button**
- [ ] **Step 3: Verify rendering and responsive layout across both themes**

---

### Task 3: Core UI Components - Action Buttons, Status Pills & Score Ring

**Files:**
- Create: `src/components/ui/PrimaryButton.tsx`
- Create: `src/components/ui/StatusPill.tsx`
- Create: `src/components/ui/ScoreRing.tsx`
- Create: `src/components/ui/StatCard.tsx`

**Interfaces:**
- Produces:
  - `PrimaryButton`: `{ label: string, icon?: LucideIcon, onPress: () => void, variant?: 'gold' | 'success' | 'outline', loading?: boolean }`
  - `StatusPill`: `{ status: 'success' | 'warning' | 'danger' | 'info', label: string }`
  - `ScoreRing`: `{ score: number, maxScore?: number, label: string }`
  - `StatCard`: `{ title: string, value: string | number, trend: string, isPositive: boolean, icon: LucideIcon }`

- [ ] **Step 1: Build `PrimaryButton` with scale-down press feedback and minimum 44px height**
- [ ] **Step 2: Build `StatusPill` with semantic colors and icons**
- [ ] **Step 3: Build `ScoreRing` (circular performance indicator with color scale)**
- [ ] **Step 4: Build `StatCard` with trend comparison badge**

---

### Task 4: Custom Bottom Navigation Bar

**Files:**
- Create: `src/components/navigation/CustomBottomTabBar.tsx`
- Modify: `src/app/_layout.tsx` or router setup

**Interfaces:**
- Produces:
  - `CustomBottomTabBar`: Displays 3 tabs: "خانه" (Home), "تقویم کاری" (Calendar), "کارت راننده" (Driver Card)
  - Active state: Gold icon & label, soft gold pill background, top gold line indicator

- [ ] **Step 1: Implement `CustomBottomTabBar` with safe-area padding for iOS and Android**
- [ ] **Step 2: Connect tabs to Expo Router navigation**
- [ ] **Step 3: Ensure RTL order (Home on right, Profile on left)**

---

### Task 5: Screen 1 - Home Screen (صفحه خانه)

**Files:**
- Create: `src/components/ui/TripCard.tsx`
- Modify: `src/app/index.tsx`

**Interfaces:**
- Produces:
  - `TripCard`: Interactive hero card with state machine (`ready_to_start` -> `in_progress` -> `completed`)
  - Origin & Destination display with route divider
  - Departure time and distance with Persian numbers
  - Today's schedule list with trip items

- [ ] **Step 1: Implement `TripCard` with dynamic states, haptic feedback, and time registration**
- [ ] **Step 2: Implement today's upcoming trip schedule items in `src/app/index.tsx`**
- [ ] **Step 3: Test trip state transitions and verify theme adaptation**

---

### Task 6: Screen 2 - Work Calendar (صفحه تقویم کاری)

**Files:**
- Create: `src/components/ui/ShamsiCalendar.tsx`
- Create: `src/app/calendar.tsx`

**Interfaces:**
- Produces:
  - `ShamsiCalendar`: Month picker, 7-column weekday grid (شنبه تا جمعه), day cells with status dots (green = completed, gold = scheduled, red = cancelled)
  - Daily trip details list for the selected day or empty state

- [ ] **Step 1: Implement `ShamsiCalendar` grid component with Persian day numbers**
- [ ] **Step 2: Implement daily trips list and empty state in `src/app/calendar.tsx`**
- [ ] **Step 3: Verify month navigation and day selection**

---

### Task 7: Screen 3 - Driver Card / Profile (صفحه کارت راننده)

**Files:**
- Create: `src/components/ui/DriverIdCard.tsx`
- Create: `src/app/profile.tsx`

**Interfaces:**
- Produces:
  - `DriverIdCard`: Physical ID card aesthetic (photo, full name, personnel code, license category, expiry date, verified shield)
  - Performance rating circular score
  - Monthly stats grid (successful trips, delays, absences)

- [ ] **Step 1: Build `DriverIdCard` component with luxury styling and security hologram badge**
- [ ] **Step 2: Connect `ScoreRing` and `StatCard` grid in `src/app/profile.tsx`**
- [ ] **Step 3: Verify contrast, Persian digits, and responsive layout**

---

### Task 8: Verification & Polish

**Files:**
- Full codebase check

- [ ] **Step 1: Run TypeScript compiler check (`npx tsc --noEmit`) and fix any issues**
- [ ] **Step 2: Verify both Dark Luxury and Light Milky themes look stunning and have WCAG AA contrast**
- [ ] **Step 3: Verify smooth 60fps interaction and haptics**
