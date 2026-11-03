import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits, toEnglishDigits } from '@/utils/persian-digits';

interface DelayMinutesSelectorProps {
  delayMinutes: number;
  onChangeMinutes: (val: number) => void;
}

const PRESET_MINUTES = [5, 10, 15, 20, 30, 45];

export function DelayMinutesSelector({
  delayMinutes,
  onChangeMinutes,
}: DelayMinutesSelectorProps) {
  const { colors, isDark } = useAppTheme();

  const handleCustomChange = (text: string) => {
    const raw = toEnglishDigits(text).replace(/\D/g, '');
    const num = Math.min(Number(raw) || 0, 180);
    onChangeMinutes(num);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: colors.warning }]}>
            {toPersianDigits(delayMinutes)} دقیقه
          </Text>
        </View>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            میزان تأخیر راننده
          </Text>
          <Clock size={15} color={colors.warning} />
        </View>
      </View>

      {/* Quick Preset Pills */}
      <View style={styles.pillsRow}>
        {PRESET_MINUTES.map((m) => {
          const isSelected = delayMinutes === m;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => onChangeMinutes(m)}
              activeOpacity={0.8}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected
                    ? colors.warning
                    : isDark
                    ? '#111827'
                    : '#FFFFFF',
                  borderColor: isSelected ? colors.warning : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : colors.textSecondary,
                    fontFamily: isSelected
                      ? Typography.fontFamily.bold
                      : Typography.fontFamily.medium,
                  },
                ]}
              >
                {toPersianDigits(m)} دقیقه
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Manual Input */}
      <View style={styles.customRow}>
        <Text
          style={[
            styles.customLabel,
            { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          یا ثبت دستی:
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.unitLabel,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            دقیقه
          </Text>
          <TextInput
            value={delayMinutes > 0 ? toPersianDigits(delayMinutes) : ''}
            onChangeText={handleCustomChange}
            keyboardType="number-pad"
            placeholder="۰"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 12.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  badgeText: {
    fontSize: 11.5,
    fontFamily: Typography.fontFamily.bold,
  },
  pillsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
  },
  customRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  customLabel: {
    fontSize: 11.5,
  },
  inputBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    width: 90,
  },
  input: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    padding: 0,
  },
  unitLabel: {
    fontSize: 10,
  },
});
