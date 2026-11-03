import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits, toEnglishDigits } from '@/utils/persian-digits';
import { DayTripGridItem } from '@/services/api/types';
import { StatusPill } from './StatusPill';
import { getTripStatusConfig } from '@/utils/trip-status';
import {
  Search,
  X,
  UserCheck,
  UserPlus,
  Eye,
  Phone,
  Car,
  Clock,
  Table2,
} from 'lucide-react-native';

interface DayTripsTableProps {
  trips: DayTripGridItem[];
  onSelectTrip: (trip: DayTripGridItem) => void;
  showSupervisorActions?: boolean;
  onConfirmAttendance?: (trip: DayTripGridItem) => void;
  onAssignTempDriver?: (trip: DayTripGridItem) => void;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'temp';

function formatPrice(num?: number | null): string {
  if (!num || isNaN(num)) return '---';
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  return toPersianDigits(formatted);
}

export function DayTripsTable({
  trips,
  onSelectTrip,
  showSupervisorActions = false,
  onConfirmAttendance,
  onAssignTempDriver,
}: DayTripsTableProps) {
  const { colors, isDark } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const filteredTrips = useMemo(() => {
    const q = toEnglishDigits(searchQuery).trim().toLowerCase();

    return trips.filter((item) => {
      if (statusFilter === 'pending' && item.status !== 0) return false;
      if (statusFilter === 'confirmed' && item.status !== 1 && item.status !== 2)
        return false;
      if (statusFilter === 'temp' && !item.hasTemporaryDriver) return false;

      if (!q) return true;

      const searchableFields = [
        String(item.tripId || ''),
        item.tripName || '',
        item.driverFullName || '',
        item.driverTel || '',
        item.licensePlate || '',
        item.carType || '',
        item.carBodyColor || '',
        item.outbound?.start || '',
        item.temporaryDriver
          ? `${item.temporaryDriver.name} ${item.temporaryDriver.family}`
          : '',
      ]
        .map((s) => toEnglishDigits(s).toLowerCase())
        .join(' ');

      return searchableFields.includes(q);
    });
  }, [trips, searchQuery, statusFilter]);

  const filterOptions: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'همه', count: trips.length },
    {
      key: 'pending',
      label: 'در انتظار',
      count: trips.filter((t) => t.status === 0).length,
    },
    {
      key: 'confirmed',
      label: 'تأیید شده',
      count: trips.filter((t) => t.status === 1 || t.status === 2).length,
    },
    {
      key: 'temp',
      label: 'دارای لنگی',
      count: trips.filter((t) => t.hasTemporaryDriver).length,
    },
  ];

  const actionColWidth = showSupervisorActions ? 215 : 92;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top Toolbar: Title + Search Input */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.toolbarHeaderRow}>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: colors.goldBg, borderColor: colors.borderGold },
            ]}
          >
            <Text
              style={[
                styles.countBadgeText,
                { color: colors.gold, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(filteredTrips.length)} از {toPersianDigits(trips.length)} سرویس
            </Text>
          </View>

          <View style={styles.toolbarTitleRow}>
            <Text
              style={[
                styles.toolbarTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              جدول دیتاگرید سفرهای روز
            </Text>
            <Table2 size={16} color={colors.gold} />
          </View>
        </View>

        {/* Search Input Box */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: searchQuery ? colors.gold : colors.border,
            },
          ]}
        >
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.clearBtn}
            >
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="جستجو بر اساس کد سفر، نام سفر (جهاد)، راننده، پلاک یا خودرو..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.searchInput,
              {
                color: colors.text,
                fontFamily: Typography.fontFamily.regular,
              },
            ]}
          />
          <Search size={16} color={colors.gold} />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          {filterOptions.map((f) => {
            const active = statusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setStatusFilter(f.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? colors.gold
                      : isDark
                      ? '#1E293B'
                      : '#EEF2F6',
                    borderColor: active ? colors.gold : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: active ? '#090D16' : colors.textSecondary,
                      fontFamily: active
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.medium,
                    },
                  ]}
                >
                  {f.label} ({toPersianDigits(f.count)})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Horizontal Scrollable Data-Grid Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        <View style={styles.tableContainer}>
          {/* Table Header Row (RTL: row-reverse) */}
          <View
            style={[
              styles.headerRow,
              {
                backgroundColor: isDark ? '#161F30' : '#F1F5F9',
                borderBottomColor: colors.borderGold,
              },
            ]}
          >
            <View style={[styles.cell, { width: 82 }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                کد سفر
              </Text>
            </View>

            <View style={[styles.cell, { width: 125 }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                نام سفر
              </Text>
            </View>

            <View style={[styles.cell, { width: 110 }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                وضعیت
              </Text>
            </View>

            <View style={[styles.cell, { width: 135 }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                ساعت رفت / برگشت
              </Text>
            </View>

            <View style={[styles.cell, { width: 118 }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                کرایه (ریال)
              </Text>
            </View>

            <View style={[styles.cell, { width: 150 }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                راننده و تلفن
              </Text>
            </View>

            <View style={[styles.cell, { width: 170 }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                مشخصات خودرو و پلاک
              </Text>
            </View>

            <View style={[styles.cell, { width: 115 }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                وضعیت لنگی
              </Text>
            </View>

            <View style={[styles.cell, { width: actionColWidth }]}>
              <Text
                style={[
                  styles.headerText,
                  { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                عملیات
              </Text>
            </View>
          </View>

          {/* Table Rows */}
          {filteredTrips.length === 0 ? (
            <View style={styles.noResultRow}>
              <Text
                style={[
                  styles.noResultText,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                سرویسی مطابق با عبارت جستجو شده یافت نشد.
              </Text>
            </View>
          ) : (
            filteredTrips.map((row, idx) => {
              const statusCfg = getTripStatusConfig(row.status);
              const outStart = row.outbound?.start
                ? row.outbound.start.slice(0, 5)
                : '--:--';
              const outEnd = row.outbound?.end
                ? row.outbound.end.slice(0, 5)
                : '--:--';
              const inStart = row.inbound?.start
                ? row.inbound.start.slice(0, 5)
                : null;
              const inEnd = row.inbound?.end ? row.inbound.end.slice(0, 5) : null;
              const fare = row.outbound?.price ?? row.inbound?.price ?? null;
              const carDesc = [
                row.carType,
                row.carBodyColor,
                row.carModelYear ? `مدل ${toPersianDigits(row.carModelYear)}` : null,
              ]
                .filter(Boolean)
                .join(' ');

              const isEven = idx % 2 === 0;
              const rowBg = isDark
                ? isEven
                  ? '#111827'
                  : '#0E1525'
                : isEven
                ? '#FFFFFF'
                : '#F9FAFB';

              return (
                <Pressable
                  key={row.tripWorkCalendarId || `${row.tripId}-${idx}`}
                  onPress={() => onSelectTrip(row)}
                  style={({ pressed }) => [
                    styles.dataRow,
                    {
                      backgroundColor: pressed
                        ? isDark
                          ? '#1E293B'
                          : '#F1F5F9'
                        : rowBg,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  {/* 1. Trip ID */}
                  <View style={[styles.cell, { width: 82 }]}>
                    <View
                      style={[
                        styles.tripIdPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(59, 130, 246, 0.14)'
                            : '#EFF6FF',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tripIdText,
                          {
                            color: '#3B82F6',
                            fontFamily: Typography.fontFamily.bold,
                          },
                        ]}
                      >
                        {toPersianDigits(row.tripId)}
                      </Text>
                    </View>
                  </View>

                  {/* 2. Trip Name */}
                  <View style={[styles.cell, { width: 125 }]}>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.cellPrimaryText,
                        { color: colors.text, fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      {row.tripName || '---'}
                    </Text>
                  </View>

                  {/* 3. Status */}
                  <View style={[styles.cell, { width: 110 }]}>
                    <StatusPill
                      status={statusCfg.status}
                      label={statusCfg.label}
                    />
                  </View>

                  {/* 4. Outbound / Inbound Time */}
                  <View style={[styles.cell, { width: 135 }]}>
                    <View style={styles.timeLine}>
                      <Clock size={11} color={colors.gold} />
                      <Text
                        style={[
                          styles.timeText,
                          { color: colors.text, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        {toPersianDigits(`${outStart} تا ${outEnd}`)}
                      </Text>
                    </View>
                    {inStart && inEnd ? (
                      <Text
                        style={[
                          styles.subTimeText,
                          {
                            color: colors.textMuted,
                            fontFamily: Typography.fontFamily.regular,
                          },
                        ]}
                      >
                        برگشت: {toPersianDigits(`${inStart} تا ${inEnd}`)}
                      </Text>
                    ) : null}
                  </View>

                  {/* 5. Price */}
                  <View style={[styles.cell, { width: 118 }]}>
                    <Text
                      style={[
                        styles.priceText,
                        { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      {formatPrice(fare)}
                    </Text>
                  </View>

                  {/* 6. Driver FullName & Tel */}
                  <View style={[styles.cell, { width: 150 }]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cellPrimaryText,
                        { color: colors.text, fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      {row.driverFullName || '---'}
                    </Text>
                    {row.driverTel ? (
                      <View style={styles.subInfoRow}>
                        <Phone size={10} color={colors.textMuted} />
                        <Text
                          style={[
                            styles.subInfoText,
                            {
                              color: colors.textSecondary,
                              fontFamily: Typography.fontFamily.regular,
                            },
                          ]}
                        >
                          {toPersianDigits(row.driverTel)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* 7. Vehicle & License Plate */}
                  <View style={[styles.cell, { width: 170 }]}>
                    {carDesc ? (
                      <View style={styles.subInfoRow}>
                        <Car size={11} color={colors.gold} />
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.cellPrimaryText,
                            {
                              color: colors.text,
                              fontFamily: Typography.fontFamily.medium,
                            },
                          ]}
                        >
                          {toPersianDigits(carDesc)}
                        </Text>
                      </View>
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.plateText,
                        {
                          color: colors.textSecondary,
                          fontFamily: Typography.fontFamily.bold,
                        },
                      ]}
                    >
                      {row.licensePlate
                        ? toPersianDigits(row.licensePlate)
                        : 'بدون پلاک'}
                    </Text>
                  </View>

                  {/* 8. Temporary Driver (لنگی) */}
                  <View style={[styles.cell, { width: 115 }]}>
                    {row.hasTemporaryDriver ? (
                      <View
                        style={[
                          styles.tempBadge,
                          {
                            backgroundColor: 'rgba(245, 158, 11, 0.14)',
                            borderColor: '#F59E0B',
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.tempBadgeText,
                            {
                              color: '#F59E0B',
                              fontFamily: Typography.fontFamily.bold,
                            },
                          ]}
                        >
                          {row.temporaryDriver
                            ? `${row.temporaryDriver.name} ${row.temporaryDriver.family}`
                            : 'دارای لنگی'}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.noTempText,
                          {
                            color: colors.textMuted,
                            fontFamily: Typography.fontFamily.regular,
                          },
                        ]}
                      >
                        ندارد
                      </Text>
                    )}
                  </View>

                  {/* 9. Actions */}
                  <View style={[styles.cell, styles.actionsCell, { width: actionColWidth }]}>
                    <TouchableOpacity
                      onPress={() => onSelectTrip(row)}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Eye size={12} color={colors.gold} />
                      <Text
                        style={[
                          styles.actionBtnText,
                          {
                            color: colors.text,
                            fontFamily: Typography.fontFamily.bold,
                          },
                        ]}
                      >
                        جزئیات
                      </Text>
                    </TouchableOpacity>

                    {showSupervisorActions ? (
                      <>
                        <TouchableOpacity
                          onPress={() => onConfirmAttendance?.(row)}
                          style={[
                            styles.actionBtn,
                            {
                              backgroundColor: 'rgba(16, 185, 129, 0.14)',
                              borderColor: '#10B981',
                            },
                          ]}
                        >
                          <UserCheck size={12} color="#10B981" />
                          <Text
                            style={[
                              styles.actionBtnText,
                              {
                                color: '#10B981',
                                fontFamily: Typography.fontFamily.bold,
                              },
                            ]}
                          >
                            حضور
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => onAssignTempDriver?.(row)}
                          style={[
                            styles.actionBtn,
                            {
                              backgroundColor: 'rgba(245, 158, 11, 0.14)',
                              borderColor: '#F59E0B',
                            },
                          ]}
                        >
                          <UserPlus size={12} color="#F59E0B" />
                          <Text
                            style={[
                              styles.actionBtnText,
                              {
                                color: '#F59E0B',
                                fontFamily: Typography.fontFamily.bold,
                              },
                            ]}
                          >
                            لنگی
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolbar: {
    padding: Spacing.sm,
    gap: 8,
    borderBottomWidth: 1,
  },
  toolbarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarTitle: {
    fontSize: 13,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 10.5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  filterChipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  horizontalScrollContent: {
    flexGrow: 1,
  },
  tableContainer: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 9,
    minHeight: 54,
  },
  cell: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripIdPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tripIdText: {
    fontSize: 11.5,
  },
  cellPrimaryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  timeLine: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11.5,
  },
  subTimeText: {
    fontSize: 10,
    marginTop: 2,
  },
  priceText: {
    fontSize: 12,
  },
  subInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  subInfoText: {
    fontSize: 10.5,
  },
  plateText: {
    fontSize: 10.5,
    marginTop: 2,
  },
  tempBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  tempBadgeText: {
    fontSize: 10.5,
  },
  noTempText: {
    fontSize: 11,
  },
  actionsCell: {
    flexDirection: 'row-reverse',
    gap: 5,
  },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 10.5,
  },
  noResultRow: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultText: {
    fontSize: 12,
  },
});
