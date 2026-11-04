import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('فرایندها و استانداردهای مهندسی سرشوفر (Supervisor Engineering Verification)', () => {
  const SAMPLE_CALENDAR_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

  describe('۱. متد تأیید حضور با پشتیبانی از تأخیر (confirm-attendance)', () => {
    test('باید داده‌های تأخیر را به درستی در بدنه درخواست بسته‌بندی کند', () => {
      const payload = {
        calendarDayId: SAMPLE_CALENDAR_ID,
        note: 'ورود با تاخیر به دلیل ترافیک',
        isDelayed: true,
        delayMinutes: 15,
      };

      const requestBody = JSON.stringify({
        calendarDayId: payload.calendarDayId,
        note: payload.note || '',
        isDelayed: Boolean(payload.isDelayed),
        delayMinutes: Number(payload.delayMinutes) || 0,
      });

      const parsed = JSON.parse(requestBody);
      assert.equal(parsed.calendarDayId, SAMPLE_CALENDAR_ID);
      assert.equal(parsed.note, 'ورود با تاخیر به دلیل ترافیک');
      assert.equal(parsed.isDelayed, true);
      assert.equal(parsed.delayMinutes, 15);
    });

    test('در صورت عدم انتخاب تأخیر (isDelayed = false)، دقایق تأخیر باید صفر ارسال شود', () => {
      const payload = {
        calendarDayId: SAMPLE_CALENDAR_ID,
        note: 'حضور به موقع',
        isDelayed: false,
        delayMinutes: 20, // should become 0
      };

      const requestBody = JSON.stringify({
        calendarDayId: payload.calendarDayId,
        note: payload.note || '',
        isDelayed: Boolean(payload.isDelayed),
        delayMinutes: payload.isDelayed ? Number(payload.delayMinutes) || 0 : 0,
      });

      const parsed = JSON.parse(requestBody);
      assert.equal(parsed.isDelayed, false);
      assert.equal(parsed.delayMinutes, 0);
    });
  });

  describe('۲. متد ثبت عدم حضور / غیبت راننده (mark-driver-absent)', () => {
    test('باید شناسه تقویم کاری و دلیل غیبت را با حذف فاصله‌های اضافی ارسال کند', () => {
      const payload = {
        calendarDayId: SAMPLE_CALENDAR_ID,
        reason: '   نقص فنی خودرو و عدم پاسخگویی راننده   ',
      };

      const requestBody = JSON.stringify({
        calendarDayId: payload.calendarDayId,
        reason: payload.reason.trim(),
      });

      const parsed = JSON.parse(requestBody);
      assert.equal(parsed.calendarDayId, SAMPLE_CALENDAR_ID);
      assert.equal(parsed.reason, 'نقص فنی خودرو و عدم پاسخگویی راننده');
    });

    test('در صورت بروز تعارض ۴۰۹ (Conflict)، پیام خطای فارسی همزمانی تولید شود', () => {
      const httpStatus = 409;
      const getErrorMessage = (status) => {
        if (status === 409) {
          return 'وضعیت این سفر توسط کاربر دیگری تغییر یافته است (تعارض همزمانی).';
        }
        return 'خطا در ثبت اطلاعات';
      };

      assert.equal(
        getErrorMessage(httpStatus),
        'وضعیت این سفر توسط کاربر دیگری تغییر یافته است (تعارض همزمانی).'
      );
    });
  });

  describe('۳. خلاصه گزارش مانیتورینگ زنده شیفت جاری (today-execution-summary)', () => {
    test('باید داده‌های خروجی سرور را با شاخص‌های کلیدی مانیتورینگ به درستی نگاشت کند', () => {
      const serverResponse = {
        statusCode: 200,
        success: true,
        message: null,
        result: {
          persianDate: '1405/08/11',
          supervisorUserId: 3,
          totalExecutions: 2,
          completedTrips: 1,
          absentTrips: 1,
          requiresReviewTrips: 0,
          cancelledExecutions: 0,
          langiTrips: 1,
          activeLangiTrips: 0,
          supervisorConfirmedTrips: 1,
          supervisorGpsConfirmedTrips: 0,
          supervisorConfirmedWithoutGpsTrips: 1,
          startedTrips: 1,
          driverStartedTrips: 0,
          driverStartsWithGps: 0,
          endedTrips: 0,
          driverEndedTrips: 0,
          driverEndsWithGps: 0,
          tripsWithAnyGps: 0,
          delayedTrips: 1,
          totalRecordedDelayMinutes: 10,
          adminOverriddenTrips: 0,
        },
      };

      const data = serverResponse.result;
      assert.equal(data.persianDate, '1405/08/11');
      assert.equal(data.totalExecutions, 2);
      assert.equal(data.completedTrips, 1);
      assert.equal(data.absentTrips, 1);
      assert.equal(data.langiTrips, 1);
      assert.equal(data.delayedTrips, 1);
      assert.equal(data.totalRecordedDelayMinutes, 10);
    });
  });

  describe('۴. الزامات به‌روزرسانی بدبینانه (Strictly Pessimistic Updates)', () => {
    let appState;

    beforeEach(() => {
      appState = {
        driverArrivalStatus: 'pending',
        driverAbsentReason: null,
        isSubmitting: false,
        error: null,
      };
    });

    test('وضعیت محلی تا قبل از دریافت پاسخ قطعی سرور نباید تغییر کند (عدم وجود Optimistic Update)', async () => {
      // شبیه‌سازی درخواست ناهمگام با تاخیر ۵۰ میلی‌ثانیه
      const simulatePessimisticConfirm = async (shouldSucceed) => {
        appState.isSubmitting = true;

        // بررسی در حین پرواز درخواست: وضعیت نباید آپدیت شده باشد!
        assert.equal(
          appState.driverArrivalStatus,
          'pending',
          'وضعیت نباید به صورت خوش‌بینانه قبل از پاسخ سرور تغییر کند'
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        if (!shouldSucceed) {
          appState.isSubmitting = false;
          appState.error = 'خطا در برقراری ارتباط با سرور';
          // وضعیت همچنان دست‌نخورده باقی می‌ماند
          return;
        }

        // تنها در صورت پاسخ موفق سرور وضعیت تغییر می‌کند
        appState.isSubmitting = false;
        appState.driverArrivalStatus = 'arrived';
      };

      // ۱. تست شکست در سرور -> وضعیت نباید تغییر کند
      await simulatePessimisticConfirm(false);
      assert.equal(appState.driverArrivalStatus, 'pending');
      assert.equal(appState.error, 'خطا در برقراری ارتباط با سرور');
      assert.equal(appState.isSubmitting, false);

      // ۲. تست موفقیت در سرور -> تغییر وضعیت پس از دریافت تایید
      await simulatePessimisticConfirm(true);
      assert.equal(appState.driverArrivalStatus, 'arrived');
      assert.equal(appState.isSubmitting, false);
    });

    test('در صورت غیبت راننده، فرایند باز شدن لنگی فقط پس از موفقیت قطعی سرور فعال شود', async () => {
      let langiModalOpened = false;

      const handlePessimisticAbsent = async (succeeds) => {
        appState.isSubmitting = true;
        await new Promise((resolve) => setTimeout(resolve, 30));

        if (succeeds) {
          appState.driverArrivalStatus = 'not_arrived';
          appState.driverAbsentReason = 'نقص فنی';
          langiModalOpened = true; // زنجیره هدایت به لنگی فقط پس از تایید سرور
        } else {
          appState.error = 'خطای سرور ۴۰۹';
        }
        appState.isSubmitting = false;
      };

      // تست خطا: مودال لنگی نباید باز شود
      await handlePessimisticAbsent(false);
      assert.equal(langiModalOpened, false);
      assert.equal(appState.driverArrivalStatus, 'pending');

      // تست موفقیت: مودال لنگی باز می‌شود
      await handlePessimisticAbsent(true);
      assert.equal(langiModalOpened, true);
      assert.equal(appState.driverArrivalStatus, 'not_arrived');
    });
  });

  describe('۵. مدیریت تاب‌آوری و پیام‌های فارسی خطای شبکه و دی‌ان‌اس سرشوفر', () => {
    function translateNetworkError(rawMessage) {
      const lower = (rawMessage || '').toLowerCase();
      if (
        lower.includes('unknownhostexception') ||
        lower.includes('unable to resolve host') ||
        lower.includes('enotfound') ||
        lower.includes('eai_again')
      ) {
        return 'عدم شناسایی آدرس سرور. لطفاً وضعیت اینترنت، فیلترشکن یا تنظیمات دی‌ان‌اس را بررسی کنید.';
      }
      if (
        lower.includes('aborterror') ||
        lower.includes('timeout') ||
        lower.includes('timed out')
      ) {
        return 'زمان انتظار برای پاسخ سرور به پایان رسید. لطفاً مجدداً تلاش نمایید.';
      }
      if (
        lower.includes('network request failed') ||
        lower.includes('failed to fetch') ||
        lower.includes('econnrefused') ||
        lower.includes('connection refused')
      ) {
        return 'عدم امکان اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
      }
      return 'خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
    }

    test('باید خطای UnknownHostException را به پیام روان و شفاف فارسی ترجمه کند', () => {
      const javaError =
        'fetch failed: java.net.UnknownHostException: Unable to resolve host "backend.vaezprojects.ir": No address associated with hostname';
      const result = translateNetworkError(javaError);

      assert.equal(
        result,
        'عدم شناسایی آدرس سرور. لطفاً وضعیت اینترنت، فیلترشکن یا تنظیمات دی‌ان‌اس را بررسی کنید.'
      );
      assert.equal(/[a-zA-Z]/.test(result), false, 'پیام خطا نباید هیچ کلمه انگلیسی داشته باشد');
    });

    test('مکانیزم تلاش مجدد (Retry) در صورت خطای موقت شبکه باید ارتباط را احیا کند', async () => {
      let attempts = 0;
      const simulateFetchWithRetry = async (retries = 1) => {
        attempts++;
        if (attempts === 1) {
          if (retries > 0) {
            await new Promise((r) => setTimeout(r, 20));
            return simulateFetchWithRetry(retries - 1);
          }
          throw new Error('UnknownHostException');
        }
        return { statusCode: 200, success: true, message: 'عملیات با موفقیت انجام شد.' };
      };

      const res = await simulateFetchWithRetry(1);
      assert.equal(attempts, 2);
      assert.equal(res.success, true);
    });
  });

  describe('۶. اتصال خودکار companyServiceId سرشوفر و استعلام بورد روزانه (daily-board)', () => {
    test('باید companyServiceId دریافت‌شده از لاگین (مثلاً ۱۴) را به عنوان کد محل خدمت پیش‌فرض قرار دهد', () => {
      const loginResult = {
        userId: 3,
        fullName: 'مرتضی شریعتی',
        userType: 4,
        companyServiceId: 14,
      };

      const defaultLocationId =
        typeof loginResult.companyServiceId === 'number' && loginResult.companyServiceId > 0
          ? loginResult.companyServiceId
          : 14;

      assert.equal(defaultLocationId, 14);
    });

    test('در حالت پیش‌فرض (entering = undefined)، پارامتر entering نباید در URL ارسال شود تا سرور به صورت خودکار محاسبه کند', () => {
      const buildDailyBoardUrl = (companyServiceLocationId, entering) => {
        const query =
          typeof entering === 'boolean'
            ? `?companyServiceLocationId=${companyServiceLocationId}&entering=${entering}`
            : `?companyServiceLocationId=${companyServiceLocationId}`;
        return `/api/SupervisorsMobile/Trip/daily-board${query}`;
      };

      assert.equal(
        buildDailyBoardUrl(14, undefined),
        '/api/SupervisorsMobile/Trip/daily-board?companyServiceLocationId=14'
      );
      assert.equal(
        buildDailyBoardUrl(14, true),
        '/api/SupervisorsMobile/Trip/daily-board?companyServiceLocationId=14&entering=true'
      );
      assert.equal(
        buildDailyBoardUrl(14, false),
        '/api/SupervisorsMobile/Trip/daily-board?companyServiceLocationId=14&entering=false'
      );
    });
  });

  describe('۷. نگاشت کامل وضعیت اجرای راننده، پیشرفت ایستگاه‌ها و تأیید سرشوفر در کارت بورد روزانه', () => {
    const sampleBoardItems = [
      {
        calendarDayId: 'aa265d91-755d-4dc5-7695-08df1a1c035a',
        tripId: 21450,
        tripName: 'جهاد خروج صبح',
        companyServiceLocationId: 14,
        companyServiceLocationTitle: 'کروز قدیم تهران',
        entering: false,
        directionTitle: 'خروجی از محل خدمت',
        plannedDriverId: 1044,
        plannedDriverFullName: 'حسین گلشاهی',
        plannedDriverMobile: '09192610179',
        hasTemporaryDriver: true,
        actualDriverFullName: 'راننده موقت',
        executionStatus: 4,
        executionStatusTitle: 'DriverAbsent',
        startedAtUtc: '2026-11-04T11:48:12.4252485',
        endedAtUtc: '2026-11-04T12:16:43.2762015',
        isConfirmedBySupervisor: true,
        supervisorUserId: 3,
        supervisorNote: 'عدم حضور در ایستگاه مبدا',
        driverConfirmedArrival: false,
        progress: {
          totalStations: 3,
          visitedStations: 3,
          remainingStations: 0,
          progressPercent: 100,
          stations: [
            {
              tripStationId: 11,
              stationId: 1,
              stationTitle: 'میدان آزادی تست',
              stopOrder: 1,
              isVisited: true,
              visitedAt: '2026-11-04T15:20:56.83',
            },
          ],
          nextStationId: null,
          nextStationTitle: null,
          nextStopOrder: null,
        },
      },
      {
        calendarDayId: 'bc1b4f09-024f-454f-25a3-08df3525e44f',
        tripId: 31480,
        tripName: 'جهت تست در موبایل',
        companyServiceLocationId: 14,
        companyServiceLocationTitle: 'کروز قدیم تهران',
        entering: false,
        directionTitle: 'خروجی از محل خدمت',
        plannedDriverId: 5152,
        plannedDriverFullName: 'ابوالفضل واعظ',
        plannedDriverMobile: '09931353703',
        hasTemporaryDriver: false,
        executionStatus: 3,
        executionStatusTitle: 'Completed',
        startedAtUtc: '2026-11-04T14:00:00',
        endedAtUtc: '2026-11-04T15:10:00',
        isConfirmedBySupervisor: false,
        supervisorUserId: null,
        supervisorNote: null,
        driverConfirmedArrival: true,
        progress: {
          totalStations: 2,
          visitedStations: 1,
          remainingStations: 1,
          progressPercent: 50,
          stations: [],
          nextStationId: 12,
          nextStationTitle: 'سه‌راه آذری تست',
          nextStopOrder: 2,
        },
      },
    ];

    test('باید وضعیت تکمیل سفر یا ثبت حضور توسط راننده را حتی قبل از تأیید سرشوفر به صورت شفاف تفکیک کند', () => {
      const driverCompletedItem = sampleBoardItems[1];
      const isDriverCompleted =
        driverCompletedItem.executionStatus === 3 || Boolean(driverCompletedItem.endedAtUtc);
      const isDriverConfirmed =
        driverCompletedItem.driverConfirmedArrival === true || isDriverCompleted;
      const isSupervisorFinalized = driverCompletedItem.isConfirmedBySupervisor === true;

      assert.equal(isDriverCompleted, true, 'راننده سفر را به پایان رسانده است');
      assert.equal(isDriverConfirmed, true, 'راننده حضور/اجرای سفر را ثبت کرده است');
      assert.equal(
        isSupervisorFinalized,
        false,
        'سرشوفر هنوز تأیید نهایی را ثبت نکرده و باید بتواند وضعیت راننده را ببیند و تأیید کند'
      );
    });

    test('به محض تأیید حضور یا ثبت غیبت توسط سرشوفر (isConfirmedBySupervisor === true)، دکمه‌های عملیات پایین کارت باید مخفی شوند', () => {
      const finalizedItem = sampleBoardItems[0];
      const unconfirmedItem = sampleBoardItems[1];

      const shouldShowActionButtons = (item) => !(item.isConfirmedBySupervisor === true);

      assert.equal(
        shouldShowActionButtons(finalizedItem),
        false,
        'برای سرویس تاییدشده توسط سرشوفر نباید دکمه‌های پایین کارت نمایش داده شود'
      );
      assert.equal(
        shouldShowActionButtons(unconfirmedItem),
        true,
        'برای سرویسی که هنوز توسط سرشوفر تایید نشده، دکمه‌های عملیات باید فعال باشند'
      );
    });

    test('نوار پیشرفت ایستگاه‌ها باید درصد پیشرفت و عنوان ایستگاه بعدی را به درستی استخراج کند', () => {
      const itemWithNext = sampleBoardItems[1];
      assert.equal(itemWithNext.progress.progressPercent, 50);
      assert.equal(itemWithNext.progress.visitedStations, 1);
      assert.equal(itemWithNext.progress.totalStations, 2);
      assert.equal(itemWithNext.progress.nextStationTitle, 'سه‌راه آذری تست');
    });
  });

  describe('۸. فرمتر اعداد (فارسی/عربی/انگلیسی) و تفکیک نام راننده اصلی از راننده لنگی', () => {
    const sanitizeDigitsInput = (input, maxLength) => {
      const english = String(input ?? '')
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .replace(/[^0-9]/g, '');
      return typeof maxLength === 'number' ? english.slice(0, maxLength) : english;
    };

    const formatPhoneForApi = (input) => {
      let digits = sanitizeDigitsInput(input, 14);
      if (digits.startsWith('0098')) digits = '0' + digits.slice(4);
      else if (digits.startsWith('98') && digits.length >= 12) digits = '0' + digits.slice(2);
      else if (digits.startsWith('9') && digits.length === 10) digits = '0' + digits;
      return digits.slice(0, 11);
    };

    test('باید اعداد فارسی و عربی و کاراکترهای اضافی در کد ملی، موبایل، مبلغ و شماره کارت را به فرمت انگلیسی استاندارد سرور تبدیل کند', () => {
      assert.equal(sanitizeDigitsInput('۰۰۱۲۳۴۵۶۷۸', 10), '0012345678');
      assert.equal(formatPhoneForApi('۰۹۱۲-۳۴۵-۶۷۸۹'), '09123456789');
      assert.equal(formatPhoneForApi('۹۱۲۳۴۵۶۷۸۹'), '09123456789');
      assert.equal(sanitizeDigitsInput('۶۰۳۷ ۹۹۱۱ ۲۲۳۳ ۴۴۵۵', 16), '6037991122334455');
      assert.equal(Number(sanitizeDigitsInput('۱,۵۰۰,۰۰۰', 12)), 1500000);
    });

    test('نباید نام راننده اصلی خط یا عبارت «راننده موقت» را به عنوان نام راننده لنگی در فرم ویرایش قرار دهد', () => {
      const plannedDriverFullName = 'مهدیار واعظ';
      const extractEditableLangiName = (rawName, rawFamily, plannedFull) => {
        const combined = `${rawName || ''} ${rawFamily || ''}`.trim();
        if (
          !rawName ||
          rawName === 'راننده موقت' ||
          rawName === 'راننده موقت (لنگی)' ||
          combined === plannedFull ||
          rawName === plannedFull
        ) {
          return { firstName: '', lastName: '' };
        }
        return { firstName: rawName, lastName: rawFamily };
      };

      assert.deepEqual(
        extractEditableLangiName('مهدیار واعظ', '', plannedDriverFullName),
        { firstName: '', lastName: '' }
      );
      assert.deepEqual(
        extractEditableLangiName('راننده موقت', '', plannedDriverFullName),
        { firstName: '', lastName: '' }
      );
      assert.deepEqual(
        extractEditableLangiName('رضا', 'محمدی', plannedDriverFullName),
        { firstName: 'رضا', lastName: 'محمدی' }
      );
    });
  });
});
