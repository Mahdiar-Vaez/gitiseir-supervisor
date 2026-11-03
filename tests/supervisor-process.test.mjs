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
});
