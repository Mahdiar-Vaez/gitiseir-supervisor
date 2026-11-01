import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import {
  Repeat,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Edit3,
  User,
  Banknote,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { LangiRequestItem, LangiApprovalStep } from '@/services/api/types';
import {
  toPersianDigits,
  formatNumberWithCommas,
  format4DigitGroups,
} from '@/utils/persian-digits';

interface LangiStatusCardProps {
  item: LangiRequestItem;
  onEditPress: (item: LangiRequestItem) => void;
}

export function LangiStatusCard({ item, onEditPress }: LangiStatusCardProps) {
  const { colors, isDark } = useAppTheme();

  const renderStepNode = (title: string, subtitle: string, step: LangiApprovalStep) => {
    const isApproved = step.accepted === true;
    const isRejected = step.accepted === false;

    const color = isApproved
      ? colors.success
      : isRejected
      ? colors.danger
      : colors.warning;

    const bg = isApproved
      ? colors.successBg
      : isRejected
      ? colors.dangerBg
      : colors.warningBg;

    const StepIcon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;
    const statusText = isApproved
      ? 'تایید شده'
      : isRejected
      ? 'رد شده'
      : 'منتظر اعلام فرایند';

    return (
      <View
        style={[
          styles.stepCard,
          {
            backgroundColor: isDark ? '#071318' : '#F8FAFC',
            borderColor: isApproved ? 'rgba(16, 185, 129, 0.35)' : colors.border,
          },
        ]}
      >
        <View style={styles.stepTopRow}>
          <View style={styles.stepRightTitle}>
            <StepIcon size={14} color={color} />
            <Text
              style={[
                styles.stepTitleText,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {title}
            </Text>
          </View>

          <View
            style={[
              styles.stepStatusBadge,
              { backgroundColor: bg, borderColor: color },
            ]}
          >
            <Text
              style={[
                styles.stepStatusText,
                { color, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {statusText}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.stepReasonText,
            { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          {step.reason || subtitle}
          {step.creationDate ? ` • ساعت ${toPersianDigits(step.creationDate)}` : ''}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: item.fullyAcceptedAndPayed
            ? 'rgba(16, 185, 129, 0.45)'
            : colors.langiBorder,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* 1. Top Header: Trip Name & Overall Payment Badge */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.overallBadge,
            {
              backgroundColor: item.fullyAcceptedAndPayed
                ? colors.successBg
                : colors.langiBg,
              borderColor: item.fullyAcceptedAndPayed ? colors.success : colors.langi,
            },
          ]}
        >
          <Repeat
            size={12}
            color={item.fullyAcceptedAndPayed ? colors.success : colors.langi}
          />
          <Text
            style={[
              styles.overallBadgeText,
              {
                color: item.fullyAcceptedAndPayed ? colors.success : colors.langi,
                fontFamily: Typography.fontFamily.bold,
              },
            ]}
          >
            {item.fullyAcceptedAndPayed
              ? 'تایید کامل و پرداخت شده'
              : item.readyForPay
              ? 'آماده پرداخت مالی'
              : 'ثبت شده • منتظر اعلام فرایند'}
          </Text>
        </View>

        <Text
          style={[
            styles.creationTimeText,
            { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          ثبت: {toPersianDigits(item.creationTimePersian)}
        </Text>
      </View>

      {/* 2. Route & Original Driver Info */}
      <View style={styles.tripBox}>
        <Text
          style={[
            styles.tripTitle,
            { color: colors.text, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          {item.tripName}
        </Text>
        <Text
          style={[
            styles.originalDriverText,
            { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          راننده اصلی (غایب/معذور): {item.originalDriverName} • ساعت{' '}
          {toPersianDigits(item.scheduledTime)}
        </Text>
      </View>

      {/* 3. Substitute (Langi) Driver Identity & Financial Card */}
      <View
        style={[
          styles.langiDriverBox,
          {
            backgroundColor: isDark ? '#132B38' : '#F0FDFA',
            borderColor: colors.commandBorder,
          },
        ]}
      >
        <View style={styles.langiDriverTop}>
          <View style={styles.langiDriverNameRow}>
            <User size={15} color={colors.command} />
            <Text
              style={[
                styles.langiDriverName,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              راننده لنگی: {item.name} {item.family}
            </Text>
          </View>

          <Pressable
            onPress={() => Linking.openURL(`tel:${item.phoneNumber}`).catch(() => {})}
            style={[
              styles.callMiniBtn,
              {
                backgroundColor: colors.commandBg,
                borderColor: colors.command,
              },
            ]}
          >
            <Phone size={12} color={colors.command} />
            <Text
              style={[
                styles.callMiniText,
                { color: colors.command, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(item.phoneNumber)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.langiFinanceRow}>
          <View style={styles.financeItem}>
            <Banknote size={14} color={colors.gold} />
            <Text
              style={[
                styles.financeLabel,
                { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
              ]}
            >
              مبلغ توافقی:
            </Text>
            <Text
              style={[
                styles.financeValue,
                { color: colors.gold, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {formatNumberWithCommas(item.price)} تومان
            </Text>
          </View>

          <Text
            style={[
              styles.nationalCodeText,
              { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            کد ملی: {toPersianDigits(item.nationalCode)}
          </Text>
        </View>

        {/* Bank Account / Card Row */}
        <View style={styles.bankRow}>
          <CreditCard size={13} color={colors.textMuted} />
          <Text
            selectable
            style={[
              styles.bankText,
              { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {item.paymentType === 'shaba' && item.cardAccountNumber
              ? `شبا: IR ${format4DigitGroups(item.cardAccountNumber)}`
              : item.cardNumber
              ? `کارت: ${format4DigitGroups(item.cardNumber)}`
              : 'اطلاعات بانکی ثبت شده'}
          </Text>
        </View>

        <Text
          style={[
            styles.reasonLine,
            { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          علت جایگزینی: {item.reason}
        </Text>
      </View>

      {/* 4. Three-Step Approval Pipeline (فرآیند ۳ مرحله‌ای تایید لنگی) */}
      <View style={styles.pipelineSection}>
        <Text
          style={[
            styles.pipelineHeaderTitle,
            { color: colors.textSecondary, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          مراحل تایید و پرداخت لنگی:
        </Text>

        {renderStepNode(
          'مرحله ۱: ثبت و تایید سرشوفر خط',
          'تایید حضور راننده جایگزین در خط',
          item.step1
        )}
        {renderStepNode(
          'مرحله ۲: بررسی و تایید واحد ناوگان',
          'در انتظار بررسی کارشناس ناوگان',
          item.step2
        )}
        {renderStepNode(
          'مرحله ۳: تایید مالی و واریز وجه',
          'در صف صدور حواله بانکی',
          item.step3
        )}
      </View>

      {/* 5. Footer: Payment Tracking Code & Edit Action */}
      <View style={styles.footerRow}>
        {item.payCode ? (
          <View
            style={[
              styles.payCodeBadge,
              { backgroundColor: colors.successBg, borderColor: colors.success },
            ]}
          >
            <CheckCircle2 size={13} color={colors.success} />
            <Text
              selectable
              style={[
                styles.payCodeText,
                { color: colors.success, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              کد پیگیری پرداخت: {toPersianDigits(item.payCode)}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.pendingPayText,
              { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            کد پیگیری پرداخت پس از تایید مرحله ۳ صادر می‌شود
          </Text>
        )}

        <Pressable
          onPress={() => onEditPress(item)}
          style={({ pressed }) => [
            styles.editBtn,
            {
              backgroundColor: colors.langiBg,
              borderColor: colors.langi,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Edit3 size={13} color={colors.langi} />
          <Text
            style={[
              styles.editBtnText,
              { color: colors.langi, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            ویرایش درخواست
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  overallBadgeText: {
    fontSize: 11,
  },
  creationTimeText: {
    fontSize: 11,
  },
  tripBox: {
    alignItems: 'flex-end',
    gap: 3,
  },
  tripTitle: {
    fontSize: 14,
    textAlign: 'right',
  },
  originalDriverText: {
    fontSize: 11.5,
    textAlign: 'right',
  },
  langiDriverBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  langiDriverTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langiDriverNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  langiDriverName: {
    fontSize: 14,
  },
  callMiniBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  callMiniText: {
    fontSize: 11,
  },
  langiFinanceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  financeItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  financeLabel: {
    fontSize: 11.5,
  },
  financeValue: {
    fontSize: 13,
  },
  nationalCodeText: {
    fontSize: 11.5,
  },
  bankRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  bankText: {
    fontSize: 11.5,
    textAlign: 'right',
  },
  reasonLine: {
    fontSize: 11.5,
    textAlign: 'right',
  },
  pipelineSection: {
    gap: 7,
  },
  pipelineHeaderTitle: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 2,
  },
  stepCard: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  stepTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepRightTitle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  stepTitleText: {
    fontSize: 12,
  },
  stepStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  stepStatusText: {
    fontSize: 10,
  },
  stepReasonText: {
    fontSize: 11,
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  payCodeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  payCodeText: {
    fontSize: 11.5,
  },
  pendingPayText: {
    fontSize: 10.5,
    flex: 1,
    textAlign: 'right',
  },
  editBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 11.5,
  },
});
