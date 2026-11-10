import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  X,
  Users,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  CheckSquare,
  Square,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useSarshoofer } from '@/context/SarshooferContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits, toEnglishDigits } from '@/utils/persian-digits';
import { TodayDriverItem, ArrivalStatus } from '@/services/api/types';
import { AppHeader } from '@/components/ui/AppHeader';
import { DriverAttendanceCard } from '@/components/ui/DriverAttendanceCard';
import { ArrivalConfirmModal } from '@/components/ui/ArrivalConfirmModal';
import { LangiRequestModal } from '@/components/ui/LangiRequestModal';

type MainTabType = 'exceptions' | 'completed';
type ExceptionSubFilter = 'all' | 'not_arrived' | 'pending' | 'langi';

export default function TodayDriversScreen() {
  const { colors, isDark } = useAppTheme();
  const {
    drivers,
    dailyBoard,
    serviceLocations,
    companyServiceLocationId,
    entering,
    setCompanyServiceLocationId,
    setEntering,
    loading,
    refreshing,
    refreshFleet,
    confirmDriverArrival,
    confirmBulkDriversArrival,
    stats,
  } = useSarshoofer();

  // Primary Two-Tab View (Exceptions First vs Completed)
  const [mainTab, setMainTab] = useState<MainTabType>('exceptions');
  const [exceptionSubFilter, setExceptionSubFilter] =
    useState<ExceptionSubFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>(
    String(companyServiceLocationId)
  );

  // Bulk Selection & Approval State
  const [selectedIdsForBulk, setSelectedIdsForBulk] = useState<Set<string>>(
    new Set()
  );
  const [isBulkLoading, setIsBulkLoading] = useState<boolean>(false);
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState<boolean>(false);

  // Arrival Confirmation Modal State (Individual)
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [selectedDriverForArrival, setSelectedDriverForArrival] =
    useState<TodayDriverItem | null>(null);
  const [targetArrivalStatus, setTargetArrivalStatus] =
    useState<ArrivalStatus>('arrived');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Langi Request Modal State
  const [langiModalVisible, setLangiModalVisible] = useState<boolean>(false);
  const [selectedDriverForLangi, setSelectedDriverForLangi] =
    useState<TodayDriverItem | null>(null);

  // 1. Pending drivers eligible for Bulk Approval
  const eligiblePendingDrivers = useMemo(() => {
    return drivers.filter((item) => item.arrivalStatus === 'pending');
  }, [drivers]);

  // Target IDs for Bulk Approval (if no explicit subset is selected, default to all pending)
  const targetBulkIds = useMemo(() => {
    if (selectedIdsForBulk.size > 0) {
      return Array.from(selectedIdsForBulk);
    }
    return eligiblePendingDrivers.map((d) => d.tripWorkCalendarId);
  }, [selectedIdsForBulk, eligiblePendingDrivers]);

  const allPendingSelected = useMemo(() => {
    if (eligiblePendingDrivers.length === 0) return false;
    return (
      selectedIdsForBulk.size === eligiblePendingDrivers.length &&
      eligiblePendingDrivers.every((d) =>
        selectedIdsForBulk.has(d.tripWorkCalendarId)
      )
    );
  }, [selectedIdsForBulk, eligiblePendingDrivers]);

  const handleToggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIdsForBulk(new Set());
    } else {
      setSelectedIdsForBulk(
        new Set(eligiblePendingDrivers.map((d) => d.tripWorkCalendarId))
      );
    }
  };

  const handleToggleSelectDriver = (driver: TodayDriverItem) => {
    setSelectedIdsForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(driver.tripWorkCalendarId)) {
        next.delete(driver.tripWorkCalendarId);
      } else {
        next.add(driver.tripWorkCalendarId);
      }
      return next;
    });
  };

  // 2. Exception Drivers (Tab 1) - Sorted Exceptions First (not_arrived at top in red!)
  const exceptionsDrivers = useMemo(() => {
    let list = drivers.filter((d) => d.arrivalStatus !== 'arrived');

    if (exceptionSubFilter === 'not_arrived') {
      list = list.filter((d) => d.arrivalStatus === 'not_arrived');
    } else if (exceptionSubFilter === 'pending') {
      list = list.filter((d) => d.arrivalStatus === 'pending');
    } else if (exceptionSubFilter === 'langi') {
      list = list.filter((d) => d.hasLangi);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) => {
        const matchName = item.driverFullName.toLowerCase().includes(q);
        const matchTrip = item.tripName.toLowerCase().includes(q);
        const matchPlate = item.licensePlate.toLowerCase().includes(q);
        const matchLangi =
          item.langi &&
          `${item.langi.name} ${item.langi.family}`.toLowerCase().includes(q);
        return matchName || matchTrip || matchPlate || matchLangi;
      });
    }

    // Crucial Sort Rule: not_arrived drivers first, then langi, then time
    return [...list].sort((a, b) => {
      if (a.arrivalStatus === 'not_arrived' && b.arrivalStatus !== 'not_arrived')
        return -1;
      if (b.arrivalStatus === 'not_arrived' && a.arrivalStatus !== 'not_arrived')
        return 1;
      if (a.hasLangi && !b.hasLangi) return -1;
      if (b.hasLangi && !a.hasLangi) return 1;
      return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
    });
  }, [drivers, exceptionSubFilter, searchQuery]);

  // 3. Completed Drivers (Tab 2)
  const completedDrivers = useMemo(() => {
    let list = drivers.filter((d) => d.arrivalStatus === 'arrived');

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) => {
        const matchName = item.driverFullName.toLowerCase().includes(q);
        const matchTrip = item.tripName.toLowerCase().includes(q);
        const matchPlate = item.licensePlate.toLowerCase().includes(q);
        return matchName || matchTrip || matchPlate;
      });
    }

    return [...list].sort((a, b) =>
      a.scheduledStartTime.localeCompare(b.scheduledStartTime)
    );
  }, [drivers, searchQuery]);

  const exceptionsTotalCount = stats.notArrivedCount + stats.pendingCount;

  const handleApplyLocationId = () => {
    const parsed = Number(toEnglishDigits(locationInput).replace(/\D/g, ''));
    if (parsed > 0) {
      setCompanyServiceLocationId(parsed);
    }
  };

  const handleOpenArrivalModal = (
    driverItem: TodayDriverItem,
    status: ArrivalStatus
  ) => {
    setSelectedDriverForArrival(driverItem);
    setTargetArrivalStatus(status);
    setConfirmModalVisible(true);
  };

  const handleConfirmArrivalSubmit = async (
    tripWorkCalendarId: string,
    status: ArrivalStatus,
    note: string,
    openLangiAfter: boolean
  ) => {
    const targetDriver = selectedDriverForArrival;
    setProcessingId(tripWorkCalendarId);
    try {
      await confirmDriverArrival(tripWorkCalendarId, status, note);
      setConfirmModalVisible(false);

      if (openLangiAfter && targetDriver) {
        setTimeout(() => {
          router.navigate('/calendar' as any);
        }, 220);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenLangiModal = (driverItem?: TodayDriverItem) => {
    if (driverItem && driverItem.hasLangi) {
      setSelectedDriverForLangi(driverItem);
      setLangiModalVisible(true);
    } else {
      router.navigate('/calendar' as any);
    }
  };

  // One-Click Bulk Approval Action (Strictly Pessimistic)
  const handleExecuteBulkApproval = async () => {
    if (targetBulkIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      await confirmBulkDriversArrival(targetBulkIds);
      setSelectedIdsForBulk(new Set());
      setBulkConfirmVisible(false);
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshFleet}
            tintColor={colors.command}
            colors={[colors.command]}
          />
        }
      >
        {/* 0. Daily Board Location & Direction Card */}
        <View
          style={[
            styles.dailyBoardFilterCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.commandBorder,
            },
          ]}
        >
          <View style={styles.dailyBoardHeaderRow}>
            <View style={styles.directionToggleGroup}>
              <TouchableOpacity
                onPress={() => setEntering(true)}
                style={[
                  styles.dirBtn,
                  {
                    backgroundColor: entering ? colors.command : 'transparent',
                    borderColor: entering ? colors.command : colors.border,
                  },
                ]}
              >
                <ArrowDownLeft
                  size={13}
                  color={entering ? '#071318' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.dirBtnText,
                    {
                      color: entering ? '#071318' : colors.textSecondary,
                      fontFamily: entering
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                    },
                  ]}
                >
                  سرویس‌های ورودی
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setEntering(false)}
                style={[
                  styles.dirBtn,
                  {
                    backgroundColor: !entering ? colors.gold : 'transparent',
                    borderColor: !entering ? colors.gold : colors.border,
                  },
                ]}
              >
                <ArrowUpRight
                  size={13}
                  color={!entering ? '#071318' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.dirBtnText,
                    {
                      color: !entering ? '#071318' : colors.textSecondary,
                      fontFamily: !entering
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                    },
                  ]}
                >
                  سرویس‌های خروجی
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.boardTitleGroup}>
              <Text
                style={[
                  styles.boardTitleText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                بورد روزانه محل خدمت
              </Text>
              <MapPin size={15} color={colors.command} />
            </View>
          </View>

          {/* Service Location Selector */}
          {serviceLocations.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.locationsChipsRow}
            >
              {serviceLocations.map((loc) => {
                const active = loc.id === companyServiceLocationId;
                return (
                  <TouchableOpacity
                    key={loc.id}
                    onPress={() => {
                      setCompanyServiceLocationId(loc.id);
                      setLocationInput(String(loc.id));
                    }}
                    style={[
                      styles.locChip,
                      {
                        backgroundColor: active
                          ? colors.commandBg
                          : isDark
                          ? '#071318'
                          : '#F8FAFC',
                        borderColor: active ? colors.command : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.locChipText,
                        {
                          color: active ? colors.command : colors.textSecondary,
                          fontFamily: active
                            ? Typography.fontFamily.bold
                            : Typography.fontFamily.regular,
                        },
                      ]}
                    >
                      {loc.title} ({toPersianDigits(loc.id)})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={styles.locationInputRow}>
            <TouchableOpacity
              onPress={handleApplyLocationId}
              style={[
                styles.applyLocBtn,
                { backgroundColor: colors.command },
              ]}
            >
              <RefreshCw size={13} color="#071318" />
              <Text
                style={[
                  styles.applyLocBtnText,
                  { fontFamily: Typography.fontFamily.bold },
                ]}
              >
                استعلام بورد
              </Text>
            </TouchableOpacity>

            <TextInput
              value={locationInput}
              onChangeText={setLocationInput}
              onSubmitEditing={handleApplyLocationId}
              keyboardType="numeric"
              placeholder="کد محل خدمت (مثال: 18)"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.locIdInput,
                {
                  backgroundColor: isDark ? '#071318' : '#F8FAFC',
                  borderColor: colors.border,
                  color: colors.text,
                  fontFamily: Typography.fontFamily.bold,
                },
              ]}
            />

            <Text
              style={[
                styles.locIdLabel,
                {
                  color: colors.textSecondary,
                  fontFamily: Typography.fontFamily.medium,
                },
              ]}
            >
              کد محل خدمت:
            </Text>
          </View>

          {dailyBoard ? (
            <View
              style={[
                styles.boardSummaryBar,
                {
                  backgroundColor: isDark ? '#071318' : '#F0FDFA',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.boardSummaryText,
                  { color: colors.command, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {dailyBoard.companyServiceLocationTitle} ({dailyBoard.directionTitle})
              </Text>
              <Text
                style={[
                  styles.boardCountsText,
                  {
                    color: colors.textSecondary,
                    fontFamily: Typography.fontFamily.regular,
                  },
                ]}
              >
                کل: {toPersianDigits(dailyBoard.totalCount)} | زمان‌بندی:{' '}
                {toPersianDigits(dailyBoard.scheduledCount)} | در جریان:{' '}
                {toPersianDigits(dailyBoard.startedCount)} | تکمیل:{' '}
                {toPersianDigits(dailyBoard.completedCount)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 1. Primary Two Tabs Navigation (Exceptions First vs Completed) */}
        <View style={styles.mainTabsContainer}>
          <TouchableOpacity
            onPress={() => setMainTab('exceptions')}
            style={[
              styles.mainTabBtn,
              {
                backgroundColor:
                  mainTab === 'exceptions'
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.16)'
                      : '#FEF2F2'
                    : isDark
                    ? '#071318'
                    : '#F8FAFC',
                borderColor:
                  mainTab === 'exceptions' ? '#EF4444' : colors.border,
              },
            ]}
          >
            <View style={styles.tabBadgeRow}>
              {exceptionsTotalCount > 0 ? (
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor:
                        stats.notArrivedCount > 0 ? '#EF4444' : colors.gold,
                    },
                  ]}
                >
                  <Text style={styles.tabBadgeText}>
                    {toPersianDigits(exceptionsTotalCount)}
                  </Text>
                </View>
              ) : null}
              <AlertTriangle
                size={16}
                color={mainTab === 'exceptions' ? '#EF4444' : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.mainTabText,
                {
                  color: mainTab === 'exceptions' ? '#EF4444' : colors.textMuted,
                  fontFamily:
                    mainTab === 'exceptions'
                      ? Typography.fontFamily.bold
                      : Typography.fontFamily.medium,
                },
              ]}
            >
              نیازمند بررسی و استثناها
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMainTab('completed')}
            style={[
              styles.mainTabBtn,
              {
                backgroundColor:
                  mainTab === 'completed'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.16)'
                      : '#F0FDF4'
                    : isDark
                    ? '#071318'
                    : '#F8FAFC',
                borderColor:
                  mainTab === 'completed' ? '#10B981' : colors.border,
              },
            ]}
          >
            <View style={styles.tabBadgeRow}>
              {stats.arrivedCount > 0 ? (
                <View
                  style={[
                    styles.tabBadge,
                    { backgroundColor: '#10B981' },
                  ]}
                >
                  <Text style={styles.tabBadgeText}>
                    {toPersianDigits(stats.arrivedCount)}
                  </Text>
                </View>
              ) : null}
              <CheckCircle2
                size={16}
                color={mainTab === 'completed' ? '#10B981' : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.mainTabText,
                {
                  color: mainTab === 'completed' ? '#10B981' : colors.textMuted,
                  fontFamily:
                    mainTab === 'completed'
                      ? Typography.fontFamily.bold
                      : Typography.fontFamily.medium,
                },
              ]}
            >
              تکمیل و تأییدشده
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Sub-filters for Exceptions Tab */}
        {mainTab === 'exceptions' && (
          <View style={styles.subFiltersRow}>
            <TouchableOpacity
              onPress={() => setExceptionSubFilter('all')}
              style={[
                styles.subFilterChip,
                {
                  backgroundColor:
                    exceptionSubFilter === 'all'
                      ? colors.commandBg
                      : 'transparent',
                  borderColor:
                    exceptionSubFilter === 'all'
                      ? colors.command
                      : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.subFilterChipText,
                  {
                    color:
                      exceptionSubFilter === 'all'
                        ? colors.command
                        : colors.textSecondary,
                    fontFamily:
                      exceptionSubFilter === 'all'
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                  },
                ]}
              >
                همه ({toPersianDigits(exceptionsTotalCount)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExceptionSubFilter('not_arrived')}
              style={[
                styles.subFilterChip,
                {
                  backgroundColor:
                    exceptionSubFilter === 'not_arrived'
                      ? 'rgba(239, 68, 68, 0.14)'
                      : 'transparent',
                  borderColor:
                    exceptionSubFilter === 'not_arrived'
                      ? '#EF4444'
                      : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.subFilterChipText,
                  {
                    color:
                      exceptionSubFilter === 'not_arrived'
                        ? '#EF4444'
                        : colors.textSecondary,
                    fontFamily:
                      exceptionSubFilter === 'not_arrived'
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                  },
                ]}
              >
                نرسیده‌ها ({toPersianDigits(stats.notArrivedCount)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExceptionSubFilter('pending')}
              style={[
                styles.subFilterChip,
                {
                  backgroundColor:
                    exceptionSubFilter === 'pending'
                      ? colors.goldBg
                      : 'transparent',
                  borderColor:
                    exceptionSubFilter === 'pending'
                      ? colors.gold
                      : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.subFilterChipText,
                  {
                    color:
                      exceptionSubFilter === 'pending'
                        ? colors.gold
                        : colors.textSecondary,
                    fontFamily:
                      exceptionSubFilter === 'pending'
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                  },
                ]}
              >
                در انتظار ({toPersianDigits(stats.pendingCount)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExceptionSubFilter('langi')}
              style={[
                styles.subFilterChip,
                {
                  backgroundColor:
                    exceptionSubFilter === 'langi'
                      ? colors.langiBg
                      : 'transparent',
                  borderColor:
                    exceptionSubFilter === 'langi'
                      ? colors.langi
                      : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.subFilterChipText,
                  {
                    color:
                      exceptionSubFilter === 'langi'
                        ? colors.langi
                        : colors.textSecondary,
                    fontFamily:
                      exceptionSubFilter === 'langi'
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                  },
                ]}
              >
                لنگی ({toPersianDigits(stats.langiCount)})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Bulk Approval Action Bar (Only on Exceptions Tab when pending drivers exist) */}
        {mainTab === 'exceptions' && eligiblePendingDrivers.length > 0 && (
          <View
            style={[
              styles.bulkApprovalCard,
              {
                backgroundColor: isDark ? '#081720' : '#F0FDFA',
                borderColor: colors.command,
              },
            ]}
          >
            <View style={styles.bulkTopRow}>
              <Pressable
                onPress={handleToggleSelectAll}
                style={styles.bulkSelectAllRow}
                hitSlop={6}
              >
                <Text
                  style={[
                    styles.bulkSelectAllText,
                    {
                      color: colors.textSecondary,
                      fontFamily: Typography.fontFamily.medium,
                    },
                  ]}
                >
                  {allPendingSelected ? 'لغو انتخاب همه' : 'انتخاب همه حاضران'}
                </Text>
                {allPendingSelected ? (
                  <CheckSquare size={18} color={colors.command} />
                ) : (
                  <Square size={18} color={colors.textMuted} />
                )}
              </Pressable>

              <View style={styles.bulkTitleRow}>
                <Text
                  style={[
                    styles.bulkTitleText,
                    { color: colors.command, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  تأیید یک‌باره رانندگان حاضر (Bulk Approval)
                </Text>
                <CheckCheck size={18} color={colors.command} />
              </View>
            </View>

            <Text
              style={[
                styles.bulkDescText,
                {
                  color: colors.textSecondary,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            >
              {selectedIdsForBulk.size > 0
                ? `${toPersianDigits(
                    selectedIdsForBulk.size
                  )} راننده به‌صورت انتخابی مشخص شده‌اند.`
                : `با فشردن دکمه زیر، حضور تمام ${toPersianDigits(
                    eligiblePendingDrivers.length
                  )} راننده در انتظار در یک کلیک ثبت می‌شود.`}
            </Text>

            <TouchableOpacity
              onPress={() => setBulkConfirmVisible(true)}
              disabled={isBulkLoading || targetBulkIds.length === 0}
              style={[
                styles.bulkConfirmBtn,
                {
                  backgroundColor:
                    targetBulkIds.length > 0 ? colors.command : colors.border,
                  opacity: isBulkLoading || targetBulkIds.length === 0 ? 0.6 : 1,
                },
              ]}
            >
              {isBulkLoading ? (
                <ActivityIndicator size="small" color="#071318" />
              ) : (
                <>
                  <CheckCheck size={18} color="#071318" />
                  <Text
                    style={[
                      styles.bulkConfirmBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    تأیید دسته‌جمعی {toPersianDigits(targetBulkIds.length)} راننده
                    حاضر
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Search Input Box */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={16} color={colors.command} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="جستجوی نام راننده، شماره پلاک یا مسیر..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.searchInput,
              {
                color: colors.text,
                fontFamily: Typography.fontFamily.regular,
              },
            ]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* 5. Section Header with Dynamic Count */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.countSubtitle,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {toPersianDigits(
              mainTab === 'exceptions'
                ? exceptionsDrivers.length
                : completedDrivers.length
            )}{' '}
            مورد
          </Text>

          <View style={styles.sectionTitleGroup}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {mainTab === 'exceptions'
                ? 'فهرست رانندگان نیازمند بررسی و پیگیری'
                : 'فهرست رانندگان تأییدشده و حاضر'}
            </Text>
            <View
              style={[
                styles.accentBar,
                {
                  backgroundColor:
                    mainTab === 'exceptions' ? '#EF4444' : '#10B981',
                },
              ]}
            />
          </View>
        </View>

        {/* 6. Drivers Cards List */}
        <View style={styles.cardsList}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={colors.command} />
              <Text
                style={[
                  styles.loadingText,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                در حال دریافت فهرست واقعی رانندگان از سرور...
              </Text>
            </View>
          ) : mainTab === 'exceptions' ? (
            exceptionsDrivers.length > 0 ? (
              exceptionsDrivers.map((driverItem) => {
                const isAbsentException =
                  driverItem.arrivalStatus === 'not_arrived';
                const isPendingSelectable =
                  driverItem.arrivalStatus === 'pending';
                const isSelected = selectedIdsForBulk.has(
                  driverItem.tripWorkCalendarId
                );

                return (
                  <DriverAttendanceCard
                    key={driverItem.tripWorkCalendarId}
                    item={driverItem}
                    isProcessingGps={processingId === driverItem.tripWorkCalendarId}
                    isExceptionHighlight={isAbsentException}
                    selectable={isPendingSelectable}
                    isSelected={isSelected}
                    onToggleSelect={handleToggleSelectDriver}
                    onPressArrivalAction={handleOpenArrivalModal}
                    onPressLangiAction={handleOpenLangiModal}
                  />
                );
              })
            ) : (
              <View
                style={[
                  styles.emptyStateCard,
                  {
                    backgroundColor: isDark ? '#0D1F28' : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <CheckCircle2 size={32} color="#10B981" />
                <Text
                  style={[
                    styles.emptyStateTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  عالی! موردی در این تب نیاز به بررسی ندارد
                </Text>
                <Text
                  style={[
                    styles.emptyStateSubtitle,
                    { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                  ]}
                >
                  تمام رانندگان این شیفت بررسی شده‌اند یا وضعیت حضور آن‌ها ثبت گردیده
                  است.
                </Text>
              </View>
            )
          ) : completedDrivers.length > 0 ? (
            completedDrivers.map((driverItem) => (
              <DriverAttendanceCard
                key={driverItem.tripWorkCalendarId}
                item={driverItem}
                isProcessingGps={processingId === driverItem.tripWorkCalendarId}
                isExceptionHighlight={false}
                selectable={false}
                onPressArrivalAction={handleOpenArrivalModal}
                onPressLangiAction={handleOpenLangiModal}
              />
            ))
          ) : (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: isDark ? '#0D1F28' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <Users size={30} color={colors.command} />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                هنوز راننده‌ای در وضعیت تکمیل و تایید ثبت نشده است
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                می‌توانید از تب «نیازمند بررسی و استثناها»، حضور رانندگان حاضر را با
                یک کلیک تأیید کنید.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal 1: Individual Arrival / Absence Confirmation */}
      <ArrivalConfirmModal
        visible={confirmModalVisible}
        driverItem={selectedDriverForArrival}
        targetStatus={targetArrivalStatus}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={handleConfirmArrivalSubmit}
      />

      {/* Modal 2: Langi Request / Edit Sheet */}
      <LangiRequestModal
        visible={langiModalVisible}
        preselectedDriver={selectedDriverForLangi}
        onClose={() => setLangiModalVisible(false)}
      />

      {/* Modal 3: Bulk Approval Confirmation Dialog */}
      <Modal
        visible={bulkConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isBulkLoading) setBulkConfirmVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.bulkModalCard,
              {
                backgroundColor: isDark ? '#0B151C' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View
                style={[
                  styles.modalIconWrap,
                  { backgroundColor: colors.commandBg },
                ]}
              >
                <CheckCheck size={22} color={colors.command} />
              </View>
              <Text
                style={[
                  styles.modalTitleText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                تأیید دسته‌جمعی حضور رانندگان
              </Text>
            </View>

            <Text
              style={[
                styles.modalDescText,
                {
                  color: colors.textSecondary,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            >
              آیا از ثبت همزمان حضور{' '}
              <Text
                style={{
                  color: colors.command,
                  fontFamily: Typography.fontFamily.bold,
                }}
              >
                {toPersianDigits(targetBulkIds.length)} راننده
              </Text>{' '}
              در سامانه گیتی‌سیر اطمینان دارید؟ اطلاعات حضور و موقعیت جغرافیایی برای
              تمامی این رانندگان در سرور ثبت خواهد شد.
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                onPress={() => setBulkConfirmVisible(false)}
                disabled={isBulkLoading}
                style={[
                  styles.modalCancelBtn,
                  { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    {
                      color: colors.textMuted,
                      fontFamily: Typography.fontFamily.medium,
                    },
                  ]}
                >
                  انصراف
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExecuteBulkApproval}
                disabled={isBulkLoading}
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor: colors.command,
                    opacity: isBulkLoading ? 0.7 : 1,
                  },
                ]}
              >
                {isBulkLoading ? (
                  <ActivityIndicator size="small" color="#071318" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#071318" />
                    <Text
                      style={[
                        styles.modalConfirmText,
                        { fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      تأیید و ثبت در سرور
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: 12,
  },
  dailyBoardFilterCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  dailyBoardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boardTitleText: {
    fontSize: 13,
  },
  directionToggleGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  dirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  dirBtnText: {
    fontSize: 11,
  },
  locationsChipsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    paddingVertical: 2,
  },
  locChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  locChipText: {
    fontSize: 11,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locIdLabel: {
    fontSize: 11.5,
  },
  locIdInput: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12.5,
    textAlign: 'center',
  },
  applyLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
  },
  applyLocBtnText: {
    fontSize: 11.5,
    color: '#071318',
  },
  boardSummaryBar: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: 8,
    alignItems: 'flex-end',
    gap: 2,
  },
  boardSummaryText: {
    fontSize: 12,
    textAlign: 'right',
  },
  boardCountsText: {
    fontSize: 11,
    textAlign: 'right',
  },
  mainTabsContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  mainTabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10.5,
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.bold,
  },
  mainTabText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  subFiltersRow: {
    flexDirection: 'row-reverse',
    gap: 6,
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  subFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  subFilterChipText: {
    fontSize: 11,
  },
  bulkApprovalCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: 12,
    gap: 8,
  },
  bulkTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  bulkTitleText: {
    fontSize: 13,
  },
  bulkSelectAllRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  bulkSelectAllText: {
    fontSize: 11.5,
  },
  bulkDescText: {
    fontSize: 11.5,
    textAlign: 'right',
    lineHeight: 18,
  },
  bulkConfirmBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: BorderRadius.md,
  },
  bulkConfirmBtnText: {
    fontSize: 12.5,
    color: '#071318',
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countSubtitle: {
    fontSize: 11.5,
  },
  sectionTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  accentBar: {
    width: 3.5,
    height: 17,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
  },
  cardsList: {
    gap: 10,
  },
  loadingState: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyStateCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  bulkModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 14.5,
    flex: 1,
    textAlign: 'right',
  },
  modalDescText: {
    fontSize: 12.5,
    textAlign: 'right',
    lineHeight: 20,
  },
  modalActionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 4,
  },
  modalConfirmBtn: {
    flex: 1.3,
    height: 42,
    borderRadius: BorderRadius.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalConfirmText: {
    fontSize: 12.5,
    color: '#071318',
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 12.5,
  },
});
