import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Award,
  CheckCircle2,
  Clock,
  UserX,
  FileCheck,
  RotateCw,
  TrendingUp,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '@/constants/theme';
import { DriverPerformanceSummary } from '@/services/api/types';
import { toPersianDigits } from '@/utils/persian-digits';
import { ScoreRing } from './ScoreRing';

interface DriverPerformanceCardProps {
  performance: DriverPerformanceSummary | null;
  loading?: boolean;
  periodLabel?: string;
  onRefresh?: () => void;
}

interface StatTileProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

function StatTile({ label, value, unit, color, bgColor, icon }: StatTileProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.statTile,
        {
          backgroundColor: bgColor,
          borderColor: color,
        },
      ]}
    >
      <View style={styles.statTileHeader}>
        <View style={styles.statIconWrap}>{icon}</View>
        <Text
          numberOfLines={1}
          style={[
            styles.statTileLabel,
            { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.statTileValRow}>
        <Text
          style={[
            styles.statTileVal,
            { color, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          {toPersianDigits(value)}
        </Text>
        <Text
          style={[
            styles.statTileUnit,
            { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          {unit}
        </Text>
      </View>
    </View>
  );
}

export function DriverPerformanceCard({
  performance,
  loading = false,
  periodLabel = 'ماه جاری',
  onRefresh,
}: DriverPerformanceCardProps) {
  const { colors, isDark } = useAppTheme();

  const successRate = performance ? Math.round(performance.successRate) : 0;
  const totalTrips = performance?.totalTrips ?? 0;
  const successfulTrips = performance?.successfulTrips ?? 0;
  const delayedTrips = performance?.delayedTrips ?? 0;
  const absentTrips = performance?.absentTrips ?? 0;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: (colors as any).borderGold || colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerRightGroup}>
          <View
            style={[
              styles.periodBadge,
              {
                backgroundColor: (colors as any).goldBg || 'rgba(212, 175, 55, 0.12)',
                borderColor: (colors as any).borderGold || colors.border,
              },
            ]}
          >
            <Award size={13} color={(colors as any).gold || '#D4AF37'} />
            <Text
              style={[
                styles.periodBadgeText,
                { color: (colors as any).gold || '#D4AF37', fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {periodLabel}
            </Text>
          </View>
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            شاخص‌های عملکرد ماهانه
          </Text>
        </View>

        {onRefresh && (
          <TouchableOpacity
            onPress={onRefresh}
            disabled={loading}
            style={[
              styles.refreshBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={(colors as any).gold || '#D4AF37'} />
            ) : (
              <RotateCw size={13} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Ring Score Section */}
      <View style={styles.ringSection}>
        <ScoreRing score={successRate} size={110} strokeWidth={8} />
        <View style={styles.ringInfoCol}>
          <View style={styles.ringTitleRow}>
            <TrendingUp size={16} color={colors.success} />
            <Text
              style={[
                styles.ringTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              درصد موفقیت اجرای سفرها
            </Text>
          </View>
          <Text
            style={[
              styles.ringSubtitle,
              {
                color: colors.textSecondary,
                fontFamily: Typography.fontFamily.regular,
              },
            ]}
          >
            بر اساس سفرهای پایان‌یافته بدون غیبت در دوره زمانی جاری
          </Text>
        </View>
      </View>

      {/* 4 Stat Tiles */}
      <View style={styles.grid}>
        <StatTile
          icon={<FileCheck size={15} color={(colors as any).gold || '#D4AF37'} />}
          label="کل سفرها"
          value={totalTrips}
          unit="سفر"
          color={(colors as any).gold || '#D4AF37'}
          bgColor={isDark ? 'rgba(212, 175, 55, 0.08)' : '#FBF8F1'}
        />

        <StatTile
          icon={<CheckCircle2 size={15} color={colors.success} />}
          label="سفرهای موفق"
          value={successfulTrips}
          unit="سفر"
          color={colors.success}
          bgColor={isDark ? 'rgba(52, 211, 153, 0.08)' : '#F0FDF4'}
        />

        <StatTile
          icon={<Clock size={15} color={colors.warning} />}
          label="سفرهای با تأخیر"
          value={delayedTrips}
          unit="مورد"
          color={colors.warning}
          bgColor={isDark ? 'rgba(212, 175, 55, 0.08)' : '#FFFBEB'}
        />

        <StatTile
          icon={<UserX size={15} color={colors.danger} />}
          label="غیبت‌ها"
          value={absentTrips}
          unit="مورد"
          color={colors.danger}
          bgColor={isDark ? 'rgba(251, 113, 133, 0.08)' : '#FFF1F2'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRightGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  periodBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  periodBadgeText: {
    fontSize: 11,
  },
  cardTitle: {
    fontSize: 14.5,
  },
  refreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
    gap: 12,
  },
  ringInfoCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  ringTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  ringTitle: {
    fontSize: 13.5,
    textAlign: 'right',
  },
  ringSubtitle: {
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  statTile: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 4,
  },
  statTileHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  statIconWrap: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTileLabel: {
    fontSize: 11.5,
  },
  statTileValRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  statTileVal: {
    fontSize: 18,
  },
  statTileUnit: {
    fontSize: 10.5,
  },
});
