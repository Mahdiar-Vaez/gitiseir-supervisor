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
import {
  Search,
  X,
  Users,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
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

  // 1. Pending drivers eligible for 1-click Bulk Approval
  const eligiblePendingDrivers = useMemo(() => {
    return drivers.filter(
      (item) =>
        !item.isConfirmedBySupervisor && item.arrivalStatus === 'pending'
    );
  }, [drivers]);

  // Target IDs for Bulk Approval (if none explicitly checked, default to all pending)
  const targetBulkIds = useMemo(() => {
    const validSelected = Array.from(selectedIdsForBulk).filter((id) =>
      eligiblePendingDrivers.some((d) => d.tripWorkCalendarId === id)
    );
    if (validSelected.length > 0) {
      return validSelected;
    }
    return eligiblePendingDrivers.map((d) => d.tripWorkCalendarId);
  }, [selectedIdsForBulk, eligiblePendingDrivers]);

  const allPendingSelected = useMemo(() => {
    if (eligiblePendingDrivers.length === 0) return false;
    return eligiblePendingDrivers.every((d) =>
      selectedIdsForBulk.has(d.tripWorkCalendarId)
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

  // Helper: A driver is "cleanly confirmed (green)" ONLY if confirmed, arrived, not absent, and NOT delayed
  const isCleanGreenConfirmed = (d: TodayDriverItem) =>
    Boolean(
      d.isConfirmedBySupervisor &&
        d.arrivalStatus === 'arrived' &&
        d.executionStatus !== 4 &&
        !d.isDelayed &&
        !(d.delayMinutes && d.delayMinutes > 0)
    );

  // 2. Tab 1: Everything EXCEPT cleanly confirmed green drivers:
  //    1st: Absent (Red) at the very top
  //    2nd: Delayed drivers (after Red)
  //    3rd: Langi drivers
  //    4th: Pending drivers
  const exceptionsDrivers = useMemo(() => {
    let list = drivers.filter((d) => !isCleanGreenConfirmed(d));

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

    return [...list].sort((a, b) => {
      const aAbsent = a.arrivalStatus === 'not_arrived' || a.executionStatus === 4;
      const bAbsent = b.arrivalStatus === 'not_arrived' || b.executionStatus === 4;
      if (aAbsent && !bAbsent) return -1;
      if (bAbsent && !aAbsent) return 1;

      const aDelayed = Boolean(a.isDelayed || (a.delayMinutes && a.delayMinutes > 0));
      const bDelayed = Boolean(b.isDelayed || (b.delayMinutes && b.delayMinutes > 0));
      if (aDelayed && !bDelayed) return -1;
      if (bDelayed && !aDelayed) return 1;

      if (a.hasLangi && !b.hasLangi) return -1;
      if (b.hasLangi && !a.hasLangi) return 1;
      return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
    });
  }, [drivers, searchQuery]);

  // 3. Tab 2: ONLY cleanly confirmed & completed drivers (Green border, no delay, no absence)
  const completedDrivers = useMemo(() => {
    let list = drivers.filter((d) => isCleanGreenConfirmed(d));

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

  const exceptionsTotalCount = useMemo(
    () => drivers.filter((d) => !isCleanGreenConfirmed(d)).length,
    [drivers]
  );
  const cleanCompletedCount = useMemo(
    () => drivers.filter((d) => isCleanGreenConfirmed(d)).length,
    [drivers]
  );

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
    openLangiAfter: boolean,
    isDelayed?: boolean,
    delayMinutes?: number
  ) => {
    const targetDriver = selectedDriverForArrival;
    setProcessingId(tripWorkCalendarId);
    try {
      await confirmDriverArrival(
        tripWorkCalendarId,
        status,
        note,
        isDelayed,
        delayMinutes
      );
      setConfirmModalVisible(false);

      if (openLangiAfter && targetDriver) {
        setTimeout(() => {
          setSelectedDriverForLangi(targetDriver);
          setLangiModalVisible(true);
        }, 220);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenLangiModal = (driverItem?: TodayDriverItem) => {
    setSelectedDriverForLangi(driverItem || drivers[0] || null);
    setLangiModalVisible(true);
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
        {/* 0. Compact Daily Board Location & Direction Card (Zero Overflow) */}
        <View
          style={[
            styles.dailyBoardFilterCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.commandBorder,
            },
          ]}
        >
          {/* Row 1: Right-aligned Title & Left-aligned Location Summary */}
          <View style={styles.dailyBoardTitleBar}>
            <View
              style={[
                styles.boardModeBadge,
                {
                  backgroundColor: isDark ? '#071318' : '#F0FDFA',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.boardModeBadgeText,
                  {
                    color: colors.command,
                    fontFamily: Typography.fontFamily.bold,
                  },
                ]}
              >
                {dailyBoard
                  ? `${dailyBoard.companyServiceLocationTitle} • ${toPersianDigits(
                      dailyBoard.totalCount
                    )} سرویس`
                  : `کد محل خدمت: ${toPersianDigits(companyServiceLocationId)}`}
              </Text>
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

          {/* Row 2: Direction Toggle Group (Automatic / Incoming / Outgoing) */}
          <View style={styles.directionToggleGroup}>
            <TouchableOpacity
              onPress={() => setEntering(undefined)}
              style={[
                styles.dirBtn,
                {
                  backgroundColor:
                    entering === undefined ? colors.command : 'transparent',
                  borderColor:
                    entering === undefined ? colors.command : colors.border,
                },
              ]}
            >
              <Clock
                size={12}
                color={entering === undefined ? '#071318' : colors.textSecondary}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.dirBtnText,
                  {
                    color:
                      entering === undefined ? '#071318' : colors.textSecondary,
                    fontFamily:
                      entering === undefined
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                  },
                ]}
              >
                خودکار
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEntering(true)}
              style={[
                styles.dirBtn,
                {
                  backgroundColor:
                    entering === true ? colors.command : 'transparent',
                  borderColor:
                    entering === true ? colors.command : colors.border,
                },
              ]}
            >
              <ArrowDownLeft
                size={12}
                color={entering === true ? '#071318' : colors.textSecondary}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.dirBtnText,
                  {
                    color: entering === true ? '#071318' : colors.textSecondary,
                    fontFamily:
                      entering === true
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                  },
                ]}
              >
                ورودی
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEntering(false)}
              style={[
                styles.dirBtn,
                {
                  backgroundColor:
                    entering === false ? colors.gold : 'transparent',
                  borderColor:
                    entering === false ? colors.gold : colors.border,
                },
              ]}
            >
              <ArrowUpRight
                size={12}
                color={entering === false ? '#071318' : colors.textSecondary}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.dirBtnText,
                  {
                    color: entering === false ? '#071318' : colors.textSecondary,
                    fontFamily:
                      entering === false
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.regular,
                  },
                ]}
              >
                خروجی
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 3: Service Location Chips */}
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

          {/* Row 4: Manual Location ID Input & Query Button */}
          <View style={styles.locationInputRow}>
            <TouchableOpacity
              onPress={handleApplyLocationId}
              style={[
                styles.applyLocBtn,
                { backgroundColor: colors.command },
              ]}
            >
              <RefreshCw size={12} color="#071318" />
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
              value={toPersianDigits(locationInput)}
              onChangeText={(txt) =>
                setLocationInput(toEnglishDigits(txt).replace(/\D/g, ''))
              }
              onSubmitEditing={handleApplyLocationId}
              keyboardType="numeric"
              placeholder="کد محل خدمت"
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
        </View>

        {/* 1. Primary Two Tabs Navigation (Exceptions First vs Completed) */}
        <View style={styles.mainTabsContainer}>
          <TouchableOpacity
            onPress={() => setMainTab('exceptions')}
            activeOpacity={0.85}
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
            <View style={styles.tabInnerRow}>
              <AlertTriangle
                size={15}
                color={mainTab === 'exceptions' ? '#EF4444' : colors.textMuted}
              />
              <Text
                numberOfLines={1}
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
                نیازمند بررسی
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor:
                      stats.notArrivedCount > 0
                        ? '#EF4444'
                        : exceptionsTotalCount > 0
                        ? colors.gold
                        : colors.border,
                  },
                ]}
              >
                <Text style={styles.tabBadgeText}>
                  {toPersianDigits(exceptionsTotalCount)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMainTab('completed')}
            activeOpacity={0.85}
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
            <View style={styles.tabInnerRow}>
              <CheckCircle2
                size={15}
                color={mainTab === 'completed' ? '#10B981' : colors.textMuted}
              />
              <Text
                numberOfLines={1}
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
                تأیید و تکمیل‌شده
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor:
                      cleanCompletedCount > 0 ? '#10B981' : colors.border,
                  },
                ]}
              >
                <Text style={styles.tabBadgeText}>
                  {toPersianDigits(cleanCompletedCount)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Compact 1-Click Bulk Approval Bar (Only on Exceptions Tab when pending drivers exist) */}
        {mainTab === 'exceptions' && eligiblePendingDrivers.length > 0 && (
          <View
            style={[
              styles.bulkApprovalBar,
              {
                backgroundColor: isDark ? '#081720' : '#F0FDFA',
                borderColor: colors.command,
              },
            ]}
          >
            <Pressable
              onPress={handleToggleSelectAll}
              style={styles.bulkSelectAllBtn}
              hitSlop={6}
            >
              {allPendingSelected ? (
                <CheckSquare size={18} color={colors.command} />
              ) : (
                <Square size={18} color={colors.textMuted} />
              )}
              <Text
                numberOfLines={1}
                style={[
                  styles.bulkSelectAllText,
                  {
                    color: colors.text,
                    fontFamily: Typography.fontFamily.medium,
                  },
                ]}
              >
                {allPendingSelected ? 'لغو انتخاب' : 'انتخاب همه'}
              </Text>
            </Pressable>

            <TouchableOpacity
              onPress={() => setBulkConfirmVisible(true)}
              disabled={isBulkLoading || targetBulkIds.length === 0}
              activeOpacity={0.85}
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
                  <CheckCheck size={16} color="#071318" />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.bulkConfirmBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    تأیید یک‌باره حاضران ({toPersianDigits(targetBulkIds.length)} نفر)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Search Input Box */}
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

        {/* 4. Section Header with Dynamic Count */}
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
                ? 'رانندگان نیازمند بررسی (ابتدا غایب‌ها)'
                : 'رانندگان تأیید و تکمیل‌شده'}
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

        {/* 5. Drivers Cards List */}
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
                در حال دریافت فهرست رانندگان از بورد روزانه...
              </Text>
            </View>
          ) : mainTab === 'exceptions' ? (
            exceptionsDrivers.length > 0 ? (
              exceptionsDrivers.map((driverItem) => {
                const isAbsentException =
                  driverItem.arrivalStatus === 'not_arrived' ||
                  driverItem.executionStatus === 4;
                const isPendingSelectable =
                  !driverItem.isConfirmedBySupervisor &&
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
                <CheckCircle2 size={30} color="#10B981" />
                <Text
                  style={[
                    styles.emptyStateTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {drivers.length === 0
                    ? 'هیچ سرویسی در این محل خدمت ثبت نشده است'
                    : 'تمام رانندگان این شیفت تعیین وضعیت شده‌اند'}
                </Text>
                <Text
                  style={[
                    styles.emptyStateSubtitle,
                    { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                  ]}
                >
                  {drivers.length === 0
                    ? dailyBoard
                      ? `برای «${dailyBoard.companyServiceLocationTitle}» (${dailyBoard.directionTitle}) سرویسی در بورد روزانه وجود ندارد.`
                      : 'می‌توانید محل خدمت یا جهت سرویس را از بالای صفحه تغییر دهید.'
                    : 'رانندگان تأییدشده در تب «تأیید و تکمیل‌شده» قابل مشاهده هستند.'}
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
              <Users size={28} color={colors.command} />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                هنوز راننده‌ای در وضعیت تأییدشده قرار ندارد
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                از تب «نیازمند بررسی» می‌توانید حضور رانندگان را به‌صورت تکی یا یک‌باره ثبت کنید.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal 1: Individual Arrival / Absence Confirmation (with Delay Support) */}
      <ArrivalConfirmModal
        visible={confirmModalVisible}
        driverItem={selectedDriverForArrival}
        targetStatus={targetArrivalStatus}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={handleConfirmArrivalSubmit}
      />

      {/* Modal 2: Langi Request / Edit Sheet */}
      <LangiRequestModal
        key={`${selectedDriverForLangi?.tripWorkCalendarId || 'general'}-${
          langiModalVisible ? 'open' : 'closed'
        }`}
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
                تأیید یک‌باره حضور رانندگان
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
              اطمینان دارید؟ پس از تأیید سرور، تمامی این موارد به تب «تأیید و تکمیل‌شده» منتقل می‌شوند.
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
    paddingTop: Spacing.sm,
    gap: 10,
  },
  dailyBoardFilterCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 12,
    gap: 9,
  },
  dailyBoardTitleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  boardModeBadge: {
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  boardModeBadgeText: {
    fontSize: 10.5,
  },
  boardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  boardTitleText: {
    fontSize: 13,
    textAlign: 'right',
  },
  directionToggleGroup: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  dirBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 6,
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
    height: 34,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    textAlign: 'center',
  },
  applyLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
  },
  applyLocBtnText: {
    fontSize: 11,
    color: '#071318',
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
  },
  tabInnerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10.5,
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.bold,
  },
  mainTabText: {
    fontSize: 12,
    textAlign: 'center',
  },
  bulkApprovalBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  bulkSelectAllBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  bulkSelectAllText: {
    fontSize: 12,
  },
  bulkConfirmBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
  },
  bulkConfirmBtnText: {
    fontSize: 12,
    color: '#071318',
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
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
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13.5,
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
    padding: 20,
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
    maxWidth: 400,
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
    width: 38,
    height: 38,
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
