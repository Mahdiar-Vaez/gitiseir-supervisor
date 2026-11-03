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
import {
  ShieldCheck,
  Phone,
  CreditCard,
  LogOut,
} from 'lucide-react-native';

import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSarshoofer } from '@/context/SarshooferContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { AppHeader } from '@/components/ui/AppHeader';
import { SupervisorTodaySummaryCard } from '@/components/ui/SupervisorTodaySummaryCard';
import { toPersianDigits } from '@/utils/persian-digits';

export default function SarshooferProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const { user, logout } = useAuth();
  const { todayExecutionSummary, refreshTodaySummary, refreshing } = useSarshoofer();

  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const fullName = user
    ? `${user.name || ''} ${user.family || ''}`.trim()
    : 'مهدیار واعظ';
  const displayName = fullName || 'سرشوفر ارشد گیتی‌سیر';
  const personnelCode = toPersianDigits(String(user?.id || '۴۰۶۷'));
  const nationalCode = toPersianDigits(user?.nationalCode || '۰۹۲۸۶۴۵۶۴۵');
  const phone = toPersianDigits(user?.phoneNumber || '۰۹۰۴۳۷۹۳۴۲۴');

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Physical Lead Driver (Sarshoofer) Command ID Card */}
        <View
          style={[
            styles.idCard,
            {
              backgroundColor: isDark ? '#0D1F28' : '#FFFFFF',
              borderColor: colors.command,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.idCardHeader}>
            <View style={styles.idBrandGroup}>
              <ShieldCheck size={20} color={colors.gold} />
              <Text
                style={[
                  styles.idBrandTitle,
                  { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                کارت شناسایی سرشوفر گیتی‌سیر
              </Text>
            </View>
          </View>

          <View style={styles.idMainBody}>
            <View
              style={[
                styles.largeAvatar,
                {
                  backgroundColor: colors.commandBg,
                  borderColor: colors.gold,
                },
              ]}
            >
              <Text
                style={[
                  styles.largeAvatarText,
                  { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {displayName.charAt(0)}
              </Text>
            </View>

            <View style={styles.idPersonDetails}>
              <Text
                style={[
                  styles.idName,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {displayName}
              </Text>
              <Text
                style={[
                  styles.idPersonnelCode,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                کد سازمانی سرشوفر: {personnelCode}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.idFooterGrid,
              {
                backgroundColor: isDark ? '#071318' : '#F4F7F6',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.idFooterItem}>
              <Phone size={13} color={colors.gold} />
              <Text
                style={[
                  styles.idFooterLabel,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                همراه:
              </Text>
              <Text
                style={[
                  styles.idFooterVal,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {phone}
              </Text>
            </View>

            <View style={styles.idFooterItem}>
              <CreditCard size={13} color={colors.gold} />
              <Text
                style={[
                  styles.idFooterLabel,
                  { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                کد ملی:
              </Text>
              <Text
                style={[
                  styles.idFooterVal,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {nationalCode}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Supervision Metrics Today - Live /today-execution-summary */}
        <SupervisorTodaySummaryCard
          summary={todayExecutionSummary}
          loading={refreshing}
          onRefresh={refreshTodaySummary}
        />

        {/* 3. Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
              borderColor: 'rgba(239, 68, 68, 0.35)',
            },
          ]}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#EF4444" style={{ marginLeft: 8 }} />
          <Text style={styles.logoutBtnText}>خروج از حساب کاربری سرشوفر</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
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
                backgroundColor: colors.card,
                borderColor: colors.borderGold,
              },
            ]}
          >
            <View
              style={[
                styles.modalIconRing,
                { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
              ]}
            >
              <LogOut size={28} color="#EF4444" />
            </View>

            <Text
              style={[
                styles.modalTitle,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              خروج از پنل سرشوفر
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
              آیا از خروج از حساب کاربری سرشوفر اطمینان دارید؟ برای ورود مجدد نیاز به دریافت کد تایید پیامکی خواهید داشت.
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[
                  styles.modalCancelBtn,
                  {
                    backgroundColor: isDark ? '#132B38' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.text, fontFamily: Typography.fontFamily.medium },
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
  idCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: 14,
  },
  idCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idBrandGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  idBrandTitle: {
    fontSize: 13.5,
  },
  activeRoleBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  activeRoleText: {
    fontSize: 10,
  },
  idMainBody: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  largeAvatar: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeAvatarText: {
    fontSize: 24,
  },
  idPersonDetails: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 3,
  },
  idName: {
    fontSize: 16.5,
  },
  idRoleDesc: {
    fontSize: 12,
    textAlign: 'right',
  },
  idPersonnelCode: {
    fontSize: 11,
  },
  idFooterGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  idFooterItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  idFooterLabel: {
    fontSize: 11.5,
  },
  idFooterVal: {
    fontSize: 12.5,
  },
  logoutBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  logoutBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
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
  },
  modalIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
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
