import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useSarshoofer } from '@/context/SarshooferContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';

export type DriverFilterType = 'all' | 'pending' | 'arrived' | 'not_arrived' | 'langi';

interface FleetCommandBannerProps {
  activeFilter: DriverFilterType;
  onSelectFilter: (filter: DriverFilterType) => void;
  onOpenNewLangi?: () => void;
}

export function FleetCommandBanner({
  activeFilter,
  onSelectFilter,
}: FleetCommandBannerProps) {
  const { colors, isDark } = useAppTheme();
  const { stats } = useSarshoofer();

  const items: {
    id: DriverFilterType;
    label: string;
    count: number;
    activeColor: string;
    activeBg: string;
  }[] = [
    {
      id: 'all',
      label: 'همه امروز',
      count: stats.totalDrivers,
      activeColor: colors.command,
      activeBg: colors.commandBg,
    },
    {
      id: 'arrived',
      label: 'رسیده',
      count: stats.arrivedCount,
      activeColor: colors.success,
      activeBg: colors.successBg,
    },
    {
      id: 'not_arrived',
      label: 'نرسیده',
      count: stats.notArrivedCount,
      activeColor: colors.danger,
      activeBg: colors.dangerBg,
    },
    {
      id: 'langi',
      label: 'لنگی',
      count: stats.langiCount,
      activeColor: colors.langi,
      activeBg: colors.langiBg,
    },
  ];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Clean Header Row */}
      <View style={styles.topRow}>
        <Text
          style={[
            styles.bannerTitle,
            { color: colors.text, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          خلاصه وضعیت بورد روزانه
        </Text>
      </View>

      {/* 4 Compact Filter Counters */}
      <View style={styles.kpiRow}>
        {items.map((item) => {
          const isSelected = activeFilter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() =>
                onSelectFilter(isSelected && item.id !== 'all' ? 'all' : item.id)
              }
              style={[
                styles.kpiBox,
                {
                  backgroundColor: isSelected
                    ? item.activeBg
                    : isDark
                    ? '#071318'
                    : '#F8FAFC',
                  borderColor: isSelected ? item.activeColor : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.kpiNumber,
                  {
                    color: isSelected ? item.activeColor : colors.text,
                    fontFamily: Typography.fontFamily.bold,
                  },
                ]}
              >
                {toPersianDigits(item.count)}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.kpiLabel,
                  {
                    color: isSelected ? item.activeColor : colors.textMuted,
                    fontFamily: Typography.fontFamily.medium,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14.5,
    textAlign: 'right',
  },
  quickLangiBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quickLangiBtnText: {
    fontSize: 11.5,
  },
  kpiRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  kpiBox: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  kpiNumber: {
    fontSize: 15,
    lineHeight: 19,
  },
  kpiLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
});
