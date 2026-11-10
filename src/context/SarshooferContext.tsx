import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  TodayDriverItem,
  ArrivalStatus,
  CreateLangiPayload,
  LangiRequestItem,
  SupervisorDailyBoardResult,
  CompanyServiceLocation,
} from '@/services/api/types';
import {
  getTodayDriverAssignmentsApi,
  submitDriverArrivalVerificationApi,
  submitLangiRequestApi,
} from '@/services/api/sarshoofer';
import { getServiceLocationsApi } from '@/services/api/supervisor';
import { getCurrentCoordinates, Coordinates } from '@/services/location/gps';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { toPersianDigits } from '@/utils/persian-digits';

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
  loading: boolean;
  refreshing: boolean;
  lastCoordinates: Coordinates | null;
  savedShabas: SavedBankEntry[];
  savedCards: SavedBankEntry[];
  refreshFleet: () => Promise<void>;
  confirmDriverArrival: (
    tripWorkCalendarId: string,
    status: ArrivalStatus,
    note?: string
  ) => Promise<{
    success: boolean;
    message: string;
    coords: Coordinates;
    verifiedAtTime: string;
  }>;
  confirmBulkDriversArrival: (
    tripWorkCalendarIds: string[],
    note?: string
  ) => Promise<{
    successCount: number;
    failureCount: number;
    total: number;
    errors: string[];
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
  const { showSuccess, showError, showToast } = useToast();

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
  }, [token, isAuthenticated, companyServiceLocationId, entering, showError]);

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
    async (tripWorkCalendarId: string, status: ArrivalStatus, note?: string) => {
      try {
        const coords = await getCurrentCoordinates();
        setLastCoordinates(coords);

        const res = await submitDriverArrivalVerificationApi(
          tripWorkCalendarId,
          status,
          coords,
          note,
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
                        ? 'تایید حضور توسط سرشوفر در محل ایستگاه'
                        : 'ثبت عدم حضور راننده توسط سرشوفر'),
                  },
                }
              : d
          )
        );

        showSuccess(res.message, 'ثبت وضعیت حضور');

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
    [token, showSuccess, showError]
  );

  const confirmBulkDriversArrival = useCallback(
    async (tripWorkCalendarIds: string[], note?: string) => {
      if (!tripWorkCalendarIds || tripWorkCalendarIds.length === 0) {
        return { successCount: 0, failureCount: 0, total: 0, errors: [] };
      }

      let coords: Coordinates;
      try {
        coords = await getCurrentCoordinates();
        setLastCoordinates(coords);
      } catch {
        coords = { latitude: 0, longitude: 0 };
      }

      const verifiedAtTime = new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const effectiveNote =
        note?.trim() || 'تأیید دسته‌جمعی حضور رانندگان توسط سرشوفر';

      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];
      const successfulIds = new Set<string>();

      for (const id of tripWorkCalendarIds) {
        try {
          await submitDriverArrivalVerificationApi(
            id,
            'arrived',
            coords,
            effectiveNote,
            token
          );
          successCount++;
          successfulIds.add(id);
        } catch (err: any) {
          failureCount++;
          const errMsg = err?.message || 'خطا در ثبت حضور';
          errors.push(errMsg);
        }
      }

      // Strictly Pessimistic Update: only update local state for confirmed drivers
      if (successfulIds.size > 0) {
        setDrivers((prev) =>
          prev.map((d) =>
            successfulIds.has(d.tripWorkCalendarId)
              ? {
                  ...d,
                  arrivalStatus: 'arrived',
                  gpsStamp: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    verifiedAtTime,
                    note: effectiveNote,
                  },
                }
              : d
          )
        );
      }

      if (failureCount === 0) {
        showSuccess(
          `حضور تمام ${toPersianDigits(successCount)} راننده با موفقیت تأیید شد.`,
          'تأیید دسته‌جمعی'
        );
      } else if (successCount > 0) {
        showToast({
          type: 'warning',
          title: 'تأیید دسته‌جمعی با خطا',
          message: `حضور ${toPersianDigits(
            successCount
          )} راننده ثبت شد، اما در ${toPersianDigits(
            failureCount
          )} مورد خطا رخ داد.`,
        });
      } else {
        showError(
          errors[0] || 'خطا در تأیید دسته‌جمعی رانندگان در سرور.',
          'خطای تأیید دسته‌جمعی'
        );
      }

      return {
        successCount,
        failureCount,
        total: tripWorkCalendarIds.length,
        errors,
      };
    },
    [token, showSuccess, showToast, showError]
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
      loading,
      refreshing,
      lastCoordinates,
      savedShabas,
      savedCards,
      refreshFleet,
      confirmDriverArrival,
      confirmBulkDriversArrival,
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
      loading,
      refreshing,
      lastCoordinates,
      savedShabas,
      savedCards,
      refreshFleet,
      confirmDriverArrival,
      confirmBulkDriversArrival,
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
