import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, User, LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, BorderRadius, TouchTarget } from '@/constants/theme';

export type TabRoute = 'home' | 'calendar' | 'profile';

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
  { id: 'home', label: 'خانه', icon: Home },
  { id: 'calendar', label: 'تقویم کاری', icon: Calendar },
  { id: 'profile', label: 'کارت راننده', icon: User },
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
              {/* Active top gold line indicator */}
              {isActive && (
                <View
                  style={[
                    styles.activeTopLine,
                    {
                      backgroundColor: colors.gold,
                      shadowColor: colors.gold,
                    },
                  ]}
                />
              )}

              {/* Icon with soft gold pill background when active */}
              <View
                style={[
                  styles.iconWrapper,
                  isActive && {
                    backgroundColor: colors.goldBg,
                  },
                ]}
              >
                <Icon
                  size={19}
                  color={isActive ? colors.gold : colors.textMuted}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
              </View>

              {/* Label - strictly single line, fixed height, identical baseline */}
              <View style={styles.labelContainer}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  style={[
                    styles.label,
                    {
                      color: isActive ? colors.gold : colors.textMuted,
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
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 52,
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
    width: 28,
    height: 2.5,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  iconWrapper: {
    width: 38,
    height: 26,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
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
