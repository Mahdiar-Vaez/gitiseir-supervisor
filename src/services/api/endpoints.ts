/**
 * Centralized Backend API Endpoints for Gitiseir Driver & Supervisor Mobile Apps
 * Base URL: https://backend.vaezprojects.ir
 */
export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/api/Auth/send-otp',
    LOGIN: '/api/Auth/login',
  },

  DRIVER_TRIPS: {
    ACTIVE: '/api/driversMobile/Trip/active',
    TODAY: '/api/driversMobile/Trip/today',
    SUMMARY: (tripId: number | string) => `/api/driversMobile/Trip/${tripId}/summary`,
    START: (calendarDayId: string) => `/api/driversMobile/Trip/${calendarDayId}/start`,
    END: (calendarDayId: string) => `/api/driversMobile/Trip/${calendarDayId}/end`,
  },

  WORK_CALENDAR: {
    MONTHLY: (year: number, month: number, passengerId?: number | null) => {
      let url = `/api/my-work-calendar?year=${year}&month=${month}`;
      if (passengerId !== undefined && passengerId !== null) {
        url += `&passengerId=${passengerId}`;
      }
      return url;
    },
    DAY_TRIPS_GRID: (year: number, month: number, day: number) =>
      `/api/my-work-calendar/day-trips-grid?year=${year}&month=${month}&day=${day}`,
  },

  SUPERVISOR: {
    DAILY_BOARD: (companyServiceLocationId: number, entering: boolean) =>
      `/api/SupervisorsMobile/Trip/daily-board?companyServiceLocationId=${companyServiceLocationId}&entering=${entering}`,
    CONFIRM_ATTENDANCE: '/api/SupervisorsMobile/Trip/confirm-attendance',
    ASSIGN_TEMPORARY_DRIVER: '/api/SupervisorsMobile/Trip/assign-temporary-driver',
    SEARCH_SERVICE_LOCATIONS: '/api/administration/CompanyServiceLocations/search',
  },
} as const;
