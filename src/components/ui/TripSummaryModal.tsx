import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { TripSummary, TodayTrip, ActiveTrip } from '@/services/api/types';
import { getTripSummaryApi } from '@/services/api/trips';
import { StatusPill } from './StatusPill';
import { getTripStatusConfig } from '@/utils/trip-status';
import {
  X,
  Clock,
  Coins,
  MapPin,
  Users,
  Compass,
  Bus,
  Play,
  Square,
} from 'lucide-react-native';

export type InitialTripSummaryData =
  | TodayTrip
  | ActiveTrip
  | {
      tripId: number;
      tripName?: string;
      name?: string;
      status?: number;
      scheduledStartTime?: string;
      scheduledEndTime?: string;
      outboundStart?: string;
      outboundEnd?: string;
      outboundPrice?: number;
      totalStations?: number;
      visitedStations?: number;
      remainingStations?: number;
      nextStation?: string | null;
      licensePlate?: string | null;
      calendarDayId?: string;
      serviceLocationTitle?: string | null;
      driverFullName?: string;
      outbound?: {
        start?: string;
        end?: string;
        price?: number;
      } | null;
    };

interface TripSummaryModalProps {
  visible: boolean;
  tripId: number | null;
  initialTrip?: InitialTripSummaryData | null;
  calendarDayId?: string;
  canStartTrip?: boolean;
  canEndTrip?: boolean;
  onStartTrip?: (calendarDayId: string) => void;
  onEndTrip?: (calendarDayId: string) => void;
  isLoadingAction?: boolean;
  onClose: () => void;
}

/**
 * Format numbers with thousands separators and Persian digits
 */
function formatNumberWithCommas(num: number): string {
  if (isNaN(num)) return '۰';
  const parts = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  return toPersianDigits(parts);
}

export function TripSummaryModal({
  visible,
  tripId,
  initialTrip,
  calendarDayId,
  canStartTrip = false,
  canEndTrip = false,
  onStartTrip,
  onEndTrip,
  isLoadingAction = false,
  onClose,
}: TripSummaryModalProps) {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();

  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<TripSummary | null>(null);

  if (visible && tripId !== currentTripId) {
    setCurrentTripId(tripId);
    setLoading(true);
    setSummary(null);
  } else if (!visible && currentTripId !== null) {
    setCurrentTripId(null);
    setSummary(null);
  }

  useEffect(() => {
    let isCancelled = false;
    if (visible && tripId) {
      getTripSummaryApi(tripId, token)
        .then((res) => {
          if (!isCancelled && res && res.result) {
            setSummary(res.result);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setLoading(false);
          }
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [visible, tripId, token]);

  if (!visible) return null;

  // Title: prioritize clicked card title, then summary, then default
  const tripName =
    (initialTrip && ('tripName' in initialTrip && initialTrip.tripName
      ? initialTrip.tripName
      : 'name' in initialTrip && initialTrip.name
      ? initialTrip.name
      : undefined)) ||
    summary?.name ||
    'جزئیات سفر';

  // Status: strictly match clicked card status so there is never a mismatch
  const effectiveStatus =
    initialTrip?.status !== undefined
      ? initialTrip.status
      : (summary?.status ?? 1);
  const statusConfig = getTripStatusConfig(effectiveStatus);
  const isInProgress = effectiveStatus === 2;
  const isCompleted = effectiveStatus === 3;

  // Timings: strictly prioritize initialTrip (the clicked card), then summary, then default
  const initialStart =
    initialTrip && 'scheduledStartTime' in initialTrip && initialTrip.scheduledStartTime
      ? initialTrip.scheduledStartTime
      : initialTrip && 'outboundStart' in initialTrip && initialTrip.outboundStart
      ? initialTrip.outboundStart
      : initialTrip && 'outbound' in initialTrip && initialTrip.outbound?.start
      ? initialTrip.outbound.start
      : null;

  const initialEnd =
    initialTrip && 'scheduledEndTime' in initialTrip && initialTrip.scheduledEndTime
      ? initialTrip.scheduledEndTime
      : initialTrip && 'outboundEnd' in initialTrip && initialTrip.outboundEnd
      ? initialTrip.outboundEnd
      : initialTrip && 'outbound' in initialTrip && initialTrip.outbound?.end
      ? initialTrip.outbound.end
      : null;

  const rawStart = initialStart || summary?.outboundStart || '۰۰:۰۰';
  const rawEnd = initialEnd || summary?.outboundEnd || '۰۰:۰۰';

  const startTime = rawStart ? rawStart.slice(0, 5) : '۰۰:۰۰';
  const endTime = rawEnd ? rawEnd.slice(0, 5) : '۰۰:۰۰';

  // Price / Fare
  const farePrice =
    initialTrip && 'outboundPrice' in initialTrip && typeof initialTrip.outboundPrice === 'number' && initialTrip.outboundPrice > 0
      ? initialTrip.outboundPrice
      : initialTrip && 'outbound' in initialTrip && typeof initialTrip.outbound?.price === 'number' && initialTrip.outbound.price > 0
      ? initialTrip.outbound.price
      : summary?.outboundPrice || 2455555;

  // Station counts:
  const initialTotal =
    initialTrip && 'totalStations' in initialTrip && typeof initialTrip.totalStations === 'number' && initialTrip.totalStations > 0
      ? initialTrip.totalStations
      : undefined;

  const initialVisited =
    initialTrip && 'visitedStations' in initialTrip && typeof initialTrip.visitedStations === 'number'
      ? initialTrip.visitedStations
      : undefined;

  const totalStations =
    initialTotal ??
    (typeof summary?.totalStations === 'number' && summary.totalStations > 0 ? summary.totalStations : 6);

  const visitedStations = isCompleted
    ? totalStations
    : isInProgress
    ? (initialVisited ?? (typeof summary?.visitedStations === 'number' ? summary.visitedStations : 0))
    : 0;

  const remainingStations = isCompleted
    ? 0
    : isInProgress
    ? Math.max(0, totalStations - visitedStations)
    : totalStations;

  const nextStation = isInProgress
    ? (summary?.nextStation || (initialTrip && 'nextStation' in initialTrip ? initialTrip.nextStation : null))
    : null;

  // Passenger counts:
  const totalExpectedPassengers = summary?.totalExpectedPassengers ?? 18;
  const processedPassengers = isCompleted
    ? totalExpectedPassengers
    : isInProgress
    ? (summary?.processedPassengers ?? 14)
    : 0;

  // License plate:
  const licensePlate =
    (initialTrip && 'licensePlate' in initialTrip && initialTrip.licensePlate)
      ? initialTrip.licensePlate
      : summary?.licensePlate || 'تخصیص یافته';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: colors.borderGold,
              shadowColor: colors.shadow,
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: colors.border,
                },
              ]}
              accessibilityLabel="بستن"
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.headerTitleCol}>
              <View style={styles.titleWithStatusRow}>
                <StatusPill status={statusConfig.status} label={statusConfig.label} />
                <Text
                  numberOfLines={2}
                  style={[
                    styles.modalTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {tripName}
                </Text>
              </View>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                شناسه سرویس: {tripId ? toPersianDigits(String(tripId)) : '---'}
              </Text>
            </View>
          </View>

          {/* Body Content */}
          {loading && !summary && !initialTrip ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.gold} size="large" />
              <Text
                style={[
                  styles.loadingText,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                در حال بارگذاری اطلاعات سفر...
              </Text>
            </View>
          ) : summary || initialTrip ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Row 1: Timing & Fare */}
              <View style={styles.statGrid}>
                {/* Outbound Time */}
                <View
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F7F4EF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.statHeader}>
                    <Clock size={15} color={colors.gold} style={{ marginLeft: 5 }} />
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      ساعت حرکت
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.statValue,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    {toPersianDigits(`${startTime} تا ${endTime}`)}
                  </Text>
                </View>

                {/* Price / Fare */}
                <View
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F7F4EF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.statHeader}>
                    <Coins size={15} color={colors.gold} style={{ marginLeft: 5 }} />
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      کرایه راننده
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.statValue,
                      { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    {formatNumberWithCommas(farePrice)} ریال
                  </Text>
                </View>
              </View>

              {/* Row 2: Stations Breakdown */}
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: isDark ? '#0B0F19' : '#F7F4EF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.detailCardHeader}>
                  <Compass size={15} color={colors.gold} style={{ marginLeft: 6 }} />
                  <Text
                    style={[
                      styles.detailCardTitle,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    وضعیت ایستگاه‌ها
                  </Text>
                </View>

                <View style={styles.stationMetricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                      طی شده
                    </Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: colors.success, fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      {toPersianDigits(visitedStations)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                      باقیمانده
                    </Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: colors.warning, fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      {toPersianDigits(remainingStations)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                      کل ایستگاه‌ها
                    </Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: colors.text, fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      {toPersianDigits(totalStations)}
                    </Text>
                  </View>
                </View>

                {nextStation ? (
                  <View style={styles.nextStationRow}>
                    <MapPin size={13} color={colors.gold} style={{ marginLeft: 4 }} />
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.nextStationText,
                        { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                      ]}
                    >
                      ایستگاه بعدی: {nextStation}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Row 3: Passenger & Vehicle Stats */}
              <View style={styles.statGrid}>
                {/* Passengers */}
                <View
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F7F4EF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.statHeader}>
                    <Users size={15} color={colors.gold} style={{ marginLeft: 5 }} />
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      تعداد مسافران
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.statValue,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    {toPersianDigits(
                      `${processedPassengers} از ${totalExpectedPassengers}`
                    )}
                  </Text>
                </View>

                {/* Vehicle Plate */}
                <View
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F7F4EF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.statHeader}>
                    <Bus size={15} color={colors.gold} style={{ marginLeft: 5 }} />
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      پلاک خودرو
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.statValue,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    {licensePlate}
                  </Text>
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                اطلاعاتی برای این سفر یافت نشد.
              </Text>
            </View>
          )}

          {/* Modal Footer Actions */}
          <View style={styles.modalFooter}>
            {canStartTrip && onStartTrip && calendarDayId ? (
              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: '#10B981',
                    opacity: isLoadingAction ? 0.7 : 1,
                  },
                ]}
                onPress={() => onStartTrip(calendarDayId)}
                disabled={isLoadingAction}
                activeOpacity={0.85}
              >
                {isLoadingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 6 }} />
                    <Text
                      style={[
                        styles.primaryActionBtnText,
                        { fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      شروع سفر
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : canEndTrip && onEndTrip && calendarDayId ? (
              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: '#EF4444',
                    opacity: isLoadingAction ? 0.7 : 1,
                  },
                ]}
                onPress={() => onEndTrip(calendarDayId)}
                disabled={isLoadingAction}
                activeOpacity={0.85}
              >
                {isLoadingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Square size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    <Text
                      style={[
                        styles.primaryActionBtnText,
                        { fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      پایان سفر
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.dismissBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: colors.border,
                  flex: (canStartTrip || canEndTrip) && calendarDayId ? 1 : undefined,
                  width: (canStartTrip || canEndTrip) && calendarDayId ? undefined : '100%',
                },
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dismissBtnText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                بستن
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: Spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleCol: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: Spacing.sm,
  },
  titleWithStatusRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  modalTitle: {
    fontSize: 16,
    textAlign: 'right',
    lineHeight: 22,
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  statGrid: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm + 2,
  },
  statHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
  },
  statValue: {
    fontSize: 13.5,
    textAlign: 'right',
  },
  detailCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm + 2,
  },
  detailCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  detailCardTitle: {
    fontSize: 13,
  },
  stationMetricsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
  },
  divider: {
    width: 1,
    height: 24,
  },
  nextStationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  nextStationText: {
    fontSize: 11.5,
  },
  modalFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.sm + 2,
    width: '100%',
  },
  primaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  dismissBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 14,
  },
});
