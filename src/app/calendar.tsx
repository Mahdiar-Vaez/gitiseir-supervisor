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
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { getCurrentJalaliDate, JALALI_MONTH_NAMES } from '@/utils/jalali';
import { AppHeader } from '@/components/ui/AppHeader';
import { ShamsiCalendar } from '@/components/ui/ShamsiCalendar';
import { DayTripCard } from '@/components/ui/DayTripCard';
import { TripSummaryModal } from '@/components/ui/TripSummaryModal';
import { WorkCalendarDay, DayTripGridItem } from '@/services/api/types';
import { getWorkCalendarApi, getDayTripsGridApi } from '@/services/api/calendar';
import { CalendarDays, Inbox } from 'lucide-react-native';

export default function CalendarScreen() {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();
  const today = getCurrentJalaliDate();

  // 1. Initialized immediately to the exact current Jalali date
  const [currentYear, setCurrentYear] = useState<number>(today.year);
  const [currentMonth, setCurrentMonth] = useState<number>(today.month);
  const [selectedDay, setSelectedDay] = useState<number>(today.day);

  // 2. Data state
  const [calendarDays, setCalendarDays] = useState<WorkCalendarDay[]>([]);
  const [dayTrips, setDayTrips] = useState<DayTripGridItem[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(true);
  const [loadingDayTrips, setLoadingDayTrips] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  // 3. Modal state
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Load monthly calendar days
  useEffect(() => {
    let isCancelled = false;

    const loadMonthCalendar = async () => {
      try {
        const res = await getWorkCalendarApi(currentYear, currentMonth, null, token);
        if (!isCancelled && res?.result?.days) {
          setCalendarDays(res.result.days);
        }
      } catch (err) {
        console.warn('Failed to load work calendar:', err);
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
  }, [currentYear, currentMonth, token, refreshIndex]);

  // Load trips for the selected day
  useEffect(() => {
    let isCancelled = false;

    const loadDayTrips = async () => {
      try {
        const res = await getDayTripsGridApi(currentYear, currentMonth, selectedDay, token);
        if (!isCancelled && res?.result) {
          setDayTrips(res.result);
        }
      } catch (err) {
        console.warn('Failed to load day trips grid:', err);
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
  }, [currentYear, currentMonth, selectedDay, token, refreshIndex]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    // If navigated back to current month, select current day; otherwise select day 1
    if (year === today.year && month === today.month) {
      setSelectedDay(today.day);
    } else {
      setSelectedDay(1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setLoadingDayTrips(true);
  };

  const handleOpenTripModal = (tripId: number) => {
    setSelectedTripId(tripId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTripId(null);
  };

  const currentMonthName = JALALI_MONTH_NAMES[currentMonth - 1] || 'نامشخص';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
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

        {/* 2. Selected Day Header */}
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.dayBadge,
              { backgroundColor: colors.goldBg, borderColor: colors.gold },
            ]}
          >
            <CalendarDays size={13} color={colors.gold} />
            <Text
              style={[
                styles.dayBadgeText,
                { color: colors.gold, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(selectedDay)} {currentMonthName}
            </Text>
          </View>

          <View style={styles.sectionTitleRow}>
            <View style={styles.titleColumn}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                برنامه سفرهای این روز
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                {toPersianDigits(dayTrips.length)} سرویس ثبت شده
              </Text>
            </View>
            <View style={[styles.goldAccentBar, { backgroundColor: colors.gold }]} />
          </View>
        </View>

        {/* 3. Trips List (High-Density / Clean / Scrollable) */}
        {loadingDayTrips ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text
              style={[
                styles.loadingText,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              در حال دریافت سفرهای روز {toPersianDigits(selectedDay)} {currentMonthName}...
            </Text>
          </View>
        ) : dayTrips.length > 0 ? (
          <View style={styles.tripsList}>
            {dayTrips.map((trip) => (
              <DayTripCard
                key={trip.tripWorkCalendarId || `${trip.tripId}-${trip.outbound?.start}`}
                trip={trip}
                onPress={handleOpenTripModal}
              />
            ))}
          </View>
        ) : (
          /* Empty State */
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
              برای این روز سفری ثبت نشده است
            </Text>
            <Text
              style={[
                styles.emptyStateDesc,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              روز استراحت یا عدم تخصیص سرویس در سامانه رانندگان گیتی‌سیر
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 4. Luxury Trip Summary Modal */}
      <TripSummaryModal
        visible={modalVisible}
        tripId={selectedTripId}
        initialTrip={(() => {
          const matched = dayTrips.find((t) => t.tripId === selectedTripId);
          if (!matched) return null;
          return {
            tripId: matched.tripId,
            tripName: matched.tripName,
            status: matched.status,
            scheduledStartTime: matched.outbound?.start || matched.inbound?.start || '۰۰:۰۰',
            scheduledEndTime: matched.outbound?.end || matched.inbound?.end || '۰۰:۰۰',
            outboundStart: matched.outbound?.start,
            outboundEnd: matched.outbound?.end,
            outboundPrice: matched.outbound?.price || matched.inbound?.price || 0,
            licensePlate: matched.licensePlate || undefined,
            calendarDayId: matched.tripWorkCalendarId,
            serviceLocationTitle: matched.tripName,
            driverFullName: matched.driverFullName,
            totalStations: 5,
            visitedStations: matched.status === 3 ? 5 : 0,
            startedAtUtc: null,
            endedAtUtc: null,
            isReplacementAssigned: false,
            canStartTrip: false,
            canEndTrip: false,
          };
        })()}
        calendarDayId={dayTrips.find((t) => t.tripId === selectedTripId)?.tripWorkCalendarId || ''}
        onClose={handleCloseModal}
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
  },
  titleColumn: {
    alignItems: 'flex-end',
  },
  goldAccentBar: {
    width: 3.5,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 10.5,
    marginTop: 1,
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
  tripsList: {
    gap: 10,
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
