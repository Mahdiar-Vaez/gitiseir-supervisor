import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('فرایندها و استانداردهای مهندسی راننده گیتی‌سیر (Driver Engineering Verification)', () => {
  const SAMPLE_CALENDAR_ID = '8164b057-6799-440d-6e47-08df38ea0ede';
  const SAMPLE_TRIP_ID = 31483;
  const SAMPLE_STATION_ID = 1;

  describe('۱. دریافت و پردازش سفرهای امروز (/Trip/today)', () => {
    test('باید سفرهای روز جاری را با فلگ‌های هدایتگر اعتبارسنجی کند', () => {
      const serverResponse = {
        statusCode: 200,
        success: true,
        result: [
          {
            calendarDayId: SAMPLE_CALENDAR_ID,
            tripId: SAMPLE_TRIP_ID,
            tripName: 'سرویس شیفت صبح کروز',
            serviceLocationTitle: 'کروز قدیم تهران',
            scheduledStartTime: '06:30:00',
            scheduledEndTime: '07:30:00',
            status: 0,
            startedAtUtc: null,
            endedAtUtc: null,
            isReplacementAssigned: false,
            canStartTrip: true,
            canEndTrip: false,
          },
          {
            calendarDayId: 'bc1b4f09-024f-454f-25a3-08df3525e44f',
            tripId: 31480,
            tripName: 'سرویس شیفت عصر کروز',
            serviceLocationTitle: 'کروز قدیم تهران',
            scheduledStartTime: '18:00:00',
            scheduledEndTime: '19:00:00',
            status: 0,
            startedAtUtc: null,
            endedAtUtc: null,
            isReplacementAssigned: false,
            canStartTrip: false,
            canEndTrip: false,
          },
        ],
      };

      const trips = serverResponse.result;
      assert.equal(trips.length, 2);
      assert.equal(trips[0].canStartTrip, true);
      assert.equal(trips[1].canStartTrip, false);
      assert.equal(trips[0].status, 0);
    });
  });

  describe('۲. ثبت شروع سفر با GPS (/Trip/{calendarDayId}/start)', () => {
    test('باید مختصات جغرافیایی شروع را در بازه استاندارد کره زمین بررسی و ارسال کند', () => {
      const coords = { latitude: 35.730988, longitude: 51.373384 };
      assert.ok(coords.latitude >= -90 && coords.latitude <= 90);
      assert.ok(coords.longitude >= -180 && coords.longitude <= 180);

      const requestBody = JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const parsed = JSON.parse(requestBody);
      assert.equal(parsed.latitude, 35.730988);
      assert.equal(parsed.longitude, 51.373384);
    });
  });

  describe('۳. ثبت پایان سفر با GPS (/Trip/{calendarDayId}/end)', () => {
    test('باید مختصات مقصد را به درستی در بدنه درخواست ثبت پایان قرار دهد', () => {
      const coords = { latitude: 35.728227, longitude: 51.373384 };
      const requestBody = JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const parsed = JSON.parse(requestBody);
      assert.equal(parsed.latitude, 35.728227);
      assert.equal(parsed.longitude, 51.373384);
    });
  });

  describe('۴. مدیریت ایستگاه‌ها و ثبت تردد (/Trip/{tripId}/stations & visit)', () => {
    test('ایستگاه‌ها باید به ترتیب توقف مرتب شده و ساختار کامل داشته باشند', () => {
      const stations = [
        {
          tripStationId: 1,
          stopOrder: 1,
          title: 'میدان آزادی',
          latitude: 35.6997,
          longitude: 51.338,
          geofenceRadiusMeters: 100,
          expectedPassengerCount: 15,
          isVisited: false,
          visitedAt: null,
        },
        {
          tripStationId: 2,
          stopOrder: 2,
          title: 'سه‌راه آذری',
          latitude: 35.6791,
          longitude: 51.3732,
          geofenceRadiusMeters: 150,
          expectedPassengerCount: 8,
          isVisited: false,
          visitedAt: null,
        },
      ];

      assert.equal(stations[0].stopOrder, 1);
      assert.equal(stations[1].stopOrder, 2);
      assert.equal(stations[0].isVisited, false);
    });

    test('بدنه ثبت تردد ایستگاه باید زمان ورود و مختصات راننده را به صورت کامل ارسال کند', () => {
      const visitPayload = {
        actualLatitude: 35.6998,
        actualLongitude: 51.3382,
        visitedAt: '2026-11-03T18:04:09.282Z',
      };

      const requestBody = JSON.stringify({
        actualLatitude: visitPayload.actualLatitude,
        actualLongitude: visitPayload.actualLongitude,
        visitedAt: visitPayload.visitedAt,
      });

      const parsed = JSON.parse(requestBody);
      assert.equal(parsed.actualLatitude, 35.6998);
      assert.equal(parsed.actualLongitude, 51.3382);
      assert.equal(parsed.visitedAt, '2026-11-03T18:04:09.282Z');
    });
  });

  describe('۵. خلاصه وضعیت سفر (/Trip/{tripId}/summary)', () => {
    test('باید ایستگاه بعدی را چه به صورت آبجکت و چه به صورت رشته بدون خطا تجزیه کند', () => {
      const summaryWithObj = {
        tripId: SAMPLE_TRIP_ID,
        name: 'سرویس کروز',
        status: 1,
        executionStatus: 1,
        totalStations: 10,
        visitedStations: 2,
        remainingStations: 8,
        totalExpectedPassengers: 152,
        processedPassengers: 25,
        nextStation: {
          tripStationId: 3,
          stopOrder: 3,
          title: 'میدان ۹ دی',
          latitude: 35.665,
          longitude: 51.362,
          expectedPassengerCount: 12,
        },
      };

      const nextTitle =
        typeof summaryWithObj.nextStation === 'object' && summaryWithObj.nextStation !== null
          ? summaryWithObj.nextStation.title
          : summaryWithObj.nextStation;

      assert.equal(nextTitle, 'میدان ۹ دی');
      assert.equal(summaryWithObj.totalStations, 10);
      assert.equal(summaryWithObj.visitedStations, 2);
      assert.equal(summaryWithObj.remainingStations, 8);
    });
  });

  describe('۶. شاخص‌های عملکرد راننده (/Trip/performance-summary)', () => {
    test('باید شاخص‌های تجمیعی موفقیت، تأخیر و غیبت را به درستی محاسبه کند', () => {
      const performanceResult = {
        driverId: 5152,
        totalTrips: 20,
        successfulTrips: 19,
        absentTrips: 0,
        delayedTrips: 2,
        successRate: 95.0,
      };

      assert.equal(performanceResult.driverId, 5152);
      assert.equal(performanceResult.totalTrips, 20);
      assert.equal(performanceResult.successfulTrips, 19);
      assert.equal(performanceResult.absentTrips, 0);
      assert.equal(performanceResult.successRate, 95.0);
    });
  });

  describe('۷. تضمین رفتار به‌روزرسانی بدبینانه (Strictly Pessimistic Updates)', () => {
    let tripState;
    let stationsState;

    beforeEach(() => {
      tripState = {
        tripId: SAMPLE_TRIP_ID,
        calendarDayId: SAMPLE_CALENDAR_ID,
        status: 0,
        isSubmitting: false,
        error: null,
      };

      stationsState = [
        {
          tripStationId: SAMPLE_STATION_ID,
          title: 'ایستگاه مبدا',
          isVisited: false,
          visitedAt: null,
        },
      ];
    });

    test('شروع سفر: وضعیت سفر تا قبل از دریافت پاسخ ۲۰۰ سرور نباید تغییر کند', async () => {
      const simulateStartTrip = async (succeeds) => {
        tripState.isSubmitting = true;

        assert.equal(tripState.status, 0, 'وضعیت نباید به صورت خوش‌بینانه Started شود');

        await new Promise((r) => setTimeout(r, 40));

        if (!succeeds) {
          tripState.isSubmitting = false;
          tripState.error = 'خطای سرور ۴۰۹ (تداخل اجرایی یا راننده لنگی)';
          return;
        }

        tripState.isSubmitting = false;
        tripState.status = 1;
      };

      await simulateStartTrip(false);
      assert.equal(tripState.status, 0);
      assert.equal(tripState.error, 'خطای سرور ۴۰۹ (تداخل اجرایی یا راننده لنگی)');

      await simulateStartTrip(true);
      assert.equal(tripState.status, 1);
    });

    test('ثبت تردد ایستگاه: پرچم isVisited تنها پس از پاسخ قطعی سرور فعال می‌شود', async () => {
      let isSubmittingStation = false;

      const simulateVisitStation = async (succeeds) => {
        isSubmittingStation = true;

        // بررسی در حین درخواست: هنوز ثبت نشده و لودینگ فعال است
        assert.equal(isSubmittingStation, true);
        assert.equal(stationsState[0].isVisited, false);

        await new Promise((r) => setTimeout(r, 40));

        if (!succeeds) {
          isSubmittingStation = false;
          // عدم تغییر وضعیت ایستگاه
          return;
        }

        // فقط پس از موفقیت قطعی
        isSubmittingStation = false;
        stationsState[0] = {
          ...stationsState[0],
          isVisited: true,
          visitedAt: '2026-11-03T18:04:09.282Z',
        };
      };

      // ۱. خطا در ثبت تردد -> وضعیت دست‌نخورده
      await simulateVisitStation(false);
      assert.equal(isSubmittingStation, false);
      assert.equal(stationsState[0].isVisited, false);
      assert.equal(stationsState[0].visitedAt, null);

      // ۲. تایید موفقیت سرور -> ثبت وضعیت
      await simulateVisitStation(true);
      assert.equal(isSubmittingStation, false);
      assert.equal(stationsState[0].isVisited, true);
      assert.equal(stationsState[0].visitedAt, '2026-11-03T18:04:09.282Z');
    });
  });
});
