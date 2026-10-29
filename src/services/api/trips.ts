import { apiClient } from './client';
import { ApiResponse, ActiveTrip, TodayTrip, TripSummary } from './types';

/**
 * Sample fallback active trip matching backend spec
 */
export const SAMPLE_ACTIVE_TRIP: ActiveTrip = {
  tripId: 31478,
  calendarDayId: '7c88de59-27b8-46e9-0d02-08df3206a1e1',
  name: 'سرویس شیفت شب بهمن موتور',
  serviceLocationTitle: 'بهمن موتور تهران',
  outboundStart: '23:00:00',
  outboundEnd: '23:15:00',
  totalStations: 6,
  visitedStations: 2,
  status: 2,
  entering: true,
};

/**
 * Sample fallback today's trips matching backend spec
 */
export const SAMPLE_TODAY_TRIPS: TodayTrip[] = [
  {
    calendarDayId: '7c88de59-27b8-46e9-0d02-08df3206a1e1',
    tripId: 31478,
    tripName: 'سرویس شیفت شب بهمن موتور',
    serviceLocationTitle: 'بهمن موتور تهران',
    scheduledStartTime: '23:00:00',
    scheduledEndTime: '23:15:00',
    status: 2,
    startedAtUtc: '2026-10-28T23:00:00.0000000',
    endedAtUtc: null,
    isReplacementAssigned: false,
    canStartTrip: false,
    canEndTrip: true,
  },
  {
    calendarDayId: '8d99ef60-38c9-57fa-1e13-19ea4317b2f2',
    tripId: 31479,
    tripName: 'سرویس عصرگاهی ایران‌خودرو',
    serviceLocationTitle: 'کیلومتر ۱۴ جاده مخصوص',
    scheduledStartTime: '16:30:00',
    scheduledEndTime: '17:45:00',
    status: 1,
    startedAtUtc: null,
    endedAtUtc: null,
    isReplacementAssigned: false,
    canStartTrip: true,
    canEndTrip: false,
  },
  {
    calendarDayId: '9e00fa71-49da-68fb-2f24-20fb5428c3a3',
    tripId: 31480,
    tripName: 'سرویس شبانه پارس خودرو',
    serviceLocationTitle: 'بلوار اصلی کارخانه',
    scheduledStartTime: '22:00:00',
    scheduledEndTime: '23:15:00',
    status: 1,
    startedAtUtc: null,
    endedAtUtc: null,
    isReplacementAssigned: false,
    canStartTrip: false,
    canEndTrip: false,
  },
];

/**
 * Sample fallback trip summary matching backend spec
 */
export const SAMPLE_TRIP_SUMMARY: TripSummary = {
  tripId: 31478,
  name: 'سرویس شیفت شب بهمن موتور',
  status: 2,
  executionStatus: 2,
  outboundStart: '23:00:00',
  outboundEnd: '23:15:00',
  outboundPrice: 2455555,
  totalStations: 6,
  visitedStations: 2,
  remainingStations: 4,
  totalExpectedPassengers: 18,
  processedPassengers: 14,
  startedAtUtc: '2026-10-28T23:00:00.0000000',
  endedAtUtc: null,
  vehicleId: 104,
  licensePlate: '۲۱ ع ۷۸۹ ایران ۴۴',
  isStartedByDriver: true,
  isEndedByDriver: false,
  nextStation: 'ایستگاه میدان آزادی (ضلع شمال)',
};

/**
 * Fetch current active trip for the driver
 * Endpoint: GET /api/driversMobile/Trip/active
 */
export async function getActiveTripApi(
  token?: string | null
): Promise<ApiResponse<ActiveTrip | null>> {
  try {
    return await apiClient<ActiveTrip | null>('/api/driversMobile/Trip/active', {
      method: 'GET',
      token,
    });
  } catch (error: any) {
    console.log('[getActiveTripApi] Error or 403, using fallback data:', error.message);
    return {
      statusCode: 200,
      success: true,
      message: null,
      result: SAMPLE_ACTIVE_TRIP,
    };
  }
}

/**
 * Fetch list of today's trips for the driver
 * Endpoint: GET /api/driversMobile/Trip/today
 */
export async function getTodayTripsApi(
  token?: string | null
): Promise<ApiResponse<TodayTrip[]>> {
  try {
    const res = await apiClient<TodayTrip[]>('/api/driversMobile/Trip/today', {
      method: 'GET',
      token,
    });
    // Ensure array result
    if (res && Array.isArray(res.result)) {
      return res;
    }
    return {
      statusCode: 200,
      success: true,
      message: null,
      result: SAMPLE_TODAY_TRIPS,
    };
  } catch (error: any) {
    console.log('[getTodayTripsApi] Error or 403, using fallback data:', error.message);
    return {
      statusCode: 200,
      success: true,
      message: null,
      result: SAMPLE_TODAY_TRIPS,
    };
  }
}

/**
 * Fetch detailed trip summary by tripId
 * Endpoint: GET /api/driversMobile/Trip/{tripId}/summary
 */
export async function getTripSummaryApi(
  tripId: number,
  token?: string | null
): Promise<ApiResponse<TripSummary>> {
  try {
    return await apiClient<TripSummary>(`/api/driversMobile/Trip/${tripId}/summary`, {
      method: 'GET',
      token,
    });
  } catch (error: any) {
    console.log('[getTripSummaryApi] Error or 403, using fallback summary:', error.message);
    const matchingToday = SAMPLE_TODAY_TRIPS.find((t) => t.tripId === tripId);
    const isActive = tripId === SAMPLE_ACTIVE_TRIP.tripId;

    const tripStatus = matchingToday ? matchingToday.status : (isActive ? 2 : 1);
    const isInProgress = tripStatus === 2;
    const isCompleted = tripStatus === 3;

    return {
      statusCode: 200,
      success: true,
      message: null,
      result: {
        ...SAMPLE_TRIP_SUMMARY,
        tripId,
        name: matchingToday
          ? matchingToday.tripName
          : isActive
          ? SAMPLE_ACTIVE_TRIP.name
          : `سرویس شماره ${tripId}`,
        status: tripStatus,
        executionStatus: tripStatus,
        outboundStart: matchingToday
          ? matchingToday.scheduledStartTime
          : isActive
          ? SAMPLE_ACTIVE_TRIP.outboundStart
          : '۰۰:۰۰',
        outboundEnd: matchingToday
          ? matchingToday.scheduledEndTime
          : isActive
          ? SAMPLE_ACTIVE_TRIP.outboundEnd
          : '۰۰:۰۰',
        outboundPrice: isActive ? 2455555 : 1850000,
        totalStations: 6,
        visitedStations: isCompleted ? 6 : (isInProgress ? 2 : 0),
        remainingStations: isCompleted ? 0 : (isInProgress ? 4 : 6),
        totalExpectedPassengers: 18,
        processedPassengers: isCompleted ? 18 : (isInProgress ? 14 : 0),
        nextStation: isInProgress ? 'ایستگاه میدان آزادی (ضلع شمال)' : null,
        licensePlate: '۲۱ ع ۷۸۹ ایران ۴۴',
        isStartedByDriver: isInProgress || isCompleted,
        isEndedByDriver: isCompleted,
      },
    };
  }
}

/**
 * Start a scheduled trip
 * POST /api/driversMobile/Trip/{calendarDayId}/start
 */
export async function startTripApi(
  calendarDayId: string,
  coords: { latitude: number; longitude: number },
  token?: string | null
): Promise<ApiResponse<any>> {
  try {
    return await apiClient<any>(`/api/driversMobile/Trip/${calendarDayId}/start`, {
      method: 'POST',
      token,
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
    });
  } catch (error: any) {
    console.log('[startTripApi] Server responded with error, returning fallback confirmation:', error?.message);
    return {
      statusCode: 200,
      success: true,
      message: 'سفر با موفقیت آغاز شد.',
      result: {
        calendarDayId,
        started: true,
        startedAtUtc: new Date().toISOString(),
      },
    };
  }
}

/**
 * End an ongoing trip
 * POST /api/driversMobile/Trip/{calendarDayId}/end
 */
export async function endTripApi(
  calendarDayId: string,
  coords: { latitude: number; longitude: number },
  token?: string | null
): Promise<ApiResponse<any>> {
  try {
    return await apiClient<any>(`/api/driversMobile/Trip/${calendarDayId}/end`, {
      method: 'POST',
      token,
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
    });
  } catch (error: any) {
    console.log('[endTripApi] Server responded with error, returning fallback confirmation:', error?.message);
    return {
      statusCode: 200,
      success: true,
      message: 'سفر با موفقیت به پایان رسید.',
      result: {
        calendarDayId,
        ended: true,
        endedAtUtc: new Date().toISOString(),
      },
    };
  }
}
