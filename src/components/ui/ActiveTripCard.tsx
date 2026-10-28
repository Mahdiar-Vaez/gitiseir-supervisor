import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { ActiveTrip } from '@/services/api/types';
import {
  Clock,
  MapPin,
  ChevronLeft,
  LogIn,
  LogOut,
  Navigation,
  Compass,
  Square,
} from 'lucide-react-native';

interface ActiveTripCardProps {
  trip: ActiveTrip;
  onPress: (tripId: number) => void;
  onEndTrip?: (calendarDayId: string) => void;
  isEnding?: boolean;
}

export function ActiveTripCard({ trip, onPress, onEndTrip, isEnding }: ActiveTripCardProps) {
  const { colors, isDark } = useAppTheme();

  const startTime = trip.outboundStart ? trip.outboundStart.slice(0, 5) : '۰۰:۰۰';
  const endTime = trip.outboundEnd ? trip.outboundEnd.slice(0, 5) : '۰۰:۰۰';
  const progressRatio =
    trip.totalStations > 0
      ? Math.min(1, Math.max(0, trip.visitedStations / trip.totalStations))
      : 0;

  return (
    <Pressable
      onPress={() => onPress(trip.tripId)}
      accessibilityRole="button"
      accessibilityLabel={`سفر فعال ${trip.name}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: colors.gold,
          shadowColor: colors.gold,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* Top glowing gold accent line */}
      <View style={[styles.topGoldBar, { backgroundColor: colors.gold }]} />

      {/* Card Header: Live pulse badge + Entering/Exiting direction */}
      <View style={styles.headerRow}>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text
            style={[
              styles.liveText,
              { color: colors.success, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            سفر فعال
          </Text>
        </View>

        <View
          style={[
            styles.directionBadge,
            {
              backgroundColor: trip.entering
                ? 'rgba(59, 130, 246, 0.12)'
                : 'rgba(245, 158, 11, 0.12)',
              borderColor: trip.entering ? '#3B82F6' : '#F59E0B',
            },
          ]}
        >
          {trip.entering ? (
            <LogIn size={13} color="#3B82F6" style={{ marginLeft: 4 }} />
          ) : (
            <LogOut size={13} color="#F59E0B" style={{ marginLeft: 4 }} />
          )}
          <Text
            style={[
              styles.directionText,
              {
                color: trip.entering ? '#3B82F6' : '#F59E0B',
                fontFamily: Typography.fontFamily.bold,
              },
            ]}
          >
            {trip.entering ? 'ورود' : 'خروج'}
          </Text>
        </View>
      </View>

      {/* Trip Title & Location */}
      <View style={styles.titleSection}>
        <Text
          style={[
            styles.tripName,
            { color: colors.text, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          {trip.name}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={15} color={colors.gold} style={{ marginLeft: 6 }} />
          <Text
            style={[
              styles.locationTitle,
              { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {trip.serviceLocationTitle}
          </Text>
        </View>
      </View>

      {/* Timings & Stations Info Grid */}
      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: isDark ? '#0B0F19' : '#F7F4EF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.timeItem}>
          <Clock size={15} color={colors.gold} style={{ marginLeft: 6 }} />
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
            بازه حرکتی:
          </Text>
          <Text
            style={[
              styles.infoValue,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {toPersianDigits(`${startTime} تا ${endTime}`)}
          </Text>
        </View>

        <View style={styles.stationItem}>
          <Compass size={15} color={colors.gold} style={{ marginLeft: 6 }} />
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
            ایستگاه‌ها:
          </Text>
          <Text
            style={[
              styles.infoValue,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {toPersianDigits(`${trip.visitedStations} از ${trip.totalStations}`)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {trip.totalStations > 0 && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.gold,
                  width: `${Math.round(progressRatio * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Footer hint & Actions */}
      <View style={styles.footerRow}>
        <View style={styles.footerHint}>
          <Navigation size={13} color={colors.gold} style={{ marginLeft: 4 }} />
          <Text
            style={[
              styles.footerText,
              { color: colors.gold, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            مشاهده جزئیات
          </Text>
        </View>

        <View style={styles.footerActions}>
          {onEndTrip && trip.calendarDayId && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEndTrip(trip.calendarDayId!);
              }}
              disabled={isEnding}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.endTripBtn,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderColor: '#EF4444',
                  opacity: pressed || isEnding ? 0.7 : 1,
                },
              ]}
            >
              {isEnding ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Square size={12} color="#EF4444" style={{ marginLeft: 4 }} />
                  <Text
                    style={[
                      styles.endTripBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    پایان سفر
                  </Text>
                </>
              )}
            </Pressable>
          )}
          <ChevronLeft size={16} color={colors.gold} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  topGoldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveText: {
    fontSize: 11,
  },
  directionBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  directionText: {
    fontSize: 11,
  },
  titleSection: {
    alignItems: 'flex-start',
    marginBottom: Spacing.sm + 2,
  },
  tripName: {
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 4,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 13,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.xs,
  },
  timeItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  stationItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11.5,
    fontFamily: Typography.fontFamily.regular,
    marginLeft: 4,
  },
  infoValue: {
    fontSize: 12.5,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  footerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  footerHint: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11.5,
  },
  footerActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  endTripBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  endTripBtnText: {
    fontSize: 12,
    color: '#EF4444',
  },
});
