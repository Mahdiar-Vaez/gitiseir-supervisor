# Driver Trips & UI Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Driver Trip APIs (`/active`, `/today`, `/{tripId}/summary`), replace hardcoded driver details with dynamic user session data, eliminate all text truncation (`...`) across driver names, service titles, and quick access boxes, and introduce a minimal luxury Trip Summary Modal with full dual-theme support.

**Architecture:** A robust service layer (`src/services/api/trips.ts`) communicates with `https://backend.vaezprojects.ir/api/driversMobile/Trip/*` using JWT authorization headers from `AuthContext` with graceful fallback for unassigned/passenger roles. The Home screen (`src/app/index.tsx`) integrates live Active Trip banners, dynamic Today's Trips listing with pull-to-refresh, and an interactive luxury Modal displaying detailed trip statistics.

**Tech Stack:** Expo SDK 58, React Native 0.88, React 19.3.0, Lucide React Native, Vazirmatn Persian font, `toPersianDigits`.

---

## Global Constraints

- **Zero Truncation Rule:** Driver names (`user.name + " " + user.family`), service locations, and quick access labels must NOT be truncated with ellipses (`...`) unless exceptionally long (> 40 chars).
- **Dual Luxury Theme:** Complete visual harmony with Dark Luxury (`#0B0F19`, card `#111827`, gold `#D4AF37`) and Light Milky Gold (`#FAF7F2`, card `#FFFFFF`, border `#E7DFD5`).
- **Persian Typography & Numerals:** All times, counts, prices, and IDs must use Persian digits via `toPersianDigits` and Vazirmatn font.
- **RTL Layout:** Strict Persian Right-to-Left alignment with standard LTR number flow.
- **Zero Breaking Changes:** Preserve existing tabs, theme toggler, and auth guarding.

---

## Review Focus

1. **Active Trip Nullability:** Active trip endpoint returns `result: null` when no trip is currently in progress; Home screen must handle both active trip present and empty states cleanly.
2. **Text Overflow & Wrapping:** Quick access grid items and header greeting must flex/wrap smoothly on narrow screens (e.g. 360px) without showing `...`.
3. **Price Formatting:** Outbound price (e.g. `2455555`) must be separated by commas and displayed in Persian digits with standard currency suffix (ریال / تومان).
4. **Modal Lifecycle:** Tapping any trip card must open the Trip Summary Modal, fetch `/summary` asynchronously with loading indicator, and close cleanly on backdrop tap or close button.
5. **Session Fallback:** If API returns HTTP 403 (e.g. test user lacks driver role in backend DB), client must provide graceful sample trip data matching the user's spec so UI remains fully testable.

---

## File Structure

```
src/
├── services/
│   └── api/
│       ├── types.ts                 (Modify: Add ActiveTrip, TodayTrip, TripSummary types)
│       └── trips.ts                 (Create: Trips API client with JWT auth & fallback)
├── components/
│   └── ui/
│       ├── AppHeader.tsx            (Modify: Bind dynamic user name & eliminate text truncation)
│       ├── QuickAccessGrid.tsx      (Modify: Responsive label layout without '...' truncation)
│       ├── ActiveTripCard.tsx       (Create: Prominent active trip banner with entering/exiting badge)
│       ├── TodayTripItem.tsx        (Create: Sleek list card item for today's trips)
│       └── TripSummaryModal.tsx     (Create: Minimal luxury modal for trip details)
└── app/
    └── index.tsx                    (Modify: Integrate active trip, today's trips, modal & pull-to-refresh)
scripts/
└── test-trips-api.ts                (Create: API verification test script)
```

---

### Task 1: Trip API Client, Types & Fallback Service

**Files:**
- Modify: `src/services/api/types.ts`
- Create: `src/services/api/trips.ts`
- Create: `scripts/test-trips-api.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ActiveTrip {
    tripId: number;
    name: string;
    serviceLocationTitle: string;
    outboundStart: string;
    outboundEnd: string;
    totalStations: number;
    visitedStations: number;
    status: number;
    entering: boolean;
  }

  export interface TodayTrip {
    calendarDayId: string;
    tripId: number;
    tripName: string;
    serviceLocationTitle: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    status: number;
    startedAtUtc: string | null;
    endedAtUtc: string | null;
    isReplacementAssigned: boolean;
    canStartTrip: boolean;
    canEndTrip: boolean;
  }

  export interface TripSummary {
    tripId: number;
    name: string;
    status: number;
    executionStatus: number;
    outboundStart: string;
    outboundEnd: string;
    outboundPrice: number;
    totalStations: number;
    visitedStations: number;
    remainingStations: number;
    totalExpectedPassengers: number;
    processedPassengers: number;
    startedAtUtc: string | null;
    endedAtUtc: string | null;
    vehicleId: number | null;
    licensePlate: string | null;
    isStartedByDriver: boolean;
    isEndedByDriver: boolean;
    nextStation: string | null;
  }

  export function getActiveTripApi(token?: string | null): Promise<ApiResponse<ActiveTrip | null>>;
  export function getTodayTripsApi(token?: string | null): Promise<ApiResponse<TodayTrip[]>>;
  export function getTripSummaryApi(tripId: number, token?: string | null): Promise<ApiResponse<TripSummary>>;
  ```

- [ ] **Step 1: Update `src/services/api/types.ts`**
  Add TypeScript interfaces for `ActiveTrip`, `TodayTrip`, and `TripSummary`.

- [ ] **Step 2: Implement `src/services/api/trips.ts`**
  Implement API calls for `/api/driversMobile/Trip/active`, `/today`, and `/{tripId}/summary` using `apiClient`. Include fallback data matching the spec if the token returns 403 or server is unreachable.

- [ ] **Step 3: Test with `scripts/test-trips-api.ts`**
  Verify the methods return properly typed data structures and handle 403/errors gracefully.

- [ ] **Step 4: Commit**
  ```bash
  git add src/services/api/ scripts/test-trips-api.ts
  git commit -m "feat(trips): add trip API services, types and sample fallbacks"
  ```

---

### Task 2: Fix Text Truncation (`...`) & Dynamic Driver Name

**Files:**
- Modify: `src/components/ui/AppHeader.tsx`
- Modify: `src/components/ui/QuickAccessGrid.tsx`
- Modify: `src/components/ui/DriverIdCard.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `user` object

- [ ] **Step 1: Update `AppHeader.tsx`**
  - Read `user` from `useAuth()`.
  - Display actual full name: `user ? `${user.name || ''} ${user.family || ''}`.trim() : 'راننده گرامی'`.
  - Remove rigid constraints on `greetingText` and `profileSection`: add `flex: 1`, remove premature `numberOfLines={1}` truncation so names like "تست پشتیبانی" display completely without `...`.

- [ ] **Step 2: Update `QuickAccessGrid.tsx`**
  - In `itemLabel`: change from `numberOfLines={1}` with small fixed width to auto-wrapping `numberOfLines={2}` with `lineHeight: 14` and auto-fitting font size.
  - Ensures labels such as "برنامه امروز", "تقویم کاری", "کارت راننده" never show `...`.

- [ ] **Step 3: Update `DriverIdCard.tsx`**
  - Ensure driver name, license type, and vehicle model have proper flex layout and do not truncate abruptly.

- [ ] **Step 4: Verification & Typecheck**
  Run: `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/ui/AppHeader.tsx src/components/ui/QuickAccessGrid.tsx src/components/ui/DriverIdCard.tsx
  git commit -m "fix(ui): eliminate text truncation ellipses and bind dynamic driver name in header"
  ```

---

### Task 3: Active Trip Card & Today's Trip Item Components

**Files:**
- Create: `src/components/ui/ActiveTripCard.tsx`
- Create: `src/components/ui/TodayTripItem.tsx`

**Interfaces:**
- Produces:
  ```tsx
  export function ActiveTripCard({
    trip,
    onPress,
  }: {
    trip: ActiveTrip;
    onPress: (tripId: number) => void;
  }): React.JSX.Element;

  export function TodayTripItem({
    trip,
    onPress,
  }: {
    trip: TodayTrip;
    onPress: (tripId: number) => void;
  }): React.JSX.Element;
  ```

- [ ] **Step 1: Implement `src/components/ui/ActiveTripCard.tsx`**
  - Glowing luxury border with `#D4AF37` / `#10B981`.
  - Badges: "سفر فعال" with pulsating green status dot and direction badge ("ورود به شرکت" if `entering` else "خروج از شرکت").
  - Content: Trip Name (`trip.name`), Location Title (`trip.serviceLocationTitle`), Times (`trip.outboundStart` تا `trip.outboundEnd` in Persian digits).
  - Stations progress: "ایستگاه‌های طی شده: {visited} از {total}".
  - Touch action: triggers `onPress(trip.tripId)`.

- [ ] **Step 2: Implement `src/components/ui/TodayTripItem.tsx`**
  - Luxury item card for today's schedule list.
  - Full title and location without `...` truncation.
  - Status pill: "انجام شده", "در حال اجرا", or "برنامه‌ریزی شده".
  - Time badge with clock icon in Persian digits.
  - Touch feedback: opens details modal on press.

- [ ] **Step 3: Typecheck**
  Run: `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/ui/ActiveTripCard.tsx src/components/ui/TodayTripItem.tsx
  git commit -m "feat(trips): implement ActiveTripCard and TodayTripItem components"
  ```

---

### Task 4: Minimal Luxury Trip Summary Modal

**Files:**
- Create: `src/components/ui/TripSummaryModal.tsx`

**Interfaces:**
- Produces:
  ```tsx
  export function TripSummaryModal({
    visible,
    tripId,
    onClose,
  }: {
    visible: boolean;
    tripId: number | null;
    onClose: () => void;
  }): React.JSX.Element;
  ```

- [ ] **Step 1: Implement `src/components/ui/TripSummaryModal.tsx`**
  - Modal with backdrop blur / semi-transparent overlay.
  - Header: Trip title + close icon button.
  - Async data fetcher: calls `getTripSummaryApi(tripId, token)` on open, shows elegant gold spinner while loading.
  - Visual summary grid:
    - Route details & Location
    - Start & End timing (outbound start/end) in Persian digits
    - Outbound price formatted with thousand separators (e.g. `۲۴۵,۵۵۵ تومان` / `۲,۴۵۵,۵۵۵ ریال`)
    - Stations progress: Visited, Remaining, Total
    - Passenger stats: Expected vs Processed
    - Vehicle & License plate (if assigned)
  - Bottom action: "بستن جزئیات" button.

- [ ] **Step 2: Typecheck**
  Run: `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/ui/TripSummaryModal.tsx
  git commit -m "feat(trips): create minimal luxury TripSummaryModal component"
  ```

---

### Task 5: Home Screen (`src/app/index.tsx`) Full Integration

**Files:**
- Modify: `src/app/index.tsx`

**Interfaces:**
- Consumes: `getActiveTripApi`, `getTodayTripsApi`, `ActiveTripCard`, `TodayTripItem`, `TripSummaryModal`, `useAuth`

- [ ] **Step 1: Integrate data state in `HomeScreen`**
  - State: `activeTrip: ActiveTrip | null`, `todayTrips: TodayTrip[]`, `loadingTrips: boolean`, `refreshing: boolean`.
  - State: `selectedTripId: number | null`, `modalVisible: boolean`.
  - Effect: fetch active trip and today's trips on mount and on `onRefresh`.

- [ ] **Step 2: Render Active Trip section**
  - If `activeTrip` exists, render `<ActiveTripCard trip={activeTrip} onPress={handleOpenTripModal} />`.
  - If no active trip, show a subtle "سفر فعالی برای شما ثبت نشده است" or transition cleanly.

- [ ] **Step 3: Render Today's Trips section**
  - Render list of today's trips with `<TodayTripItem key={trip.tripId} trip={trip} onPress={handleOpenTripModal} />`.
  - Add `RefreshControl` to `ScrollView` for smooth pull-to-refresh.

- [ ] **Step 4: Mount TripSummaryModal**
  - Connect `selectedTripId`, `modalVisible`, and `onClose`.

- [ ] **Step 5: Verification & Linters**
  Run: `npx tsc --noEmit`
  Run: `npm run lint`
  Expected: 0 errors, 0 warnings.

- [ ] **Step 6: Commit**
  ```bash
  git add src/app/index.tsx
  git commit -m "feat(home): integrate active trip, today's trips list, modal details and pull-to-refresh"
  ```

---

### Task 6: Final Verification & Documentation

**Files:**
- Modify: `docs/AUTH_SERVICE.md` (or add Trip endpoints section)

- [ ] **Step 1: Update documentation with Trip APIs specification**
- [ ] **Step 2: Run full verification suite (`npx tsc --noEmit` & `npm run lint`)**
- [ ] **Step 3: Commit**
  ```bash
  git add docs/
  git commit -m "docs(trips): document active trip, today's schedule and trip summary endpoints"
  ```
