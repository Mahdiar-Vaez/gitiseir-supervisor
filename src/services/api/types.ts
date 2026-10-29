/**
 * Generic standard backend response wrapper
 */
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string | null;
  result: T;
}

/**
 * Send OTP request payload
 */
export interface SendOtpRequest {
  mobile: string;
}

/**
 * Driver Login request payload
 */
export interface LoginRequest {
  mobile: string;
  code: string;
}

/**
 * User Role structure
 */
export interface UserRole {
  userId: number;
  roleId: number;
  role: {
    id: number;
    name: string;
    roleClaims?: any[];
  };
}

/**
 * Authenticated User record
 */
export interface AuthUser {
  id: number;
  name: string;
  family: string;
  phoneNumber: string;
  createDate: string;
  nationalCode: string;
  isActive: boolean;
  otpExpire: string | null;
  company: any | null;
  driverId: number | null;
  userRoles: UserRole[];
}

/**
 * Successful Login result payload
 */
export interface LoginResult {
  token: string;
  user: AuthUser;
  isDriver: boolean;
  isAdmin: boolean;
  isLeadDriver: boolean;
  tokenExpireDate: string;
}

/**
 * Active trip information returned by /api/driversMobile/Trip/active
 */
export interface ActiveTrip {
  tripId: number;
  calendarDayId?: string;
  name: string;
  serviceLocationTitle: string;
  outboundStart: string;
  outboundEnd: string;
  totalStations: number;
  visitedStations: number;
  /**
   * Backend TripStatus enum:
   * 0: Pending ("در انتظار تأیید")
   * 1: Confirmed ("تأیید شده")
   * 2: InProgress ("در حال انجام")
   * 3: Completed ("تکمیل شده")
   * 4: Cancelled ("لغو شده")
   */
  status: number;
  entering: boolean;
}

/**
 * Single today's trip entry returned by /api/driversMobile/Trip/today
 */
export interface TodayTrip {
  calendarDayId: string;
  tripId: number;
  tripName: string;
  serviceLocationTitle: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  /**
   * Backend TripStatus enum:
   * 0: Pending ("در انتظار تأیید")
   * 1: Confirmed ("تأیید شده")
   * 2: InProgress ("در حال انجام")
   * 3: Completed ("تکمیل شده")
   * 4: Cancelled ("لغو شده")
   */
  status: number;
  startedAtUtc: string | null;
  endedAtUtc: string | null;
  isReplacementAssigned: boolean;
  canStartTrip: boolean;
  canEndTrip: boolean;
}

/**
 * Detailed trip summary returned by /api/driversMobile/Trip/{tripId}/summary
 */
export interface TripSummary {
  tripId: number;
  name: string;
  /**
   * Backend TripStatus enum:
   * 0: Pending ("در انتظار تأیید")
   * 1: Confirmed ("تأیید شده")
   * 2: InProgress ("در حال انجام")
   * 3: Completed ("تکمیل شده")
   * 4: Cancelled ("لغو شده")
   */
  status: number;
  executionStatus: number;
  outboundStart: string;
  outboundEnd: string;
  outboundPrice: number;
  totalStations: number;
  visitedStations: number;
  remainingStations: number;
  totalExpectedPassengers: number;
  processedPassengers: number;
  startedAtUtc: string | null;
  endedAtUtc: string | null;
  vehicleId: number | null;
  licensePlate: string | null;
  isStartedByDriver: boolean;
  isEndedByDriver: boolean;
  nextStation: string | null;
}

/**
 * Outbound / Inbound schedule and pricing info
 */
export interface TripLegInfo {
  start: string;
  end: string;
  maxSurveyTime?: string;
  price: number;
}

/**
 * Temporary / Substitute driver information
 */
export interface TemporaryDriverInfo {
  id: string;
  tripWorkCalendarDayId: string;
  writerId: number;
  name: string;
  family: string;
  nationalCode: string;
  cardAccountNumber: string | null;
  cardNumber: string | null;
  creationTimePersian: string | null;
  phoneNumber: string;
  reason: string | null;
  price: number | null;
  acceptOrRejectStep1?: boolean | null;
  acceptOrRejectStep2?: boolean | null;
  acceptOrRejectStep3?: boolean | null;
  payCode?: string | null;
  readyForPay?: boolean;
  fullyAcceptedAndPayed?: boolean;
  hasAnyAcceptOrReject?: boolean;
  canEdit?: boolean;
}

/**
 * Single trip inside a work calendar day
 */
export interface WorkCalendarTrip {
  tripWorkCalendarId: string;
  tripId: number;
  tripName: string;
  outbound: TripLegInfo | null;
  inbound: TripLegInfo | null;
  driverFullName: string;
  driverId: number;
  passengerId: number | null;
  temporaryDriverId: string | null;
  temporaryDriver: TemporaryDriverInfo | null;
  hasTemporaryDriver: boolean;
  canSetTemporaryDriver: boolean;
}

/**
 * Single day inside the monthly work calendar
 */
export interface WorkCalendarDay {
  year: number;
  month: number;
  day: number;
  dayOfWheek: string;
  isHoliday: boolean;
  isToday: boolean;
  isWorkingDay: boolean;
  isSelectableForLeadDriver: boolean;
  isSelectableInCalendarSet: boolean;
  isSelectableInReadOnly: boolean;
  trips: WorkCalendarTrip[];
}

/**
 * Result returned by GET /api/my-work-calendar
 */
export interface WorkCalendarResult {
  days: WorkCalendarDay[];
}

/**
 * Detailed trip returned by GET /api/my-work-calendar/day-trips-grid
 */
export interface DayTripGridItem {
  tripWorkCalendarId: string;
  tripId: number;
  tripName: string;
  status: number;
  statusDisplay: string;
  passengerId: number | null;
  passengerFullName: string | null;
  driverId: number;
  driverFullName: string;
  driverTel: string | null;
  licensePlate: string | null;
  carBodyColor: string | null;
  carModelYear: number | null;
  carType: string | null;
  outbound: TripLegInfo | null;
  inbound: TripLegInfo | null;
  temporaryDriverId: string | null;
  temporaryDriver: TemporaryDriverInfo | null;
  hasTemporaryDriver: boolean;
  canSetTemporaryDriver: boolean;
}

/**
 * Company Service Location option
 */
export interface CompanyServiceLocation {
  id: number;
  title: string;
  companyName?: string | null;
  isActive?: boolean;
}

/**
 * Single item inside Supervisor Daily Board
 */
export interface SupervisorDailyBoardItem {
  calendarDayId?: string;
  tripWorkCalendarId?: string;
  tripId: number;
  tripName: string;
  driverId?: number | null;
  driverFullName?: string | null;
  driverTel?: string | null;
  licensePlate?: string | null;
  carType?: string | null;
  carBodyColor?: string | null;
  carModelYear?: number | null;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  outbound?: TripLegInfo | null;
  inbound?: TripLegInfo | null;
  price?: number | null;
  status: number;
  statusDisplay?: string | null;
  isAttendanceConfirmed?: boolean;
  attendanceConfirmedAtUtc?: string | null;
  attendanceNote?: string | null;
  hasTemporaryDriver?: boolean;
  temporaryDriver?: TemporaryDriverInfo | null;
  canSetTemporaryDriver?: boolean;
}

/**
 * Result returned by GET /api/SupervisorsMobile/Trip/daily-board
 */
export interface SupervisorDailyBoardResult {
  companyServiceLocationId: number;
  companyServiceLocationTitle: string;
  entering: boolean;
  directionTitle: string;
  filterSource: string;
  iranLocalTime: string;
  totalCount: number;
  scheduledCount: number;
  startedCount: number;
  completedCount: number;
  items: SupervisorDailyBoardItem[];
}

/**
 * Request body for POST /api/SupervisorsMobile/Trip/confirm-attendance
 */
export interface ConfirmAttendanceRequest {
  calendarDayId: string;
  note: string;
}

/**
 * Request body for POST /api/SupervisorsMobile/Trip/assign-temporary-driver
 */
export interface AssignTemporaryDriverRequest {
  calendarDayId: string;
  name: string;
  family: string;
  phoneNumber: string;
  nationalCode: string;
  cardNumber: string;
  reason: string;
  price: number;
}


