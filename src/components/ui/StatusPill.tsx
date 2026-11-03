import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, BorderRadius } from '@/constants/theme';
import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react-native';

export type TripStatus = 'success' | 'warning' | 'danger' | 'info';

interface StatusPillProps {
  status: TripStatus;
  label: string;
  showIcon?: boolean;
}

export function StatusPill({ status, label, showIcon = true }: StatusPillProps) {
  const { colors } = useAppTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          bg: colors.successBg,
          color: colors.success,
          borderColor: colors.success,
          Icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: colors.warningBg,
          color: colors.warning,
          borderColor: colors.warning,
          Icon: Clock,
        };
      case 'danger':
        return {
          bg: colors.dangerBg,
          color: colors.danger,
          borderColor: colors.danger,
          Icon: AlertCircle,
        };
      case 'info':
        return {
          bg: colors.infoBg,
          color: colors.info,
          borderColor: colors.info,
          Icon: Calendar,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.Icon;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.borderColor,
        },
      ]}
    >
      {showIcon && <Icon size={10} color={config.color} />}
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: config.color,
            fontFamily: Typography.fontFamily.medium,
          },
        ]}
      >
        {label}
      </Text>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: BorderRadius.full,
  },
  text: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
});
