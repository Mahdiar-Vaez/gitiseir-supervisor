import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  ApiResponse,
  CompanyServiceLocation,
  SupervisorDailyBoardResult,
  ConfirmAttendanceRequest,
  AssignTemporaryDriverRequest,
  MarkDriverAbsentRequest,
  TodayExecutionSummaryResult,
} from './types';

export async function getServiceLocationsApi(
  token?: string | null
): Promise<CompanyServiceLocation[]> {
  const body = {
    sortBy: [{ field: 'title', ascending: true }],
    filters: [],
    groupingCriteria: { field: '' },
    step: 1,
    stepSize: 500,
  };

  const res = await apiClient<any>(API_ENDPOINTS.SUPERVISOR.SEARCH_SERVICE_LOCATIONS, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });

  const rawItems = Array.isArray(res?.result)
    ? res.result
    : Array.isArray(res?.result?.items)
    ? res.result.items
    : [];

  return rawItems.map((item: any) => ({
    id: Number(item.id ?? item.Id ?? 0),
    title: String(item.title ?? item.Title ?? `محل خدمت ${item.id}`),
    companyName:
      item.company?.name ?? item.companyName ?? item.CompanyName ?? null,
    isActive: item.isActive ?? true,
  }));
}

export async function getSupervisorDailyBoardApi(
  companyServiceLocationId: number,
  entering?: boolean,
  token?: string | null
): Promise<ApiResponse<SupervisorDailyBoardResult>> {
  const endpoint = API_ENDPOINTS.SUPERVISOR.DAILY_BOARD(
    companyServiceLocationId,
    entering
  );
  return await apiClient<SupervisorDailyBoardResult>(endpoint, {
    method: 'GET',
    token,
  });
}

export async function confirmAttendanceApi(
  payload: ConfirmAttendanceRequest,
  token?: string | null
): Promise<ApiResponse<any>> {
  const hasValidDelay =
    Boolean(payload.isDelayed) && Number(payload.delayMinutes) > 0;

  const requestBody: Record<string, any> = {
    calendarDayId: payload.calendarDayId,
    note: payload.note || '',
  };

  if (hasValidDelay) {
    requestBody.isDelayed = true;
    requestBody.delayMinutes = Math.round(Number(payload.delayMinutes));
  }

  return await apiClient<any>(API_ENDPOINTS.SUPERVISOR.CONFIRM_ATTENDANCE, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    token,
  });
}

/**
 * Mark Driver as Absent by Supervisor (100% real backend data)
 * Endpoint: POST /api/SupervisorsMobile/Trip/mark-driver-absent
 */
export async function markDriverAbsentApi(
  payload: MarkDriverAbsentRequest,
  token?: string | null
): Promise<ApiResponse<any>> {
  return await apiClient<any>(API_ENDPOINTS.SUPERVISOR.MARK_ABSENT, {
    method: 'POST',
    body: JSON.stringify({
      calendarDayId: payload.calendarDayId,
      reason: payload.reason.trim(),
    }),
    token,
  });
}

/**
 * Fetch Today's Shift Execution Live Monitoring Summary
 * Endpoint: GET /api/SupervisorsMobile/Trip/today-execution-summary
 */
export async function getTodayExecutionSummaryApi(
  token?: string | null
): Promise<ApiResponse<TodayExecutionSummaryResult>> {
  return await apiClient<TodayExecutionSummaryResult>(
    API_ENDPOINTS.SUPERVISOR.TODAY_EXECUTION_SUMMARY,
    {
      method: 'GET',
      token,
    }
  );
}

export async function assignTemporaryDriverApi(
  payload: AssignTemporaryDriverRequest,
  token?: string | null
): Promise<ApiResponse<any>> {
  const cleanCard = payload.cardNumber.trim();
  const cleanAccount = (payload.cardAccountNumber ?? payload.cardNumber ?? '').trim();
  return await apiClient<any>(API_ENDPOINTS.SUPERVISOR.ASSIGN_TEMPORARY_DRIVER, {
    method: 'POST',
    body: JSON.stringify({
      calendarDayId: payload.calendarDayId,
      name: payload.name.trim(),
      family: payload.family.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      nationalCode: payload.nationalCode.trim(),
      cardNumber: cleanCard,
      cardAccountNumber: cleanAccount,
      reason: payload.reason.trim(),
      price: Number(payload.price) || 0,
    }),
    token,
  });
}
