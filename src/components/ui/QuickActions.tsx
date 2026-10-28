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
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import {
  Navigation,
  PhoneCall,
  FileText,
  Wrench,
  X,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  LucideIcon,
} from 'lucide-react-native';

export type QuickActionType = 'navigation' | 'support' | 'waybill' | 'emergency';

interface ActionItem {
  id: QuickActionType;
  title: string;
  badge: string;
  icon: LucideIcon;
  colorType: 'gold' | 'success' | 'info' | 'warning';
}

const QUICK_ACTIONS: ActionItem[] = [
  {
    id: 'navigation',
    title: 'مسیریاب زنده',
    badge: 'فعال',
    icon: Navigation,
    colorType: 'gold',
  },
  {
    id: 'support',
    title: 'تماس با مرکز',
    badge: '۲۴/۷',
    icon: PhoneCall,
    colorType: 'success',
  },
  {
    id: 'waybill',
    title: 'بارنامه و مدارک',
    badge: 'الکترونیک',
    icon: FileText,
    colorType: 'info',
  },
  {
    id: 'emergency',
    title: 'امداد جاده‌ای',
    badge: 'فوری',
    icon: Wrench,
    colorType: 'warning',
  },
];

export function QuickActions() {
  const { colors } = useAppTheme();
  const [activeModal, setActiveModal] = useState<QuickActionType | null>(null);

  const handlePress = (id: QuickActionType) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics optional
    }
    setActiveModal(id);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const getAccentColor = (type: ActionItem['colorType']) => {
    switch (type) {
      case 'gold':
        return colors.gold;
      case 'success':
        return colors.success;
      case 'info':
        return colors.info;
      case 'warning':
        return colors.warning;
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            دسترسی‌های سریع راننده
          </Text>
          <View style={[styles.goldAccentBar, { backgroundColor: colors.gold }]} />
        </View>
      </View>

      {/* 4 Quick Actions Grid */}
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const accentColor = getAccentColor(action.colorType);

          return (
            <Pressable
              key={action.id}
              onPress={() => handlePress(action.id)}
              accessibilityRole="button"
              accessibilityLabel={action.title}
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              {/* Badge */}
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.cardSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: accentColor, fontFamily: Typography.fontFamily.medium },
                  ]}
                >
                  {toPersianDigits(action.badge)}
                </Text>
              </View>

              {/* Icon Circle */}
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: colors.cardSubtle,
                    borderColor: accentColor,
                  },
                ]}
              >
                <Icon size={18} color={accentColor} />
              </View>

              {/* Title */}
              <Text
                numberOfLines={1}
                style={[
                  styles.actionTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {action.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Interactive Modal for Quick Actions */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdropPress} onPress={closeModal} />

          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderGold,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable
                onPress={closeModal}
                hitSlop={8}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                ]}
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>

              <View style={styles.modalTitleGroup}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {activeModal === 'navigation' && 'مسیریاب زنده سفر'}
                  {activeModal === 'support' && 'مرکز عملیات و اعزام گیتی‌سیر'}
                  {activeModal === 'waybill' && 'بارنامه و مدارک سفر'}
                  {activeModal === 'emergency' && 'امداد جاده‌ای و ثبت نقص فنی'}
                </Text>
                <View style={[styles.goldAccentBar, { backgroundColor: colors.gold }]} />
              </View>
            </View>

            {/* Modal Body Based on Active Modal */}
            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. NAVIGATION MODAL */}
              {activeModal === 'navigation' && (
                <View style={styles.modalInner}>
                  <View
                    style={[
                      styles.infoBanner,
                      { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                    ]}
                  >
                    <MapPin size={16} color={colors.gold} />
                    <View style={styles.infoTextColumn}>
                      <Text
                        style={[
                          styles.bannerTitle,
                          { color: colors.text, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        مسیر: تهران (ترمینال غرب) به رشت
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
                        مسافت ۳۲۰ کیلومتر • وضعیت جاده: روان و بدون محدودیت
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.optionsHeader,
                      { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                    ]}
                  >
                    انتخاب اپلیکیشن مسیریاب:
                  </Text>

                  <View style={styles.appOptionsRow}>
                    <Pressable
                      onPress={() => Linking.openURL('https://neshan.org').catch(() => {})}
                      style={[
                        styles.navAppButton,
                        { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                      ]}
                    >
                      <Navigation size={18} color={colors.gold} />
                      <Text
                        style={[
                          styles.navAppText,
                          { color: colors.text, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        مسیریاب نشان
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => Linking.openURL('https://balad.ir').catch(() => {})}
                      style={[
                        styles.navAppButton,
                        { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                      ]}
                    >
                      <Navigation size={18} color={colors.gold} />
                      <Text
                        style={[
                          styles.navAppText,
                          { color: colors.text, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        مسیریاب بلد
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => Linking.openURL('https://www.waze.com').catch(() => {})}
                      style={[
                        styles.navAppButton,
                        { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                      ]}
                    >
                      <Navigation size={18} color={colors.gold} />
                      <Text
                        style={[
                          styles.navAppText,
                          { color: colors.text, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        ویز (Waze)
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* 2. SUPPORT MODAL */}
              {activeModal === 'support' && (
                <View style={styles.modalInner}>
                  <View
                    style={[
                      styles.infoBanner,
                      { backgroundColor: colors.successBg, borderColor: colors.success },
                    ]}
                  >
                    <Clock size={16} color={colors.success} />
                    <View style={styles.infoTextColumn}>
                      <Text
                        style={[
                          styles.bannerTitle,
                          { color: colors.success, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        پشتیبانی ۲۴ ساعته ناوگان فعال است
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
                        پاسخگویی آنی به درخواست‌های ناوگان بین‌شهری و سرویس‌های فعال
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contactList}>
                    <Pressable
                      onPress={() => Linking.openURL('tel:02188884321').catch(() => {})}
                      style={[
                        styles.contactCard,
                        { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.callActionIcon,
                          { backgroundColor: colors.success },
                        ]}
                      >
                        <Phone size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.contactDetails}>
                        <Text
                          style={[
                            styles.contactTitle,
                            { color: colors.text, fontFamily: Typography.fontFamily.bold },
                          ]}
                        >
                          مرکز دیسپاچینگ و اعزام مرکزی
                        </Text>
                        <Text
                          style={[
                            styles.contactPhone,
                            { color: colors.gold, fontFamily: Typography.fontFamily.medium },
                          ]}
                        >
                          {toPersianDigits('021-88884321')}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => Linking.openURL('tel:02188880000').catch(() => {})}
                      style={[
                        styles.contactCard,
                        { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.callActionIcon,
                          { backgroundColor: colors.gold },
                        ]}
                      >
                        <Phone size={16} color="#0B0F19" />
                      </View>
                      <View style={styles.contactDetails}>
                        <Text
                          style={[
                            styles.contactTitle,
                            { color: colors.text, fontFamily: Typography.fontFamily.bold },
                          ]}
                        >
                          سرپرست خط و امور رانندگان
                        </Text>
                        <Text
                          style={[
                            styles.contactPhone,
                            { color: colors.gold, fontFamily: Typography.fontFamily.medium },
                          ]}
                        >
                          {toPersianDigits('021-88880000')}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* 3. WAYBILL MODAL */}
              {activeModal === 'waybill' && (
                <View style={styles.modalInner}>
                  <View
                    style={[
                      styles.infoBanner,
                      { backgroundColor: colors.infoBg, borderColor: colors.info },
                    ]}
                  >
                    <ShieldCheck size={16} color={colors.info} />
                    <View style={styles.infoTextColumn}>
                      <Text
                        style={[
                          styles.bannerTitle,
                          { color: colors.info, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        بارنامه برخط سازمان راهداری
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
                        کد رهگیری معتبر و متصل به سامانه جامع حمل‌ونقل
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.detailsBox,
                      { backgroundColor: colors.cardSubtle, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailVal, { color: colors.text }]}>
                        {toPersianDigits('IR-98421074')}
                      </Text>
                      <Text style={[styles.detailKey, { color: colors.textMuted }]}>
                        شماره بارنامه الکترونیک:
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailVal, { color: colors.text }]}>
                        {toPersianDigits(24)} نفر
                      </Text>
                      <Text style={[styles.detailKey, { color: colors.textMuted }]}>
                        تعداد مسافران ثبت‌شده:
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailVal, { color: colors.success }]}>
                        پوشش کامل معتبر
                      </Text>
                      <Text style={[styles.detailKey, { color: colors.textMuted }]}>
                        بیمه سرنشین و مسئولیت:
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailVal, { color: colors.text }]}>
                        {toPersianDigits('1404/06/20')}
                      </Text>
                      <Text style={[styles.detailKey, { color: colors.textMuted }]}>
                        اعتبار معاینه فنی خودرو:
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 4. EMERGENCY MODAL */}
              {activeModal === 'emergency' && (
                <View style={styles.modalInner}>
                  <View
                    style={[
                      styles.infoBanner,
                      { backgroundColor: colors.warningBg, borderColor: colors.warning },
                    ]}
                  >
                    <AlertTriangle size={16} color={colors.warning} />
                    <View style={styles.infoTextColumn}>
                      <Text
                        style={[
                          styles.bannerTitle,
                          { color: colors.warning, fontFamily: Typography.fontFamily.bold },
                        ]}
                      >
                        اعلام اضطرار و امداد فنی در راه
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
                        در صورت نقص فنی، موقعیت شما فوراً به گشت امداد ارسال می‌شود
                      </Text>
                    </View>
                  </View>

                  <View style={styles.emergencyOptions}>
                    <Pressable
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        closeModal();
                      }}
                      style={[
                        styles.emergencyButton,
                        { backgroundColor: colors.warning, borderColor: colors.gold },
                      ]}
                    >
                      <Wrench size={16} color="#0B0F19" />
                      <Text
                        style={[
                          styles.emergencyBtnText,
                          {
                            color: '#0B0F19',
                            fontFamily: Typography.fontFamily.bold,
                          },
                        ]}
                      >
                        ثبت درخواست اعزام مکانیک سیار
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => Linking.openURL('tel:141').catch(() => {})}
                      style={[
                        styles.emergencyButtonOutline,
                        { borderColor: colors.border, backgroundColor: colors.cardSubtle },
                      ]}
                    >
                      <Phone size={16} color={colors.text} />
                      <Text
                        style={[
                          styles.emergencyBtnOutlineText,
                          { color: colors.text, fontFamily: Typography.fontFamily.medium },
                        ]}
                      >
                        تماس مستقیم با راهداری ({toPersianDigits('141')})
                      </Text>
                    </Pressable>
                  </View>
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
  container: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  goldAccentBar: {
    width: 3.5,
    height: 15,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 0.5,
  },
  badgeText: {
    fontSize: 8.5,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 6,
  },
  actionTitle: {
    fontSize: 10.5,
    textAlign: 'center',
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
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    maxHeight: '80%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 15,
  },
  modalBody: {
    paddingVertical: Spacing.xs,
  },
  modalInner: {
    gap: Spacing.md,
  },
  infoBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoTextColumn: {
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
  optionsHeader: {
    fontSize: 12,
    textAlign: 'right',
  },
  appOptionsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  navAppButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navAppText: {
    fontSize: 11,
  },
  contactList: {
    gap: Spacing.sm,
  },
  contactCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  callActionIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contactTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
  },
  detailsBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    fontSize: 11.5,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emergencyOptions: {
    gap: Spacing.sm,
  },
  emergencyButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  emergencyBtnText: {
    fontSize: 12.5,
  },
  emergencyButtonOutline: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  emergencyBtnOutlineText: {
    fontSize: 12,
  },
});
