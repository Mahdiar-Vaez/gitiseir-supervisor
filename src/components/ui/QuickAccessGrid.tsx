import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Linking,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import {
  Calendar,
  User,
  BarChart3,
  FileText,
  Clock,
  Headphones,
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  LucideIcon,
  Radio,
} from 'lucide-react-native';

export interface QuickAccessItem {
  id: string;
  title: string;
  icon: LucideIcon;
  bgColor: string;
  action: () => void;
}

interface QuickAccessGridProps {
  onScrollToSchedule?: () => void;
  onOpenSos?: () => void;
  onOpenManagement?: () => void;
  onOpenRatings?: () => void;
}

export function QuickAccessGrid({
  onScrollToSchedule,
  onOpenSos,
  onOpenManagement,
  onOpenRatings,
}: QuickAccessGridProps) {
  const { colors } = useAppTheme();
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportConfirmed, setSupportConfirmed] = useState(false);

  const handleSupportPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional
    }
    setSupportConfirmed(false);
    setSupportModalVisible(true);
  };

  const handleConfirmSupport = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }
    setSupportConfirmed(true);
    setTimeout(() => {
      setSupportModalVisible(false);
      setSupportConfirmed(false);
    }, 2000);
  };

  // 8 Exact items from the reference Figma design:
  // Row 1 (RTL): تقویم کاری, کارت راننده, سفرهای من, عملکرد من
  // Row 2 (RTL): مدارک, برنامه امروز, پشتیبانی, تاریخچه
  const ITEMS: QuickAccessItem[] = [
    {
      id: 'calendar',
      title: 'تقویم کاری',
      icon: Calendar,
      bgColor: '#F59E0B', // Warm Amber / Gold
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.navigate('/calendar' as any);
      },
    },
    {
      id: 'driver_card',
      title: 'کارت راننده',
      icon: User,
      bgColor: '#3B82F6', // Vibrant Blue
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.navigate('/profile' as any);
      },
    },
    {
      id: 'management',
      title: 'ارتباط با مدیریت',
      icon: ShieldCheck,
      bgColor: '#8B5CF6', // Purple
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (onOpenManagement) onOpenManagement();
      },
    },
    {
      id: 'sos',
      title: 'امداد SOS',
      icon: Radio,
      bgColor: '#EF4444', // Red Alert
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        if (onOpenSos) onOpenSos();
      },
    },
    {
      id: 'documents',
      title: 'مدارک',
      icon: FileText,
      bgColor: '#06B6D4', // Cyan / Teal
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.navigate('/profile' as any);
      },
    },
    {
      id: 'today_schedule',
      title: 'برنامه امروز',
      icon: Clock,
      bgColor: '#F97316', // Orange
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onScrollToSchedule?.();
      },
    },
    {
      id: 'support',
      title: 'پشتیبانی',
      icon: Headphones,
      bgColor: '#EC4899', // Pink / Magenta
      action: handleSupportPress,
    },
    {
      id: 'ratings',
      title: 'نظرسنجی و آمار',
      icon: BarChart3,
      bgColor: '#10B981', // Emerald / Teal
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (onOpenRatings) {
          onOpenRatings();
        } else {
          router.navigate('/ratings' as any);
        }
      },
    },
  ];

  return (
    <View
      style={[
        styles.containerCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Top Header of Quick Access Section */}
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.subtitleText,
            { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          خدمات پرکاربرد شما
        </Text>

        <View style={styles.titleGroup}>
          <Text
            style={[
              styles.titleText,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            دسترسی سریع
          </Text>
          <View style={[styles.goldBar, { backgroundColor: colors.gold }]} />
        </View>
      </View>

      {/* 8-Box Grid (2 rows x 4 columns) */}
      <View style={styles.grid}>
        {ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Pressable
              key={item.id}
              onPress={item.action}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={({ pressed }) => [
                styles.itemWrapper,
                {
                  transform: [{ scale: pressed ? 0.93 : 1 }],
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <Icon size={20} color="#FFFFFF" strokeWidth={2.2} />
              </View>

              <Text
                numberOfLines={2}
                style={[
                  styles.itemLabel,
                  {
                    color: colors.text,
                    fontFamily: Typography.fontFamily.medium,
                  },
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Support & Dispatcher Modal */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.backdropPress}
            onPress={() => setSupportModalVisible(false)}
          />

          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderGold,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => setSupportModalVisible(false)}
                hitSlop={8}
                style={[
                  styles.closeBtn,
                  { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                ]}
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>

              <View style={styles.titleGroup}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  پشتیبانی و مرکز عملیات گیتی‌سیر
                </Text>
                <View style={[styles.goldBar, { backgroundColor: colors.gold }]} />
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {supportConfirmed ? (
                <View style={styles.confirmedBox}>
                  <CheckCircle2 size={42} color={colors.success} />
                  <Text
                    style={[
                      styles.confirmedTitle,
                      { color: colors.success, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    پیام شما به مرکز عملیات ارسال شد
                  </Text>
                  <Text
                    style={[
                      styles.confirmedDesc,
                      {
                        color: colors.textSecondary,
                        fontFamily: Typography.fontFamily.regular,
                      },
                    ]}
                  >
                    کارشناس دیسپاچینگ ظرف کمتر از ۳ دقیقه با شماره شما تماس خواهد گرفت.
                  </Text>
                </View>
              ) : (
                <View style={styles.supportOptions}>
                  <View
                    style={[
                      styles.infoBanner,
                      { backgroundColor: colors.goldBg, borderColor: colors.gold },
                    ]}
                  >
                    <Headphones size={18} color={colors.gold} />
                    <View style={styles.bannerText}>
                      <Text
                        style={[
                          styles.bannerTitle,
                          { color: colors.text, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        پشتیبانی شبانه‌روزی رانندگان گیتی‌سیر
                      </Text>
                      <Text
                        style={[
                          styles.bannerSubtitle,
                          {
                            color: colors.textMuted,
                            fontFamily: Typography.fontFamily.regular,
                          },
                        ]}
                      >
                        پاسخگویی آنی به درخواست‌های ناوگان و موارد اضطراری سفر
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => Linking.openURL('tel:02188884321').catch(() => {})}
                    style={[
                      styles.contactOption,
                      { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.callIconBox,
                        { backgroundColor: colors.success },
                      ]}
                    >
                      <Phone size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.contactTextCol}>
                      <Text
                        style={[
                          styles.contactTitle,
                          { color: colors.text, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        تماس تلفنی با دیسپاچینگ مرکزی
                      </Text>
                      <Text
                        style={[
                          styles.contactNumber,
                          { color: colors.gold, fontFamily: Typography.fontFamily.medium },
                        ]}
                      >
                        {toPersianDigits('021-88884321')}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmSupport}
                    style={[
                      styles.sendRequestBtn,
                      { backgroundColor: colors.gold },
                    ]}
                  >
                    <ShieldCheck size={16} color="#0B0F19" />
                    <Text
                      style={[
                        styles.sendRequestText,
                        { color: '#0B0F19', fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      درخواست تماس فوری از طرف مرکز
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  containerCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.2,
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  goldBar: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
  },
  titleText: {
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  itemWrapper: {
    width: '23%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 5,
  },
  itemLabel: {
    fontSize: 10.5,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 14,
    minHeight: 28,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdropPress: {
    ...StyleSheet.absoluteFill,
  },
  modalBox: {
    width: '100%',
    maxWidth: 390,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
  },
  modalContent: {
    paddingVertical: 4,
  },
  supportOptions: {
    gap: Spacing.sm + 2,
  },
  infoBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerTitle: {
    fontSize: 12.5,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 11,
    textAlign: 'right',
  },
  contactOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  callIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contactTitle: {
    fontSize: 12.5,
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 12,
  },
  sendRequestBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  sendRequestText: {
    fontSize: 12.5,
  },
  confirmedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  confirmedTitle: {
    fontSize: 14.5,
    textAlign: 'center',
    marginTop: 4,
  },
  confirmedDesc: {
    fontSize: 11.5,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});
