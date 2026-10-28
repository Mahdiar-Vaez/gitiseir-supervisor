import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react-native';

export type StatVariant = 'gold' | 'success' | 'danger' | 'info' | 'warning';

interface StatCardProps {
  title: string;
  value: number | string;
  trendText: string;
  isPositive?: boolean;
  icon: LucideIcon;
  variant?: StatVariant;
}

export function StatCard({
  title,
  value,
  trendText,
  isPositive = true,
  icon: Icon,
  variant = 'gold',
}: StatCardProps) {
  const { colors } = useAppTheme();

  const getVariantColor = () => {
    switch (variant) {
      case 'gold':
        return colors.gold;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.danger;
      case 'info':
        return colors.info;
    }
  };

  const accentColor = getVariantColor();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: colors.cardSubtle,
              borderColor: accentColor,
            },
          ]}
        >
          <Icon size={14} color={accentColor} />
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.valueText,
            { color: colors.text, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          {toPersianDigits(value)}
        </Text>
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.titleText,
          { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
        ]}
      >
        {title}
      </Text>

      <View style={styles.trendRow}>
        {isPositive ? (
          <TrendingUp size={10} color={colors.success} />
        ) : (
          <TrendingDown size={10} color={colors.danger} />
        )}
        <Text
          numberOfLines={1}
          style={[
            styles.trendText,
            {
              color: isPositive ? colors.success : colors.danger,
              fontFamily: Typography.fontFamily.regular,
            },
          ]}
        >
          {toPersianDigits(trendText)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  titleText: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  trendText: {
    fontSize: 9.5,
  },
});
