import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius, TouchTarget } from '@/constants/theme';
import { LucideIcon } from 'lucide-react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'gold' | 'success' | 'danger' | 'outline';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'normal' | 'large';
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'gold',
  icon: Icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'large',
}: PrimaryButtonProps) {
  const { colors, isDark } = useAppTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional on web/simulator
    }
    onPress();
  };

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.cardSubtle;
    switch (variant) {
      case 'gold':
        return pressed ? colors.goldSoft : colors.gold;
      case 'success':
        return pressed ? '#22C55E' : colors.success;
      case 'danger':
        return pressed ? '#E11D48' : colors.danger;
      case 'outline':
        return pressed ? colors.goldBg : 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'gold':
        return isDark ? '#0B0F19' : '#FFFFFF';
      case 'success':
        return '#0B0F19';
      case 'danger':
        return '#FFFFFF';
      case 'outline':
        return colors.gold;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.gold;
    return 'transparent';
  };

  const minHeight = size === 'large' ? 52 : TouchTarget.min;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: disabled ? 0.6 : 1,
        },
        variant === 'gold' && styles.goldGlow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {Icon && iconPosition === 'right' && (
            <Icon size={size === 'large' ? 20 : 18} color={getTextColor()} />
          )}
          <Text
            style={[
              styles.label,
              {
                color: getTextColor(),
                fontFamily: Typography.fontFamily.bold,
                fontSize: size === 'large' ? 16 : 14,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {Icon && iconPosition === 'left' && (
            <Icon size={size === 'large' ? 20 : 18} color={getTextColor()} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  goldGlow: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  label: {
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
