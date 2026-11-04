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
} from 'react-native';
import {
  Search,
  X,
  Users,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useSarshoofer } from '@/context/SarshooferContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { TodayDriverItem, ArrivalStatus } from '@/services/api/types';
import { AppHeader } from '@/components/ui/AppHeader';
import {
  FleetCommandBanner,
  DriverFilterType,
} from '@/components/ui/FleetCommandBanner';
import { DriverAttendanceCard } from '@/components/ui/DriverAttendanceCard';
import { ArrivalConfirmModal } from '@/components/ui/ArrivalConfirmModal';
import { LangiRequestModal } from '@/components/ui/LangiRequestModal';

export default function TodayDriversScreen() {
  const { colors, isDark } = useAppTheme();
  const {
    drivers,
    dailyBoard,
    entering,
    setEntering,
    loading,
    refreshing,
    refreshFleet,
    confirmDriverArrival,
  } = useSarshoofer();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<DriverFilterType>('all');

  // Arrival Confirmation Modal State
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

  const filteredDrivers = useMemo(() => {
    return drivers.filter((item) => {
      if (activeFilter === 'pending' && item.arrivalStatus !== 'pending') return false;
      if (
        activeFilter === 'arrived' &&
        !(item.isConfirmedBySupervisor === true && item.arrivalStatus === 'arrived')
      )
        return false;
      if (
        activeFilter === 'driver_confirmed' &&
        !(
          item.driverConfirmedArrival === true ||
          item.executionStatus === 1 ||
          item.executionStatus === 3
        )
      )
        return false;
      if (
        activeFilter === 'completed' &&
        !(item.executionStatus === 3 || Boolean(item.endedAtUtc))
      )
        return false;
      if (
        activeFilter === 'not_arrived' &&
        !(item.arrivalStatus === 'not_arrived' || item.executionStatus === 4)
      )
        return false;
      if (activeFilter === 'langi' && !item.hasLangi) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = item.driverFullName.toLowerCase().includes(q);
        const matchTrip = item.tripName.toLowerCase().includes(q);
        const matchPlate = item.licensePlate.toLowerCase().includes(q);
        const matchLangi =
          item.langi &&
          `${item.langi.name} ${item.langi.family}`.toLowerCase().includes(q);
        if (!matchName && !matchTrip && !matchPlate && !matchLangi) return false;
      }

      return true;
    });
  }, [drivers, activeFilter, searchQuery]);

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

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 }]}
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
        {/* 0. Daily Board Location & Direction Filter Card */}
        <View
          style={[
            styles.dailyBoardFilterCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.commandBorder,
            },
          ]}
        >
          {/* Row 1: Title neatly aligned to the right without overflowing */}
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
                style={[
                  styles.boardModeBadgeText,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                {entering === undefined
                  ? 'جهت خودکار بر اساس ساعت'
                  : entering
                  ? 'فیلتر ورودی'
                  : 'فیلتر خروجی'}
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
                size={13}
                color={entering === true ? '#071318' : colors.textSecondary}
              />
              <Text
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
                سرویس‌های ورودی
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
                size={13}
                color={entering === false ? '#071318' : colors.textSecondary}
              />
              <Text
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
                سرویس‌های خروجی
              </Text>
            </TouchableOpacity>
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
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
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

        {/* 1. Compact Attendance Summary & Filter Strip */}
        <FleetCommandBanner
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          onOpenNewLangi={() => handleOpenLangiModal()}
        />

        {/* 2. Search Input */}
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
            placeholder="جستجوی نام راننده، پلاک یا سرویس..."
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

        {/* 3. Section Header: Today's Drivers List */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.countSubtitle,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {toPersianDigits(filteredDrivers.length)} سرویس در سرور
          </Text>

          <View style={styles.sectionTitleGroup}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              لیست راننده‌ها و سرویس‌های امروز
            </Text>
            <View
              style={[
                styles.accentBar,
                { backgroundColor: colors.command },
              ]}
            />
          </View>
        </View>

        {/* 4. Drivers Cards List */}
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
                در حال دریافت فهرست واقعی رانندگان امروز از سرور...
              </Text>
            </View>
          ) : filteredDrivers.length > 0 ? (
            filteredDrivers.map((driverItem) => (
              <DriverAttendanceCard
                key={driverItem.tripWorkCalendarId}
                item={driverItem}
                isProcessingGps={processingId === driverItem.tripWorkCalendarId}
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
              <Users size={26} color={colors.command} />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                هیچ راننده یا سرویسی برای امروز در سرور یافت نشد
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                {dailyBoard
                  ? `برای محل خدمت «${dailyBoard.companyServiceLocationTitle}» (${dailyBoard.directionTitle}) در حال حاضر ۰ سرویس در سرور ثبت شده است.`
                  : 'در حال حاضر سرویسی برای محل خدمت شما در این شیفت ثبت نشده است.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal 1: Confirm Arrival / Non-Arrival */}
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
  dailyBoardTitleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  boardModeBadge: {
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
    gap: 6,
  },
  boardTitleText: {
    fontSize: 13.5,
    textAlign: 'right',
  },
  directionToggleGroup: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  dirBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
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
});
