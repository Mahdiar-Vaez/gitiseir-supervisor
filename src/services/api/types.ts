/**
 * Generic standard backend response wrapper
 */
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string | null;
  result: T;
}

export interface SendOtpRequest {
  mobile: string;
}

export interface LoginRequest {
  mobile: string;
  code: string;
}

export interface UserRole {
  userId: number;
  roleId: number;
  role: {
    id: number;
    name: string;
    roleClaims?: any[];
  };
}

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

export interface TripLegInfo {
  start: string;
  end: string;
  maxSurveyTime?: string;
  price: number;
}

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

export interface WorkCalendarResult {
  days: WorkCalendarDay[];
}

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

export interface CompanyServiceLocation {
  id: number;
  title: string;
  companyName?: string | null;
  isActive?: boolean;
}

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

export interface ConfirmAttendanceRequest {
  calendarDayId: string;
  note: string;
}

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

/**
 * Sarshoofer (Lead Driver) Domain Types - MOB-06
 */
export type ArrivalStatus = 'pending' | 'arrived' | 'not_arrived';

export interface GpsVerificationStamp {
  latitude: number;
  longitude: number;
  verifiedAtTime: string;
  note?: string;
}

export interface LangiApprovalStep {
  accepted: boolean | null;
  reason?: string | null;
  creationDate?: string | null;
  approverName?: string | null;
}

export interface LangiRequestItem {
  id: string;
  tripWorkCalendarId: string;
  tripId: number;
  tripName: string;
  serviceLocationTitle: string;
  scheduledTime: string;
  originalDriverName: string;
  originalDriverPhone: string;
  name: string;
  family: string;
  nationalCode: string;
  phoneNumber: string;
  price: number;
  paymentType: 'shaba' | 'card';
  cardAccountNumber: string;
  cardNumber: string;
  reason: string;
  creationTimePersian: string;
  step1: LangiApprovalStep;
  step2: LangiApprovalStep;
  step3: LangiApprovalStep;
  payCode: string | null;
  readyForPay: boolean;
  fullyAcceptedAndPayed: boolean;
}

export interface TodayDriverItem {
  tripWorkCalendarId: string;
  tripId: number;
  tripName: string;
  serviceLocationTitle: string;
  shiftLabel: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  driverId: number;
  driverFullName: string;
  driverPhone: string;
  vehicleType: string;
  vehicleColor: string;
  licensePlate: string;
  passengersCount: number;
  stationsCount: number;
  price: number;
  arrivalStatus: ArrivalStatus;
  gpsStamp: GpsVerificationStamp | null;
  hasLangi: boolean;
  canRequestLangi: boolean;
  langi: LangiRequestItem | null;
}

export interface CreateLangiPayload {
  tripWorkCalendarId: string;
  tripId: number;
  tripName: string;
  serviceLocationTitle: string;
  scheduledTime: string;
  originalDriverName: string;
  originalDriverPhone: string;
  name: string;
  family: string;
  nationalCode: string;
  phoneNumber: string;
  price: number;
  paymentType: 'shaba' | 'card';
  cardAccountNumber: string;
  cardNumber: string;
  reason: string;
}
