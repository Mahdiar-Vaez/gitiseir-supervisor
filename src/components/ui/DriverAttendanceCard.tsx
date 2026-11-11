import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Repeat,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Copy,
  X,
  Navigation,
  UserCheck,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TodayDriverItem, ArrivalStatus } from '@/services/api/types';
import { toPersianDigits } from '@/utils/persian-digits';
import { formatUtcToIranTime } from '@/utils/jalali';

interface DriverAttendanceCardProps {
  item: TodayDriverItem;
  isProcessingGps?: boolean;
  isExceptionHighlight?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (item: TodayDriverItem) => void;
  onPressArrivalAction: (item: TodayDriverItem, targetStatus: ArrivalStatus) => void;
  onPressLangiAction: (item: TodayDriverItem) => void;
}

function formatUtcTimeOnly(utcStr?: string | null): string {
  const iranTime = formatUtcToIranTime(utcStr);
  return iranTime ? toPersianDigits(iranTime) : '';
}

function formatStationVisitedTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
    const iranTime = formatUtcToIranTime(trimmed);
    return iranTime ? toPersianDigits(iranTime) : '';
  }
  const match = trimmed.match(/T(\d{2}:\d{2})/);
  return match ? toPersianDigits(match[1]) : '';
}

export function DriverAttendanceCard({
  item,
  isProcessingGps = false,
  isExceptionHighlight = false,
  selectable = false,
  isSelected = false,
  onToggleSelect,
  onPressArrivalAction,
  onPressLangiAction,
}: DriverAttendanceCardProps) {
  const { colors, isDark } = useAppTheme();
  const { showSuccess, showError } = useToast();

  const [stationsExpanded, setStationsExpanded] = useState<boolean>(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState<boolean>(false);

  const phoneToDisplay =
    item.driverPhone ||
    item.plannedDriverMobile ||
    item.actualDriverMobile ||
    '';

  const handleCopyPhone = async () => {
    if (!phoneToDisplay) {
      showError('شماره تماسی برای این راننده ثبت نشده است.', 'عدم وجود شماره');
      return;
    }
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(phoneToDisplay);
      } else if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
        await (navigator as any).clipboard.writeText(phoneToDisplay);
      }
      showSuccess(
        `شماره ${toPersianDigits(phoneToDisplay)} در حافظه کپی شد.`,
        'کپی شماره تماس'
      );
      setPhoneModalVisible(false);
    } catch {
      showSuccess(
        `شماره تماس راننده: ${toPersianDigits(phoneToDisplay)}`,
        'شماره تماس'
      );
    }
  };

  const handleCallDriver = (phone: string) => {
    if (!phone) {
      showError('شماره تماسی برای این راننده ثبت نشده است.', 'عدم وجود شماره');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  // Supervisor confirmation status meta
  const isSupervisorFinalized =
    item.isConfirmedBySupervisor ||
    item.arrivalStatus === 'arrived' ||
    item.arrivalStatus === 'not_arrived';

  const getSupervisorStatusMeta = () => {
    if (item.arrivalStatus === 'not_arrived' || item.executionStatus === 4) {
      return {
        label: 'ثبت نرسیدن (غیبت)',
        bg: colors.dangerBg,
        color: colors.danger,
        borderColor: colors.danger,
        Icon: XCircle,
      };
    }
    if (item.isConfirmedBySupervisor || item.arrivalStatus === 'arrived') {
      return {
        label: 'تأیید شده سرشوفر',
        bg: colors.successBg,
        color: colors.success,
        borderColor: colors.success,
        Icon: CheckCircle2,
      };
    }
    return {
      label: 'تأیید نشده سرشوفر',
      bg: colors.goldBg,
      color: colors.gold,
      borderColor: colors.borderGold,
      Icon: Clock,
    };
  };

  // Driver execution & self-arrival status meta (so supervisor ALWAYS sees what the driver did)
  const getDriverExecutionMeta = () => {
    const startTimeStr = formatUtcTimeOnly(item.startedAtUtc);
    const endTimeStr = formatUtcTimeOnly(item.endedAtUtc);

    if (item.executionStatus === 4) {
      return {
        title: 'وضعیت راننده: عدم حضور در مبدأ سرویس',
        detail: item.supervisorNote || 'غیبت راننده ثبت شده است',
        color: colors.danger,
        bg: 'rgba(244, 63, 94, 0.1)',
        borderColor: 'rgba(244, 63, 94, 0.35)',
      };
    }

    if (item.executionStatus === 3 || Boolean(item.endedAtUtc)) {
      const timeRange =
        startTimeStr && endTimeStr
          ? ` (شروع: ${startTimeStr} • پایان: ${endTimeStr})`
          : endTimeStr
          ? ` (پایان در ساعت ${endTimeStr})`
          : '';
      return {
        title: `وضعیت راننده: سفر پایان یافته و تکمیل شد ✓${timeRange}`,
        detail: item.driverConfirmedArrival
          ? 'راننده حضور و پایان سفر را در اپلیکیشن ثبت کرده است'
          : 'پایان سفر توسط راننده ثبت شده است',
        color: colors.success,
        bg: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
      };
    }

    if (item.executionStatus === 1 || (Boolean(item.startedAtUtc) && !item.endedAtUtc)) {
      const timeInfo = startTimeStr ? ` (شروع در ساعت ${startTimeStr})` : '';
      return {
        title: `وضعیت راننده: سفر شروع شده و در حال اجراست${timeInfo}`,
        detail: item.driverConfirmedArrival
          ? 'راننده اعلام حضور و شروع سفر را ثبت کرده است'
          : 'راننده در مسیر ایستگاه‌ها در حال حرکت است',
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.12)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
      };
    }

    if (item.driverConfirmedArrival) {
      return {
        title: 'وضعیت راننده: راننده اعلام حضور کرده است ✓',
        detail: 'راننده در اپلیکیشن خود رسیدن به مبدأ را ثبت کرده است',
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.12)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
      };
    }

    return {
      title: 'وضعیت راننده: در انتظار شروع سفر توسط راننده',
      detail: 'راننده هنوز شروع یا اعلام حضور را ثبت نکرده است',
      color: colors.textSecondary,
      bg: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
      borderColor: colors.border,
    };
  };

  const statusMeta = getSupervisorStatusMeta();
  const StatusIcon = statusMeta.Icon;
  const driverExecMeta = getDriverExecutionMeta();

  const progress = item.progress;
  const totalStations = progress?.totalStations ?? 0;
  const visitedStations = progress?.visitedStations ?? 0;
  const progressPercent =
    progress?.progressPercent !== undefined
      ? Math.min(100, Math.max(0, Math.round(progress.progressPercent)))
      : totalStations > 0
      ? Math.min(100, Math.round((visitedStations / totalStations) * 100))
      : 0;

  const isAbsentDriver =
    isExceptionHighlight ||
    item.arrivalStatus === 'not_arrived' ||
    item.executionStatus === 4;

  const isDelayedDriver = Boolean(
    item.isDelayed || (item.delayMinutes && item.delayMinutes > 0)
  );

  const isArrivedConfirmed =
    (item.arrivalStatus === 'arrived' ||
      (item.isConfirmedBySupervisor && !isAbsentDriver)) &&
    !isDelayedDriver;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isAbsentDriver
            ? isDark
              ? 'rgba(239, 68, 68, 0.09)'
              : '#FEF2F2'
            : isDelayedDriver
            ? isDark
              ? 'rgba(245, 158, 11, 0.08)'
              : '#FFFBEB'
            : isArrivedConfirmed
            ? isDark
              ? 'rgba(16, 185, 129, 0.07)'
              : '#F0FDF4'
            : colors.card,
          borderColor: isAbsentDriver
            ? '#EF4444'
            : isDelayedDriver
            ? '#F59E0B'
            : isArrivedConfirmed
            ? '#10B981'
            : isSelected
            ? colors.command
            : colors.border,
          borderWidth:
            isAbsentDriver || isDelayedDriver || isArrivedConfirmed || isSelected
              ? 1.5
              : 1,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Red Exception Alert Strip for Absent / Problematic Drivers */}
      {isAbsentDriver && (
        <View
          style={[
            styles.exceptionAlertStrip,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
              borderColor: 'rgba(239, 68, 68, 0.45)',
            },
          ]}
        >
          <AlertTriangle size={14} color="#EF4444" />
          <Text
            style={[
              styles.exceptionAlertText,
              { fontFamily: Typography.fontFamily.bold },
            ]}
          >
            عدم حضور راننده (نیازمند تعیین وضعیت یا ثبت لنگی)
          </Text>
        </View>
      )}

      {/* Orange Delay Strip for Delayed Drivers (shown right after Red cards in Tab 1) */}
      {!isAbsentDriver && isDelayedDriver && (
        <View
          style={[
            styles.exceptionAlertStrip,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
              borderColor: 'rgba(245, 158, 11, 0.45)',
            },
          ]}
        >
          <Clock size={14} color="#F59E0B" />
          <Text
            style={[
              styles.exceptionAlertText,
              { color: '#F59E0B', fontFamily: Typography.fontFamily.bold },
            ]}
          >
            راننده دارای تأخیر ثبت‌شده
            {item.delayMinutes && item.delayMinutes > 0
              ? ` (${toPersianDigits(item.delayMinutes)} دقیقه تأخیر)`
              : ''}
          </Text>
        </View>
      )}

      {/* 1. Header Row: Checkbox + Driver Name & Plate (Right) | Supervisor Status & Phone Button (Left) */}
      <View style={styles.headerRow}>
        <View style={styles.driverRightRow}>
          {selectable && onToggleSelect ? (
            <Pressable
              onPress={() => onToggleSelect(item)}
              hitSlop={8}
              style={styles.checkboxBtn}
            >
              {isSelected ? (
                <CheckSquare size={20} color={colors.command} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
            </Pressable>
          ) : null}

          <View style={styles.driverInfoRight}>
            <Text
              numberOfLines={1}
              style={[
                styles.driverName,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {item.driverFullName}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.vehicleSubText,
                { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
              ]}
            >
              {toPersianDigits(item.licensePlate)}
              {item.scheduledStartTime && item.scheduledStartTime !== '۰۰:۰۰'
                ? ` • ساعت ${toPersianDigits(item.scheduledStartTime)}`
                : ''}
            </Text>
          </View>
        </View>

        <View style={styles.headerLeftActions}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusMeta.bg,
                borderColor: statusMeta.borderColor,
              },
            ]}
          >
            <StatusIcon size={11} color={statusMeta.color} />
            <Text
              style={[
                styles.statusPillText,
                { color: statusMeta.color, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {statusMeta.label}
            </Text>
          </View>

          <Pressable
            onPress={() => setPhoneModalVisible(true)}
            accessibilityLabel={`مشاهده و کپی شماره ${item.driverFullName}`}
            style={({ pressed }) => [
              styles.callIconBtn,
              {
                backgroundColor: colors.commandBg,
                borderColor: colors.commandBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Phone size={14} color={colors.command} />
          </Pressable>
        </View>
      </View>

      {/* 2. Route / Service Title */}
      <View style={styles.tripTitleRow}>
        <Text
          numberOfLines={1}
          style={[
            styles.tripName,
            { color: colors.gold, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          سرویس: {item.tripName}
        </Text>
        <Text
          style={[
            styles.tripIdBadge,
            { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          کد سرویس: {toPersianDigits(item.tripId)}
        </Text>
      </View>

      {/* 3. Driver Live Status & Self-Arrival Banner (Always visible to Supervisor) */}
      <View
        style={[
          styles.driverExecBox,
          {
            backgroundColor: driverExecMeta.bg,
            borderColor: driverExecMeta.borderColor,
          },
        ]}
      >
        <View style={styles.driverExecTopRow}>
          <UserCheck size={14} color={driverExecMeta.color} />
          <Text
            style={[
              styles.driverExecTitle,
              { color: driverExecMeta.color, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {driverExecMeta.title}
          </Text>
        </View>

        <View style={styles.badgesInlineRow}>
          <View
            style={[
              styles.miniTag,
              {
                backgroundColor: item.driverConfirmedArrival
                  ? 'rgba(16, 185, 129, 0.16)'
                  : isDark
                  ? 'rgba(255,255,255,0.05)'
                  : '#E2E8F0',
                borderColor: item.driverConfirmedArrival ? '#10B981' : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.miniTagText,
                {
                  color: item.driverConfirmedArrival ? '#10B981' : colors.textSecondary,
                  fontFamily: Typography.fontFamily.medium,
                },
              ]}
            >
              {item.driverConfirmedArrival
                ? 'ثبت حضور توسط راننده: بله ✓'
                : 'ثبت حضور توسط راننده: خیر'}
            </Text>
          </View>

          <View
            style={[
              styles.miniTag,
              {
                backgroundColor: item.isConfirmedBySupervisor
                  ? item.arrivalStatus === 'not_arrived'
                    ? 'rgba(244, 63, 94, 0.16)'
                    : 'rgba(16, 185, 129, 0.16)'
                  : 'rgba(245, 158, 11, 0.14)',
                borderColor: item.isConfirmedBySupervisor
                  ? item.arrivalStatus === 'not_arrived'
                    ? colors.danger
                    : colors.success
                  : colors.gold,
              },
            ]}
          >
            <ShieldCheck
              size={11}
              color={
                item.isConfirmedBySupervisor
                  ? item.arrivalStatus === 'not_arrived'
                    ? colors.danger
                    : colors.success
                  : colors.gold
              }
            />
            <Text
              style={[
                styles.miniTagText,
                {
                  color: item.isConfirmedBySupervisor
                    ? item.arrivalStatus === 'not_arrived'
                      ? colors.danger
                      : colors.success
                    : colors.gold,
                  fontFamily: Typography.fontFamily.bold,
                },
              ]}
            >
              {item.isConfirmedBySupervisor
                ? item.arrivalStatus === 'not_arrived'
                  ? 'سرشوفر: ثبت غیبت شده ✗'
                  : 'سرشوفر: تأیید شده ✓'
                : 'سرشوفر: تأیید نشده'}
            </Text>
          </View>

          {item.isDelayed && item.delayMinutes && item.delayMinutes > 0 ? (
            <View
              style={[
                styles.miniTag,
                {
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  borderColor: '#F59E0B',
                },
              ]}
            >
              <Clock size={11} color="#F59E0B" />
              <Text
                style={[
                  styles.miniTagText,
                  {
                    color: '#F59E0B',
                    fontFamily: Typography.fontFamily.bold,
                  },
                ]}
              >
                با {toPersianDigits(item.delayMinutes)} دقیقه تأخیر
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 4. Rich Station Progress Bar & Current/Next Station Indicator */}
      {progress && totalStations > 0 && (
        <Pressable
          onPress={() => setStationsExpanded((prev) => !prev)}
          style={[
            styles.progressBox,
            {
              backgroundColor: isDark ? '#071318' : '#F8FAFC',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.progressHeaderRow}>
            <View style={styles.progressTitleGroup}>
              <Navigation size={13} color={colors.command} />
              <Text
                style={[
                  styles.progressTitleText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                پیشرفت ایستگاه‌ها: {toPersianDigits(visitedStations)} از{' '}
                {toPersianDigits(totalStations)} ایستگاه
              </Text>
            </View>

            <View style={styles.progressPercentBadge}>
              <Text
                style={[
                  styles.progressPercentText,
                  {
                    color: progressPercent === 100 ? colors.success : colors.command,
                    fontFamily: Typography.fontFamily.bold,
                  },
                ]}
              >
                ٪{toPersianDigits(progressPercent)}
              </Text>
              {stationsExpanded ? (
                <ChevronUp size={14} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={14} color={colors.textSecondary} />
              )}
            </View>
          </View>

          {/* Visual Progress Track */}
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor:
                    progressPercent === 100
                      ? colors.success
                      : progressPercent > 0
                      ? colors.command
                      : colors.gold,
                },
              ]}
            />
          </View>

          {/* Current / Next Station Callout */}
          <View style={styles.nextStationRow}>
            <MapPin
              size={13}
              color={
                progress.remainingStations === 0 ? colors.success : colors.gold
              }
            />
            <Text
              numberOfLines={1}
              style={[
                styles.nextStationText,
                {
                  color:
                    progress.remainingStations === 0
                      ? colors.success
                      : colors.textSecondary,
                  fontFamily: Typography.fontFamily.medium,
                },
              ]}
            >
              {progress.remainingStations === 0
                ? 'تمامی ایستگاه‌های مسیر با موفقیت طی شده‌اند ✓'
                : progress.nextStationTitle
                ? `ایستگاه فعلی / بعدی: ${progress.nextStationTitle}${
                    progress.nextStopOrder
                      ? ` (ایستگاه ${toPersianDigits(progress.nextStopOrder)})`
                      : ''
                  }`
                : `باقی‌مانده: ${toPersianDigits(progress.remainingStations)} ایستگاه`}
            </Text>
          </View>

          {/* Expandable Stations List */}
          {stationsExpanded &&
            Array.isArray(progress.stations) &&
            progress.stations.length > 0 && (
              <View
                style={[
                  styles.stationsTimeline,
                  { borderTopColor: colors.border },
                ]}
              >
                {progress.stations.map((st) => {
                  const visitedTime = formatStationVisitedTime(st.visitedAt);
                  const isCurrentNext =
                    !st.isVisited && st.stationId === progress.nextStationId;
                  return (
                    <View key={st.tripStationId} style={styles.stationRow}>
                      <View style={styles.stationRightGroup}>
                        <View
                          style={[
                            styles.stationDot,
                            {
                              backgroundColor: st.isVisited
                                ? colors.success
                                : isCurrentNext
                                ? colors.gold
                                : 'transparent',
                              borderColor: st.isVisited
                                ? colors.success
                                : isCurrentNext
                                ? colors.gold
                                : colors.textMuted,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.stationNameText,
                            {
                              color: st.isVisited
                                ? colors.text
                                : isCurrentNext
                                ? colors.gold
                                : colors.textSecondary,
                              fontFamily:
                                st.isVisited || isCurrentNext
                                  ? Typography.fontFamily.bold
                                  : Typography.fontFamily.regular,
                            },
                          ]}
                        >
                          {toPersianDigits(st.stopOrder)}. {st.stationTitle}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.stationStateText,
                          {
                            color: st.isVisited
                              ? colors.success
                              : isCurrentNext
                              ? colors.gold
                              : colors.textMuted,
                            fontFamily: Typography.fontFamily.medium,
                          },
                        ]}
                      >
                        {st.isVisited
                          ? visitedTime
                            ? `طی شده (${visitedTime}) ✓`
                            : 'طی شده ✓'
                          : isCurrentNext
                          ? 'ایستگاه پیش‌رو'
                          : 'در انتظار'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
        </Pressable>
      )}

      {/* 5. Supervisor Confirmation Note (if confirmed) */}
      {(item.supervisorNote || item.gpsStamp?.note) && (
        <Text
          numberOfLines={2}
          style={[
            styles.stampLine,
            {
              color:
                item.arrivalStatus === 'not_arrived' ? colors.danger : colors.success,
              fontFamily: Typography.fontFamily.medium,
            },
          ]}
        >
          ✓ یادداشت سرشوفر: {item.supervisorNote || item.gpsStamp?.note}
        </Text>
      )}

      {/* 6. Compact Langi Status Badge (if Langi assigned) */}
      {item.hasLangi && (
        <Pressable
          onPress={() => onPressLangiAction(item)}
          style={({ pressed }) => [
            styles.langiCompactBar,
            {
              backgroundColor: colors.langiBg,
              borderColor: colors.langiBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.langiCompactRight}>
            <Repeat size={12} color={colors.langi} />
            <Text
              numberOfLines={1}
              style={[
                styles.langiCompactText,
                { color: colors.langi, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {(() => {
                const candidate = item.langi
                  ? `${item.langi.name || ''} ${item.langi.family || ''}`.trim()
                  : (item.actualDriverFullName || '').trim();
                const isDistinct =
                  Boolean(candidate) &&
                  candidate !== (item.plannedDriverFullName || item.driverFullName).trim() &&
                  candidate !== 'راننده موقت' &&
                  candidate !== 'راننده موقت (لنگی)';
                return isDistinct
                  ? `راننده لنگی (جایگزین): ${candidate}`
                  : 'دارای راننده موقت (لنگی) • مشاهده / ویرایش مشخصات';
              })()}
            </Text>
          </View>
          <ChevronLeft size={13} color={colors.langi} />
        </Pressable>
      )}

      {/* 7. Action Buttons: rendered when NOT yet confirmed, OR allow Langi assignment when driver is marked absent */}
      {!isSupervisorFinalized ? (
        <View style={styles.actionsBar}>
          <Pressable
            onPress={() => onPressArrivalAction(item, 'arrived')}
            disabled={isProcessingGps}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                borderColor: colors.success,
                opacity: pressed || isProcessingGps ? 0.75 : 1,
              },
            ]}
          >
            {isProcessingGps ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <>
                <CheckCircle2 size={14} color={colors.success} />
                <Text
                  style={[
                    styles.actionBtnText,
                    {
                      color: colors.success,
                      fontFamily: Typography.fontFamily.bold,
                    },
                  ]}
                >
                  تایید رسیدن
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => onPressArrivalAction(item, 'not_arrived')}
            disabled={isProcessingGps}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                borderColor: colors.danger,
                opacity: pressed || isProcessingGps ? 0.75 : 1,
              },
            ]}
          >
            <XCircle size={14} color={colors.danger} />
            <Text
              style={[
                styles.actionBtnText,
                {
                  color: colors.danger,
                  fontFamily: Typography.fontFamily.bold,
                },
              ]}
            >
              ثبت نرسیدن
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onPressLangiAction(item)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: item.hasLangi ? colors.langi : colors.langiBg,
                borderColor: colors.langi,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Repeat
              size={13}
              color={item.hasLangi ? '#071318' : colors.langi}
            />
            <Text
              style={[
                styles.actionBtnText,
                {
                  color: item.hasLangi ? '#071318' : colors.langi,
                  fontFamily: Typography.fontFamily.bold,
                },
              ]}
            >
              {item.hasLangi ? 'وضعیت لنگی' : 'درخواست لنگی'}
            </Text>
          </Pressable>
        </View>
      ) : (item.arrivalStatus === 'not_arrived' || item.executionStatus === 4) &&
        !item.hasLangi ? (
        <View style={styles.actionsBar}>
          <Pressable
            onPress={() => onPressLangiAction(item)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.langiBg,
                borderColor: colors.langi,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Repeat size={14} color={colors.langi} />
            <Text
              style={[
                styles.actionBtnText,
                {
                  color: colors.langi,
                  fontFamily: Typography.fontFamily.bold,
                },
              ]}
            >
              ثبت راننده لنگی (جایگزین) برای این سرویس
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Phone Number View & Copy Modal */}
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <Pressable
          style={styles.phoneModalOverlay}
          onPress={() => setPhoneModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.phoneModalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.commandBorder,
              },
            ]}
          >
            <View style={styles.phoneModalHeader}>
              <Pressable
                onPress={() => setPhoneModalVisible(false)}
                hitSlop={8}
                style={styles.phoneModalCloseBtn}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
              <Text
                style={[
                  styles.phoneModalTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                اطلاعات تماس راننده
              </Text>
            </View>

            <Text
              style={[
                styles.phoneModalDriverName,
                { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
              ]}
            >
              {item.driverFullName}
            </Text>

            <View
              style={[
                styles.phoneBox,
                {
                  backgroundColor: isDark ? '#071318' : '#F1F5F9',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                selectable
                style={[
                  styles.phoneDigitsText,
                  { color: colors.command, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {phoneToDisplay
                  ? toPersianDigits(phoneToDisplay)
                  : 'شماره ثبت نشده'}
              </Text>
            </View>

            <View style={styles.phoneModalActions}>
              <Pressable
                onPress={handleCopyPhone}
                style={[
                  styles.phoneActionBtn,
                  {
                    backgroundColor: colors.command,
                    borderColor: colors.command,
                  },
                ]}
              >
                <Copy size={15} color="#071318" />
                <Text
                  style={[
                    styles.phoneActionBtnText,
                    { color: '#071318', fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  کپی شماره همراه
                </Text>
              </Pressable>

              {phoneToDisplay ? (
                <Pressable
                  onPress={() => {
                    setPhoneModalVisible(false);
                    handleCallDriver(phoneToDisplay);
                  }}
                  style={[
                    styles.phoneActionBtn,
                    {
                      backgroundColor: colors.commandBg,
                      borderColor: colors.command,
                    },
                  ]}
                >
                  <Phone size={15} color={colors.command} />
                  <Text
                    style={[
                      styles.phoneActionBtnText,
                      {
                        color: colors.command,
                        fontFamily: Typography.fontFamily.bold,
                      },
                    ]}
                  >
                    تماس تلفنی
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  exceptionAlertStrip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  exceptionAlertText: {
    fontSize: 11.5,
    color: '#EF4444',
    textAlign: 'right',
    flex: 1,
  },
  driverRightRow: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBtn: {
    padding: 2,
  },
  driverInfoRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  driverName: {
    width: '100%',
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  vehicleSubText: {
    width: '100%',
    fontSize: 11.5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10.5,
  },
  callIconBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripTitleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  tripName: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
  },
  tripIdBadge: {
    fontSize: 11,
  },
  driverExecBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  driverExecTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  driverExecTitle: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
  },
  badgesInlineRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  miniTagText: {
    fontSize: 10.5,
  },
  progressBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 10,
    gap: 7,
  },
  progressHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  progressTitleText: {
    fontSize: 11.5,
  },
  progressPercentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressPercentText: {
    fontSize: 12,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row-reverse',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextStationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  nextStationText: {
    flex: 1,
    fontSize: 11.5,
    textAlign: 'right',
  },
  stationsTimeline: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
    gap: 6,
  },
  stationRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  stationRightGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stationDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  stationNameText: {
    fontSize: 11.5,
    textAlign: 'right',
  },
  stationStateText: {
    fontSize: 10.5,
  },
  stampLine: {
    fontSize: 11,
    textAlign: 'right',
  },
  langiCompactBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  langiCompactRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  langiCompactText: {
    fontSize: 11.5,
    textAlign: 'right',
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  actionBtnText: {
    fontSize: 11,
  },
  phoneModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  phoneModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  phoneModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneModalCloseBtn: {
    padding: 4,
  },
  phoneModalTitle: {
    fontSize: 15,
    textAlign: 'right',
  },
  phoneModalDriverName: {
    fontSize: 13,
    textAlign: 'right',
  },
  phoneBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneDigitsText: {
    fontSize: 19,
    letterSpacing: 1.2,
  },
  phoneModalActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  phoneActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  phoneActionBtnText: {
    fontSize: 12,
  },
});
