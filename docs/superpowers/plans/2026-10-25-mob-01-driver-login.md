# MOB-01: Driver Login & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a secure, stateless Driver Login flow (`MOB-01`) for the Gitiseir Driver app with SMS OTP autofill, dual-theme luxury styling, anti-brute force protection, secure token storage, and redirection to the driver's profile screen upon login.

**Architecture:** A client-side stateless authentication system powered by `AuthContext`, persisting JWT tokens and user records via `expo-secure-store` (iOS Keychain / Android Keystore with Web fallback). The flow consists of a 2-step OTP verification with automatic SMS code fill (`textContentType="oneTimeCode"`), 120-second cooldown timer, attempt-based lockout, and an API client interacting with `https://backend.vaezprojects.ir/`.

**Tech Stack:** Expo SDK 58, React Native 0.88, React 19.3.0, Expo Router, `expo-secure-store`, `expo-haptics`, Lucide React Native, Vazirmatn Persian typography.

**Spec:** User request `MOB-01` and Gitiseir Driver App Design Spec (`docs/superpowers/specs/2026-10-21-gitiseir-driver-app-design.md`).

---

## Global Constraints

- **Theme Consistency:** Strict support for both Dark Luxury (`#0B0F19`, gold `#D4AF37`) and Light Milky Gold (`#FAF7F2`, milky white `#FFFFFF`, border `#E7DFD5`).
- **Typography & RTL:** Persian RTL layout throughout, Vazirmatn font family, all numerical digits converted using `toPersianDigits`.
- **Stateless Persistence:** Tokens and user metadata persisted in secure hardware storage (`expo-secure-store`) with graceful web fallback.
- **Touch & Accessibility:** Touch targets minimum 44×44px, high-contrast states, clear visual loading & error banners.
- **Zero Breaking Changes:** Preserve existing tabs (`/`, `/calendar`, `/profile`), bottom bar alignment, and theme toggler.

---

## Review Focus

1. **SMS OTP Auto-Detection:** Verification input must handle both OS auto-fill suggestion (via `textContentType="oneTimeCode"` / `autoComplete="sms-otp"`) and manual 4-to-6 digit keyboard entry.
2. **Anti-Brute Force Protection:** Cooldown timer must persist across component re-renders and brief app restarts; submit action must be debounced to prevent duplicate concurrent network requests.
3. **Backend Error Handling:** Backend returns HTTP 200 with `{ statusCode: 401, success: false, message: "..." }`; client must inspect `success` flag and display server's Persian message.
4. **Token Expiration & Storage Validation:** App startup must check token validity/expiration and silently restore the session or clean up stale tokens.
5. **Post-Login Routing:** Following successful login, the app must transition directly to the Profile screen (`/profile`) as specified.

---

## File Structure

```
src/
├── app/
│   ├── _layout.tsx                  (Modify: Add AuthProvider and route guarding)
│   ├── login.tsx                    (Create: 2-step Driver Login Screen)
│   └── profile.tsx                  (Modify: Bind authenticated user & add Logout)
├── context/
│   └── AuthContext.tsx              (Create: Global authentication state & methods)
├── services/
│   ├── api/
│   │   ├── client.ts                (Create: Base HTTP fetch helper with error handling)
│   │   ├── types.ts                 (Create: Auth request/response TypeScript interfaces)
│   │   └── auth.ts                  (Create: sendOtp and login API endpoints)
│   └── storage/
│       └── secure-storage.ts        (Create: Cross-platform secure token/user storage)
├── hooks/
│   └── useOtpTimer.ts               (Create: Cooldown countdown & anti-spam lockout hook)
└── utils/
    └── security.ts                  (Create: Iranian phone regex, attempt counter & debouncer)
docs/
└── AUTH_SERVICE.md                  (Create: Comprehensive Auth documentation)
```

---

### Task 1: Secure Storage Adapter & Dependencies

**Files:**
- Modify: `package.json`
- Create: `src/services/storage/secure-storage.ts`
- Test: `src/services/storage/__tests__/secure-storage.test.ts` (or node verification script)

**Interfaces:**
- Produces:
  ```ts
  export interface StorageAdapter {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }
  export const secureStorage: StorageAdapter;
  export const STORAGE_KEYS: { TOKEN: string; USER: string; EXPIRE: string };
  ```

- [ ] **Step 1: Install `expo-secure-store`**
  Run: `npx expo install expo-secure-store`
  Verify: Package is added to `dependencies` in `package.json`.

- [ ] **Step 2: Implement `src/services/storage/secure-storage.ts`**
  Implement cross-platform secure storage utilizing `* as SecureStore from 'expo-secure-store'`. If running on Web (`Platform.OS === 'web'`), fall back to `window.localStorage` or in-memory dictionary. Define `STORAGE_KEYS = { TOKEN: 'gitiseir_auth_token', USER: 'gitiseir_auth_user', EXPIRE: 'gitiseir_token_expire' }`.

- [ ] **Step 3: Verification script**
  Run a quick node/tsx script to verify `secureStorage` functions write, read, and delete without exception.

- [ ] **Step 4: Commit**
  ```bash
  git add package.json package-lock.json src/services/storage/
  git commit -m "feat(auth): add secure storage adapter with cross-platform fallback"
  ```

---

### Task 2: Auth API Client & Type Definitions

**Files:**
- Create: `src/services/api/types.ts`
- Create: `src/services/api/client.ts`
- Create: `src/services/api/auth.ts`
- Test: `scripts/test-auth-api.js`

**Interfaces:**
- Produces:
  ```ts
  export interface ApiResponse<T> {
    statusCode: number;
    success: boolean;
    message: string | null;
    result: T;
  }
  export interface UserRole {
    userId: number;
    roleId: number;
    role: { id: number; name: string };
  }
  export interface AuthUser {
    id: number;
    name: string;
    family: string;
    phoneNumber: string;
    nationalCode: string;
    isActive: boolean;
    userRoles: UserRole[];
  }
  export interface LoginResult {
    token: string;
    user: AuthUser;
    isDriver: boolean;
    isAdmin: boolean;
    isLeadDriver: boolean;
    tokenExpireDate: string;
  }
  export function sendOtpApi(mobile: string): Promise<ApiResponse<number>>;
  export function loginApi(mobile: string, code: string): Promise<ApiResponse<LoginResult>>;
  ```

- [ ] **Step 1: Create `src/services/api/types.ts`**
  Define data contracts for backend API requests and responses according to Swagger specs.

- [ ] **Step 2: Create `src/services/api/client.ts`**
  Implement a lightweight `request<T>(path, options)` function with:
  - Base URL: `https://backend.vaezprojects.ir`
  - Timeout: 15 seconds
  - Header: `Content-Type: application/json`, `Accept: application/json`
  - Body serialization & response parsing checking `data.success` and Persian error fallback.

- [ ] **Step 3: Create `src/services/api/auth.ts`**
  Implement `sendOtpApi(mobile: string)` (`POST /api/Auth/send-otp`) and `loginApi(mobile: string, code: string)` (`POST /api/Auth/login`).

- [ ] **Step 4: Verify with automated test script**
  Run `scripts/test-auth-api.js` verifying successful call to `send-otp` and 401 handling on invalid `login` code.

- [ ] **Step 5: Commit**
  ```bash
  git add src/services/api/ scripts/test-auth-api.js
  git commit -m "feat(auth): implement auth api client and request handlers"
  ```

---

### Task 3: Anti-Brute Force, Throttling & Cooldown Timer

**Files:**
- Create: `src/utils/security.ts`
- Create: `src/hooks/useOtpTimer.ts`
- Test: `src/utils/__tests__/security.test.ts` (or node verification script)

**Interfaces:**
- Produces:
  ```ts
  export function isValidIranMobile(mobile: string): boolean;
  export function normalizeIranMobile(mobile: string): string;
  export interface OtpTimerState {
    secondsLeft: number;
    canResend: boolean;
    isLocked: boolean;
    lockRemainingSeconds: number;
    startTimer: (duration?: number) => void;
    recordFailedAttempt: () => boolean; // returns true if now locked
    resetLockout: () => void;
  }
  export function useOtpTimer(): OtpTimerState;
  ```

- [ ] **Step 1: Create `src/utils/security.ts`**
  - Implement mobile normalization (handles Persian/Arabic digits, strips spaces and leading `+98` or `0098` to format `09XXXXXXXXX`).
  - Regex check: `/^09[0-9]{9}$/`.
  - Anti-brute force attempt counter: track failed verification attempts within a rolling window (max 5 consecutive failures triggers 60s lockout).

- [ ] **Step 2: Create `src/hooks/useOtpTimer.ts`**
  - State management for 120s countdown between OTP resends.
  - Active countdown persisted with timestamp to prevent refresh evasion.
  - Exposes formatted countdown string in Persian digits (e.g. `۰۱:۵۹`).

- [ ] **Step 3: Verify security logic**
  Run unit script to verify validation regex, Persian digit conversion, and lock out threshold trigger.

- [ ] **Step 4: Commit**
  ```bash
  git add src/utils/security.ts src/hooks/useOtpTimer.ts
  git commit -m "feat(auth): add anti-brute force throttling and OTP cooldown timer"
  ```

---

### Task 4: Global Auth Context & State Management

**Files:**
- Create: `src/context/AuthContext.tsx`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    isDriver: boolean;
    isAdmin: boolean;
    tokenExpireDate: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    sendOtp: (mobile: string) => Promise<{ success: boolean; message: string }>;
    login: (mobile: string, code: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
  }
  export const useAuth: () => AuthContextType;
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
  ```

- [ ] **Step 1: Create `src/context/AuthContext.tsx`**
  - Hydrate token, user, and expiration on mount from `secureStorage`.
  - Validate token expiration (`new Date(expireDate) > new Date()`).
  - Implement `sendOtp(mobile)` calling `sendOtpApi`.
  - Implement `login(mobile, code)` calling `loginApi`. On success, persist `token`, `user`, `tokenExpireDate` in `secureStorage` and update state.
  - Implement `logout()` clearing storage and state.

- [ ] **Step 2: Wrap Root Navigator in `src/app/_layout.tsx` with `AuthProvider`**
  - Place `AuthProvider` inside `AppThemeProvider`.
  - Add auth guarding: check `isAuthenticated` and redirect unauthenticated requests to `/login`.

- [ ] **Step 3: Verify TypeScript & Build**
  Run: `npx tsc --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
  ```bash
  git add src/context/AuthContext.tsx src/app/_layout.tsx
  git commit -m "feat(auth): integrate AuthContext with secure persistence and route guarding"
  ```

---

### Task 5: Driver Login Screen UI with SMS Autofill

**Files:**
- Create: `src/app/login.tsx`
- Modify: `src/app/_layout.tsx` (configure `login` tab hiding)

**Interfaces:**
- Consumes: `useAuth()`, `useAppTheme()`, `useOtpTimer()`, `toPersianDigits()`
- Produces: Visual 2-step Login Screen (`/login`)

- [ ] **Step 1: Build Step 1 (Mobile Input Screen)**
  - Large luxury gold branding / Gitiseir logo icon.
  - Heading: "ورود رانندگان گیتی‌سیر" with subtitle "برای ورود، شماره تلفن همراه خود را وارد کنید".
  - Phone input field with Persian digits, phone icon, and auto-focus.
  - "دریافت کد تایید" action button with minimum 48px height, gradient/gold accent, disabled when invalid or loading.
  - Theme toggler button in top header.

- [ ] **Step 2: Build Step 2 (OTP Verification Screen)**
  - Heading: "کد تایید پیامک‌شده" with subtext showing the entered phone number in Persian.
  - "ویرایش شماره" link to easily return to Step 1.
  - OTP Input with `textContentType="oneTimeCode"`, `autoComplete="sms-otp"`, and `inputMode="numeric"`.
  - Visual 4-box or 5-box display highlighting active index with `#D4AF37` gold border.
  - Auto-submits as soon as the code is completely filled (from SMS auto-paste or typing).
  - Resend OTP row displaying countdown e.g. "ارسال مجدد کد پس از ۰۱:۴۵" in Persian digits, enabling button when timer finishes.
  - Anti-brute force lockout alert banner if multiple wrong attempts occur.
  - Success handler: Triggers `expo-haptics` notification and redirects to `/profile`.

- [ ] **Step 3: Hide Bottom Tab Bar on `/login`**
  - In `src/app/_layout.tsx`, add `<Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />`.
  - In `CustomBottomTabBar`, return `null` if active tab is `'login'`.

- [ ] **Step 4: Verify UI in Web & Typecheck**
  Run: `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/login.tsx src/app/_layout.tsx
  git commit -m "feat(auth): create driver login screen with SMS autofill and dual luxury themes"
  ```

---

### Task 6: Profile Screen Binding & Logout Action

**Files:**
- Modify: `src/app/profile.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `useAppTheme()`

- [ ] **Step 1: Bind real user details in Profile Screen**
  - Read `user`, `isDriver`, `tokenExpireDate` from `useAuth()`.
  - Display user's full name (`user.name` + `user.family`) or fallback to "راننده گرامی".
  - Display national code (`user.nationalCode`) and phone number (`user.phoneNumber`) in Persian digits.
  - Display driver status badge (active/driver).

- [ ] **Step 2: Add Logout Button & Confirmation**
  - Add a distinct "خروج از حساب کاربری" button in Profile settings.
  - On press, prompt confirmation or trigger `logout()`.
  - Clears `secureStorage` and automatically routes back to `/login`.

- [ ] **Step 3: Verification**
  Run: `npx tsc --noEmit`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/profile.tsx
  git commit -m "feat(auth): bind authenticated driver profile and add logout functionality"
  ```

---

### Task 7: Architecture Documentation & Final Verification

**Files:**
- Create: `docs/AUTH_SERVICE.md`

- [ ] **Step 1: Author `docs/AUTH_SERVICE.md`**
  - Detail architecture diagrams (Mermaid).
  - Describe endpoints (`/api/Auth/send-otp` & `/api/Auth/login`).
  - Explain state storage, key names, and security measures.
  - Detail anti-brute force algorithms (cooldown timer + attempt lockout + debouncing).
  - Document SMS OTP autofill mechanism across iOS, Android, and Web.

- [ ] **Step 2: Run Lint and Typecheck**
  Run: `npx expo lint`
  Run: `npx tsc --noEmit`
  Expected: All checks clean with 0 errors.

- [ ] **Step 3: Commit**
  ```bash
  git add docs/AUTH_SERVICE.md
  git commit -m "docs(auth): add comprehensive driver authentication service documentation"
  ```
