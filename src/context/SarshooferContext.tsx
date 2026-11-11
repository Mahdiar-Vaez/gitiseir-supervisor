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
  getTodayExecutionSummaryApi,
  getServiceLocationsApi,
} from '@/services/api/supervisor';
import { Coordinates } from '@/services/location/gps';
import { toPersianDigits } from '@/utils/persian-digits';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface SavedBankEntry {
  value: string;
  ownerName: string;
}

export interface SarshooferStats {
  totalDrivers: number;
  arrivedCount: number;
  driverConfirmedCount: number;
  completedByDriverCount: number;
  notArrivedCount: number;
  pendingCount: number;
  langiCount: number;
}

interface SarshooferContextValue {
  drivers: TodayDriverItem[];
  dailyBoard: SupervisorDailyBoardResult | null;
  serviceLocations: CompanyServiceLocation[];
  companyServiceLocationId: number;
  entering: boolean | undefined;
  setCompanyServiceLocationId: (id: number) => void;
  setEntering: (val: boolean | undefined) => void;
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
    verifiedAtTime: string;
  }>;
  confirmBulkDriversArrival: (
    tripWorkCalendarIds: string[],
    note?: string
  ) => Promise<{
    succeededCount: number;
    failedCount: number;
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
  const { token, isAuthenticated, companyServiceId } = useAuth();
  const { showSuccess, showError } = useToast();

  const [drivers, setDrivers] = useState<TodayDriverItem[]>([]);
  const [dailyBoard, setDailyBoard] = useState<SupervisorDailyBoardResult | null>(null);
  const [serviceLocations, setServiceLocations] = useState<CompanyServiceLocation[]>([]);
  const [customLocationId, setCustomLocationId] = useState<number | null>(null);
  const [entering, setEntering] = useState<boolean | undefined>(undefined);

  const companyServiceLocationId =
    customLocationId ?? (companyServiceId && companyServiceId > 0 ? companyServiceId : 14);
  const setCompanyServiceLocationId = useCallback((id: number) => {
    setCustomLocationId(id);
  }, []);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastCoordinates] = useState<Coordinates | null>(null);

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

  const loadData = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setDrivers([]);
      setDailyBoard(null);
      setServiceLocations([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      getServiceLocationsApi(token)
        .then((locs) => {
          if (Array.isArray(locs) && locs.length > 0) {
            setServiceLocations(locs.filter((l) => l.isActive !== false));
          }
        })
        .catch(() => {});

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
        const res = await submitDriverArrivalVerificationApi(
          tripWorkCalendarId,
          status,
          note,
          isDelayed,
          delayMinutes,
          token
        );

        const resolvedNote =
          note ||
          (status === 'arrived'
            ? 'تأیید حضور توسط سرشوفر'
            : 'ثبت عدم حضور راننده توسط سرشوفر');
        const nowIso = new Date().toISOString();

        setDrivers((prev) =>
          prev.map((d) => {
            if (d.tripWorkCalendarId !== tripWorkCalendarId) return d;

            if (status === 'not_arrived') {
              return {
                ...d,
                arrivalStatus: 'not_arrived',
                isConfirmedBySupervisor: true,
                supervisorNote: resolvedNote,
                isDelayed: false,
                delayMinutes: null,
                executionStatus: 4,
                executionStatusTitle: 'عدم حضور راننده (غیبت)',
                gpsStamp: {
                  latitude: 0,
                  longitude: 0,
                  verifiedAtTime: res.verifiedAtTime,
                  note: resolvedNote,
                },
              };
            }

            // Entering = true => Completed (3) and endedAtUtc
            // Entering = false => Started (1) and startedAtUtc (unless already started/completed)
            const nextExecStatus =
              d.entering === true
                ? 3
                : d.executionStatus === 3
                ? 3
                : 1;
            const nextExecTitle =
              nextExecStatus === 3
                ? 'پایان‌یافته توسط راننده'
                : 'در حال اجرا توسط راننده';

            return {
              ...d,
              arrivalStatus: 'arrived',
              isConfirmedBySupervisor: true,
              supervisorNote: resolvedNote,
              isDelayed: Boolean(res.isDelayed),
              delayMinutes: res.delayMinutes ?? null,
              executionStatus: nextExecStatus,
              executionStatusTitle: nextExecTitle,
              startedAtUtc:
                d.entering === false && !d.startedAtUtc ? nowIso : d.startedAtUtc,
              endedAtUtc:
                d.entering === true && !d.endedAtUtc ? nowIso : d.endedAtUtc,
              gpsStamp: {
                latitude: 0,
                longitude: 0,
                verifiedAtTime: res.verifiedAtTime,
                note: resolvedNote,
              },
            };
          })
        );

        showSuccess(res.message, 'ثبت وضعیت حضور');
        refreshTodaySummary();

        return {
          success: res.success,
          message: res.message,
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

  const confirmBulkDriversArrival = useCallback(
    async (tripWorkCalendarIds: string[], note?: string) => {
      const targetIds = Array.from(
        new Set(tripWorkCalendarIds.filter((id) => Boolean(id && id.trim())))
      );
      if (targetIds.length === 0) {
        return { succeededCount: 0, failedCount: 0 };
      }

      const effectiveNote =
        note?.trim() || 'تأیید دسته‌جمعی حضور راننده توسط سرشوفر';
      const succeededIds = new Map<string, string>();
      let failedCount = 0;
      let lastErrorMessage = '';

      for (const id of targetIds) {
        try {
          const res = await submitDriverArrivalVerificationApi(
            id,
            'arrived',
            effectiveNote,
            false,
            undefined,
            token
          );
          succeededIds.set(id, res.verifiedAtTime);
        } catch (err: any) {
          failedCount += 1;
          lastErrorMessage =
            err?.message || 'خطا در تأیید برخی از رانندگان در سرور.';
        }
      }

      if (succeededIds.size > 0) {
        const nowIso = new Date().toISOString();
        setDrivers((prev) =>
          prev.map((d) => {
            const verifiedTime = succeededIds.get(d.tripWorkCalendarId);
            if (!verifiedTime) return d;

            const nextExecStatus =
              d.entering === true
                ? 3
                : d.executionStatus === 3
                ? 3
                : 1;
            const nextExecTitle =
              nextExecStatus === 3
                ? 'پایان‌یافته توسط راننده'
                : 'در حال اجرا توسط راننده';

            return {
              ...d,
              arrivalStatus: 'arrived',
              isConfirmedBySupervisor: true,
              supervisorNote: effectiveNote,
              isDelayed: false,
              delayMinutes: null,
              executionStatus: nextExecStatus,
              executionStatusTitle: nextExecTitle,
              startedAtUtc:
                d.entering === false && !d.startedAtUtc ? nowIso : d.startedAtUtc,
              endedAtUtc:
                d.entering === true && !d.endedAtUtc ? nowIso : d.endedAtUtc,
              gpsStamp: {
                latitude: 0,
                longitude: 0,
                verifiedAtTime: verifiedTime,
                note: effectiveNote,
              },
            };
          })
        );
        refreshTodaySummary();
      }

      const succeededCount = succeededIds.size;
      if (succeededCount > 0 && failedCount === 0) {
        showSuccess(
          `حضور ${toPersianDigits(succeededCount)} راننده با موفقیت ثبت و تکمیل شد.`,
          'تأیید یک‌باره رانندگان'
        );
      } else if (succeededCount > 0 && failedCount > 0) {
        showError(
          `حضور ${toPersianDigits(succeededCount)} راننده ثبت شد، اما ${toPersianDigits(failedCount)} مورد با خطا مواجه شد: ${lastErrorMessage}`,
          'نتیجه تأیید یک‌باره'
        );
      } else if (failedCount > 0) {
        showError(
          lastErrorMessage || 'خطا در تأیید دسته‌جمعی رانندگان در سرور.',
          'خطا در تأیید یک‌باره'
        );
      }

      return { succeededCount, failedCount };
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

        const resolvedReason = reason || 'عدم حضور راننده';

        setDrivers((prev) =>
          prev.map((d) =>
            d.tripWorkCalendarId === tripWorkCalendarId
              ? {
                  ...d,
                  arrivalStatus: 'not_arrived',
                  isConfirmedBySupervisor: true,
                  supervisorNote: resolvedReason,
                  executionStatus: 4,
                  executionStatusTitle: 'عدم حضور راننده (غیبت)',
                  gpsStamp: {
                    latitude: 0,
                    longitude: 0,
                    verifiedAtTime: res.verifiedAtTime,
                    note: resolvedReason,
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
                  actualDriverFullName: fullName,
                  actualDriverMobile: payload.phoneNumber,
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
    const arrivedCount = drivers.filter(
      (d) => d.isConfirmedBySupervisor && d.executionStatus !== 4 && d.arrivalStatus === 'arrived'
    ).length;
    const driverConfirmedCount = drivers.filter(
      (d) =>
        d.driverConfirmedArrival ||
        d.executionStatus === 1 ||
        d.executionStatus === 3 ||
        Boolean(d.startedAtUtc) ||
        Boolean(d.endedAtUtc)
    ).length;
    const completedByDriverCount = drivers.filter(
      (d) => d.executionStatus === 3 || Boolean(d.endedAtUtc)
    ).length;
    const notArrivedCount = drivers.filter(
      (d) => d.arrivalStatus === 'not_arrived' || d.executionStatus === 4
    ).length;
    const pendingCount = drivers.filter(
      (d) => !d.isConfirmedBySupervisor && d.arrivalStatus === 'pending'
    ).length;
    const langiCount = drivers.filter((d) => d.hasLangi).length;
    return {
      totalDrivers,
      arrivedCount,
      driverConfirmedCount,
      completedByDriverCount,
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
      confirmBulkDriversArrival,
      markDriverAbsent,
      submitLangiRequest,
    }),
    [
      drivers,
      dailyBoard,
      serviceLocations,
      companyServiceLocationId,
      setCompanyServiceLocationId,
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
      confirmBulkDriversArrival,
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
