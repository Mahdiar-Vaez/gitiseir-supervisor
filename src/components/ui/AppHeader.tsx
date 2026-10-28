import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Moon, Sun, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { getCurrentJalaliDate } from '@/utils/jalali';

interface AppHeaderProps {
  driverName?: string;
  onNotificationPress?: () => void;
}

export function AppHeader({
  driverName,
  onNotificationPress,
}: AppHeaderProps) {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const today = getCurrentJalaliDate();

  // Dynamically resolve driver name from authenticated user session
  const userFullName = user
    ? `${user.name || ''} ${user.family || ''}`.trim()
    : '';
  const resolvedName = driverName || userFullName || 'راننده گرامی';
  const initialLetter = resolvedName ? resolvedName.charAt(0) : 'ر';

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
      {/* Right side in RTL (User profile & greeting) */}
      <View style={styles.profileSection}>
        <View
          style={[
            styles.avatarContainer,
            {
              backgroundColor: colors.goldBg,
              borderColor: colors.gold,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.gold }]}>
            {initialLetter}
          </Text>
          <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
            <ShieldCheck size={9} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text
            numberOfLines={2}
            style={[
              styles.greetingText,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {resolvedName}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.dateText,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            {today.formattedText}
          </Text>
        </View>
      </View>

      {/* Left side in RTL (Action buttons: Theme toggle & Notifications) */}
      <View style={styles.actionsSection}>
        {/* Dual Theme Toggle: Sun / Moon */}
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

        {/* Notifications Button */}
        <Pressable
          onPress={onNotificationPress}
          hitSlop={6}
          accessibilityLabel="اعلان‌ها"
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Bell size={17} color={colors.textSecondary} />
          <View
            style={[
              styles.notificationDot,
              { backgroundColor: colors.gold, borderColor: colors.card },
            ]}
          />
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
    fontSize: 17,
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
    borderColor: '#0B0F19',
  },
  textContainer: {
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 14.5,
    letterSpacing: -0.2,
    textAlign: 'right',
    lineHeight: 20,
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
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
  },
});
