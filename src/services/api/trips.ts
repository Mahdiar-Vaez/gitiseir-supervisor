import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, ActiveTrip, TodayTrip, TripSummary } from './types';

export async function getActiveTripApi(
  token?: string | null
): Promise<ApiResponse<ActiveTrip | null>> {
  return await apiClient<ActiveTrip | null>(API_ENDPOINTS.DRIVER_TRIPS.ACTIVE, {
    method: 'GET',
    token,
  });
}

export async function getTodayTripsApi(
  token?: string | null
): Promise<ApiResponse<TodayTrip[]>> {
  const res = await apiClient<TodayTrip[]>(API_ENDPOINTS.DRIVER_TRIPS.TODAY, {
    method: 'GET',
    token,
  });
  return {
    ...res,
    result: Array.isArray(res?.result) ? res.result : [],
  };
}

export async function getTripSummaryApi(
  tripId: number,
  token?: string | null
): Promise<ApiResponse<TripSummary>> {
  return await apiClient<TripSummary>(API_ENDPOINTS.DRIVER_TRIPS.SUMMARY(tripId), {
    method: 'GET',
    token,
  });
}

export async function startTripApi(
  calendarDayId: string,
  coords: { latitude: number; longitude: number },
  token?: string | null
): Promise<ApiResponse<any>> {
  return await apiClient<any>(API_ENDPOINTS.DRIVER_TRIPS.START(calendarDayId), {
    method: 'POST',
    token,
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),
  });
}

export async function endTripApi(
  calendarDayId: string,
  coords: { latitude: number; longitude: number },
  token?: string | null
): Promise<ApiResponse<any>> {
  return await apiClient<any>(API_ENDPOINTS.DRIVER_TRIPS.END(calendarDayId), {
    method: 'POST',
    token,
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),
  });
}
