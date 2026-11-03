import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { Award, ShieldCheck, CreditCard, Calendar, Hash } from 'lucide-react-native';

export interface DriverInfo {
  name: string;
  nationalCode: string;
  personnelCode: string;
  licenseNumber: string;
  licenseType: string;
  expiryDate: string;
  vehicleModel: string;
  plateNumber: string;
  isVerified: boolean;
}

interface DriverIdCardProps {
  driver?: DriverInfo;
}

export function DriverIdCard({
  driver = {
    name: 'محمد علیزاده',
    nationalCode: '۰۹۲۴۵۶۷۸۹۱',
    personnelCode: '۸۴۲۱',
    licenseNumber: '۹۲۸۳۷۴۱۰',
    licenseType: 'پایه یکم هوشمند برون‌شهری',
    expiryDate: '۱۴۰۶/۰۴/۱۵',
    vehicleModel: 'ولوو B9R VIP',
    plateNumber: '۲۱ ع ۷۸۹ ایران ۴۴',
    isVerified: true,
  },
}: DriverIdCardProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: colors.borderGold,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Background Luxury Card Top Glow Bar */}
      <View style={[styles.topGoldBar, { backgroundColor: colors.gold }]} />

      {/* Top Header of the ID Card */}
      <View style={styles.topHeader}>
        <View style={styles.verifiedRow}>
          <ShieldCheck size={14} color={colors.gold} />
          <Text
            style={[
              styles.verifiedText,
              { color: colors.gold, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            هویت تأیید شده گیتیسیر
          </Text>
        </View>

        <View style={styles.brandTitleRow}>
          <Text
            style={[
              styles.brandTitle,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            گیتی‌سیر
          </Text>
          <Award size={15} color={colors.gold} />
        </View>
      </View>

      {/* Main Profile Info Section */}
      <View style={styles.mainInfoRow}>
        <View style={styles.detailsColumn}>
          <Text
            numberOfLines={2}
            style={[
              styles.driverName,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {driver.name}
          </Text>

          <Text
            numberOfLines={2}
            style={[
              styles.licenseType,
              { color: colors.gold, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {driver.licenseType}
          </Text>

          <Text
            numberOfLines={2}
            style={[
              styles.vehicleText,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            خودرو: {driver.vehicleModel} ({driver.plateNumber})
          </Text>
        </View>

        {/* Driver Photo / Avatar */}
        <View
          style={[
            styles.avatarBox,
            {
              backgroundColor: colors.cardSubtle,
              borderColor: colors.gold,
            },
          ]}
        >
          <Text style={[styles.avatarInitial, { color: colors.gold }]}>
            {driver.name.slice(0, 1)}
          </Text>
          <View style={[styles.avatarBadge, { backgroundColor: colors.gold }]}>
            <Award size={10} color="#0B0F19" />
          </View>
        </View>
      </View>

      {/* Security Divider */}
      <View style={[styles.securityDivider, { borderTopColor: colors.border }]} />

      {/* License & Personnel Details Grid */}
      <View style={styles.detailsGrid}>
        {/* Personnel Code */}
        <View style={styles.gridItem}>
          <View style={styles.gridItemHeader}>
            <Hash size={11} color={colors.gold} />
            <Text
              style={[
                styles.gridLabel,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              کد پرسنلی
            </Text>
          </View>
          <Text
            style={[
              styles.gridValue,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {toPersianDigits(driver.personnelCode)}
          </Text>
        </View>

        {/* License Number */}
        <View style={styles.gridItem}>
          <View style={styles.gridItemHeader}>
            <CreditCard size={11} color={colors.gold} />
            <Text
              style={[
                styles.gridLabel,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              شماره گواهینامه
            </Text>
          </View>
          <Text
            style={[
              styles.gridValue,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {toPersianDigits(driver.licenseNumber)}
          </Text>
        </View>

        {/* Expiry Date */}
        <View style={styles.gridItem}>
          <View style={styles.gridItemHeader}>
            <Calendar size={11} color={colors.gold} />
            <Text
              style={[
                styles.gridLabel,
                { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              تاریخ اعتبار
            </Text>
          </View>
          <Text
            style={[
              styles.gridValue,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {toPersianDigits(driver.expiryDate)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.2,
    padding: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  topGoldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  topHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: 2,
  },
  brandTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  verifiedRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
  },
  mainInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailsColumn: {
    alignItems: 'flex-end',
    flex: 1,
    paddingLeft: Spacing.md,
  },
  driverName: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  licenseType: {
    fontSize: 11,
    marginTop: 2,
  },
  vehicleText: {
    fontSize: 10.5,
    marginTop: 3,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 17,
    height: 17,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityDivider: {
    borderTopWidth: 1,
    marginVertical: Spacing.sm,
  },
  detailsGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  gridItem: {
    alignItems: 'flex-end',
    flex: 1,
  },
  gridItemHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 10,
  },
  gridValue: {
    fontSize: 11.5,
  },
});
