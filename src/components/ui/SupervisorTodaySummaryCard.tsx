import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Calendar,
  CheckCircle2,
  UserX,
  Clock,
  RotateCw,
  Navigation,
  Repeat,
  AlertCircle,
  FileCheck,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TodayExecutionSummary } from '@/services/api/types';
import { toPersianDigits } from '@/utils/persian-digits';

interface SupervisorTodaySummaryCardProps {
  summary: TodayExecutionSummary | null;
  loading?: boolean;
  onRefresh?: () => void;
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  color: string;
  bgColor: string;
}

function StatTile({ icon, label, value, unit, color, bgColor }: StatTileProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: bgColor,
          borderColor: color,
        },
      ]}
    >
      <View style={styles.tileHeader}>
        <View style={styles.tileIconWrap}>{icon}</View>
        <Text
          numberOfLines={1}
          style={[
            styles.tileLabel,
            { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.tileValueRow}>
        <Text
          style={[
            styles.tileValue,
            { color, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          {toPersianDigits(value)}
        </Text>
        {unit ? (
          <Text
            style={[
              styles.tileUnit,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

interface MiniRowItemProps {
  label: string;
  value: number | string;
  unit?: string;
  accentColor?: string;
}

function MiniRowItem({ label, value, unit, accentColor }: MiniRowItemProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.miniItem}>
      <Text
        style={[
          styles.miniLabel,
          { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
        ]}
      >
        {label}:
      </Text>
      <View style={styles.miniValRow}>
        <Text
          style={[
            styles.miniValue,
            {
              color: accentColor || colors.text,
              fontFamily: Typography.fontFamily.bold,
            },
          ]}
        >
          {toPersianDigits(value)}
        </Text>
        {unit ? (
          <Text
            style={[
              styles.miniUnit,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function SupervisorTodaySummaryCard({
  summary,
  loading = false,
  onRefresh,
}: SupervisorTodaySummaryCardProps) {
  const { colors, isDark } = useAppTheme();

  const persianDate = summary?.persianDate || 'امروز';
  const totalTrips = summary?.totalExecutions ?? 0;
  const completedTrips = summary?.completedTrips ?? 0;
  const absentTrips = summary?.absentTrips ?? 0;
  const langiTrips = summary?.langiTrips ?? 0;
  const delayedTrips = summary?.delayedTrips ?? 0;
  const totalDelayMinutes = summary?.totalRecordedDelayMinutes ?? 0;
  const gpsConfirmed = summary?.supervisorGpsConfirmedTrips ?? 0;
  const noGpsConfirmed = summary?.supervisorConfirmedWithoutGpsTrips ?? 0;
  const requiresReview = summary?.requiresReviewTrips ?? 0;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#0D1F28' : '#FFFFFF',
          borderColor: colors.commandBorder,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: colors.commandBg, borderColor: colors.command },
            ]}
          >
            <Calendar size={13} color={colors.command} />
            <Text
              style={[
                styles.headerDate,
                { color: colors.command, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(persianDate)}
            </Text>
          </View>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            خلاصه اجرای شیفت امروز
          </Text>
        </View>

        {onRefresh && (
          <TouchableOpacity
            onPress={onRefresh}
            disabled={loading}
            style={[
              styles.refreshBtn,
              {
                backgroundColor: isDark ? '#132B38' : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.command} />
            ) : (
              <RotateCw size={14} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Primary Key Metrics Grid */}
      <View style={styles.grid}>
        <StatTile
          icon={<FileCheck size={16} color={colors.command} />}
          label="کل سفرها"
          value={totalTrips}
          unit="سرویس"
          color={colors.command}
          bgColor={isDark ? 'rgba(20, 184, 166, 0.10)' : '#F0FDFA'}
        />

        <StatTile
          icon={<CheckCircle2 size={16} color={colors.success} />}
          label="تکمیل‌شده"
          value={completedTrips}
          unit="سرویس"
          color={colors.success}
          bgColor={isDark ? 'rgba(16, 185, 129, 0.10)' : '#ECFDF5'}
        />

        <StatTile
          icon={<UserX size={16} color={colors.danger} />}
          label="غیبت راننده"
          value={absentTrips}
          unit="مورد"
          color={colors.danger}
          bgColor={isDark ? 'rgba(251, 113, 133, 0.10)' : '#FFF1F2'}
        />

        <StatTile
          icon={<Repeat size={16} color={colors.langi} />}
          label="سفرهای لنگی"
          value={langiTrips}
          unit="سفر"
          color={colors.langi}
          bgColor={isDark ? 'rgba(245, 158, 11, 0.10)' : '#FFFBEB'}
        />
      </View>

      {/* Secondary Detailed Row - Delay & GPS Monitoring */}
      <View
        style={[
          styles.subDetailsBox,
          {
            backgroundColor: isDark ? '#071318' : '#F8FAFC',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Delay Section */}
        <View style={styles.subDetailSection}>
          <View style={styles.subDetailHeader}>
            <Clock size={13} color={colors.warning} />
            <Text
              style={[
                styles.subDetailTitle,
                { color: colors.warning, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              پایش تأخیر شیفت
            </Text>
          </View>
          <View style={styles.miniList}>
            <MiniRowItem
              label="سفرهای دارای تأخیر"
              value={delayedTrips}
              unit="سفر"
              accentColor={delayedTrips > 0 ? colors.warning : undefined}
            />
            <MiniRowItem
              label="مجموع دقایق تأخیر"
              value={totalDelayMinutes}
              unit="دقیقه"
              accentColor={totalDelayMinutes > 0 ? colors.warning : undefined}
            />
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

        {/* GPS Monitoring Section */}
        <View style={styles.subDetailSection}>
          <View style={styles.subDetailHeader}>
            <Navigation size={13} color={colors.command} />
            <Text
              style={[
                styles.subDetailTitle,
                { color: colors.command, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              پایش موقعیت‌یاب
            </Text>
          </View>
          <View style={styles.miniList}>
            <MiniRowItem
              label="تأیید حضوری با موقعیت"
              value={gpsConfirmed}
              unit="مورد"
              accentColor={colors.success}
            />
            <MiniRowItem
              label="تأیید بدون ثبت موقعیت"
              value={noGpsConfirmed}
              unit="مورد"
            />
          </View>
        </View>
      </View>

      {/* Alerts or Review Warning (if any) */}
      {requiresReview > 0 && (
        <View
          style={[
            styles.alertBox,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
              borderColor: colors.warning,
            },
          ]}
        >
          <AlertCircle size={14} color={colors.warning} />
          <Text
            style={[
              styles.alertText,
              { color: colors.warning, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            تعداد {toPersianDigits(requiresReview)} سفر نیازمند بازبینی و بررسی
            سرشوفر است.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    textAlign: 'right',
  },
  headerBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  headerDate: {
    fontSize: 11,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 6,
  },
  tileHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  tileIconWrap: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  tileValueRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
  },
  tileValue: {
    fontSize: 18,
  },
  tileUnit: {
    fontSize: 10,
  },
  subDetailsBox: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  subDetailSection: {
    gap: 6,
  },
  subDetailHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  subDetailTitle: {
    fontSize: 12,
  },
  miniList: {
    gap: 4,
  },
  miniItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniLabel: {
    fontSize: 11.5,
  },
  miniValRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
  },
  miniValue: {
    fontSize: 12.5,
  },
  miniUnit: {
    fontSize: 10,
  },
  sectionDivider: {
    height: 1,
    width: '100%',
  },
  alertBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 11.5,
    flex: 1,
    textAlign: 'right',
  },
});
