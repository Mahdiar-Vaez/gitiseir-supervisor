import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  TodayDriverItem,
  ArrivalStatus,
  CreateLangiPayload,
  LangiRequestItem,
  SupervisorDailyBoardResult,
  CompanyServiceLocation,
  TodayExecutionSummaryResult,
} from '@/services/api/types';
import {
  getTodayDriverAssignmentsApi,
  submitDriverArrivalVerificationApi,
  submitDriverAbsentVerificationApi,
  submitLangiRequestApi,
} from '@/services/api/sarshoofer';
import {
  getServiceLocationsApi,
  getTodayExecutionSummaryApi,
} from '@/services/api/supervisor';
import { getCurrentCoordinates, Coordinates } from '@/services/location/gps';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface SavedBankEntry {
  value: string;
  ownerName: string;
}

export interface SarshooferStats {
  totalDrivers: number;
  arrivedCount: number;
  notArrivedCount: number;
  pendingCount: number;
  langiCount: number;
}

interface SarshooferContextValue {
  drivers: TodayDriverItem[];
  dailyBoard: SupervisorDailyBoardResult | null;
  serviceLocations: CompanyServiceLocation[];
  companyServiceLocationId: number;
  entering: boolean;
  setCompanyServiceLocationId: (id: number) => void;
  setEntering: (val: boolean) => void;
  langiList: LangiRequestItem[];
  stats: SarshooferStats;
  todayExecutionSummary: TodayExecutionSummaryResult | null;
  loading: boolean;
  refreshing: boolean;
  lastCoordinates: Coordinates | null;
  savedShabas: SavedBankEntry[];
  savedCards: SavedBankEntry[];
  refreshFleet: () => Promise<void>;
  refreshTodaySummary: () => Promise<void>;
  confirmDriverArrival: (
    tripWorkCalendarId: string,
    status: ArrivalStatus,
    note?: string,
    isDelayed?: boolean,
    delayMinutes?: number
  ) => Promise<{
    success: boolean;
    message: string;
    coords: Coordinates;
    verifiedAtTime: string;
  }>;
  markDriverAbsent: (
    tripWorkCalendarId: string,
    reason: string
  ) => Promise<{
    success: boolean;
    message: string;
    verifiedAtTime: string;
  }>;
  submitLangiRequest: (payload: CreateLangiPayload) => Promise<{
    success: boolean;
    message: string;
    langiItem: LangiRequestItem;
  }>;
}

const SarshooferContext = createContext<SarshooferContextValue | null>(null);

export function SarshooferProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  const [drivers, setDrivers] = useState<TodayDriverItem[]>([]);
  const [dailyBoard, setDailyBoard] = useState<SupervisorDailyBoardResult | null>(null);
  const [serviceLocations, setServiceLocations] = useState<CompanyServiceLocation[]>([]);
  const [companyServiceLocationId, setCompanyServiceLocationId] = useState<number>(18);
  const [entering, setEntering] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastCoordinates, setLastCoordinates] = useState<Coordinates | null>(null);

  const [savedShabas, setSavedShabas] = useState<SavedBankEntry[]>([]);
  const [savedCards, setSavedCards] = useState<SavedBankEntry[]>([]);

  const [todayExecutionSummary, setTodayExecutionSummary] =
    useState<TodayExecutionSummaryResult | null>(null);

  const refreshTodaySummary = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setTodayExecutionSummary(null);
      return;
    }
    try {
      const res = await getTodayExecutionSummaryApi(token);
      if (res?.result) {
        setTodayExecutionSummary(res.result);
      }
    } catch (err: any) {
      console.log('[SarshooferContext] today-execution-summary info:', err?.message);
    }
  }, [token, isAuthenticated]);

  // Load available service locations from backend when authenticated
  useEffect(() => {
    if (!token || !isAuthenticated) return;
    getServiceLocationsApi(token)
      .then((locs) => {
        if (locs.length > 0) {
          setServiceLocations(locs);
        }
      })
      .catch((err) => {
        console.log('[SarshooferContext] Service locations lookup info:', err?.message);
      });
  }, [token, isAuthenticated]);

  const loadData = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setDrivers([]);
      setDailyBoard(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const { drivers: fetchedDrivers, dailyBoard: fetchedBoard } =
        await getTodayDriverAssignmentsApi(
          token,
          companyServiceLocationId,
          entering
        );
      setDrivers(fetchedDrivers);
      setDailyBoard(fetchedBoard);
      await refreshTodaySummary();
    } catch (err: any) {
      setDrivers([]);
      setDailyBoard(null);
      showError(
        err?.message || 'خطا در دریافت اطلاعات بورد روزانه سرشوفر از سرور.',
        'خطای دریافت بورد روزانه'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isAuthenticated, companyServiceLocationId, entering, showError, refreshTodaySummary]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) {
        await loadData();
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [loadData]);

  const refreshFleet = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  const confirmDriverArrival = useCallback(
    async (
      tripWorkCalendarId: string,
      status: ArrivalStatus,
      note?: string,
      isDelayed?: boolean,
      delayMinutes?: number
    ) => {
      try {
        const coords = await getCurrentCoordinates();
        setLastCoordinates(coords);

        const res = await submitDriverArrivalVerificationApi(
          tripWorkCalendarId,
          status,
          coords,
          note,
          isDelayed,
          delayMinutes,
          token
        );

        setDrivers((prev) =>
          prev.map((d) =>
            d.tripWorkCalendarId === tripWorkCalendarId
              ? {
                  ...d,
                  arrivalStatus: status,
                  gpsStamp: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    verifiedAtTime: res.verifiedAtTime,
                    note:
                      note ||
                      (status === 'arrived'
                        ? 'تأیید حضور توسط سرشوفر در محل ایستگاه'
                        : 'ثبت عدم حضور راننده توسط سرشوفر'),
                  },
                }
              : d
          )
        );

        showSuccess(res.message, 'ثبت وضعیت حضور');
        refreshTodaySummary();

        return {
          success: res.success,
          message: res.message,
          coords,
          verifiedAtTime: res.verifiedAtTime,
        };
      } catch (err: any) {
        showError(
          err?.message || 'خطا در ثبت حضور راننده در سرور.',
          'خطا در تأیید حضور'
        );
        throw err;
      }
    },
    [token, showSuccess, showError, refreshTodaySummary]
  );

  const markDriverAbsent = useCallback(
    async (tripWorkCalendarId: string, reason: string) => {
      try {
        const res = await submitDriverAbsentVerificationApi(
          tripWorkCalendarId,
          reason,
          token
        );

        setDrivers((prev) =>
          prev.map((d) =>
            d.tripWorkCalendarId === tripWorkCalendarId
              ? {
                  ...d,
                  arrivalStatus: 'not_arrived',
                  gpsStamp: {
                    latitude: 0,
                    longitude: 0,
                    verifiedAtTime: res.verifiedAtTime,
                    note: reason || 'عدم حضور راننده',
                  },
                }
              : d
          )
        );

        showSuccess(res.message, 'ثبت عدم حضور');
        refreshTodaySummary();

        return {
          success: res.success,
          message: res.message,
          verifiedAtTime: res.verifiedAtTime,
        };
      } catch (err: any) {
        showError(
          err?.message || 'خطا در ثبت عدم حضور راننده در سرور.',
          'خطا در ثبت غیبت'
        );
        throw err;
      }
    },
    [token, showSuccess, showError, refreshTodaySummary]
  );

  const submitLangiRequest = useCallback(
    async (payload: CreateLangiPayload) => {
      try {
        const res = await submitLangiRequestApi(payload, token);

        const fullName = `${payload.name} ${payload.family}`.trim();
        if (payload.paymentType === 'shaba' && payload.cardAccountNumber) {
          setSavedShabas((prev) => {
            if (prev.some((s) => s.value === payload.cardAccountNumber)) return prev;
            return [{ value: payload.cardAccountNumber, ownerName: fullName }, ...prev].slice(0, 8);
          });
        } else if (payload.paymentType === 'card' && payload.cardNumber) {
          setSavedCards((prev) => {
            if (prev.some((c) => c.value === payload.cardNumber)) return prev;
            return [{ value: payload.cardNumber, ownerName: fullName }, ...prev].slice(0, 8);
          });
        }

        setDrivers((prev) =>
          prev.map((d) =>
            d.tripWorkCalendarId === payload.tripWorkCalendarId
              ? {
                  ...d,
                  hasLangi: true,
                  langi: res.langiItem,
                }
              : d
          )
        );

        showSuccess(res.message, 'ثبت راننده موقت (لنگی)');
        return res;
      } catch (err: any) {
        showError(
          err?.message || 'خطا در ثبت راننده موقت (لنگی) در سرور.',
          'خطا در ثبت راننده موقت (لنگی)'
        );
        throw err;
      }
    },
    [token, showSuccess, showError]
  );

  const langiList = useMemo<LangiRequestItem[]>(() => {
    return drivers.filter((d) => d.hasLangi && d.langi).map((d) => d.langi!);
  }, [drivers]);

  const stats = useMemo<SarshooferStats>(() => {
    const totalDrivers = drivers.length;
    const arrivedCount = drivers.filter((d) => d.arrivalStatus === 'arrived').length;
    const notArrivedCount = drivers.filter((d) => d.arrivalStatus === 'not_arrived').length;
    const pendingCount = drivers.filter((d) => d.arrivalStatus === 'pending').length;
    const langiCount = drivers.filter((d) => d.hasLangi).length;
    return {
      totalDrivers,
      arrivedCount,
      notArrivedCount,
      pendingCount,
      langiCount,
    };
  }, [drivers]);

  const value = useMemo<SarshooferContextValue>(
    () => ({
      drivers,
      dailyBoard,
      serviceLocations,
      companyServiceLocationId,
      entering,
      setCompanyServiceLocationId,
      setEntering,
      langiList,
      stats,
      todayExecutionSummary,
      loading,
      refreshing,
      lastCoordinates,
      savedShabas,
      savedCards,
      refreshFleet,
      refreshTodaySummary,
      confirmDriverArrival,
      markDriverAbsent,
      submitLangiRequest,
    }),
    [
      drivers,
      dailyBoard,
      serviceLocations,
      companyServiceLocationId,
      entering,
      langiList,
      stats,
      todayExecutionSummary,
      loading,
      refreshing,
      lastCoordinates,
      savedShabas,
      savedCards,
      refreshFleet,
      refreshTodaySummary,
      confirmDriverArrival,
      markDriverAbsent,
      submitLangiRequest,
    ]
  );

  return <SarshooferContext.Provider value={value}>{children}</SarshooferContext.Provider>;
}

export function useSarshoofer(): SarshooferContextValue {
  const ctx = useContext(SarshooferContext);
  if (!ctx) {
    throw new Error('useSarshoofer must be used within a SarshooferProvider');
  }
  return ctx;
}
