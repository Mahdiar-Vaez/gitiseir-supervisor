import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  TodayDriverItem,
  ArrivalStatus,
  CreateLangiPayload,
  LangiRequestItem,
  SupervisorDailyBoardResult,
} from './types';
import { Coordinates } from '@/services/location/gps';
import { getCurrentJalaliDate, getCurrentPersianTime } from '@/utils/jalali';
import {
  getSupervisorDailyBoardApi,
  confirmAttendanceApi,
  assignTemporaryDriverApi,
} from './supervisor';

/**
 * Map a backend item (from daily-board or day-trips-grid) into TodayDriverItem
 */
export function mapBackendTripToDriverItem(
  item: any,
  idx: number,
  locationTitleFallback?: string
): TodayDriverItem {
  const td = item.temporaryDriver;
  const start =
    item.scheduledStartTime?.slice(0, 5) ||
    item.outbound?.start?.slice(0, 5) ||
    '00:00';
  const end =
    item.scheduledEndTime?.slice(0, 5) ||
    item.outbound?.end?.slice(0, 5) ||
    '00:00';
  const price =
    item.price ??
    item.outbound?.price ??
    item.inbound?.price ??
    td?.price ??
    0;

  const calendarId =
    item.calendarDayId || item.tripWorkCalendarId || '';

  const langiItem: LangiRequestItem | null =
    item.hasTemporaryDriver && td
      ? {
          id: td.id || `${calendarId}-langi`,
          tripWorkCalendarId: calendarId,
          tripId: item.tripId,
          tripName: item.tripName || 'سرویس ثبت شده',
          serviceLocationTitle:
            locationTitleFallback || item.serviceLocationTitle || item.tripName || '',
          scheduledTime: `${start} - ${end}`,
          originalDriverName: item.driverFullName || 'بدون نام',
          originalDriverPhone: item.driverTel || '',
          name: td.name || '',
          family: td.family || '',
          nationalCode: td.nationalCode || '',
          phoneNumber: td.phoneNumber || '',
          price: td.price || price,
          paymentType: td.cardNumber && !td.cardAccountNumber ? 'card' : 'shaba',
          cardAccountNumber: td.cardAccountNumber || '',
          cardNumber: td.cardNumber || '',
          reason: td.reason || 'ثبت شده در سامانه',
          creationTimePersian: td.creationTimePersian || 'امروز',
          step1: {
            accepted:
              typeof td.acceptOrRejectStep1 === 'object' && td.acceptOrRejectStep1 !== null
                ? (td.acceptOrRejectStep1 as any)?.accepted ?? true
                : Boolean(td.acceptOrRejectStep1 ?? true),
            reason: 'ثبت توسط سرشوفر',
          },
          step2: {
            accepted:
              typeof td.acceptOrRejectStep2 === 'object' && td.acceptOrRejectStep2 !== null
                ? (td.acceptOrRejectStep2 as any)?.accepted ?? null
                : (td.acceptOrRejectStep2 ?? null),
            reason: 'بررسی واحد ناوگان',
          },
          step3: {
            accepted:
              typeof td.acceptOrRejectStep3 === 'object' && td.acceptOrRejectStep3 !== null
                ? (td.acceptOrRejectStep3 as any)?.accepted ?? null
                : (td.acceptOrRejectStep3 ?? null),
            reason: 'بررسی واحد مالی',
          },
          payCode: td.payCode || null,
          readyForPay: Boolean(td.readyForPay),
          fullyAcceptedAndPayed: Boolean(td.fullyAcceptedAndPayed),
        }
      : null;

  const isArrived =
    Boolean(item.isAttendanceConfirmed) ||
    item.status === 2 ||
    item.status === 3;

  return {
    tripWorkCalendarId: calendarId,
    tripId: item.tripId || 0,
    tripName: item.tripName || 'بدون عنوان',
    serviceLocationTitle:
      locationTitleFallback || item.serviceLocationTitle || item.tripName || 'ثبت نشده',
    shiftLabel: item.inbound ? 'سرویس رفت و برگشت' : 'شیفت روزانه',
    scheduledStartTime: start,
    scheduledEndTime: end,
    driverId: item.driverId || 0,
    driverFullName: item.driverFullName || 'راننده نامشخص',
    driverPhone: item.driverTel || item.driverPhone || '',
    vehicleType: item.carType || 'ثبت نشده',
    vehicleColor: item.carBodyColor || '',
    licensePlate: item.licensePlate || 'ثبت نشده',
    passengersCount: item.passengersCount || 0,
    stationsCount: item.stationsCount || 0,
    price,
    arrivalStatus: isArrived ? 'arrived' : 'pending',
    gpsStamp: item.attendanceNote
      ? {
          latitude: 0,
          longitude: 0,
          verifiedAtTime: item.attendanceConfirmedAtUtc || 'ثبت شده',
          note: item.attendanceNote,
        }
      : null,
    hasLangi: Boolean(item.hasTemporaryDriver && langiItem),
    canRequestLangi: item.canSetTemporaryDriver !== false,
    langi: langiItem,
  };
}

/**
 * Fetch today's driver assignments & daily board for the Supervisor (100% real backend data, zero mocks).
 * Calls:
 * 1) GET /api/SupervisorsMobile/Trip/daily-board?companyServiceLocationId={id}&entering={entering}
 * 2) GET /api/my-work-calendar/day-trips-grid?year={y}&month={m}&day={d} (when daily-board is empty)
 */
export async function getTodayDriverAssignmentsApi(
  token?: string | null,
  companyServiceLocationId = 18,
  entering = true
): Promise<{
  drivers: TodayDriverItem[];
  dailyBoard: SupervisorDailyBoardResult | null;
}> {
  if (!token) {
    return { drivers: [], dailyBoard: null };
  }

  let dailyBoard: SupervisorDailyBoardResult | null = null;
  let boardError: any = null;

  try {
    const boardRes = await getSupervisorDailyBoardApi(
      companyServiceLocationId,
      entering,
      token
    );
    if (boardRes?.result) {
      dailyBoard = boardRes.result;
      if (Array.isArray(boardRes.result.items) && boardRes.result.items.length > 0) {
        const mapped = boardRes.result.items.map((item, idx) =>
          mapBackendTripToDriverItem(
            item,
            idx,
            boardRes.result.companyServiceLocationTitle
          )
        );
        return { drivers: mapped, dailyBoard };
      }
    }
  } catch (err) {
    boardError = err;
  }

  // Also check today's work calendar grid so if daily-board for that location has 0 items,
  // any trips assigned in today's work calendar are shown cleanly.
  const today = getCurrentJalaliDate();
  const gridEndpoint = API_ENDPOINTS.WORK_CALENDAR.DAY_TRIPS_GRID(
    today.year,
    today.month,
    today.day
  );

  try {
    const gridRes = await apiClient<any[]>(gridEndpoint, {
      method: 'GET',
      token,
    });
    if (Array.isArray(gridRes?.result) && gridRes.result.length > 0) {
      const mapped = gridRes.result.map((item, idx) =>
        mapBackendTripToDriverItem(item, idx)
      );
      return { drivers: mapped, dailyBoard };
    }
  } catch (gridErr) {
    if (boardError) {
      throw boardError;
    }
    throw gridErr;
  }

  if (boardError && !dailyBoard) {
    throw boardError;
  }

  return { drivers: [], dailyBoard };
}

/**
 * Confirm Driver Attendance via Supervisor endpoint:
 * POST /api/SupervisorsMobile/Trip/confirm-attendance
 * Request body: { calendarDayId, note }
 */
export async function submitDriverArrivalVerificationApi(
  tripWorkCalendarId: string,
  status: ArrivalStatus,
  _coords: Coordinates,
  note?: string,
  token?: string | null
): Promise<{
  success: boolean;
  message: string;
  verifiedAtTime: string;
}> {
  const verifiedAtTime = getCurrentPersianTime();
  const effectiveNote =
    note?.trim() ||
    (status === 'arrived'
      ? 'تأیید حضور راننده توسط سرشوفر'
      : 'عدم حضور راننده - ثبت توسط سرشوفر');

  const res = await confirmAttendanceApi(
    {
      calendarDayId: tripWorkCalendarId,
      note: effectiveNote,
    },
    token
  );

  return {
    success: true,
    verifiedAtTime,
    message:
      res?.message ||
      (status === 'arrived'
        ? 'حضور راننده در سرور با موفقیت ثبت شد.'
        : 'وضعیت عدم حضور راننده در سرور ثبت شد.'),
  };
}

/**
 * Assign Temporary Driver (لنگی) via Supervisor endpoint:
 * POST /api/SupervisorsMobile/Trip/assign-temporary-driver
 * Request body:
 * {
 *   calendarDayId, name, family, phoneNumber, nationalCode, cardNumber, reason, price
 * }
 */
export async function submitLangiRequestApi(
  payload: CreateLangiPayload,
  token?: string | null
): Promise<{
  success: boolean;
  message: string;
  langiItem: LangiRequestItem;
}> {
  const res = await assignTemporaryDriverApi(
    {
      calendarDayId: payload.tripWorkCalendarId,
      name: payload.name.trim(),
      family: payload.family.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      nationalCode: payload.nationalCode.trim(),
      cardNumber:
        payload.paymentType === 'card'
          ? payload.cardNumber.trim()
          : payload.cardAccountNumber.trim().slice(0, 16),
      reason: payload.reason.trim() || 'جایگزینی راننده توسط سرشوفر',
      price: Number(payload.price) || 0,
    },
    token
  );

  const nowTime = getCurrentPersianTime();
  const langiItem: LangiRequestItem = {
    id: `langi-${Date.now()}`,
    tripWorkCalendarId: payload.tripWorkCalendarId,
    tripId: payload.tripId,
    tripName: payload.tripName,
    serviceLocationTitle: payload.serviceLocationTitle,
    scheduledTime: payload.scheduledTime,
    originalDriverName: payload.originalDriverName,
    originalDriverPhone: payload.originalDriverPhone,
    name: payload.name.trim(),
    family: payload.family.trim(),
    nationalCode: payload.nationalCode.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    price: payload.price,
    paymentType: payload.paymentType,
    cardAccountNumber:
      payload.paymentType === 'shaba' ? payload.cardAccountNumber : '',
    cardNumber: payload.paymentType === 'card' ? payload.cardNumber : '',
    reason: payload.reason.trim() || 'جایگزینی راننده توسط سرشوفر',
    creationTimePersian: `امروز ${nowTime}`,
    step1: {
      accepted: true,
      reason: 'ثبت توسط سرشوفر خط',
      creationDate: nowTime,
      approverName: 'سرشوفر خط',
    },
    step2: {
      accepted: null,
      reason: 'در انتظار بررسی ناوگان',
      creationDate: null,
      approverName: 'واحد ناوگان',
    },
    step3: {
      accepted: null,
      reason: 'در انتظار تسویه مالی',
      creationDate: null,
      approverName: 'واحد مالی',
    },
    payCode: null,
    readyForPay: false,
    fullyAcceptedAndPayed: false,
  };

  return {
    success: true,
    message:
      res?.message ||
      'راننده جایگزین (لنگی) با موفقیت در تقویم کاری و اجرای سفر ثبت شد.',
    langiItem,
  };
}
