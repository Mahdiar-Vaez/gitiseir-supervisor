import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, CalendarDays, ShieldUser, LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, BorderRadius, TouchTarget } from '@/constants/theme';

export type TabRoute = 'drivers' | 'calendar' | 'profile';

interface CustomBottomTabBarProps {
  activeTab: TabRoute;
  onTabChange: (tab: TabRoute) => void;
}

interface TabItemConfig {
  id: TabRoute;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItemConfig[] = [
  { id: 'drivers', label: 'بورد روزانه محل خدمت', icon: Users },
  { id: 'calendar', label: 'تقویم کاری', icon: CalendarDays },
  { id: 'profile', label: 'کارت سرشوفر', icon: ShieldUser },
];

export function CustomBottomTabBar({ activeTab, onTabChange }: CustomBottomTabBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const activeAccent =
            tab.id === 'calendar' ? colors.gold : colors.command;
          const activeBg =
            tab.id === 'calendar' ? colors.goldBg : colors.commandBg;

          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              style={({ pressed }) => [
                styles.tabItem,
                {
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              {isActive && (
                <View
                  style={[
                    styles.activeTopLine,
                    {
                      backgroundColor: activeAccent,
                      shadowColor: activeAccent,
                    },
                  ]}
                />
              )}

              <View
                style={[
                  styles.iconWrapper,
                  isActive && {
                    backgroundColor: activeBg,
                  },
                ]}
              >
                <Icon
                  size={19}
                  color={isActive ? activeAccent : colors.textMuted}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
              </View>

              <View style={styles.labelContainer}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  style={[
                    styles.label,
                    {
                      color: isActive ? activeAccent : colors.textMuted,
                      fontFamily: isActive
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.medium,
                    },
                    Platform.OS === 'web' && ({ whiteSpace: 'nowrap' } as any),
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 54,
    paddingTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    position: 'relative',
    height: '100%',
  },
  activeTopLine: {
    position: 'absolute',
    top: -4,
    width: 32,
    height: 2.5,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  iconWrapper: {
    width: 42,
    height: 26,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -3,
    left: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    paddingHorizontal: 3,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#071318',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  labelContainer: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'center',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
});
