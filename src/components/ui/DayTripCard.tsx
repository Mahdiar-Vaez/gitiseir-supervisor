import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { StatusPill } from './StatusPill';
import { getTripStatusConfig } from '@/utils/trip-status';
import { DayTripGridItem } from '@/services/api/types';
import { Clock, Coins, Car, UserCheck, ChevronLeft } from 'lucide-react-native';

interface DayTripCardProps {
  trip: DayTripGridItem;
  onPress: (tripId: number) => void;
}

/**
 * Format numbers with thousands separators and Persian digits
 */
function formatPrice(amount?: number | null): string {
  if (amount === undefined || amount === null) return '۰';
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  return toPersianDigits(formatted);
}

export function DayTripCard({ trip, onPress }: DayTripCardProps) {
  const { colors, isDark } = useAppTheme();

  const statusConfig = getTripStatusConfig(trip.status);
  const timing = trip.outbound || trip.inbound;
  const startTime = timing?.start ? timing.start.slice(0, 5) : '۰۰:۰۰';
  const endTime = timing?.end ? timing.end.slice(0, 5) : '۰۰:۰۰';
  const price = timing?.price ?? 0;

  const vehicleInfo = [
    trip.carType,
    trip.carBodyColor,
    trip.licensePlate,
  ]
    .filter(Boolean)
    .join(' - ');

  return (
    <Pressable
      onPress={() => onPress(trip.tripId)}
      accessibilityRole="button"
      accessibilityLabel={`سفر ${trip.tripName}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: colors.border,
          shadowColor: colors.shadow,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* Top Header: Title, ID & Status Badge */}
      <View style={styles.headerRow}>
        <StatusPill status={statusConfig.status} label={statusConfig.label} />

        <View style={styles.titleCol}>
          <Text
            numberOfLines={2}
            style={[
              styles.tripTitle,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {trip.tripName}
          </Text>
          <Text
            style={[
              styles.tripCode,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            شناسه: {toPersianDigits(trip.tripId)}
          </Text>
        </View>
      </View>

      {/* Middle Row: Timing & Fare Box */}
      <View
        style={[
          styles.timePriceBox,
          {
            backgroundColor: isDark ? '#0B0F19' : '#F7F4EF',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Right: Timing */}
        <View style={styles.metaCol}>
          <View style={styles.iconTextRow}>
            <Clock size={13} color={colors.gold} />
            <Text
              style={[
                styles.metaLabel,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              ساعت حرکت:
            </Text>
          </View>
          <Text
            style={[
              styles.metaValue,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {toPersianDigits(`${startTime} تا ${endTime}`)}
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.boxDivider, { backgroundColor: colors.border }]} />

        {/* Left: Price */}
        <View style={styles.metaCol}>
          <View style={styles.iconTextRow}>
            <Coins size={13} color={colors.gold} />
            <Text
              style={[
                styles.metaLabel,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              کرایه راننده:
            </Text>
          </View>
          <Text
            style={[
              styles.metaValuePrice,
              { color: colors.gold, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {formatPrice(price)} ریال
          </Text>
        </View>
      </View>

      {/* Vehicle Info Row */}
      {vehicleInfo ? (
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleInfoGroup}>
            <Car size={13} color={colors.textSecondary} />
            <Text
              numberOfLines={1}
              style={[
                styles.vehicleText,
                { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
              ]}
            >
              {vehicleInfo}
            </Text>
          </View>

          <View style={styles.moreAction}>
            <Text
              style={[
                styles.detailsLink,
                { color: colors.gold, fontFamily: Typography.fontFamily.medium },
              ]}
            >
              جزئیات
            </Text>
            <ChevronLeft size={14} color={colors.gold} />
          </View>
        </View>
      ) : null}

      {/* Temporary Driver Banner (If replacement driver assigned) */}
      {trip.hasTemporaryDriver && trip.temporaryDriver && (
        <View
          style={[
            styles.tempDriverBanner,
            {
              backgroundColor: isDark
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <View style={styles.tempDriverHeader}>
            <UserCheck size={14} color="#F59E0B" />
            <Text
              style={[
                styles.tempDriverTitle,
                { color: '#F59E0B', fontFamily: Typography.fontFamily.bold },
              ]}
            >
              راننده جایگزین: {trip.temporaryDriver.name} {trip.temporaryDriver.family}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.tempDriverSub,
              { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            تماس: {trip.temporaryDriver.phoneNumber}
            {trip.temporaryDriver.reason ? ` • دلیل: ${trip.temporaryDriver.reason}` : ''}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md - 2,
    gap: Spacing.sm,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tripTitle: {
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },
  tripCode: {
    fontSize: 10.5,
    marginTop: 2,
  },
  timePriceBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  metaCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
  },
  boxDivider: {
    width: 1,
    height: '70%',
    marginHorizontal: Spacing.sm,
  },
  iconTextRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 10.5,
  },
  metaValue: {
    fontSize: 12,
  },
  metaValuePrice: {
    fontSize: 12.5,
  },
  vehicleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  vehicleInfoGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  vehicleText: {
    fontSize: 11,
    textAlign: 'right',
  },
  moreAction: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  detailsLink: {
    fontSize: 11,
  },
  tempDriverBanner: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm - 2,
    gap: 2,
    marginTop: 2,
  },
  tempDriverHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  tempDriverTitle: {
    fontSize: 11.5,
    textAlign: 'right',
  },
  tempDriverSub: {
    fontSize: 10.5,
    textAlign: 'right',
  },
});
