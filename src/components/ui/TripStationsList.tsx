import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  CheckCircle2,
  Clock,
  Users,
  Navigation,
  MapPin,
  Check,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '@/constants/theme';
import { TripStation } from '@/services/api/types';
import { toPersianDigits } from '@/utils/persian-digits';

interface StationRowProps {
  station: TripStation;
  isLast: boolean;
  submitting: boolean;
  onVisit: (station: TripStation) => void;
}

function StationRow({ station, isLast, submitting, onVisit }: StationRowProps) {
  const { colors, isDark } = useAppTheme();
  const isVisited = Boolean(station.isVisited);

  // Time format: display HH:MM
  const timeDisplay = station.estimatedArrivalTime
    ? station.estimatedArrivalTime.slice(0, 5)
    : null;

  return (
    <View style={styles.stationRowContainer}>
      {/* Right Column: Timeline vertical connector and order badge */}
      <View style={styles.timelineCol}>
        <View
          style={[
            styles.orderBadge,
            {
              backgroundColor: isVisited
                ? colors.successBg
                : isDark
                ? '#1E293B'
                : '#F1F5F9',
              borderColor: isVisited ? colors.success : colors.borderGold,
            },
          ]}
        >
          {isVisited ? (
            <Check size={14} color={colors.success} strokeWidth={3} />
          ) : (
            <Text
              style={[
                styles.orderText,
                {
                  color: colors.gold,
                  fontFamily: Typography.fontFamily.bold,
                },
              ]}
            >
              {toPersianDigits(station.stopOrder)}
            </Text>
          )}
        </View>

        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              {
                backgroundColor: isVisited ? colors.success : colors.border,
              },
            ]}
          />
        )}
      </View>

      {/* Main Card: Station Details and Visit Action */}
      <View
        style={[
          styles.stationCard,
          {
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderColor: isVisited ? 'rgba(52, 211, 153, 0.3)' : colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.stationHeader}>
          <View style={styles.stationTitleCol}>
            <Text
              numberOfLines={2}
              style={[
                styles.stationTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {station.title}
            </Text>

            {station.description ? (
              <Text
                numberOfLines={2}
                style={[
                  styles.stationDesc,
                  {
                    color: colors.textMuted,
                    fontFamily: Typography.fontFamily.regular,
                  },
                ]}
              >
                {station.description}
              </Text>
            ) : null}
          </View>

          {/* Action: Visit Button or Completed Badge */}
          {isVisited ? (
            <View
              style={[
                styles.visitedBadge,
                {
                  backgroundColor: colors.successBg,
                  borderColor: colors.success,
                },
              ]}
            >
              <CheckCircle2 size={13} color={colors.success} />
              <Text
                style={[
                  styles.visitedBadgeText,
                  { color: colors.success, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                ثبت شد
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => onVisit(station)}
              disabled={submitting}
              activeOpacity={0.8}
              style={[
                styles.visitBtn,
                {
                  backgroundColor: colors.goldBg,
                  borderColor: colors.gold,
                  opacity: submitting ? 0.6 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.gold} />
              ) : (
                <>
                  <Navigation size={13} color={colors.gold} />
                  <Text
                    style={[
                      styles.visitBtnText,
                      { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    ثبت تردد
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Badges Row: Time, Passengers, Geofence */}
        <View style={styles.badgesRow}>
          {timeDisplay ? (
            <View
              style={[
                styles.miniChip,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Clock size={11} color={colors.textMuted} />
              <Text
                style={[
                  styles.miniChipText,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                {toPersianDigits(timeDisplay)}
              </Text>
            </View>
          ) : null}

          {station.expectedPassengerCount !== undefined &&
          station.expectedPassengerCount !== null ? (
            <View
              style={[
                styles.miniChip,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Users size={11} color={colors.textMuted} />
              <Text
                style={[
                  styles.miniChipText,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                {toPersianDigits(station.expectedPassengerCount)} مسافر
              </Text>
            </View>
          ) : null}

          {station.geofenceRadiusMeters ? (
            <View
              style={[
                styles.miniChip,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <MapPin size={11} color={colors.textMuted} />
              <Text
                style={[
                  styles.miniChipText,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                محدوده: {toPersianDigits(station.geofenceRadiusMeters)} متر
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

interface TripStationsListProps {
  stations: TripStation[];
  loading?: boolean;
  submittingStationId?: number | null;
  onVisitStation: (station: TripStation) => void;
}

export function TripStationsList({
  stations,
  loading = false,
  submittingStationId = null,
  onVisitStation,
}: TripStationsListProps) {
  const { colors, isDark } = useAppTheme();

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text
          style={[
            styles.stateText,
            { color: colors.textMuted, fontFamily: Typography.fontFamily.medium },
          ]}
        >
          در حال بارگذاری لیست ایستگاه‌ها...
        </Text>
      </View>
    );
  }

  if (!stations || stations.length === 0) {
    return (
      <View
        style={[
          styles.emptyBox,
          {
            backgroundColor: isDark ? '#111827' : '#F8FAFC',
            borderColor: colors.border,
          },
        ]}
      >
        <MapPin size={24} color={colors.textMuted} style={{ opacity: 0.6 }} />
        <Text
          style={[
            styles.emptyText,
            { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
          ]}
        >
          ایستگاهی برای این مسیر ثبت نشده است.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {stations.map((st, index) => (
        <StationRow
          key={st.tripStationId}
          station={st}
          isLast={index === stations.length - 1}
          submitting={submittingStationId === st.tripStationId}
          onVisit={onVisitStation}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  stationRowContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    gap: 10,
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  orderText: {
    fontSize: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 2,
  },
  stationCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 10,
  },
  stationHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  stationTitleCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  stationTitle: {
    fontSize: 13.5,
    textAlign: 'right',
  },
  stationDesc: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  visitedBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  visitedBadgeText: {
    fontSize: 11,
  },
  visitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  visitBtnText: {
    fontSize: 11.5,
  },
  badgesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  miniChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  miniChipText: {
    fontSize: 10.5,
  },
  stateContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
});
