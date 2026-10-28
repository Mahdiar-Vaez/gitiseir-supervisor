import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { TodayTrip } from '@/services/api/types';
import { StatusPill } from './StatusPill';
import { getTripStatusConfig } from '@/utils/trip-status';
import { Clock, MapPin, ChevronLeft, Play, Square } from 'lucide-react-native';

interface TodayTripItemProps {
  trip: TodayTrip;
  onPress: (tripId: number) => void;
  onStartTrip?: (calendarDayId: string) => void;
  onEndTrip?: (calendarDayId: string) => void;
  isLoadingAction?: boolean;
}

export function TodayTripItem({
  trip,
  onPress,
  onStartTrip,
  onEndTrip,
  isLoadingAction = false,
}: TodayTripItemProps) {
  const { colors, isDark } = useAppTheme();

  const startTime = trip.scheduledStartTime ? trip.scheduledStartTime.slice(0, 5) : '۰۰:۰۰';
  const endTime = trip.scheduledEndTime ? trip.scheduledEndTime.slice(0, 5) : '۰۰:۰۰';

  // Map status code to StatusPill variant & label according to backend C# enum
  const statusConfig = getTripStatusConfig(trip.status);

  return (
    <Pressable
      onPress={() => onPress(trip.tripId)}
      accessibilityRole="button"
      accessibilityLabel={`سفر ${trip.tripName}`}
      style={({ pressed }) => [
        styles.itemCard,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: colors.border,
          shadowColor: colors.shadow,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* Top row: Status Pill + Scheduled Time badge */}
      <View style={styles.topRow}>
        <StatusPill status={statusConfig.status} label={statusConfig.label} />

        <View
          style={[
            styles.timeBadge,
            {
              backgroundColor: isDark ? 'rgba(212, 175, 55, 0.1)' : '#F5EEDB',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            },
          ]}
        >
          <Clock size={12} color={colors.gold} style={{ marginLeft: 4 }} />
          <Text
            style={[
              styles.timeText,
              { color: colors.gold, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {toPersianDigits(`${startTime} - ${endTime}`)}
          </Text>
        </View>
      </View>

      {/* Main content: Trip title and location */}
      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          <Text
            numberOfLines={2}
            style={[
              styles.tripTitle,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {trip.tripName}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.gold} style={{ marginLeft: 5 }} />
            <Text
              numberOfLines={2}
              style={[
                styles.locationText,
                { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              {trip.serviceLocationTitle}
            </Text>
          </View>
        </View>

        {/* Actions & Chevron */}
        <View style={styles.actionCol}>
          {trip.canStartTrip && onStartTrip ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onStartTrip(trip.calendarDayId);
              }}
              disabled={isLoadingAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  borderColor: '#10B981',
                  opacity: pressed || isLoadingAction ? 0.7 : 1,
                },
              ]}
            >
              {isLoadingAction ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <>
                  <Play size={11} color="#10B981" fill="#10B981" style={{ marginLeft: 3 }} />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: '#10B981', fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    شروع
                  </Text>
                </>
              )}
            </Pressable>
          ) : trip.canEndTrip && onEndTrip ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEndTrip(trip.calendarDayId);
              }}
              disabled={isLoadingAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderColor: '#EF4444',
                  opacity: pressed || isLoadingAction ? 0.7 : 1,
                },
              ]}
            >
              {isLoadingAction ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Square size={11} color="#EF4444" style={{ marginLeft: 3 }} />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: '#EF4444', fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    پایان
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          <View
            style={[
              styles.chevronBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
          >
            <ChevronLeft size={16} color={colors.gold} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 11,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: Spacing.sm,
  },
  tripTitle: {
    fontSize: 14.5,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
  actionCol: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
  },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
