import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits, toEnglishDigits } from '@/utils/persian-digits';
import { getCurrentJalaliDate } from '@/utils/jalali';
import { AppHeader } from '@/components/ui/AppHeader';
import { DayTripsTable } from '@/components/ui/DayTripsTable';
import { TripSummaryModal } from '@/components/ui/TripSummaryModal';
import { ConfirmAttendanceModal } from '@/components/ui/ConfirmAttendanceModal';
import { AssignTempDriverModal } from '@/components/ui/AssignTempDriverModal';
import { SosEmergencyModal } from '@/components/ui/SosEmergencyModal';
import { ManagementContactModal } from '@/components/ui/ManagementContactModal';
import {
  CompanyServiceLocation,
  SupervisorDailyBoardResult,
  SupervisorDailyBoardItem,
  DayTripGridItem,
} from '@/services/api/types';
import {
  getServiceLocationsApi,
  getSupervisorDailyBoardApi,
  SAMPLE_SERVICE_LOCATIONS,
} from '@/services/api/supervisor';
import { getDayTripsGridApi } from '@/services/api/calendar';
import {
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  Layers,
  ChevronDown,
  Search,
  X,
  PhoneCall,
  Headphones,
  RefreshCw,
} from 'lucide-react-native';

function mapBoardItemToGridItem(item: SupervisorDailyBoardItem): DayTripGridItem {
  const startStr = item.outbound?.start || item.scheduledStartTime || '06:00:00';
  const endStr = item.outbound?.end || item.scheduledEndTime || '07:00:00';
  const priceVal = item.outbound?.price ?? item.price ?? 1000000;

  return {
    tripWorkCalendarId:
      item.tripWorkCalendarId || item.calendarDayId || String(item.tripId),
    tripId: item.tripId,
    tripName: item.tripName || `سرویس ${item.tripId}`,
    status: item.status ?? 1,
    statusDisplay: item.statusDisplay || 'Confirmed',
    passengerId: null,
    passengerFullName: null,
    driverId: Number(item.driverId) || 0,
    driverFullName: item.driverFullName || 'راننده نامشخص',
    driverTel: item.driverTel || null,
    licensePlate: item.licensePlate || null,
    carType: item.carType || 'خودرو سرویس',
    carModelYear: item.carModelYear || null,
    carBodyColor: item.carBodyColor || null,
    canSetTemporaryDriver: item.canSetTemporaryDriver ?? true,
    hasTemporaryDriver: Boolean(item.hasTemporaryDriver),
    temporaryDriverId: item.temporaryDriver?.id || null,
    temporaryDriver: item.temporaryDriver || null,
    outbound: {
      start: startStr,
      end: endStr,
      price: priceVal,
    },
    inbound: item.inbound || null,
  };
}

export default function SupervisorHomeScreen() {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();
  const todayJalali = useMemo(() => getCurrentJalaliDate(), []);

  // Service Location & Direction state
  const [locations, setLocations] = useState<CompanyServiceLocation[]>(
    SAMPLE_SERVICE_LOCATIONS
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number>(18);
  const [entering, setEntering] = useState<boolean>(true);
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [customLocationIdInput, setCustomLocationIdInput] = useState<string>('18');

  // Board & Calendar Trips state
  const [dailyBoard, setDailyBoard] = useState<SupervisorDailyBoardResult | null>(
    null
  );
  const [calendarTrips, setCalendarTrips] = useState<DayTripGridItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all_today' | 'board_only'>('all_today');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  // Modals state
  const [selectedGridTrip, setSelectedGridTrip] =
    useState<DayTripGridItem | null>(null);
  const [summaryModalVisible, setSummaryModalVisible] = useState<boolean>(false);

  const [attendanceTrip, setAttendanceTrip] = useState<DayTripGridItem | null>(
    null
  );
  const [tempDriverTrip, setTempDriverTrip] = useState<DayTripGridItem | null>(
    null
  );

  const [sosModalVisible, setSosModalVisible] = useState<boolean>(false);
  const [managementModalVisible, setManagementModalVisible] =
    useState<boolean>(false);

  // Load Service Locations once
  useEffect(() => {
    let isCancelled = false;
    getServiceLocationsApi(token).then((list) => {
      if (!isCancelled && list.length > 0) {
        setLocations(list);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [token]);

  // Fetch Daily Board & Today's Work Calendar Grid
  useEffect(() => {
    let isCancelled = false;

    const fetchSupervisorData = async () => {
      setLoading(true);
      try {
        const [boardRes, gridRes] = await Promise.all([
          getSupervisorDailyBoardApi(selectedLocationId, entering, token),
          getDayTripsGridApi(
            todayJalali.year,
            todayJalali.month,
            todayJalali.day,
            token
          ),
        ]);

        if (!isCancelled) {
          if (boardRes && boardRes.result) {
            setDailyBoard(boardRes.result);
          }
          if (gridRes && Array.isArray(gridRes.result)) {
            setCalendarTrips(gridRes.result);
          }
        }
      } catch (err: any) {
        console.log('[SupervisorHomeScreen] Fetch error:', err?.message);
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchSupervisorData();

    return () => {
      isCancelled = true;
    };
  }, [
    selectedLocationId,
    entering,
    token,
    refreshIndex,
    todayJalali.year,
    todayJalali.month,
    todayJalali.day,
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const boardGridItems = useMemo(() => {
    if (!dailyBoard || !Array.isArray(dailyBoard.items)) return [];
    return dailyBoard.items.map(mapBoardItemToGridItem);
  }, [dailyBoard]);

  const displayedTrips = useMemo(() => {
    if (activeTab === 'board_only') {
      return boardGridItems;
    }
    // Combine board items & calendar trips without duplicates
    const map = new Map<string, DayTripGridItem>();
    calendarTrips.forEach((t) => {
      map.set(t.tripWorkCalendarId || String(t.tripId), t);
    });
    boardGridItems.forEach((t) => {
      const key = t.tripWorkCalendarId || String(t.tripId);
      if (!map.has(key)) {
        map.set(key, t);
      }
    });
    return Array.from(map.values());
  }, [activeTab, boardGridItems, calendarTrips]);

  const selectedLocationTitle = useMemo(() => {
    if (
      dailyBoard?.companyServiceLocationId === selectedLocationId &&
      dailyBoard?.companyServiceLocationTitle
    ) {
      return dailyBoard.companyServiceLocationTitle;
    }
    const found = locations.find((l) => l.id === selectedLocationId);
    return found ? found.title : `محل خدمت کد ${toPersianDigits(selectedLocationId)}`;
  }, [dailyBoard, locations, selectedLocationId]);

  const filteredLocations = useMemo(() => {
    const q = toEnglishDigits(locationSearch).trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (loc) =>
        loc.title.toLowerCase().includes(q) ||
        String(loc.id).includes(q) ||
        (loc.companyName && loc.companyName.toLowerCase().includes(q))
    );
  }, [locations, locationSearch]);

  const handleApplyCustomLocationId = () => {
    const num = parseInt(toEnglishDigits(customLocationIdInput), 10);
    if (!isNaN(num) && num > 0) {
      setSelectedLocationId(num);
      setLocationModalVisible(false);
    }
  };

  const handleOpenTripDetails = (trip: DayTripGridItem) => {
    setSelectedGridTrip(trip);
    setSummaryModalVisible(true);
  };

  const handleOpenConfirmAttendance = (trip: DayTripGridItem) => {
    setAttendanceTrip(trip);
  };

  const handleOpenAssignTempDriver = (trip: DayTripGridItem) => {
    setTempDriverTrip(trip);
  };

  // Summary Counters (use dailyBoard counters or fallback to displayedTrips)
  const totalCount = dailyBoard?.totalCount ?? displayedTrips.length;
  const scheduledCount =
    dailyBoard?.scheduledCount ??
    displayedTrips.filter((t) => t.status === 0 || t.status === 1).length;
  const startedCount =
    dailyBoard?.startedCount ??
    displayedTrips.filter((t) => t.status === 2).length;
  const completedCount =
    dailyBoard?.completedCount ??
    displayedTrips.filter((t) => t.status === 3).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* 1. Service Location & Direction Control Card (بورد روزانه سرشوفر) */}
        <View
          style={[
            styles.boardControlCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.boardCardHeader}>
            <View style={styles.boardTitleGroup}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.goldBg, borderColor: colors.gold },
                ]}
              >
                <MapPin size={18} color={colors.gold} />
              </View>
              <View style={styles.boardTitleTextCol}>
                <Text
                  style={[
                    styles.boardMainTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  بورد روزانه سرشوفر (Daily Board)
                </Text>
                <Text
                  style={[
                    styles.boardSubTitle,
                    {
                      color: colors.textMuted,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                >
                  انتخاب محل خدمت و جهت سرویس (ورودی / خروجی)
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.refreshIconBtn,
                {
                  backgroundColor: colors.cardSubtle,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <RefreshCw size={15} color={colors.gold} />
            </Pressable>
          </View>

          {/* Service Location Selector Button */}
          <Pressable
            onPress={() => {
              setCustomLocationIdInput(String(selectedLocationId));
              setLocationModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.locationSelectorBtn,
              {
                backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                borderColor: colors.gold,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.locationSelectorRight}>
              <View
                style={[
                  styles.locationIdBadge,
                  { backgroundColor: colors.goldBg },
                ]}
              >
                <Text
                  style={[
                    styles.locationIdText,
                    { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  ID: {toPersianDigits(selectedLocationId)}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.locationTitleText,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {selectedLocationTitle}
              </Text>
            </View>

            <View style={styles.locationSelectorLeft}>
              <Text
                style={[
                  styles.changeLocationLabel,
                  { color: colors.gold, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                تغییر محل خدمت
              </Text>
              <ChevronDown size={16} color={colors.gold} />
            </View>
          </Pressable>

          {/* Entering / Exiting Toggle */}
          <View style={styles.directionToggleRow}>
            <Pressable
              onPress={() => setEntering(true)}
              style={[
                styles.directionBtn,
                {
                  backgroundColor: entering
                    ? colors.gold
                    : isDark
                    ? '#0B0F19'
                    : '#F1F5F9',
                  borderColor: entering ? colors.gold : colors.border,
                },
              ]}
            >
              <ArrowDownLeft
                size={15}
                color={entering ? '#090D16' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.directionBtnText,
                  {
                    color: entering ? '#090D16' : colors.textSecondary,
                    fontFamily: entering
                      ? Typography.fontFamily.bold
                      : Typography.fontFamily.medium,
                  },
                ]}
              >
                ورودی به محل خدمت
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setEntering(false)}
              style={[
                styles.directionBtn,
                {
                  backgroundColor: !entering
                    ? colors.gold
                    : isDark
                    ? '#0B0F19'
                    : '#F1F5F9',
                  borderColor: !entering ? colors.gold : colors.border,
                },
              ]}
            >
              <ArrowUpRight
                size={15}
                color={!entering ? '#090D16' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.directionBtnText,
                  {
                    color: !entering ? '#090D16' : colors.textSecondary,
                    fontFamily: !entering
                      ? Typography.fontFamily.bold
                      : Typography.fontFamily.medium,
                  },
                ]}
              >
                خروجی از محل خدمت
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 2. Daily Board 4 Summary Stat Cards */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: colors.goldBg },
              ]}
            >
              <Layers size={16} color={colors.gold} />
            </View>
            <Text
              style={[
                styles.statValue,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(totalCount)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textMuted,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            >
              کل سرویس‌ها
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
              ]}
            >
              <Clock size={16} color="#3B82F6" />
            </View>
            <Text
              style={[
                styles.statValue,
                { color: '#3B82F6', fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(scheduledCount)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textMuted,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            >
              برنامه‌ریزی شده
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: colors.warningBg },
              ]}
            >
              <PlayCircle size={16} color={colors.warning} />
            </View>
            <Text
              style={[
                styles.statValue,
                { color: colors.warning, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(startedCount)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textMuted,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            >
              در حال انجام
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: colors.successBg },
              ]}
            >
              <CheckCircle2 size={16} color={colors.success} />
            </View>
            <Text
              style={[
                styles.statValue,
                { color: colors.success, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(completedCount)}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textMuted,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            >
              تکمیل شده
            </Text>
          </View>
        </View>

        {/* 3. Quick Supervisor Shortcuts */}
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.navigate('/calendar' as any)}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Calendar size={17} color={colors.gold} />
            <Text
              style={[
                styles.quickActionText,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              تقویم کاری کامل
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setManagementModalVisible(true)}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Headphones size={17} color={colors.gold} />
            <Text
              style={[
                styles.quickActionText,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              ارتباط با مدیریت
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSosModalVisible(true)}
            style={({ pressed }) => [
              styles.quickActionCard,
              {
                backgroundColor: colors.dangerBg,
                borderColor: colors.danger,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <PhoneCall size={17} color={colors.danger} />
            <Text
              style={[
                styles.quickActionText,
                { color: colors.danger, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              امداد اضطراری
            </Text>
          </Pressable>
        </View>

        {/* 4. Data Source Tabs: All Today's Calendar Trips vs Location Board Only */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.tabSwitchContainer}>
            <Pressable
              onPress={() => setActiveTab('all_today')}
              style={[
                styles.sourceTabBtn,
                {
                  backgroundColor:
                    activeTab === 'all_today' ? colors.gold : colors.card,
                  borderColor:
                    activeTab === 'all_today' ? colors.gold : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sourceTabText,
                  {
                    color:
                      activeTab === 'all_today'
                        ? '#090D16'
                        : colors.textSecondary,
                    fontFamily:
                      activeTab === 'all_today'
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.medium,
                  },
                ]}
              >
                سرویس‌های امروز ({toPersianDigits(displayedTrips.length)})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('board_only')}
              style={[
                styles.sourceTabBtn,
                {
                  backgroundColor:
                    activeTab === 'board_only' ? colors.gold : colors.card,
                  borderColor:
                    activeTab === 'board_only' ? colors.gold : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sourceTabText,
                  {
                    color:
                      activeTab === 'board_only'
                        ? '#090D16'
                        : colors.textSecondary,
                    fontFamily:
                      activeTab === 'board_only'
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.medium,
                  },
                ]}
              >
                فقط بورد محل خدمت ({toPersianDigits(boardGridItems.length)})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 5. Searchable & Filterable Data-Grid Table with Supervisor Actions */}
        {loading && displayedTrips.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text
              style={[
                styles.loadingText,
                {
                  color: colors.textMuted,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            >
              در حال دریافت اطلاعات بورد روزانه و تقویم کاری...
            </Text>
          </View>
        ) : (
          <DayTripsTable
            trips={displayedTrips}
            onSelectTrip={handleOpenTripDetails}
            showSupervisorActions={true}
            onConfirmAttendance={handleOpenConfirmAttendance}
            onAssignTempDriver={handleOpenAssignTempDriver}
          />
        )}
      </ScrollView>

      {/* Service Location Picker Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.locationModalContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.locationModalHeader}>
              <Text
                style={[
                  styles.locationModalTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                انتخاب محل خدمت (Service Location)
              </Text>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                style={[
                  styles.closeBtn,
                  { backgroundColor: colors.cardSubtle },
                ]}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Manual Location ID Entry */}
            <View
              style={[
                styles.manualIdBox,
                {
                  backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.manualIdLabel,
                  {
                    color: colors.textSecondary,
                    fontFamily: Typography.fontFamily.medium,
                  },
                ]}
              >
                ورود دستی کد محل خدمت (companyServiceLocationId):
              </Text>
              <View style={styles.manualIdInputRow}>
                <TextInput
                  value={customLocationIdInput}
                  onChangeText={setCustomLocationIdInput}
                  keyboardType="numeric"
                  placeholder="مثلاً 18"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.manualIdInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      fontFamily: Typography.fontFamily.bold,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={handleApplyCustomLocationId}
                  style={[
                    styles.applyIdBtn,
                    { backgroundColor: colors.gold },
                  ]}
                >
                  <Text
                    style={[
                      styles.applyIdBtnText,
                      {
                        color: '#090D16',
                        fontFamily: Typography.fontFamily.bold,
                      },
                    ]}
                  >
                    اعمال کد
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Locations */}
            <View
              style={[
                styles.searchLocationBox,
                {
                  backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Search size={16} color={colors.textMuted} />
              <TextInput
                value={locationSearch}
                onChangeText={setLocationSearch}
                placeholder="جستجوی نام محل خدمت یا شرکت..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.searchLocationInput,
                  {
                    color: colors.text,
                    fontFamily: Typography.fontFamily.regular,
                  },
                ]}
              />
            </View>

            <ScrollView style={{ maxHeight: 280 }}>
              {filteredLocations.map((loc) => {
                const isSelected = loc.id === selectedLocationId;
                return (
                  <TouchableOpacity
                    key={loc.id}
                    onPress={() => {
                      setSelectedLocationId(loc.id);
                      setLocationModalVisible(false);
                    }}
                    style={[
                      styles.locationListItem,
                      {
                        backgroundColor: isSelected
                          ? colors.goldBg
                          : 'transparent',
                        borderColor: isSelected ? colors.gold : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.locationItemRight}>
                      <Text
                        style={[
                          styles.locationItemTitle,
                          {
                            color: isSelected ? colors.gold : colors.text,
                            fontFamily: Typography.fontFamily.bold,
                          },
                        ]}
                      >
                        {loc.title}
                      </Text>
                      {loc.companyName ? (
                        <Text
                          style={[
                            styles.locationItemCompany,
                            {
                              color: colors.textMuted,
                              fontFamily: Typography.fontFamily.regular,
                            },
                          ]}
                        >
                          {loc.companyName}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.locationIdPill,
                        {
                          backgroundColor: isSelected
                            ? colors.gold
                            : colors.cardSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: isSelected ? '#090D16' : colors.textSecondary,
                          fontFamily: Typography.fontFamily.bold,
                        }}
                      >
                        کد {toPersianDigits(loc.id)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Trip Details Modal */}
      <TripSummaryModal
        visible={summaryModalVisible}
        tripId={selectedGridTrip?.tripId ?? null}
        initialTrip={
          selectedGridTrip
            ? {
                tripId: selectedGridTrip.tripId,
                tripName: selectedGridTrip.tripName,
                status: selectedGridTrip.status,
                scheduledStartTime:
                  selectedGridTrip.outbound?.start ||
                  selectedGridTrip.inbound?.start ||
                  '۰۰:۰۰',
                scheduledEndTime:
                  selectedGridTrip.outbound?.end ||
                  selectedGridTrip.inbound?.end ||
                  '۰۰:۰۰',
                outboundStart: selectedGridTrip.outbound?.start,
                outboundEnd: selectedGridTrip.outbound?.end,
                outboundPrice:
                  selectedGridTrip.outbound?.price ||
                  selectedGridTrip.inbound?.price ||
                  0,
                licensePlate: selectedGridTrip.licensePlate || undefined,
                calendarDayId: selectedGridTrip.tripWorkCalendarId,
                serviceLocationTitle: selectedGridTrip.tripName,
                driverFullName: selectedGridTrip.driverFullName,
                totalStations: 5,
                visitedStations: selectedGridTrip.status === 3 ? 5 : 0,
              }
            : null
        }
        calendarDayId={selectedGridTrip?.tripWorkCalendarId || ''}
        canStartTrip={false}
        canEndTrip={false}
        onClose={() => {
          setSummaryModalVisible(false);
          setSelectedGridTrip(null);
        }}
      />

      {/* Supervisor Confirm Attendance Modal */}
      <ConfirmAttendanceModal
        visible={Boolean(attendanceTrip)}
        calendarDayId={attendanceTrip?.tripWorkCalendarId ?? null}
        tripId={attendanceTrip?.tripId}
        tripName={attendanceTrip?.tripName}
        driverName={attendanceTrip?.driverFullName}
        tripTime={
          attendanceTrip?.outbound?.start
            ? `${attendanceTrip.outbound.start.slice(0, 5)} تا ${
                attendanceTrip.outbound.end?.slice(0, 5) || ''
              }`
            : undefined
        }
        onClose={() => setAttendanceTrip(null)}
        onSuccess={() => {
          setRefreshIndex((prev) => prev + 1);
        }}
      />

      {/* Supervisor Assign Temporary Driver (لنگی) Modal */}
      <AssignTempDriverModal
        visible={Boolean(tempDriverTrip)}
        calendarDayId={tempDriverTrip?.tripWorkCalendarId ?? null}
        tripId={tempDriverTrip?.tripId}
        tripName={tempDriverTrip?.tripName}
        mainDriverName={tempDriverTrip?.driverFullName}
        defaultPrice={
          tempDriverTrip?.outbound?.price ??
          tempDriverTrip?.inbound?.price ??
          1000000
        }
        existingTempDriver={tempDriverTrip?.temporaryDriver}
        onClose={() => setTempDriverTrip(null)}
        onSuccess={() => {
          setRefreshIndex((prev) => prev + 1);
        }}
      />

      {/* SOS & Management Modals */}
      <SosEmergencyModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
      />
      <ManagementContactModal
        visible={managementModalVisible}
        onClose={() => setManagementModalVisible(false)}
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
    gap: Spacing.md,
  },
  boardControlCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 12,
  },
  boardCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boardTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardTitleTextCol: {
    alignItems: 'flex-end',
    flex: 1,
  },
  boardMainTitle: {
    fontSize: 14.5,
  },
  boardSubTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationSelectorBtn: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationSelectorRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationIdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  locationIdText: {
    fontSize: 11,
  },
  locationTitleText: {
    fontSize: 13.5,
    textAlign: 'right',
    flex: 1,
  },
  locationSelectorLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  changeLocationLabel: {
    fontSize: 11.5,
  },
  directionToggleRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  directionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  directionBtnText: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 11.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabSwitchContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    flex: 1,
  },
  sourceTabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  sourceTabText: {
    fontSize: 11.5,
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  locationModalContainer: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 12,
  },
  locationModalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationModalTitle: {
    fontSize: 14.5,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualIdBox: {
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  manualIdLabel: {
    fontSize: 11.5,
    textAlign: 'right',
  },
  manualIdInputRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  manualIdInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
    fontSize: 13,
  },
  applyIdBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  applyIdBtnText: {
    fontSize: 12,
  },
  searchLocationBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchLocationInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12.5,
  },
  locationListItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  locationItemRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  locationItemTitle: {
    fontSize: 13,
  },
  locationItemCompany: {
    fontSize: 11,
    marginTop: 2,
  },
  locationIdPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
});
