import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import {
  JALALI_MONTH_NAMES,
  PERSIAN_WEEKDAYS_SHORT,
  getDaysInJalaliMonth,
  getJalaliMonthStartWeekday,
  getCurrentJalaliDate,
} from '@/utils/jalali';
import { WorkCalendarDay } from '@/services/api/types';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react-native';

export type DayStatus = 'completed' | 'scheduled' | 'cancelled' | 'none';

interface ShamsiCalendarProps {
  year: number;
  month: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onMonthChange?: (year: number, month: number) => void;
  calendarDays?: WorkCalendarDay[];
  dayStatuses?: Record<number, DayStatus>;
  isLoading?: boolean;
}

export function ShamsiCalendar({
  year,
  month,
  selectedDay,
  onSelectDay,
  onMonthChange,
  calendarDays = [],
}: ShamsiCalendarProps) {
  const { colors, isDark } = useAppTheme();
  const today = getCurrentJalaliDate();

  const monthName = JALALI_MONTH_NAMES[month - 1] || 'نامشخص';
  const daysInMonth = getDaysInJalaliMonth(year, month);
  const startOffset = getJalaliMonthStartWeekday(year, month);

  const isViewingCurrentMonth = year === today.year && month === today.month;

  const handlePrevMonth = () => {
    if (!onMonthChange) return;
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (!onMonthChange) return;
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const handleJumpToToday = () => {
    if (onMonthChange) {
      onMonthChange(today.year, today.month);
    }
    onSelectDay(today.day);
  };

  // Generate array of days 1..daysInMonth
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: startOffset }, (_, i) => i);

  // Map calendarDays by day number for fast O(1) lookup
  const daysMap = React.useMemo(() => {
    const map = new Map<number, WorkCalendarDay>();
    for (const d of calendarDays) {
      map.set(d.day, d);
    }
    return map;
  }, [calendarDays]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Month Navigation Header */}
      <View style={styles.monthHeader}>
        {/* Next Month (Arrow Left in RTL) */}
        <Pressable
          onPress={handleNextMonth}
          hitSlop={8}
          accessibilityLabel="ماه بعد"
          style={({ pressed }) => [
            styles.navButton,
            {
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ChevronLeft size={16} color={colors.gold} />
        </Pressable>

        {/* Center: Month & Year Label + Jump to Today */}
        <View style={styles.monthLabelWrapper}>
          <Text
            style={[
              styles.monthText,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {monthName} {toPersianDigits(year)}
          </Text>

          {!isViewingCurrentMonth && (
            <Pressable
              onPress={handleJumpToToday}
              hitSlop={6}
              style={({ pressed }) => [
                styles.todayChip,
                {
                  backgroundColor: colors.goldBg,
                  borderColor: colors.gold,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <CalendarIcon size={10} color={colors.gold} />
              <Text
                style={[
                  styles.todayChipText,
                  { color: colors.gold, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                امروز
              </Text>
            </Pressable>
          )}
        </View>

        {/* Prev Month (Arrow Right in RTL) */}
        <Pressable
          onPress={handlePrevMonth}
          hitSlop={8}
          accessibilityLabel="ماه قبل"
          style={({ pressed }) => [
            styles.navButton,
            {
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ChevronRight size={16} color={colors.gold} />
        </Pressable>
      </View>

      {/* Weekday Labels (شنبه تا جمعه) */}
      <View style={styles.weekdaysRow}>
        {PERSIAN_WEEKDAYS_SHORT.map((wd, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                {
                  color: index === 6 ? '#EF4444' : colors.textMuted,
                  fontFamily: Typography.fontFamily.bold,
                },
              ]}
            >
              {wd}
            </Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {blankDays.map((_, i) => (
          <View key={`blank-${i}`} style={styles.dayCell} />
        ))}

        {days.map((day) => {
          const isSelected = selectedDay === day;
          const dayData = daysMap.get(day);

          const isToday =
            (year === today.year && month === today.month && day === today.day) ||
            Boolean(dayData?.isToday);

          // Weekday index (0..6) of this day
          const dayWeekdayIndex = (startOffset + day - 1) % 7;
          const isHoliday = dayData?.isHoliday ?? dayWeekdayIndex === 6;

          const tripCount = dayData?.trips?.length ?? 0;

          return (
            <Pressable
              key={day}
              onPress={() => onSelectDay(day)}
              accessibilityRole="button"
              accessibilityLabel={`روز ${toPersianDigits(day)} ${monthName}`}
              style={({ pressed }) => [
                styles.dayCell,
                isSelected && [
                  styles.selectedDayCell,
                  {
                    backgroundColor: colors.gold,
                    borderColor: colors.goldSoft,
                  },
                ],
                !isSelected &&
                  isToday && [
                    styles.todayDayCell,
                    {
                      borderColor: colors.gold,
                      backgroundColor: isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(212, 175, 55, 0.08)',
                    },
                  ],
                !isSelected && pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  {
                    color: isSelected
                      ? isDark
                        ? '#0B0F19'
                        : '#FFFFFF'
                      : isHoliday
                      ? '#EF4444'
                      : isToday
                      ? colors.gold
                      : colors.text,
                    fontFamily:
                      isSelected || isToday
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.medium,
                  },
                ]}
              >
                {toPersianDigits(day)}
              </Text>

              {/* Trip Count Indicator Badge */}
              <View style={styles.dotContainer}>
                {tripCount > 0 && (
                  <View
                    style={[
                      styles.tripBadge,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#0B0F19'
                            : '#FFFFFF'
                          : colors.gold,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tripBadgeText,
                        {
                          color: isSelected
                            ? colors.gold
                            : isDark
                            ? '#0B0F19'
                            : '#FFFFFF',
                          fontFamily: Typography.fontFamily.bold,
                        },
                      ]}
                    >
                      {toPersianDigits(tripCount)}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Legend Row */}
      <View style={[styles.legendRow, { borderTopColor: colors.borderSubtle }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBadge, { backgroundColor: colors.gold }]} />
          <Text
            style={[
              styles.legendText,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            دارای سفر
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: colors.gold, borderWidth: 1.5 }]} />
          <Text
            style={[
              styles.legendText,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            امروز
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text
            style={[
              styles.legendText,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            روز تعطیل
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm + 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabelWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 15.5,
    letterSpacing: -0.2,
  },
  todayChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  todayChipText: {
    fontSize: 11,
  },
  weekdaysRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  weekdayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12.5,
  },
  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  selectedDayCell: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  todayDayCell: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
  },
  dayNumber: {
    fontSize: 14.5,
    lineHeight: 18,
  },
  dotContainer: {
    position: 'absolute',
    bottom: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripBadge: {
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripBadgeText: {
    fontSize: 8.5,
    lineHeight: 11,
  },
  legendRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10.5,
  },
});
