# Driver Work Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

This plan integrates the **Driver Work Calendar Service** (`/api/my-work-calendar` and `/api/my-work-calendar/day-trips-grid`) into the mobile app, providing accurate Jalali calendar calculations, initial launch on the exact current day and month, multi-trip density management, and luxury trip detail cards with temporary driver support.

---

## Architecture & Data Flow

```mermaid
flowchart TD
    A["Calendar Screen (src/app/calendar.tsx)"] -->|Mounts with current Jalali year/month/day| B["getCurrentJalaliDate()"]
    A -->|Fetch monthly calendar| C["getWorkCalendarApi(year, month, token)"]
    C -->|GET /api/my-work-calendar| D["Backend API / Dual-Mode Fallback"]
    D -->|Returns days array with trips & holiday flags| C
    C -->|Populates month grid & day status dots| E["ShamsiCalendar component"]
    
    A -->|On day select or initial load| F["getDayTripsGridApi(year, month, day, token)"]
    F -->|GET /api/my-work-calendar/day-trips-grid| G["Backend API / Dual-Mode Fallback"]
    G -->|Returns DayTripGridItem[]| F
    F -->|Renders performant trip list| H["DayTripCard components"]
    H -->|Tapping any card opens| I["TripSummaryModal"]
```

---

## File Structure & Responsibilities

| File | Responsibility |
| :--- | :--- |
| `src/services/api/types.ts` | TypeScript interfaces for `WorkCalendarDay`, `WorkCalendarTrip`, `DayTripGridItem`, and `TemporaryDriverInfo`. |
| `src/services/api/calendar.ts` | API client methods `getWorkCalendarApi` and `getDayTripsGridApi` with Dual-Mode Resiliency (live backend + realistic sample fallbacks). |
| `src/utils/jalali.ts` | Add `jalaliToGregorian` algorithm to compute exact first-weekday offsets for any month without hardcoded guesswork. |
| `src/components/ui/ShamsiCalendar.tsx` | Enhanced Shamsi Calendar component supporting dynamic month/year, holiday indicators, trip count badges, today ring, and month change callbacks. |
| `src/components/ui/DayTripCard.tsx` | Dedicated luxury card for high-density day trips: timing, fare in Persian digits, vehicle plate, status pill, and temporary driver badge. |
| `src/app/calendar.tsx` | Calendar screen initializing on the exact current Jalali date, coordinating monthly calendar fetch and day trips grid fetch with pull-to-refresh. |
| `docs/WORK_CALENDAR_SERVICE.md` | Comprehensive architectural documentation with Mermaid diagrams and endpoint specifications. |

---

## Proposed Tasks

### Task 1: Calendar API Client, Types & Fallback Data
- **Goal:** Define all data structures and API functions for `/api/my-work-calendar` and `/api/my-work-calendar/day-trips-grid`.
- **Files:**
  - `src/services/api/types.ts`: add `WorkCalendarTrip`, `WorkCalendarDay`, `WorkCalendarResult`, `DayTripGridItem`, `TemporaryDriverInfo`.
  - `src/services/api/calendar.ts`: implement `getWorkCalendarApi` and `getDayTripsGridApi` with bearer token support and realistic fallback data matching user's spec.
  - `scripts/test-calendar-api.js`: Node test script to verify endpoint structures.
- **Verification:** Run `node scripts/test-calendar-api.js` and `npx tsc --noEmit`.

### Task 2: Accurate Jalali Month First-Weekday Algorithm
- **Goal:** Enable exact month offset calculation in `src/utils/jalali.ts` so that Day 1 correctly lands on its true Persian weekday (e.g., Wednesday for Mehr 1, 1405).
- **Files:**
  - `src/utils/jalali.ts`: add `jalaliToGregorian` and `getJalaliMonthStartWeekday(year, month)`.
- **Verification:** Unit test conversion of 1405/07/01 -> Wednesday (index 4 in Persian week).

### Task 3: Enhanced `ShamsiCalendar` Component
- **Goal:** Upgrade calendar grid to support:
  1. Exact starting day offset based on `getJalaliMonthStartWeekday`.
  2. Trip indicator badges/dots based on `days[].trips.length`.
  3. Holiday styling for `isHoliday: true` (e.g. Fridays).
  4. Real-time highlight for `isToday`.
  5. Smooth month navigation with `onMonthChange(year, month)` and "امروز" jump button.
- **Files:**
  - `src/components/ui/ShamsiCalendar.tsx`.
- **Verification:** `npx tsc --noEmit` & `npm run lint`.

### Task 4: High-Density `DayTripCard` Component
- **Goal:** Design a clean, minimal luxury card for individual trips returned by `/api/my-work-calendar/day-trips-grid`.
- **Features:**
  - Route timing (start to end).
  - Outbound/inbound price with Persian thousand separators.
  - Status pill using `getTripStatusConfig`.
  - Vehicle details (car type, color, license plate).
  - Temporary driver banner if `hasTemporaryDriver` is true (with substitute driver name, phone, reason).
  - Tap handler to open `TripSummaryModal`.
- **Files:**
  - `src/components/ui/DayTripCard.tsx`.
- **Verification:** `npx tsc --noEmit` & `npm run lint`.

### Task 5: Integrate into `src/app/calendar.tsx`
- **Goal:** Connect screen to live data:
  - On mount, automatically select CURRENT Jalali year, month, and day (`getCurrentJalaliDate()`).
  - Fetch monthly data (`getWorkCalendarApi`).
  - Fetch day trips grid (`getDayTripsGridApi`) for the selected day.
  - Pull-to-refresh (`RefreshControl`).
  - Empty state when a day has 0 trips.
  - Modal integration with `TripSummaryModal`.
- **Files:**
  - `src/app/calendar.tsx`.
- **Verification:** `npx tsc --noEmit` & `npm run lint`.

### Task 6: Documentation & Final Verification
- **Goal:** Document the calendar service in `docs/WORK_CALENDAR_SERVICE.md` and verify entire project health.
- **Files:**
  - `docs/WORK_CALENDAR_SERVICE.md`.
- **Verification:** Run `npx tsc --noEmit` and `npm run lint` (0 errors, 0 warnings).
