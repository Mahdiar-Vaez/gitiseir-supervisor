import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import {
  Repeat,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useSarshoofer } from '@/context/SarshooferContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { TodayDriverItem, LangiRequestItem } from '@/services/api/types';
import { AppHeader } from '@/components/ui/AppHeader';
import { LangiStatusCard } from '@/components/ui/LangiStatusCard';
import { LangiRequestModal } from '@/components/ui/LangiRequestModal';

type LangiFilterTab = 'all' | 'pending' | 'paid';

export default function LangiManagementScreen() {
  const { colors, isDark } = useAppTheme();
  const { drivers, langiList, refreshing, refreshFleet } = useSarshoofer();

  const [filterTab, setFilterTab] = useState<LangiFilterTab>('all');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDriverForModal, setSelectedDriverForModal] =
    useState<TodayDriverItem | null>(null);

  // Drivers who were marked Not Arrived today and still do not have a Langi assigned
  const absentWithoutLangi = useMemo(() => {
    return drivers.filter((d) => d.arrivalStatus === 'not_arrived' && !d.hasLangi);
  }, [drivers]);

  const paidCount = useMemo(
    () => langiList.filter((l) => l.fullyAcceptedAndPayed).length,
    [langiList]
  );
  const pendingApprovalCount = langiList.length - paidCount;

  const filteredLangiList = useMemo(() => {
    if (filterTab === 'paid') {
      return langiList.filter((l) => l.fullyAcceptedAndPayed);
    }
    if (filterTab === 'pending') {
      return langiList.filter((l) => !l.fullyAcceptedAndPayed);
    }
    return langiList;
  }, [langiList, filterTab]);

  const handleOpenNewLangi = (_driver?: TodayDriverItem) => {
    router.navigate('/calendar' as any);
  };

  const handleEditLangiItem = (langiItem: LangiRequestItem) => {
    const matchedDriver = drivers.find(
      (d) => d.tripWorkCalendarId === langiItem.tripWorkCalendarId
    );
    setSelectedDriverForModal(matchedDriver || null);
    setModalVisible(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 36 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshFleet}
            tintColor={colors.langi}
            colors={[colors.langi]}
          />
        }
      >
        {/* 1. Langi Hero Command Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.langiBorder,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleCol}>
              <View
                style={[
                  styles.heroPill,
                  { backgroundColor: colors.langiBg, borderColor: colors.langi },
                ]}
              >
                <Repeat size={12} color={colors.langi} />
                <Text
                  style={[
                    styles.heroPillText,
                    { color: colors.langi, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  سامانه جایگزینی و لنگی گیتی‌سیر
                </Text>
              </View>
              <Text
                style={[
                  styles.heroTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                وضعیت درخواست‌های لنگی و مراحل تایید
              </Text>
            </View>

            <Pressable
              onPress={() => handleOpenNewLangi()}
              style={({ pressed }) => [
                styles.newRequestBtn,
                {
                  backgroundColor: colors.langi,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Plus size={16} color="#071318" />
              <Text
                style={[
                  styles.newRequestBtnText,
                  { fontFamily: Typography.fontFamily.bold },
                ]}
              >
                + ثبت لنگی از تقویم کاری
              </Text>
            </Pressable>
          </View>

          {/* 3 Summary Metrics */}
          <View style={styles.metricsRow}>
            <View
              style={[
                styles.metricBox,
                {
                  backgroundColor: isDark ? '#071318' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Repeat size={15} color={colors.langi} />
              <Text
                style={[
                  styles.metricVal,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {toPersianDigits(langiList.length)}
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                کل لنگی‌های امروز
              </Text>
            </View>

            <View
              style={[
                styles.metricBox,
                {
                  backgroundColor: isDark ? '#071318' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Clock size={15} color={colors.gold} />
              <Text
                style={[
                  styles.metricVal,
                  { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {toPersianDigits(pendingApprovalCount)}
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                در جریان تایید
              </Text>
            </View>

            <View
              style={[
                styles.metricBox,
                {
                  backgroundColor: isDark ? '#071318' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <CheckCircle2 size={15} color={colors.success} />
              <Text
                style={[
                  styles.metricVal,
                  { color: colors.success, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {toPersianDigits(paidCount)}
              </Text>
              <Text
                style={[
                  styles.metricLabel,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                تایید و تسویه شده
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Urgent Alert: Drivers Marked Absent Without Langi Yet */}
        {absentWithoutLangi.length > 0 && (
          <View
            style={[
              styles.urgentBox,
              {
                backgroundColor: colors.dangerBg,
                borderColor: colors.danger,
              },
            ]}
          >
            <View style={styles.urgentHeader}>
              <AlertTriangle size={16} color={colors.danger} />
              <Text
                style={[
                  styles.urgentTitle,
                  { color: colors.danger, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                سرویس‌های بدون راننده نیازمند تعیین فوری لنگی (
                {toPersianDigits(absentWithoutLangi.length)} مورد)
              </Text>
            </View>

            {absentWithoutLangi.map((absentDriver) => (
              <View
                key={absentDriver.tripWorkCalendarId}
                style={[
                  styles.urgentItemRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ alignItems: 'flex-end', flex: 1 }}>
                  <Text
                    style={[
                      styles.urgentDriverName,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    غیبت: {absentDriver.driverFullName} (ساعت{' '}
                    {toPersianDigits(absentDriver.scheduledStartTime)})
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.urgentTripName,
                      {
                        color: colors.textSecondary,
                        fontFamily: Typography.fontFamily.regular,
                      },
                    ]}
                  >
                    {absentDriver.tripName}
                  </Text>
                </View>

                <Pressable
                  onPress={() => router.navigate('/calendar' as any)}
                  style={[
                    styles.assignNowBtn,
                    { backgroundColor: colors.langi },
                  ]}
                >
                  <Text
                    style={[
                      styles.assignNowBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    + ثبت لنگی در تقویم
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* 3. Filter Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'all' as const, label: 'همه درخواست‌ها' },
            { id: 'pending' as const, label: 'در انتظار تایید ناوگان/مالی' },
            { id: 'paid' as const, label: 'تایید نهایی و تسویه شده' },
          ].map((tab) => {
            const active = filterTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setFilterTab(tab.id)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.langi : colors.card,
                    borderColor: active ? colors.langi : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    {
                      color: active ? '#071318' : colors.textSecondary,
                      fontFamily: active
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.medium,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 4. Langi Status Cards List */}
        <View style={styles.listContainer}>
          {filteredLangiList.length > 0 ? (
            filteredLangiList.map((langi) => (
              <LangiStatusCard
                key={langi.id}
                item={langi}
                onEditPress={handleEditLangiItem}
              />
            ))
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Repeat size={28} color={colors.langi} />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                درخواست لنگی در این بخش وجود ندارد
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                برای تخصیص و ثبت راننده جایگزین (لنگی)، روز و سرویس مورد نظر را از «تقویم کاری» انتخاب نمایید.
              </Text>
              <Pressable
                onPress={() => router.navigate('/calendar' as any)}
                style={[
                  styles.assignNowBtn,
                  {
                    backgroundColor: colors.langi,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: BorderRadius.md,
                    marginTop: 10,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.assignNowBtnText,
                    { color: '#071318', fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  ورود به تقویم کاری
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <LangiRequestModal
        visible={modalVisible}
        preselectedDriver={selectedDriverForModal}
        onClose={() => setModalVisible(false)}
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
  heroCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  heroTitleCol: {
    alignItems: 'flex-end',
    gap: 4,
    flex: 1,
  },
  heroPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  heroPillText: {
    fontSize: 10,
  },
  heroTitle: {
    fontSize: 14.5,
    textAlign: 'right',
  },
  newRequestBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  newRequestBtnText: {
    fontSize: 12,
    color: '#071318',
  },
  metricsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 3,
  },
  metricVal: {
    fontSize: 16,
  },
  metricLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  urgentBox: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  urgentHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  urgentTitle: {
    fontSize: 12.5,
    textAlign: 'right',
    flex: 1,
  },
  urgentItemRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 10,
  },
  urgentDriverName: {
    fontSize: 12.5,
  },
  urgentTripName: {
    fontSize: 11,
    marginTop: 2,
  },
  assignNowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  assignNowBtnText: {
    fontSize: 11.5,
    color: '#071318',
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipText: {
    fontSize: 11,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
  },
});
