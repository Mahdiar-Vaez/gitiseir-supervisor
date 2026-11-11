import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Moon, Sun, ShieldCheck, Repeat } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSarshoofer } from '@/context/SarshooferContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { getCurrentJalaliDate } from '@/utils/jalali';
import { toPersianDigits } from '@/utils/persian-digits';

interface AppHeaderProps {
  supervisorName?: string;
}

export function AppHeader({ supervisorName }: AppHeaderProps) {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { user } = useAuth();
  const { stats } = useSarshoofer();
  const insets = useSafeAreaInsets();
  const [today, setToday] = useState(() => getCurrentJalaliDate());

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(getCurrentJalaliDate());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const userFullName = user
    ? `${user.name || ''} ${user.family || ''}`.trim()
    : '';
  const resolvedName = supervisorName || userFullName || 'سرشوفر گرامی';
  const initialLetter = resolvedName ? resolvedName.charAt(0) : 'س';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8) + 6,
          backgroundColor: colors.bg,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Right side in RTL: Avatar, Name & Jalali Date (Clean, no GPS clutter) */}
      <View style={styles.profileSection}>
        <View
          style={[
            styles.avatarContainer,
            {
              backgroundColor: colors.commandBg,
              borderColor: colors.command,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.command }]}>
            {initialLetter}
          </Text>
          <View style={[styles.verifiedBadge, { backgroundColor: colors.gold }]}>
            <ShieldCheck size={9} color="#071318" />
          </View>
        </View>

        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.greetingText,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {resolvedName}
            </Text>
            <View
              style={[
                styles.rolePill,
                {
                  backgroundColor: colors.commandBg,
                  borderColor: colors.commandBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.rolePillText,
                  { color: colors.command, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                سرشوفر
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.dateText,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            {today.formattedWithTime}
          </Text>
        </View>
      </View>

      {/* Left side in RTL: Theme Toggle & Quick Langi Tab Button */}
      <View style={styles.actionsSection}>
        <Pressable
          onPress={toggleTheme}
          hitSlop={6}
          accessibilityLabel="تغییر تم"
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          {isDark ? (
            <Sun size={17} color={colors.gold} />
          ) : (
            <Moon size={17} color={colors.gold} />
          )}
        </Pressable>

        <Pressable
          onPress={() => router.navigate('/langi' as any)}
          hitSlop={6}
          accessibilityLabel="وضعیت لنگی‌ها"
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: colors.card,
              borderColor: stats.langiCount > 0 ? colors.langiBorder : colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Repeat size={16} color={stats.langiCount > 0 ? colors.langi : colors.textSecondary} />
          {stats.langiCount > 0 && (
            <View
              style={[
                styles.badgeCounter,
                { backgroundColor: colors.langi, borderColor: colors.card },
              ]}
            >
              <Text style={styles.badgeCounterText}>
                {toPersianDigits(stats.langiCount)}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  profileSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 14,
    height: 14,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#071318',
  },
  textContainer: {
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 14,
    letterSpacing: -0.2,
    textAlign: 'right',
    lineHeight: 20,
  },
  rolePill: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 9.5,
  },
  dateText: {
    fontSize: 11,
    marginTop: 1,
    textAlign: 'right',
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeCounter: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCounterText: {
    color: '#071318',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
