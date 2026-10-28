import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';

import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { AppHeader } from '@/components/ui/AppHeader';
import { DriverIdCard, DriverInfo } from '@/components/ui/DriverIdCard';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { StatCard } from '@/components/ui/StatCard';
import { toPersianDigits } from '@/utils/persian-digits';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  LogOut,
  Phone,
  CreditCard,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const { user, isDriver, logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Build driver card data from authenticated session
  const fullName = user ? `${user.name || ''} ${user.family || ''}`.trim() : 'محمد علیزاده';
  const driverData: DriverInfo = {
    name: fullName || 'راننده گیتی‌سیر',
    nationalCode: toPersianDigits(user?.nationalCode || '۰۹۲۴۵۶۷۸۹۱'),
    personnelCode: toPersianDigits(String(user?.driverId || user?.id || '۸۴۲۱')),
    licenseNumber: toPersianDigits(user?.phoneNumber || '۰۹۰۴۳۷۹۳۴۲۴'),
    licenseType: isDriver ? 'راننده هوشمند بین‌شهری' : 'پرسنل ناوگان گیتی‌سیر',
    expiryDate: '۱۴۰۶/۰۴/۱۵',
    vehicleModel: 'ولوو B9R VIP',
    plateNumber: '۲۱ ع ۷۸۹ ایران ۴۴',
    isVerified: user ? user.isActive : true,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Physical Driver ID Card */}
        <DriverIdCard driver={driverData} />

        {/* User Account Quick Details Card */}
        {user && (
          <View
            style={[
              styles.accountCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.accountRow}>
              <View style={styles.accountItem}>
                <Phone size={14} color={colors.gold} style={{ marginLeft: 6 }} />
                <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>
                  همراه:
                </Text>
                <Text style={[styles.accountValue, { color: colors.text }]}>
                  {toPersianDigits(user.phoneNumber)}
                </Text>
              </View>

              <View style={styles.accountItem}>
                <CreditCard size={14} color={colors.gold} style={{ marginLeft: 6 }} />
                <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>
                  کد ملی:
                </Text>
                <Text style={[styles.accountValue, { color: colors.text }]}>
                  {toPersianDigits(user.nationalCode)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Performance Score Section */}
        <View
          style={[
            styles.scoreCardContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.scoreHeader}>
            <View
              style={[
                styles.badgeStatus,
                { backgroundColor: colors.successBg, borderColor: colors.success },
              ]}
            >
              <Sparkles size={11} color={colors.success} />
              <Text
                style={[
                  styles.badgeStatusText,
                  { color: colors.success, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                راننده نمونه
              </Text>
            </View>

            <View style={styles.scoreTitleGroup}>
              <Text
                style={[
                  styles.scoreTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                امتیاز عملکرد ماهانه
              </Text>
              <View style={[styles.goldBar, { backgroundColor: colors.gold }]} />
            </View>
          </View>

          {/* Circular Score Visualizer */}
          <View style={styles.ringWrapper}>
            <ScoreRing score={94} size={130} strokeWidth={9} />
          </View>

          <Text
            style={[
              styles.scoreFootnote,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            محاسبه شده بر اساس رضایت مسافران، زمان‌بندی و ایمنی سفر
          </Text>
        </View>

        {/* Statistical Metrics Section */}
        <View style={styles.statsSectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            شاخص‌های آماری این دوره
          </Text>
          <View style={[styles.goldBar, { backgroundColor: colors.gold }]} />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="سفرهای موفق"
            value="۱۴۸"
            trendText="+۱۲ نسبت به قبل"
            isPositive={true}
            icon={CheckCircle2}
            variant="success"
          />

          <StatCard
            title="تعداد تأخیر"
            value="۱"
            trendText="-۲ بهبود"
            isPositive={true}
            icon={Clock}
            variant="warning"
          />

          <StatCard
            title="تعداد غیبت"
            value="۰"
            trendText="بدون غیبت"
            isPositive={true}
            icon={AlertTriangle}
            variant="gold"
          />
        </View>

        {/* Logout Action Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            },
          ]}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#EF4444" style={{ marginLeft: 8 }} />
          <Text style={styles.logoutBtnText}>خروج از حساب کاربری</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Cross-platform Confirmation Modal for Logout */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: colors.borderGold,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View
              style={[
                styles.modalIconRing,
                { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
              ]}
            >
              <LogOut size={30} color="#EF4444" />
            </View>

            <Text
              style={[
                styles.modalTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              خروج از حساب کاربری
            </Text>

            <Text
              style={[
                styles.modalSubtitle,
                {
                  color: colors.textSecondary,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            >
              آیا از خروج از حساب کاربری راننده اطمینان دارید؟ برای ورود مجدد نیاز به دریافت کد تایید پیامکی خواهید داشت.
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[
                  styles.modalCancelBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    {
                      color: colors.text,
                      fontFamily: Typography.fontFamily.medium,
                    },
                  ]}
                >
                  انصراف
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor: '#EF4444',
                    opacity: isLoggingOut ? 0.7 : 1,
                  },
                ]}
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.modalConfirmText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    تایید و خروج
                  </Text>
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
    gap: Spacing.md,
  },
  accountCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  accountRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  accountItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  accountLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    marginRight: 4,
  },
  accountValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
  },
  scoreCardContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoreTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  goldBar: {
    width: 3.5,
    height: 15,
    borderRadius: 2,
  },
  scoreTitle: {
    fontSize: 15,
  },
  badgeStatus: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeStatusText: {
    fontSize: 10.5,
  },
  ringWrapper: {
    marginVertical: 2,
  },
  scoreFootnote: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  statsSectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  logoutBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  logoutBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#EF4444',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActionsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
