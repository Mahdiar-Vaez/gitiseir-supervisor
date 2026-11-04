import {
  TodayDriverItem,
  ArrivalStatus,
  CreateLangiPayload,
  LangiRequestItem,
  SupervisorDailyBoardResult,
  DailyBoardTripProgress,
} from './types';
import { getCurrentPersianTime, formatUtcToIranTime } from '@/utils/jalali';
import {
  sanitizeDigitsInput,
  formatPhoneForApi,
  formatNationalCodeForApi,
  formatBankNumberForApi,
  formatPriceForApi,
} from '@/utils/persian-digits';
import {
  getSupervisorDailyBoardApi,
  confirmAttendanceApi,
  assignTemporaryDriverApi,
  markDriverAbsentApi,
} from './supervisor';

function formatUtcToTimeLabel(utcStr?: string | null): string {
  return formatUtcToIranTime(utcStr);
}

function getPersianExecutionStatusTitle(
  executionStatus: number,
  rawTitle?: string | null
): string {
  if (executionStatus === 4 || rawTitle === 'DriverAbsent') {
    return 'عدم حضور راننده (غیبت)';
  }
  if (executionStatus === 3) {
    return 'پایان‌یافته توسط راننده';
  }
  if (executionStatus === 1 || executionStatus === 2) {
    return 'در حال اجرا توسط راننده';
  }
  return 'در انتظار شروع راننده';
}

/**
 * Map a backend item from /api/SupervisorsMobile/Trip/daily-board into TodayDriverItem
 */
export function mapBackendTripToDriverItem(
  item: any,
  _idx: number,
  locationTitleFallback?: string
): TodayDriverItem {
  const td = item.temporaryDriver;
  const startedTime = formatUtcToTimeLabel(item.startedAtUtc);
  const endedTime = formatUtcToTimeLabel(item.endedAtUtc);

  const start =
    item.scheduledStartTime?.slice(0, 5) ||
    item.outbound?.start?.slice(0, 5) ||
    startedTime ||
    '۰۰:۰۰';
  const end =
    item.scheduledEndTime?.slice(0, 5) ||
    item.outbound?.end?.slice(0, 5) ||
    endedTime ||
    '۰۰:۰۰';
  const price =
    item.price ??
    item.outbound?.price ??
    item.inbound?.price ??
    td?.price ??
    0;

  const calendarId =
    item.calendarDayId || item.tripWorkCalendarId || '';

  const plannedName =
    item.plannedDriverFullName || item.driverFullName || 'راننده نامشخص';
  const plannedMobile =
    item.plannedDriverMobile || item.driverTel || item.driverPhone || '';
  const actualName =
    item.actualDriverFullName ||
    item.temporaryDriverFullName ||
    plannedName;
  const actualMobile =
    item.actualDriverMobile ||
    item.temporaryDriverPhone ||
    plannedMobile;

  const hasTempDriver = Boolean(item.hasTemporaryDriver || item.temporaryDriverId);
  const rawActualName = (item.actualDriverFullName || '').trim();
  const isActualDistinctFromPlanned =
    Boolean(rawActualName) &&
    rawActualName !== plannedName.trim() &&
    rawActualName !== 'راننده موقت' &&
    rawActualName !== 'راننده موقت (لنگی)';

  const rawTempFullName = (
    item.temporaryDriverFullName ||
    (td ? `${td.name || ''} ${td.family || ''}`.trim() : '') ||
    (hasTempDriver && isActualDistinctFromPlanned ? rawActualName : '')
  ).trim();

  const splitParts = rawTempFullName ? rawTempFullName.split(/\s+/) : [];
  const parsedTempFirstName = td?.name?.trim() || splitParts[0] || '';
  const parsedTempLastName =
    td?.family?.trim() ||
    (splitParts.length > 1 ? splitParts.slice(1).join(' ') : '');

  const langiItem: LangiRequestItem | null = hasTempDriver
    ? {
        id: td?.id || item.temporaryDriverId || `${calendarId}-langi`,
        tripWorkCalendarId: calendarId,
        tripId: item.tripId,
        tripName: item.tripName || 'سرویس ثبت شده',
        serviceLocationTitle:
          item.companyServiceLocationTitle ||
          locationTitleFallback ||
          item.serviceLocationTitle ||
          item.tripName ||
          '',
        scheduledTime: `${start} - ${end}`,
        originalDriverName: plannedName,
        originalDriverPhone: plannedMobile,
        name: parsedTempFirstName || 'راننده موقت',
        family: parsedTempLastName,
        nationalCode: sanitizeDigitsInput(td?.nationalCode || '', 10),
        phoneNumber: sanitizeDigitsInput(
          td?.phoneNumber ||
            item.temporaryDriverPhone ||
            (isActualDistinctFromPlanned ? item.actualDriverMobile : '') ||
            '',
          11
        ),
        price: td?.price || price,
        paymentType: td?.cardAccountNumber && !td?.cardNumber ? 'shaba' : 'card',
        cardAccountNumber: sanitizeDigitsInput(td?.cardAccountNumber || '', 24),
        cardNumber: sanitizeDigitsInput(td?.cardNumber || '', 16),
        reason: td?.reason || item.supervisorNote || 'ثبت شده در سامانه',
        creationTimePersian: td?.creationTimePersian || 'امروز',
        step1: {
          accepted:
            typeof td?.acceptOrRejectStep1 === 'object' && td?.acceptOrRejectStep1 !== null
              ? (td.acceptOrRejectStep1 as any)?.accepted ?? true
              : Boolean(td?.acceptOrRejectStep1 ?? true),
          reason: 'ثبت توسط سرشوفر',
        },
        step2: {
          accepted:
            typeof td?.acceptOrRejectStep2 === 'object' && td?.acceptOrRejectStep2 !== null
              ? (td.acceptOrRejectStep2 as any)?.accepted ?? null
              : (td?.acceptOrRejectStep2 ?? null),
          reason: 'بررسی واحد ناوگان',
        },
        step3: {
          accepted:
            typeof td?.acceptOrRejectStep3 === 'object' && td?.acceptOrRejectStep3 !== null
              ? (td.acceptOrRejectStep3 as any)?.accepted ?? null
              : (td?.acceptOrRejectStep3 ?? null),
          reason: 'بررسی واحد مالی',
        },
        payCode: td?.payCode || null,
        readyForPay: Boolean(td?.readyForPay),
        fullyAcceptedAndPayed: Boolean(td?.fullyAcceptedAndPayed),
      }
    : null;

  const executionStatus =
    typeof item.executionStatus === 'number'
      ? item.executionStatus
      : typeof item.status === 'number'
      ? item.status
      : 0;

  const executionStatusTitle = getPersianExecutionStatusTitle(
    executionStatus,
    item.executionStatusTitle
  );

  const isConfirmedBySupervisor = Boolean(
    item.isConfirmedBySupervisor ?? item.isAttendanceConfirmed
  );
  const driverConfirmedArrival = Boolean(item.driverConfirmedArrival);
  const isDriverAbsent =
    executionStatus === 4 || item.executionStatusTitle === 'DriverAbsent';

  const arrivalStatus: ArrivalStatus = isDriverAbsent
    ? 'not_arrived'
    : isConfirmedBySupervisor
    ? 'arrived'
    : 'pending';

  const supervisorNote = item.supervisorNote || item.attendanceNote || null;
  const supervisorConfirmedAtUtc =
    item.supervisorConfirmedAtUtc || item.attendanceConfirmedAtUtc || null;
  const confirmedTimeLabel =
    formatUtcToTimeLabel(supervisorConfirmedAtUtc) || 'ثبت شده';

  const rawProgress = item.progress;
  const progress: DailyBoardTripProgress | null =
    rawProgress && typeof rawProgress === 'object'
      ? {
          totalStations: Number(rawProgress.totalStations) || 0,
          visitedStations: Number(rawProgress.visitedStations) || 0,
          remainingStations: Number(rawProgress.remainingStations) || 0,
          progressPercent: Number(rawProgress.progressPercent) || 0,
          stations: Array.isArray(rawProgress.stations)
            ? [...rawProgress.stations].sort(
                (a, b) => (a.stopOrder || 0) - (b.stopOrder || 0)
              )
            : [],
          nextStationId: rawProgress.nextStationId ?? null,
          nextStationTitle: rawProgress.nextStationTitle ?? null,
          nextStopOrder: rawProgress.nextStopOrder ?? null,
        }
      : null;

  const licensePlate =
    item.vehicleLicensePlate?.trim() ||
    item.licensePlate?.trim() ||
    'پلاک ثبت نشده';

  return {
    tripWorkCalendarId: calendarId,
    tripId: item.tripId || 0,
    tripName: item.tripName || 'بدون عنوان',
    serviceLocationTitle:
      item.companyServiceLocationTitle ||
      locationTitleFallback ||
      item.serviceLocationTitle ||
      item.tripName ||
      'ثبت نشده',
    shiftLabel:
      item.directionTitle ||
      (item.entering === true
        ? 'ورودی به محل خدمت'
        : item.entering === false
        ? 'خروجی از محل خدمت'
        : 'شیفت روزانه'),
    scheduledStartTime: start,
    scheduledEndTime: end,
    driverId: item.plannedDriverId || item.driverId || 0,
    driverFullName: plannedName,
    driverPhone: actualMobile || plannedMobile,
    plannedDriverFullName: plannedName,
    plannedDriverMobile: plannedMobile,
    actualDriverFullName: actualName,
    actualDriverMobile: actualMobile,
    vehicleType: item.carType || 'خودرو سرویس',
    vehicleColor: item.carBodyColor || '',
    licensePlate,
    passengersCount: item.passengersCount || 0,
    stationsCount: progress?.totalStations ?? item.stationsCount ?? 0,
    price,
    arrivalStatus,
    isConfirmedBySupervisor,
    supervisorNote,
    supervisorConfirmedAtUtc,
    driverConfirmedArrival,
    executionStatus,
    executionStatusTitle,
    startedAtUtc: item.startedAtUtc || null,
    endedAtUtc: item.endedAtUtc || null,
    entering: item.entering,
    directionTitle: item.directionTitle || '',
    progress,
    gpsStamp:
      isConfirmedBySupervisor || supervisorNote
        ? {
            latitude: 0,
            longitude: 0,
            verifiedAtTime: confirmedTimeLabel,
            note: supervisorNote || undefined,
          }
        : null,
    hasLangi: hasTempDriver,
    canRequestLangi: item.canSetTemporaryDriver !== false,
    langi: langiItem,
  };
}

/**
 * Fetch today's driver assignments & daily board for the Supervisor EXCLUSIVELY from:
 * GET /api/SupervisorsMobile/Trip/daily-board?companyServiceLocationId={id}[&entering={entering}]
 * (Work calendar fallback has been completely removed per requirement).
 */
export async function getTodayDriverAssignmentsApi(
  token?: string | null,
  companyServiceLocationId = 14,
  entering?: boolean
): Promise<{
  drivers: TodayDriverItem[];
  dailyBoard: SupervisorDailyBoardResult | null;
}> {
  if (!token) {
    return { drivers: [], dailyBoard: null };
  }

  const boardRes = await getSupervisorDailyBoardApi(
    companyServiceLocationId,
    entering,
    token
  );

  const dailyBoard = boardRes?.result || null;
  if (dailyBoard && Array.isArray(dailyBoard.items)) {
    const mapped = dailyBoard.items.map((item, idx) =>
      mapBackendTripToDriverItem(
        item,
        idx,
        dailyBoard.companyServiceLocationTitle
      )
    );
    return { drivers: mapped, dailyBoard };
  }

  return { drivers: [], dailyBoard };
}

/**
 * Confirm Driver Attendance via Supervisor endpoint:
 * POST /api/SupervisorsMobile/Trip/confirm-attendance
 * Request body: { calendarDayId, note, isDelayed, delayMinutes }
 */
export async function submitDriverArrivalVerificationApi(
  tripWorkCalendarId: string,
  status: ArrivalStatus,
  note?: string,
  isDelayed?: boolean,
  delayMinutes?: number,
  token?: string | null
): Promise<{
  success: boolean;
  message: string;
  verifiedAtTime: string;
}> {
  const verifiedAtTime = getCurrentPersianTime();

  if (status === 'not_arrived') {
    const res = await markDriverAbsentApi(
      {
        calendarDayId: tripWorkCalendarId,
        reason: note?.trim() || 'عدم حضور راننده در سرویس امروز',
      },
      token
    );
    return {
      success: true,
      verifiedAtTime,
      message: res?.message || 'غیبت راننده با موفقیت در سامانه ثبت شد.',
    };
  }

  const effectiveNote = note?.trim() || 'تأیید حضور راننده توسط سرشوفر';
  const res = await confirmAttendanceApi(
    {
      calendarDayId: tripWorkCalendarId,
      note: effectiveNote,
      isDelayed: Boolean(isDelayed),
      delayMinutes: Number(delayMinutes) || 0,
    },
    token
  );

  return {
    success: true,
    verifiedAtTime,
    message: res?.message || 'حضور راننده در سرور با موفقیت ثبت شد.',
  };
}

/**
 * Mark Driver as Absent via Supervisor endpoint:
 * POST /api/SupervisorsMobile/Trip/mark-driver-absent
 */
export async function submitDriverAbsentVerificationApi(
  tripWorkCalendarId: string,
  reason: string,
  token?: string | null
): Promise<{
  success: boolean;
  message: string;
  verifiedAtTime: string;
}> {
  const verifiedAtTime = getCurrentPersianTime();
  const res = await markDriverAbsentApi(
    {
      calendarDayId: tripWorkCalendarId,
      reason: reason.trim() || 'عدم حضور راننده در سرویس امروز',
    },
    token
  );
  return {
    success: true,
    verifiedAtTime,
    message: res?.message || 'غیبت راننده با موفقیت در سامانه ثبت شد.',
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
  const formattedPhone = formatPhoneForApi(payload.phoneNumber);
  const formattedNatCode = formatNationalCodeForApi(payload.nationalCode);
  const formattedPrice = formatPriceForApi(payload.price);
  const cleanCard = formatBankNumberForApi(payload.cardNumber, 16);
  const cleanShaba = formatBankNumberForApi(payload.cardAccountNumber, 24);

  const resolvedCardNumber =
    cleanCard || (cleanShaba ? cleanShaba.slice(0, 16) : '');
  const resolvedAccountNumber = cleanShaba || cleanCard || '';

  const res = await assignTemporaryDriverApi(
    {
      calendarDayId: payload.tripWorkCalendarId,
      name: payload.name.trim(),
      family: payload.family.trim(),
      phoneNumber: formattedPhone,
      nationalCode: formattedNatCode,
      cardNumber: resolvedCardNumber,
      cardAccountNumber: resolvedAccountNumber,
      reason: payload.reason.trim() || 'جایگزینی راننده توسط سرشوفر',
      price: formattedPrice,
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
    nationalCode: formattedNatCode,
    phoneNumber: formattedPhone,
    price: formattedPrice,
    paymentType: payload.paymentType,
    cardAccountNumber: resolvedAccountNumber,
    cardNumber: resolvedCardNumber,
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
