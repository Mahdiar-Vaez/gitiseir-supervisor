import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits, formatDistance } from '@/utils/persian-digits';
import { PrimaryButton } from './PrimaryButton';
import {
  Clock,
  ArrowLeft,
  Play,
  Square,
  RotateCcw,
  Navigation,
  Bus,
} from 'lucide-react-native';

export type TripState = 'ready' | 'in_progress' | 'completed';

export interface TripData {
  id: string;
  originCity: string;
  originDetail: string;
  destCity: string;
  destDetail: string;
  departureTime: string;
  distanceKm: number;
  passengerCount: number;
  routeCode: string;
}

interface TripCardProps {
  initialTrip?: TripData;
  onStateChange?: (newState: TripState) => void;
}

export function TripCard({
  initialTrip = {
    id: 'GS-8942',
    originCity: 'تهران',
    originDetail: 'پایانه بیهقی',
    destCity: 'رشت',
    destDetail: 'پایانه گیل',
    departureTime: '۰۸:۰۰',
    distanceKm: 325,
    passengerCount: 24,
    routeCode: 'سرویس شماره ۸۹۴۲',
  },
  onStateChange,
}: TripCardProps) {
  const { colors } = useAppTheme();
  const [tripState, setTripState] = useState<TripState>('ready');
  const [startTime, setStartTime] = useState<string | null>(null);

  const handleAction = () => {
    if (tripState === 'ready') {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      setStartTime(toPersianDigits(timeStr));
      setTripState('in_progress');
      onStateChange?.('in_progress');
    } else if (tripState === 'in_progress') {
      setTripState('completed');
      onStateChange?.('completed');
    } else {
      setTripState('ready');
      setStartTime(null);
      onStateChange?.('ready');
    }
  };

  const getHeaderInfo = () => {
    switch (tripState) {
      case 'ready':
        return {
          title: 'سفر بعدی شما',
          color: colors.gold,
          statusText: 'آماده حرکت',
          pillStatus: 'warning' as const,
        };
      case 'in_progress':
        return {
          title: 'سفر در حال انجام',
          color: colors.success,
          statusText: 'فعال',
          pillStatus: 'success' as const,
        };
      case 'completed':
        return {
          title: 'سفر با موفقیت پایان یافت',
          color: colors.gold,
          statusText: 'پایان یافته',
          pillStatus: 'success' as const,
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: tripState === 'in_progress' ? colors.success : colors.borderGold,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Top Header of Card */}
      <View style={styles.headerRow}>
        {/* Left: Transport Mode Badge or Status */}
        <View
          style={[
            styles.transportBadge,
            { backgroundColor: colors.cardSubtle, borderColor: colors.border },
          ]}
        >
          <Bus size={18} color={colors.gold} />
        </View>

        {/* Right: Title & Subtitle */}
        <View style={styles.titleWrapper}>
          <View style={styles.titleWithDot}>
            <View style={[styles.goldDot, { backgroundColor: colors.gold }]} />
            <Text
              style={[
                styles.cardTitle,
                { color: header.color, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {header.title}
            </Text>
          </View>
          <Text
            style={[
              styles.routeCode,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            {toPersianDigits(initialTrip.routeCode)}
          </Text>
        </View>
      </View>

      {/* Origin -> Destination Horizontal Luxury Track */}
      <View style={[styles.routeSection, { backgroundColor: colors.cardSubtle }]}>
        {/* Origin (Right) */}
        <View style={styles.cityColumnRight}>
          <Text
            numberOfLines={1}
            style={[
              styles.cityName,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {initialTrip.originCity}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.cityDetail,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            {initialTrip.originDetail}
          </Text>
        </View>

        {/* Center Track Arrow */}
        <View style={styles.routeTrackCenter}>
          <View
            style={[
              styles.trackLine,
              { backgroundColor: colors.border, borderColor: colors.border },
            ]}
          />
          <View
            style={[
              styles.arrowBadge,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ArrowLeft size={12} color={colors.gold} />
          </View>
        </View>

        {/* Destination (Left) */}
        <View style={styles.cityColumnLeft}>
          <Text
            numberOfLines={1}
            style={[
              styles.cityName,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {initialTrip.destCity}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.cityDetail,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            {initialTrip.destDetail}
          </Text>
        </View>
      </View>

      {/* Trip Meta: Departure Time & Distance */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Clock size={14} color={colors.gold} />
          <Text
            style={[
              styles.metaLabel,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            حرکت:
          </Text>
          <Text
            style={[
              styles.metaValue,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {toPersianDigits(initialTrip.departureTime)}
          </Text>
        </View>

        <View style={[styles.metaDivider, { backgroundColor: colors.borderSubtle }]} />

        <View style={styles.metaItem}>
          <Navigation size={14} color={colors.gold} />
          <Text
            style={[
              styles.metaLabel,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            مسافت:
          </Text>
          <Text
            style={[
              styles.metaValue,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {formatDistance(initialTrip.distanceKm)}
          </Text>
        </View>
      </View>

      {/* In-progress start timestamp display */}
      {tripState === 'in_progress' && startTime && (
        <View
          style={[
            styles.inProgressNotice,
            { backgroundColor: colors.successBg, borderColor: colors.success },
          ]}
        >
          <Clock size={12} color={colors.success} />
          <Text
            style={[
              styles.inProgressText,
              { color: colors.success, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            حرکت در ساعت {startTime} ثبت گردید • موقعیت فعال
          </Text>
        </View>
      )}

      {/* Primary Action Button */}
      <View style={styles.actionContainer}>
        {tripState === 'ready' && (
          <PrimaryButton
            label="ثبت شروع سفر"
            variant="gold"
            icon={Play}
            size="normal"
            onPress={handleAction}
          />
        )}

        {tripState === 'in_progress' && (
          <PrimaryButton
            label="پایان سفر (ثبت زمان فعلی)"
            variant="success"
            icon={Square}
            size="normal"
            onPress={handleAction}
          />
        )}

        {tripState === 'completed' && (
          <PrimaryButton
            label="شروع سفر جدید"
            variant="outline"
            icon={RotateCcw}
            size="normal"
            onPress={handleAction}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.2,
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  transportBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    alignItems: 'flex-end',
  },
  titleWithDot: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
  },
  cardTitle: {
    fontSize: 14.5,
  },
  routeCode: {
    fontSize: 10.5,
    marginTop: 2,
  },
  routeSection: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cityColumnRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  cityColumnLeft: {
    alignItems: 'flex-start',
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  cityDetail: {
    fontSize: 11,
    marginTop: 2,
  },
  routeTrackCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 80,
    position: 'relative',
  },
  arrowBadge: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  trackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  metaLabel: {
    fontSize: 11,
  },
  metaValue: {
    fontSize: 12,
  },
  metaDivider: {
    width: 1,
    height: 14,
  },
  inProgressNotice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    justifyContent: 'center',
  },
  inProgressText: {
    fontSize: 11,
  },
  actionContainer: {
    marginTop: 2,
  },
});
