# مستند جامع فنی، نیازمندی‌های بک‌اند و برنامه پیاده‌سازی (Gitiseir Mobile Apps)

این مستند شامل **تحلیل خطاهای فعلی**، **وضعیت سرویس‌ها و اندپوینت‌ها**، **کسری‌های بک‌اند برای جلسه با رابط فنی**، **تطبیق تسک‌های `MOB-01` تا `MOB-06` و یوزر استوری‌های `US-01` تا `US-06`** و **برنامه کامل پیاده‌سازی (Implementation Plan)** برای دو اپلیکیشن **راننده (`gitiseir-app`)** و **سرشوفر (`gitiseir-sarshoofer` / `gitiseir-supervisor`)** است.

---

## ۱. وضعیت فعلی پروژه‌ها و ۳ اندپوینت سرشوفر

### ۱.۱. ساختار پوشه‌های پروژه
1. **اپلیکیشن راننده (`Driver App`):**
   - مسیر: `e:\projects\gitiseir-app\gitiseir-app`
   - ریپازیتوری: `https://github.com/Mahdiar-Vaez/gitiseir-app.git`
2. **اپلیکیشن سرشوفر (`Supervisor / Sarshoofer App`):**
   - مسیر نسخه اصلی طراحی‌شده با هویت بصری سرشوفر (تم فیروزه‌ای-طلایی فرماندهی): `e:\projects\gitiseir-app\gitiseir-sarshoofer`
   - مسیر ریپازیتوری متصل به گیت‌هاب: `e:\projects\gitiseir-supervisor` (`https://github.com/Mahdiar-Vaez/gitiseir-supervisor.git`)

### ۱.۲. وضعیت ۳ اندپوینت اصلی سرشوفر (`SupervisorsMobile`)
سه اندپوینت معرفی‌شده برای سرشوفر عبارت‌اند از:
1. **`GET /api/SupervisorsMobile/Trip/daily-board`**
   - پارامترهای Query: `companyServiceLocationId` (عدد `int32`) و `entering` (بولین `true/false`)
2. **`POST /api/SupervisorsMobile/Trip/confirm-attendance`**
   - بدنه درخواست (JSON Body):
     ```json
     {
       "calendarDayId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
       "note": "string"
     }
     ```
3. **`POST /api/SupervisorsMobile/Trip/assign-temporary-driver`**
   - بدنه درخواست (JSON Body):
     ```json
     {
       "calendarDayId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
       "name": "رضا",
       "family": "محمدی",
       "phoneNumber": "09123456789",
       "nationalCode": "0012345678",
       "cardNumber": "6037991122334455",
       "reason": "خرابی لاستیک خودروی راننده اصلی در مسیر",
       "price": 1500000
     }
     ```

**وضعیت در کد فعلی:**
- در پوشه `gitiseir-app/src/services/api/supervisor.ts` و `gitiseir-supervisor/src/services/api/supervisor.ts` توابع این ۳ اندپوینت ایجاد شده‌اند.
- اما در پوشه اصلی `gitiseir-sarshoofer/src/services/api/sarshoofer.ts` هنوز اندپوینت‌های قدیمی فاز اول (`/api/driversMobile/Trip/{id}/start` و `/api/administration/temporary-driver/{id}`) فراخوانی می‌شوند و صفحه `calendar.tsx` (تقویم کاری) نیز هنوز به تب‌های `gitiseir-sarshoofer` اضافه نشده است.

---

## ۲. تحلیل دقیق خطاهای لاگ کنسول و نحوه رفع آن‌ها

### خطای ۱: کرش `Uncaught (in promise) Error: The method or property Haptic.impactAsync is not available on android`
- **محل وقوع:** `src/components/ui/DriverRatingBanner.tsx:29:26` و سایر فایل‌هایی که مستقیماً `Haptics.impactAsync` یا `Haptics.notificationAsync` را صدا می‌زنند (`QuickAccessGrid.tsx`، `QuickActions.tsx`، `PrimaryButton.tsx`، `ManagementContactModal.tsx`، `index.tsx`، `login.tsx`).
- **علت فنی:** متدهای پکیج `expo-haptics` خروجی از نوع **Promise** برمی‌گردانند. زمانی که روی شبیه‌ساز اندروید، نسخه وب یا محیطی که ماژول نیتیو Haptic ندارد اجرا شوند، این Promise ریجکت (Reject) می‌شود. نوشتنِ `try { Haptics.impactAsync(...); } catch {}` بدون `await` یا `.catch(() => {})` نمی‌تواند خطای غیرهمزمان Promise را بگیرد و باعث پرتاب `Uncaught (in promise) Error` می‌شود.
- **نحوه رفع:** ایجاد فایل کمکی ایمن `src/utils/haptics.ts` (با `async/await` و `try/catch` کامل و بررسی `Platform.OS === 'web'`) و جایگزینی تمام فراخوانی‌های مستقیم `Haptics.*` با توابع `triggerImpactHaptic`، `triggerNotificationHaptic` و `triggerSelectionHaptic`.

### خطای ۲: هشدار زرد `WARN [GPS] Error fetching device position, using fallback: Location request failed due to unsatisfied device settings`
- **محل وقوع:** `src/services/location/gps.ts` (خطوط ۲۲ و ۳۵) و چند فایل دیگر (`AuthContext.tsx`، `secure-storage.ts`، `SosEmergencyModal.tsx`).
- **علت فنی:** استفاده از `console.warn` و `console.error` در React Native باعث فعال شدن LogBox و نمایش بنر زرد/قرمز روی صفحه موبایل می‌شود. همچنین زمانی که GPS گوشی خاموش است، `Location.getCurrentPositionAsync` خطا می‌دهد.
- **نحوه رفع:**
  1. ابتدا تلاش برای دریافت آخرین موقعیت ذخیره‌شده با `Location.getLastKnownPositionAsync()` در صورت خطای GPS زنده، و سپس بازگشت مختصات پیش‌فرض.
  2. تبدیل تمام `console.warn` و `console.error` در کل پوشه `src/` هر دو اپلیکیشن به `console.log` استاندارد انگلیسی.

### خطای ۳: خطای ۴۰۴ روی `GET /api/driversMobile/Trip/31478/summary` با پاسخ `{"statusCode": 404, "success": false, "result": {"message": "سفر یافت نشد."}}`
- **محل وقوع:** `src/components/ui/TripSummaryModal.tsx` و `src/services/api/trips.ts` و `src/services/api/client.ts`.
- **علت فنی:**
  1. شناسه `31478` مربوط به دیتای نمونه آفلاین (`SAMPLE_ACTIVE_TRIP`) است که در دیتابیس واقعی بک‌اند وجود ندارد؛ بنابراین با باز شدن مدال جزئیات، درخواست به سرور ارسال شده و ۴۰۴ برمی‌گردد.
  2. در فایل `client.ts`، پیام خطا فقط از `data?.message` خوانده می‌شد، در حالی که بک‌اند در این اندپوینت پیام خطا را درون `data?.result?.message` (`"سفر یافت نشد."`) قرار داده است.
- **نحوه رفع:**
  1. اصلاح `client.ts` برای استخراج دقیق پیام خطا از `data?.message || data?.result?.message || data?.errorMessage`.
  2. جلوگیری از ارسال درخواست شبکه برای شناسه‌های نمونه آفلاین (`31478`, `31479`, `31480`) یا زمانی که اطلاعات کامل سفر از تقویم کاری (`day-trips-grid`) در دسترس است.

---

## ۳. کسری‌های بک‌اند و سوالات فنی (جهت ارائه به رابط بک‌اند)

این بخش فهرست دقیق اطلاعات، فیلدها و اندپوینت‌هایی است که در حال حاضر در Swagger (`https://backend.vaezprojects.ir`) وجود ندارند یا نیازمند شفاف‌سازی و تکمیل توسط تیم بک‌اند هستند:

### مورد ۱: منبع دریافت `companyServiceLocationId` برای سرشوفر (ضروری برای `daily-board`)
- **مشکل:** اندپوینت `GET /api/SupervisorsMobile/Trip/daily-board` دو پارامتر اجباری `companyServiceLocationId` (مثلاً `18`) و `entering` (`true/false`) دریافت می‌کند. اما وقتی سرشوفر لاگین می‌کند (`POST /api/Auth/login`):
  - در آبجکت `user` یا `result` لاگین، فیلدی برای `companyServiceLocationId` یا لیست محل‌های خدمت تحت نظارت آن سرشوفر وجود ندارد.
  - اندپوینت موبایلی مانند `GET /api/SupervisorsMobile/Trip/my-service-locations` نیز در Swagger تعریف نشده است (صرفاً اندپوینت پنل ادمین `POST /api/administration/CompanyServiceLocations/search` وجود دارد).
- **درخواست از بک‌اند:**
  - یا لیست محل‌های خدمت مجاز سرشوفر (`serviceLocations: [{ id, title }]`) در خروجی لاگین یا یک اندپوینت `GET /api/SupervisorsMobile/service-locations` برگردانده شود، و یا اگر `companyServiceLocationId` ارسال نشد، بک‌اند به صورت خودکار محل خدمت پیش‌فرض سرشوفر لاگین‌شده را در نظر بگیرد.

### مورد ۲: ارسال لوکیشن لحظه‌ای (`latitude`, `longitude`) و ثبت «عدم حضور (غیبت)» در `confirm-attendance`
- **مشکل:** طبق نیازمندی **MOB-06** و **US-04 (معیارهای پذیرش ۲ و ۳)**:
  1. سرشوفر باید بتواند هم **«تایید رسیدن (حضور)»** و هم **«رد / عدم حضور (غیبت)»** راننده را ثبت کند.
  2. در لحظه تایید رسیدن، **لوکیشن لحظه‌ای (GPS)** سرشوفر باید همراه با تاییدیه به بک‌اند ارسال و ثبت شود.
  - اما اسکیمای فعلی `POST /api/SupervisorsMobile/Trip/confirm-attendance` صرفاً به شکل زیر است:
    ```json
    {
      "calendarDayId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "note": "string"
    }
    ```
    و فیلدهای `latitude`، `longitude` و وضعیت حضور (`isPresent` / `status`) را ندارد.
- **درخواست از بک‌اند:**
  - آیا فیلدهای `latitude: number`، `longitude: number` و `isPresent: boolean` به Body اندپوینت `confirm-attendance` اضافه می‌شوند یا اندپوینت جداگانه‌ای برای ثبت غیبت در نظر گرفته شده است؟

### مورد ۳: نحوه پیاده‌سازی «تایید سفر جامانده (فراموشی Start/End راننده) و کسر از سهمیه ماهانه» (`US-05`)
- **مشکل:** طبق **US-05**:
  - *«اگر راننده‌ای شروع یا پایان سفر را فراموش کرده باشد، سرشوفر سفر او را با تایید خود نهایی می‌کند و سیستم به‌صورت خودکار ۱ واحد از سهمیه فراموشی ماهانه راننده کم کرده و لاگ جریمه ثبت می‌کند.»*
  - در Swagger فعلی اندپوینت مجزایی برای «نهایی‌سازی سفر جامانده توسط سرشوفر» یا دریافت «تعداد سهمیه فراموشی باقیمانده راننده» وجود ندارد.
- **درخواست از بک‌اند:**
  1. آیا همان اندپوینت `POST /api/SupervisorsMobile/Trip/confirm-attendance` این کار را انجام می‌دهد یا اندپوینت/فلگ اختصاصی (مثلاً `POST /api/SupervisorsMobile/Trip/finalize-missed-trip` یا فیلد `isMissedTrip: true`) نیاز است؟
  2. مقدار «سهمیه فراموشی ماهانه راننده» (`monthlyForgetQuota` / `usedQuota`) در کدام اندپوینت به اپ راننده و سرشوفر برگردانده می‌شود؟

### مورد ۴: فیلد شماره شبا (`cardAccountNumber`) در اندپوینت `assign-temporary-driver`
- **مشکل:** در خروجی تقویم کاری (`GET /api/my-work-calendar/day-trips-grid`) درون آبجکت `temporaryDriver`، علاوه بر `cardNumber` (شماره کارت ۱۶ رقمی)، فیلد `cardAccountNumber` (شماره شبا ۲۴ رقمی) و مراحل تایید ۳ گانه (`acceptOrRejectStep1/2/3`, `payCode`, `readyForPay`) وجود دارد. اما در ورودی `POST /api/SupervisorsMobile/Trip/assign-temporary-driver` فقط فیلد `cardNumber` قرار داده شده است.
- **درخواست از بک‌اند:**
  - آیا فیلد `cardAccountNumber` (شماره شبا) هم در Body اندپوینت `assign-temporary-driver` پذیرفته می‌شود؟

### مورد ۵: اندپوینت «وضعیت ستاره‌ها، امتیازات و نظرسنجی راننده» (Driver Ratings & Survey Summary)
- **مشکل:** در اپ راننده، بخش ویژه‌ای برای نمایش **میانگین ستاره‌ها (مثلاً ۴.۸۵ از ۵)**، **تعداد کل نظرات**، **مثبت‌ترین ویژگی راننده**، **منفی‌ترین ویژگی راننده** و **تعداد سفرهای امروز و این هفته** طراحی شده است، اما هنوز اندپوینتی در بخش `driversMobile` (مانند `GET /api/driversMobile/Rating/summary`) در بک‌اند وجود ندارد.
- **درخواست از بک‌اند:**
  - ارائه اندپوینت خلاصه امتیازات و عملکرد راننده شامل:
    - `averageRating` (امتیاز از ۵)
    - `totalReviewsCount` (تعداد نظرات)
    - `topPositiveTrait` (مثبت‌ترین ویژگی)
    - `topNegativeTrait` (منفی‌ترین ویژگی)
    - `todayTripsCount` و `weeklyTripsCount` (تعداد سفرهای امروز و هفته جاری)
    - `recentFeedbacks` (لیست آخرین نظرات مسافران)

### مورد ۶: خطای `403 Forbidden` یا `404` روی اندپوینت‌های `driversMobile/Trip/active` و `today` برای برخی کاربران تستی
- **مشکل:** هنگام لاگین با برخی شماره‌های تستی (که دارای نقش `SuperAdmin` و `Driver` هستند)، فراخوانی `GET /api/driversMobile/Trip/active` یا `GET /api/SupervisorsMobile/Trip/daily-board` خطای عدم دسترسی یا `خطایی پیش آمده` برمی‌گرداند.
- **درخواست از بک‌اند:**
  - بررسی اتصال `DriverId` و نقش `Supervisor` / `LeadDriver` در Claims توکن JWT برای شماره‌های تستی راننده و سرشوفر.

---

## ۴. بررسی وضعیت تسک‌ها (`MOB-01` تا `MOB-06`) و یوزر استوری‌ها (`US-01` تا `US-06`)

| کد تسک / استوری | شرح نیازمندی | اندپوینت مرتبط | وضعیت پیاده‌سازی و نیازمندی تکمیلی |
| :--- | :--- | :--- | :--- |
| **MOB-01** | صفحه Login راننده و سرشوفر با OTP | `POST /api/Auth/send-otp`<br>`POST /api/Auth/login` | ✅ پیاده‌سازی کامل. نیازمند اتصال به سیستم سراسری Toast برای نمایش خطاهای سرور. |
| **MOB-02 & US-01** | لیست سفرهای راننده + **فعال بودن دکمه Start صرفاً برای نزدیک‌ترین سفر** و قفل بودن سایر سفرها | `GET /api/driversMobile/Trip/today`<br>`GET /api/driversMobile/Trip/active` | 🔧 باید در لیست سفرهای امروز (`TodayTripItem.tsx`) تضمین شود که فقط **اولین/نزدیک‌ترین سفر در نوبت** دکمه فعال «شروع سفر» داشته باشد و بقیه سفرها حالت قفل («در نوبت بعدی») داشته باشند. |
| **MOB-03 & US-02** | ویجت/صفحه تقویم کاری راننده و سرشوفر | `GET /api/my-work-calendar`<br>`GET /api/my-work-calendar/day-trips-grid` | 🔧 در اپ راننده پیاده‌سازی شده است. باید عیناً به اپ سرشوفر (`gitiseir-sarshoofer`) اضافه شود و در بالای جدول هر روز، بخش **«اختصاص سفر به روز [تاریخ انتخاب‌شده]»** با دو اندپوینت `confirm-attendance` و `assign-temporary-driver` قرار گیرد. |
| **MOB-04 & US-01** | UI شروع و پایان سفر همراه با دریافت لوکیشن و تایمینگ دستگاه | `POST /api/driversMobile/Trip/{calendarDayId}/start`<br>`POST /api/driversMobile/Trip/{calendarDayId}/end` | ✅ پیاده‌سازی شده. باید نتیجه موفقیت یا علت خطای بک‌اند از طریق Toast نمایش داده شود. |
| **MOB-05 & US-03** | دکمه SOS / تماس اضطراری با پشتیبانی در اپ راننده | باز کردن شماره‌گیر تلفن (`tel:`) | ✅ به صورت کامل در هدر، دسترسی سریع و مدال اضطراری پیاده‌سازی شده است. |
| **MOB-06 & US-04** | اپ سرشوفر: لیست راننده‌های امروز + تایید رسیدن/نرسیدن همراه با لوکیشن | `GET /api/SupervisorsMobile/Trip/daily-board`<br>`POST /api/SupervisorsMobile/Trip/confirm-attendance` | 🔧 اتصال مستقیم صفحه اول سرشوفر و تقویم کاری به این دو اندپوینت + نمایش Toast با علت دقیق خطا. |
| **US-05** | تایید سفر جامانده (فراموشی Start/End راننده) و کسر از سهمیه | `POST /api/SupervisorsMobile/Trip/confirm-attendance` | 🔧 افزودن حالت «تایید سفر جامانده (فراموشی راننده)» در مدال تایید حضور سرشوفر + هماهنگی با بک‌اند طبق مورد ۳ بخش کسری‌ها. |
| **US-06** | ثبت و مدیریت وضعیت «لنگی» راننده توسط سرشوفر | `POST /api/SupervisorsMobile/Trip/assign-temporary-driver` | 🔧 اتصال کامل فرم ثبت لنگی در صفحه رانندگان امروز، صفحه لنگی و صفحه تقویم کاری به این اندپوینت با خواندن `calendarDayId` (`tripWorkCalendarId`) و `price` از تقویم کاری. |

---

## ۵. برنامه پیاده‌سازی گام‌به‌گام (Implementation Plan)

### گام ۱: یکپارچه‌سازی و تمیزکاری سرویس‌های API در هر دو اپلیکیشن (`src/services/api/`)
در هر دو پروژه (`gitiseir-app` و `gitiseir-sarshoofer` / `gitiseir-supervisor`)، فایل‌های سرویس به صورت کاملاً ماژولار و یکسان در پوشه `src/services/api/` قرار می‌گیرند:
1. **`src/services/api/endpoints.ts`**: نگهداری آدرس تمام اندپوینت‌های بک‌اند در یک ثابت مرکزی (`API_ENDPOINTS`).
2. **`src/services/api/client.ts`**:
   - چاپ لاگ کامل انگلیسی (`[API REQUEST]`, `[API RESPONSE]`, `[API ERROR]`) با `console.log`.
   - استخراج هوشمند پیام خطا از `data?.message || data?.result?.message || data?.title` و قرار دادن آن در `ApiError`.
3. **`src/services/api/types.ts`**: تعریف دقیق تمام اینترفیس‌های مشترک بین راننده و سرشوفر.
4. **`src/services/api/auth.ts`**: سرویس‌های `sendOtpApi` و `loginApi`.
5. **`src/services/api/trips.ts`**: سرویس‌های سفر راننده (`getActiveTripApi`, `getTodayTripsApi`, `getTripSummaryApi`, `startTripApi`, `endTripApi`).
6. **`src/services/api/calendar.ts`**: سرویس‌های تقویم کاری (`getWorkCalendarApi`, `getDayTripsGridApi`).
7. **`src/services/api/supervisor.ts`**: سرویس‌های اختصاصی سرشوفر (`getServiceLocationsApi`, `getSupervisorDailyBoardApi`, `confirmAttendanceApi`, `assignTemporaryDriverApi`).
8. **`src/services/api/index.ts`**: خروجی یکپارچه (Barrel Export) تمام سرویس‌ها.

---

### گام ۲: پیاده‌سازی سیستم سراسری Toast برای نمایش پیام‌ها و علت دقیق خطا (`src/context/ToastContext.tsx`)
1. ساخت `ToastProvider` و هوک `useToast()` در هر دو اپلیکیشن.
2. پشتیبانی از ۳ نوع پیام:
   - `success` (سبز): تایید انجام عملیات.
   - `error` (قرمز): نمایش عنوان عملیات + کد وضعیت HTTP + **علت دقیق خطای برگشتی از سرور (`error.message`)**.
   - `info` / `warning` (طلایی/نارنجی): هشدارهای سیستمی مثل عدم دسترسی به GPS.
3. جایگزینی تمام `Alert.alert`ها و خطاهای خاموش با `showToast({ type: 'error', title: '...', message: err.message })` در:
   - شروع و پایان سفر (`startTripApi` / `endTripApi`)
   - تایید حضور سرشوفر (`confirmAttendanceApi`)
   - ثبت راننده موقت / لنگی (`assignTemporaryDriverApi`)
   - دریافت اطلاعات تقویم کاری، بورد روزانه و خلاصه سفر
   - ارسال و تایید کد OTP در صفحه ورود

---

### گام ۳: تکمیل صفحه تقویم کاری (`src/app/calendar.tsx`) با قابلیت «اختصاص سفر به روز انتخاب‌شده»
1. افزودن صفحه `src/app/calendar.tsx` به اپلیکیشن سرشوفر (`gitiseir-sarshoofer`) و اضافه کردن تب **«تقویم کاری»** به `CustomBottomTabBar.tsx`.
2. در صفحه `calendar.tsx` (زمانی که سرشوفر روی هر روز از تقویم شمسی مثلاً **۱۴ آبان ۱۴۰۵** کلیک می‌کند):
   - در بالای جدول سفرهای آن روز، یک کارت عملیاتی با عنوان **«اختصاص و مدیریت سفرهای روز ۱۴ آبان ۱۴۰۵»** نمایش داده می‌شود.
   - این بخش شامل دو دکمه مستقیم است:
     1. **«تایید حضور برای روز ۱۴ آبان»** $\leftarrow$ باز شدن مدال `ConfirmAttendanceModal` (با قابلیت انتخاب سفر از لیست سفرهای همان روز و ارسال به `POST /api/SupervisorsMobile/Trip/confirm-attendance` با `{ calendarDayId, note }`).
     2. **«تعیین راننده موقت (لنگی) برای روز ۱۴ آبان»** $\leftarrow$ باز شدن مدال `AssignTempDriverModal` (با قابلیت انتخاب سفر از لیست سفرهای همان روز، پر شدن خودکار `calendarDayId` از `tripWorkCalendarId` و `price` از `outbound.price`، و ارسال به `POST /api/SupervisorsMobile/Trip/assign-temporary-driver`).
   - در داخل جدول دیتاگرید (`DayTripsTable.tsx`) نیز برای هر ردیف سفر، دکمه‌های **«حضور»**، **«لنگی»** و **«جزئیات»** فعال هستند.

---

### گام ۴: رفع قطعی خطاهای Haptics، GPS و قفل سفرهای غیرنزدیک (`US-01`)
1. افزودن `src/utils/haptics.ts` به اپ راننده و حذف تمام فراخوانی‌های مستقیم `Haptics.impactAsync` و `Haptics.notificationAsync`.
2. اصلاح `src/services/location/gps.ts` و حذف تمام `console.warn` و `console.error` در هر دو پروژه.
3. اعمال منطق `US-01` روی لیست سفرهای امروز راننده (`TodayTripItem.tsx` و `index.tsx`) به طوری که صرفاً **نزدیک‌ترین سفرِ در نوبت** دکمه فعال «شروع سفر» داشته باشد و سایر سفرهای برنامه‌ریزی‌شده به صورت قفل‌شده نمایش داده شوند.
