import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { getCurrentJalaliDate, JALALI_MONTH_NAMES } from '@/utils/jalali';
import { AppHeader } from '@/components/ui/AppHeader';
import { ShamsiCalendar } from '@/components/ui/ShamsiCalendar';
import { DayTripsTable } from '@/components/ui/DayTripsTable';
import { TripSummaryModal } from '@/components/ui/TripSummaryModal';
import { ConfirmAttendanceModal } from '@/components/ui/ConfirmAttendanceModal';
import { AssignTempDriverModal } from '@/components/ui/AssignTempDriverModal';
import { WorkCalendarDay, DayTripGridItem } from '@/services/api/types';
import { getWorkCalendarApi, getDayTripsGridApi } from '@/services/api/calendar';
import { Inbox } from 'lucide-react-native';

export default function CalendarScreen() {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();
  const { showError } = useToast();
  const today = getCurrentJalaliDate();

  // 1. Initialized immediately to the exact current Jalali date
  const [currentYear, setCurrentYear] = useState<number>(today.year);
  const [currentMonth, setCurrentMonth] = useState<number>(today.month);
  const [selectedDay, setSelectedDay] = useState<number>(today.day);

  // 2. Data state (100% real backend data)
  const [calendarDays, setCalendarDays] = useState<WorkCalendarDay[]>([]);
  const [dayTrips, setDayTrips] = useState<DayTripGridItem[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(true);
  const [loadingDayTrips, setLoadingDayTrips] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  // 3. Modal state
  const [selectedGridTrip, setSelectedGridTrip] = useState<DayTripGridItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Supervisor / Calendar Day Action Modals
  const [attendanceModalOpen, setAttendanceModalOpen] = useState<boolean>(false);
  const [attendanceTrip, setAttendanceTrip] = useState<DayTripGridItem | null>(null);

  const [tempDriverModalOpen, setTempDriverModalOpen] = useState<boolean>(false);
  const [tempDriverTrip, setTempDriverTrip] = useState<DayTripGridItem | null>(null);

  // Load monthly calendar days
  useEffect(() => {
    let isCancelled = false;

    const loadMonthCalendar = async () => {
      try {
        setLoadingCalendar(true);
        const res = await getWorkCalendarApi(currentYear, currentMonth, null, token);
        if (!isCancelled) {
          setCalendarDays(res?.result?.days || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setCalendarDays([]);
          showError(
            err?.message || 'خطا در دریافت اطلاعات تقویم کاری ماهانه از سرور.',
            'خطای تقویم کاری'
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingCalendar(false);
          setRefreshing(false);
        }
      }
    };

    loadMonthCalendar();

    return () => {
      isCancelled = true;
    };
  }, [currentYear, currentMonth, token, refreshIndex, showError]);

  // Load trips for the selected day
  useEffect(() => {
    let isCancelled = false;

    const loadDayTrips = async () => {
      try {
        setLoadingDayTrips(true);
        const res = await getDayTripsGridApi(currentYear, currentMonth, selectedDay, token);
        if (!isCancelled) {
          setDayTrips(Array.isArray(res?.result) ? res.result : []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setDayTrips([]);
          showError(
            err?.message || 'خطا در دریافت لیست سفرهای روز انتخاب‌شده.',
            'خطای دریافت سفرهای روز'
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingDayTrips(false);
        }
      }
    };

    loadDayTrips();

    return () => {
      isCancelled = true;
    };
  }, [currentYear, currentMonth, selectedDay, token, refreshIndex, showError]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    if (year === today.year && month === today.month) {
      setSelectedDay(today.day);
    } else {
      setSelectedDay(1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  const handleSelectTripFromTable = (trip: DayTripGridItem) => {
    setSelectedGridTrip(trip);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedGridTrip(null);
  };

  const currentMonthName = JALALI_MONTH_NAMES[currentMonth - 1] || 'نامشخص';
  const selectedDateLabel = `${toPersianDigits(selectedDay)} ${currentMonthName} ${toPersianDigits(currentYear)}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* 1. Interactive Shamsi Calendar Card */}
        <ShamsiCalendar
          year={currentYear}
          month={currentMonth}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          onMonthChange={handleMonthChange}
          calendarDays={calendarDays}
          isLoading={loadingCalendar}
        />

        {/* 2. Selected Day Trips Section Header */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {toPersianDigits(dayTrips.length)} سرویس ثبت شده
          </Text>

          <View style={styles.sectionTitleRow}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              سفرهای فعال تاریخ {selectedDateLabel} در تقویم کاری
            </Text>
            <View style={[styles.goldAccentBar, { backgroundColor: colors.gold }]} />
          </View>
        </View>

        {/* 4. Tabular Data-Grid View with Search */}
        {loadingDayTrips ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text
              style={[
                styles.loadingText,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              در حال دریافت جدول سفرهای روز {selectedDateLabel}...
            </Text>
          </View>
        ) : dayTrips.length > 0 ? (
          <DayTripsTable
            trips={dayTrips}
            onSelectTrip={handleSelectTripFromTable}
            showSupervisorActions={true}
            onConfirmAttendance={(trip) => {
              setAttendanceTrip(trip);
              setAttendanceModalOpen(true);
            }}
            onAssignTempDriver={(trip) => {
              setTempDriverTrip(trip);
              setTempDriverModalOpen(true);
            }}
          />
        ) : (
          /* Real Empty State (Zero Mock Data) */
          <View
            style={[
              styles.emptyStateCard,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.cardSubtle, borderColor: colors.border },
              ]}
            >
              <Inbox size={24} color={colors.gold} />
            </View>
            <Text
              style={[
                styles.emptyStateTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              برای روز {selectedDateLabel} هیچ سفری در سرور ثبت نشده است
            </Text>
            <Text
              style={[
                styles.emptyStateDesc,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              در صورت تخصیص سرویس در تقویم کاری بک‌اند، اطلاعات واقعی در این جدول نمایش داده می‌شود.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 5. Luxury Trip Summary Modal */}
      <TripSummaryModal
        visible={modalVisible}
        tripId={selectedGridTrip?.tripId ?? null}
        initialTrip={
          selectedGridTrip
            ? {
                tripId: selectedGridTrip.tripId,
                tripName: selectedGridTrip.tripName,
                status: selectedGridTrip.status,
                scheduledStartTime:
                  selectedGridTrip.outbound?.start ||
                  selectedGridTrip.inbound?.start ||
                  '۰۰:۰۰',
                scheduledEndTime:
                  selectedGridTrip.outbound?.end ||
                  selectedGridTrip.inbound?.end ||
                  '۰۰:۰۰',
                outboundStart: selectedGridTrip.outbound?.start,
                outboundEnd: selectedGridTrip.outbound?.end,
                outboundPrice:
                  selectedGridTrip.outbound?.price ||
                  selectedGridTrip.inbound?.price ||
                  0,
                licensePlate: selectedGridTrip.licensePlate || undefined,
                calendarDayId: selectedGridTrip.tripWorkCalendarId,
                serviceLocationTitle: selectedGridTrip.tripName,
                driverFullName: selectedGridTrip.driverFullName,
              }
            : null
        }
        calendarDayId={selectedGridTrip?.tripWorkCalendarId || ''}
        onClose={handleCloseModal}
      />

      {/* 6. Confirm Attendance Modal */}
      <ConfirmAttendanceModal
        visible={attendanceModalOpen}
        calendarDayId={attendanceTrip?.tripWorkCalendarId ?? null}
        tripId={attendanceTrip?.tripId}
        tripName={attendanceTrip?.tripName}
        driverName={attendanceTrip?.driverFullName}
        tripTime={
          attendanceTrip?.outbound?.start
            ? `${attendanceTrip.outbound.start.slice(0, 5)} تا ${
                attendanceTrip.outbound.end?.slice(0, 5) || ''
              }`
            : undefined
        }
        selectedDateLabel={selectedDateLabel}
        dayTrips={dayTrips}
        onClose={() => {
          setAttendanceModalOpen(false);
          setAttendanceTrip(null);
        }}
        onSuccess={() => setRefreshIndex((prev) => prev + 1)}
        onDriverMarkedAbsent={(absentCalendarDayId) => {
          const matched =
            dayTrips.find((t) => t.tripWorkCalendarId === absentCalendarDayId) ||
            attendanceTrip;
          setTempDriverTrip(matched);
          setTempDriverModalOpen(true);
        }}
      />

      {/* 7. Assign Temporary Driver Modal */}
      <AssignTempDriverModal
        visible={tempDriverModalOpen}
        calendarDayId={tempDriverTrip?.tripWorkCalendarId ?? null}
        tripId={tempDriverTrip?.tripId}
        tripName={tempDriverTrip?.tripName}
        mainDriverName={tempDriverTrip?.driverFullName}
        defaultPrice={
          tempDriverTrip?.outbound?.price ??
          tempDriverTrip?.inbound?.price ??
          null
        }
        existingTempDriver={tempDriverTrip?.temporaryDriver}
        selectedDateLabel={selectedDateLabel}
        dayTrips={dayTrips}
        onClose={() => {
          setTempDriverModalOpen(false);
          setTempDriverTrip(null);
        }}
        onSuccess={() => setRefreshIndex((prev) => prev + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dayBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dayBadgeText: {
    fontSize: 11.5,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  titleColumn: {
    alignItems: 'flex-end',
    flex: 1,
  },
  goldAccentBar: {
    width: 3.5,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13.5,
    letterSpacing: -0.2,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 10.5,
    marginTop: 1,
    textAlign: 'right',
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyStateCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyStateTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyStateDesc: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 18,
  },
});
