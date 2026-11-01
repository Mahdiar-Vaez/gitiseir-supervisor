import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, WorkCalendarResult, DayTripGridItem } from './types';

export async function getWorkCalendarApi(
  year: number,
  month: number,
  passengerId?: number | null,
  token?: string | null
): Promise<ApiResponse<WorkCalendarResult>> {
  const endpoint = API_ENDPOINTS.WORK_CALENDAR.MONTHLY(year, month, passengerId);
  const res = await apiClient<WorkCalendarResult>(endpoint, {
    method: 'GET',
    token,
  });
  return {
    ...res,
    result: {
      days: Array.isArray(res?.result?.days) ? res.result.days : [],
    },
  };
}

export async function getDayTripsGridApi(
  year: number,
  month: number,
  day: number,
  token?: string | null
): Promise<ApiResponse<DayTripGridItem[]>> {
  const endpoint = API_ENDPOINTS.WORK_CALENDAR.DAY_TRIPS_GRID(year, month, day);
  const res = await apiClient<DayTripGridItem[]>(endpoint, {
    method: 'GET',
    token,
  });
  return {
    ...res,
    result: Array.isArray(res?.result) ? res.result : [],
  };
}
