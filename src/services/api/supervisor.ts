import { apiClient } from './client';
import {
  ApiResponse,
  CompanyServiceLocation,
  SupervisorDailyBoardResult,
  ConfirmAttendanceRequest,
  AssignTemporaryDriverRequest,
} from './types';
import { SAMPLE_DAY_TRIPS_GRID } from './calendar';

/**
 * Sample fallback service locations
 */
export const SAMPLE_SERVICE_LOCATIONS: CompanyServiceLocation[] = [
  { id: 18, title: 'کروز مخصوص کرج', companyName: 'شرکت کروز', isActive: true },
  { id: 12, title: 'بهمن موتور تهران', companyName: 'گروه بهمن', isActive: true },
  { id: 15, title: 'ایران‌خودرو جاده مخصوص', companyName: 'ایران‌خودرو', isActive: true },
  { id: 21, title: 'جهاد تهران', companyName: 'جهاد', isActive: true },
  { id: 24, title: 'پارس‌خودرو کیلوساز', companyName: 'پارس‌خودرو', isActive: true },
];

/**
 * Fetch available Company Service Locations
 * POST /api/administration/CompanyServiceLocations/search
 */
export async function getServiceLocationsApi(
  token?: string | null
): Promise<CompanyServiceLocation[]> {
  try {
    const body = {
      sortBy: [{ field: 'title', ascending: true }],
      filters: [],
      groupingCriteria: { field: '' },
      step: 1,
      stepSize: 500,
    };

    const res = await apiClient<any>(
      '/api/administration/CompanyServiceLocations/search',
      {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      }
    );

    const rawItems = Array.isArray(res?.result)
      ? res.result
      : Array.isArray(res?.result?.items)
      ? res.result.items
      : [];

    if (rawItems.length > 0) {
      return rawItems.map((item: any) => ({
        id: Number(item.id ?? item.Id ?? 18),
        title: String(item.title ?? item.Title ?? `محل خدمت ${item.id}`),
        companyName:
          item.company?.name ?? item.companyName ?? item.CompanyName ?? null,
        isActive: item.isActive ?? true,
      }));
    }

    return SAMPLE_SERVICE_LOCATIONS;
  } catch (error: any) {
    console.log(
      '[getServiceLocationsApi] Using fallback service locations:',
      error?.message
    );
    return SAMPLE_SERVICE_LOCATIONS;
  }
}

/**
 * Fetch Supervisor Daily Board
 * GET /api/SupervisorsMobile/Trip/daily-board?companyServiceLocationId={id}&entering={entering}
 */
export async function getSupervisorDailyBoardApi(
  companyServiceLocationId: number,
  entering: boolean,
  token?: string | null
): Promise<ApiResponse<SupervisorDailyBoardResult>> {
  const endpoint = `/api/SupervisorsMobile/Trip/daily-board?companyServiceLocationId=${companyServiceLocationId}&entering=${entering}`;

  try {
    const res = await apiClient<SupervisorDailyBoardResult>(endpoint, {
      method: 'GET',
      token,
    });
    if (res && res.result) {
      return res;
    }
    throw new Error('Invalid daily board response');
  } catch (error: any) {
    console.log(
      '[getSupervisorDailyBoardApi] Using fallback daily board data:',
      error?.message
    );

    const matchedLocation = SAMPLE_SERVICE_LOCATIONS.find(
      (l) => l.id === companyServiceLocationId
    );
    const items = SAMPLE_DAY_TRIPS_GRID.map((item, idx) => ({
      calendarDayId: item.tripWorkCalendarId,
      tripWorkCalendarId: item.tripWorkCalendarId,
      tripId: item.tripId,
      tripName: item.tripName,
      driverId: item.driverId,
      driverFullName: item.driverFullName,
      driverTel: item.driverTel,
      licensePlate: item.licensePlate,
      carType: item.carType,
      carBodyColor: item.carBodyColor,
      carModelYear: item.carModelYear,
      scheduledStartTime: item.outbound?.start || '06:00:00',
      scheduledEndTime: item.outbound?.end || '07:00:00',
      outbound: item.outbound,
      inbound: item.inbound,
      price: item.outbound?.price || 1000000,
      status: idx === 0 ? 2 : idx === 1 ? 3 : 1,
      statusDisplay: idx === 0 ? 'InProgress' : idx === 1 ? 'Completed' : 'Confirmed',
      isAttendanceConfirmed: idx === 1,
      hasTemporaryDriver: item.hasTemporaryDriver,
      temporaryDriver: item.temporaryDriver,
      canSetTemporaryDriver: true,
    }));

    return {
      statusCode: 200,
      success: true,
      message: null,
      result: {
        companyServiceLocationId,
        companyServiceLocationTitle:
          matchedLocation?.title || `محل خدمت کد ${companyServiceLocationId}`,
        entering,
        directionTitle: entering ? 'ورودی به محل خدمت' : 'خروجی از محل خدمت',
        filterSource: 'manual',
        iranLocalTime: new Date().toISOString(),
        totalCount: items.length,
        scheduledCount: items.filter((i) => i.status === 0 || i.status === 1).length,
        startedCount: items.filter((i) => i.status === 2).length,
        completedCount: items.filter((i) => i.status === 3).length,
        items,
      },
    };
  }
}

/**
 * Confirm Driver Attendance by Supervisor
 * POST /api/SupervisorsMobile/Trip/confirm-attendance
 */
export async function confirmAttendanceApi(
  payload: ConfirmAttendanceRequest,
  token?: string | null
): Promise<ApiResponse<any>> {
  const endpoint = '/api/SupervisorsMobile/Trip/confirm-attendance';
  return await apiClient<any>(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      calendarDayId: payload.calendarDayId,
      note: payload.note || '',
    }),
    token,
  });
}

/**
 * Assign Temporary (Substitute / لنگی) Driver by Supervisor
 * POST /api/SupervisorsMobile/Trip/assign-temporary-driver
 */
export async function assignTemporaryDriverApi(
  payload: AssignTemporaryDriverRequest,
  token?: string | null
): Promise<ApiResponse<any>> {
  const endpoint = '/api/SupervisorsMobile/Trip/assign-temporary-driver';
  return await apiClient<any>(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      calendarDayId: payload.calendarDayId,
      name: payload.name.trim(),
      family: payload.family.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      nationalCode: payload.nationalCode.trim(),
      cardNumber: payload.cardNumber.trim(),
      reason: payload.reason.trim(),
      price: Number(payload.price) || 0,
    }),
    token,
  });
}
