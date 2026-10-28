import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { AppHeader } from '@/components/ui/AppHeader';
import { TripCard } from '@/components/ui/TripCard';
import { QuickAccessGrid } from '@/components/ui/QuickAccessGrid';
import { ActiveTripCard } from '@/components/ui/ActiveTripCard';
import { TodayTripItem } from '@/components/ui/TodayTripItem';
import { TripSummaryModal } from '@/components/ui/TripSummaryModal';
import { DriverRatingBanner } from '@/components/ui/DriverRatingBanner';
import { DriverRatingsModal } from '@/components/ui/DriverRatingsModal';
import { SosEmergencyModal } from '@/components/ui/SosEmergencyModal';
import { ManagementContactModal } from '@/components/ui/ManagementContactModal';
import { ActiveTrip, TodayTrip } from '@/services/api/types';
import {
  getActiveTripApi,
  getTodayTripsApi,
  startTripApi,
  endTripApi,
} from '@/services/api/trips';
import { getCurrentCoordinates } from '@/services/location/gps';
import { Calendar } from 'lucide-react-native';

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();
  const scrollViewRef = useRef<any>(null);
  const scheduleLayoutY = useRef<number>(0);

  const [loadingTrips, setLoadingTrips] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [todayTrips, setTodayTrips] = useState<TodayTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TodayTrip | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  // Modals state
  const [ratingsModalVisible, setRatingsModalVisible] = useState<boolean>(false);
  const [sosModalVisible, setSosModalVisible] = useState<boolean>(false);
  const [managementModalVisible, setManagementModalVisible] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadTrips = async () => {
      try {
        const [activeRes, todayRes] = await Promise.all([
          getActiveTripApi(token),
          getTodayTripsApi(token),
        ]);

        if (!isCancelled) {
          if (activeRes && activeRes.result) {
            setActiveTrip(activeRes.result);
          } else {
            setActiveTrip(null);
          }

          if (todayRes && todayRes.result) {
            setTodayTrips(todayRes.result);
          } else {
            setTodayTrips([]);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch driver trips:', err);
      } finally {
        if (!isCancelled) {
          setLoadingTrips(false);
          setRefreshing(false);
        }
      }
    };

    loadTrips();

    return () => {
      isCancelled = true;
    };
  }, [token, refreshIndex]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const handleScrollToSchedule = () => {
    scrollViewRef.current?.scrollTo({
      y: scheduleLayoutY.current,
      animated: true,
    });
  };

  const handleStartTrip = async (calendarDayId: string) => {
    try {
      setActionLoadingId(calendarDayId);
      const coords = await getCurrentCoordinates();
      const res = await startTripApi(calendarDayId, coords, token);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics optional
      }
      Alert.alert('شروع سفر', res.message || 'سفر با موفقیت آغاز شد.');
      setRefreshIndex((prev) => prev + 1);
    } catch (err: any) {
      Alert.alert('خطا', err?.message || 'خطا در ثبت شروع سفر');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEndTrip = async (calendarDayId: string) => {
    Alert.alert(
      'پایان سفر',
      'آیا از اتمام این سفر اطمینان دارید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بله، پایان سفر',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(calendarDayId);
              const coords = await getCurrentCoordinates();
              const res = await endTripApi(calendarDayId, coords, token);
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {
                // Haptics optional
              }
              Alert.alert('پایان سفر', res.message || 'سفر با موفقیت به پایان رسید.');
              setRefreshIndex((prev) => prev + 1);
            } catch (err: any) {
              Alert.alert('خطا', err?.message || 'خطا در ثبت پایان سفر');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenTripSummary = (tripId: number) => {
    setSelectedTripId(tripId);
    if (activeTrip && activeTrip.tripId === tripId) {
      setSelectedTrip(null);
    } else {
      const matched = todayTrips.find((t) => t.tripId === tripId);
      setSelectedTrip(matched || null);
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTripId(null);
    setSelectedTrip(null);
  };

  const activeCalendarDayId =
    activeTrip?.calendarDayId ||
    todayTrips.find((t) => t.tripId === activeTrip?.tripId)?.calendarDayId ||
    (todayTrips.length > 0 ? todayTrips[0].calendarDayId : undefined);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        ref={scrollViewRef}
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
        {/* 1. Driver Rating & Passenger Survey Hero Banner */}
        <DriverRatingBanner onPress={() => setRatingsModalVisible(true)} />

        {/* 2. Quick Access 8-Box Grid (دسترسی سریع) */}
        <QuickAccessGrid
          onScrollToSchedule={handleScrollToSchedule}
          onOpenSos={() => setSosModalVisible(true)}
          onOpenManagement={() => setManagementModalVisible(true)}
          onOpenRatings={() => setRatingsModalVisible(true)}
        />

        {/* 3. Active Trip Card or Hero Fallback */}
        {activeTrip ? (
          <ActiveTripCard
            trip={{
              ...activeTrip,
              calendarDayId: activeCalendarDayId,
            }}
            onPress={handleOpenTripSummary}
            onEndTrip={activeCalendarDayId ? handleEndTrip : undefined}
            isEnding={actionLoadingId === activeCalendarDayId}
          />
        ) : (
          <TripCard />
        )}

        {/* 4. Today's Schedule Section (برنامه امروز) */}
        <View
          style={styles.sectionHeader}
          onLayout={(event) => {
            scheduleLayoutY.current = event.nativeEvent.layout.y;
          }}
        >
          {/* Left: View All Link */}
          <Pressable
            onPress={() => router.navigate('/calendar' as any)}
            hitSlop={8}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text
              style={[
                styles.viewAllText,
                { color: colors.gold, fontFamily: Typography.fontFamily.medium },
              ]}
            >
              مشاهده همه
            </Text>
          </Pressable>

          {/* Right: Section Title & Subtitle */}
          <View style={styles.sectionTitleRow}>
            <View style={styles.titleColumn}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                برنامه امروز
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  {
                    color: colors.textMuted,
                    fontFamily: Typography.fontFamily.regular,
                  },
                ]}
              >
                {toPersianDigits(todayTrips.length)} سفر برنامه‌ریزی شده
              </Text>
            </View>
            <View style={[styles.goldAccentBar, { backgroundColor: colors.gold }]} />
          </View>
        </View>

        {/* Schedule List */}
        <View style={styles.scheduleList}>
          {loadingTrips && todayTrips.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text
                style={[
                  styles.loadingText,
                  {
                    color: colors.textMuted,
                    fontFamily: Typography.fontFamily.regular,
                  },
                ]}
              >
                در حال دریافت سفرهای امروز...
              </Text>
            </View>
          ) : todayTrips.length > 0 ? (
            todayTrips.map((trip) => (
              <TodayTripItem
                key={trip.tripId}
                trip={trip}
                onPress={handleOpenTripSummary}
                onStartTrip={handleStartTrip}
                onEndTrip={handleEndTrip}
                isLoadingAction={actionLoadingId === trip.calendarDayId}
              />
            ))
          ) : (
            <View
              style={[
                styles.emptyScheduleCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <Calendar size={28} color={colors.gold} style={{ opacity: 0.8 }} />
              <Text
                style={[
                  styles.emptyScheduleTitle,
                  {
                    color: colors.text,
                    fontFamily: Typography.fontFamily.bold,
                  },
                ]}
              >
                سفری برای امروز ثبت نشده است
              </Text>
              <Text
                style={[
                  styles.emptyScheduleSubtitle,
                  {
                    color: colors.textMuted,
                    fontFamily: Typography.fontFamily.regular,
                  },
                ]}
              >
                در صورت تخصیص سفر جدید، در این بخش نمایش داده خواهد شد
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 5. Minimal Luxury Trip Summary Modal */}
      <TripSummaryModal
        visible={modalVisible}
        tripId={selectedTripId}
        initialTrip={
          activeTrip?.tripId === selectedTripId
            ? activeTrip
            : (selectedTrip || todayTrips.find((t) => t.tripId === selectedTripId) || null)
        }
        calendarDayId={
          activeTrip?.tripId === selectedTripId
            ? activeCalendarDayId
            : (selectedTrip?.calendarDayId || activeCalendarDayId)
        }
        canStartTrip={
          activeTrip?.tripId === selectedTripId
            ? false
            : (selectedTrip?.canStartTrip ?? false)
        }
        canEndTrip={
          activeTrip?.tripId === selectedTripId
            ? true
            : (selectedTrip?.canEndTrip ?? false)
        }
        onStartTrip={(id) => {
          handleCloseModal();
          handleStartTrip(id);
        }}
        onEndTrip={(id) => {
          handleCloseModal();
          handleEndTrip(id);
        }}
        isLoadingAction={
          actionLoadingId ===
          (activeTrip?.tripId === selectedTripId
            ? activeCalendarDayId
            : selectedTrip?.calendarDayId || activeCalendarDayId)
        }
        onClose={handleCloseModal}
      />

      {/* 6. Emergency SOS Assistance Modal */}
      <SosEmergencyModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
      />

      {/* 7. Direct Management Contact Modal */}
      <ManagementContactModal
        visible={managementModalVisible}
        onClose={() => setManagementModalVisible(false)}
      />

      {/* 8. Driver Ratings & Passenger Feedback Modal */}
      <DriverRatingsModal
        visible={ratingsModalVisible}
        onClose={() => setRatingsModalVisible(false)}
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
    marginTop: 4,
  },
  viewAllText: {
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
  scheduleList: {
    gap: 8,
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
  emptyScheduleCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyScheduleTitle: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  emptyScheduleSubtitle: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 18,
  },
});
