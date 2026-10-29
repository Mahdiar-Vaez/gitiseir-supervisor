import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits, toEnglishDigits } from '@/utils/persian-digits';
import { assignTemporaryDriverApi } from '@/services/api/supervisor';
import { TemporaryDriverInfo } from '@/services/api/types';
import {
  X,
  UserPlus,
  User,
  Phone,
  CreditCard,
  Coins,
  FileWarning,
  CheckCircle2,
  Hash,
} from 'lucide-react-native';

interface AssignTempDriverModalProps {
  visible: boolean;
  calendarDayId: string | null;
  tripId?: number | null;
  tripName?: string;
  mainDriverName?: string;
  defaultPrice?: number | null;
  existingTempDriver?: TemporaryDriverInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_REASONS = [
  'خرابی فنی خودروی راننده اصلی',
  'مرخصی روزانه راننده اصلی',
  'تأخیر یا عدم حضور راننده در مبدأ',
];

export function AssignTempDriverModal({
  visible,
  calendarDayId,
  tripId,
  tripName,
  mainDriverName,
  defaultPrice,
  existingTempDriver,
  onClose,
  onSuccess,
}: AssignTempDriverModalProps) {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();

  const [name, setName] = useState<string>('');
  const [family, setFamily] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [nationalCode, setNationalCode] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [price, setPrice] = useState<string>(String(defaultPrice ?? 1000000));
  const [reason, setReason] = useState<string>('خرابی فنی خودروی راننده اصلی');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const initFormFields = () => {
    setErrorText(null);
    if (existingTempDriver) {
      setName(existingTempDriver.name || '');
      setFamily(existingTempDriver.family || '');
      setPhoneNumber(existingTempDriver.phoneNumber || '');
      setNationalCode(existingTempDriver.nationalCode || '');
      setCardNumber(existingTempDriver.cardNumber || '');
      setReason(existingTempDriver.reason || 'خرابی فنی خودروی راننده اصلی');
      setPrice(
        String(existingTempDriver.price ?? defaultPrice ?? 1000000)
      );
    } else {
      setName('');
      setFamily('');
      setPhoneNumber('');
      setNationalCode('');
      setCardNumber('');
      setReason('خرابی فنی خودروی راننده اصلی');
      setPrice(String(defaultPrice ?? 1000000));
    }
  };

  if (!visible || !calendarDayId) return null;

  const handleSubmit = async () => {
    setErrorText(null);

    const cleanPhone = toEnglishDigits(phoneNumber).replace(/\D/g, '');
    const cleanNational = toEnglishDigits(nationalCode).replace(/\D/g, '');
    const cleanCard = toEnglishDigits(cardNumber).replace(/\D/g, '');
    const cleanPrice = Number(toEnglishDigits(price).replace(/\D/g, '')) || 0;

    if (!name.trim() || !family.trim()) {
      setErrorText('لطفاً نام و نام خانوادگی راننده جایگزین را وارد کنید.');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorText('شماره موبایل راننده جایگزین معتبر نیست (مثال: 09123456789).');
      return;
    }
    if (cleanNational.length !== 10) {
      setErrorText('کد ملی باید دقیقاً ۱۰ رقم عددی باشد.');
      return;
    }
    if (cleanCard.length > 0 && cleanCard.length !== 16) {
      setErrorText('شماره کارت بانکی باید ۱۶ رقم باشد.');
      return;
    }
    if (cleanPrice <= 0) {
      setErrorText('مبلغ کرایه سرویس را به درستی وارد نمایید.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await assignTemporaryDriverApi(
        {
          calendarDayId,
          name: name.trim(),
          family: family.trim(),
          phoneNumber: cleanPhone,
          nationalCode: cleanNational,
          cardNumber: cleanCard,
          reason: reason.trim() || 'جایگزینی توسط سرشوفر',
          price: cleanPrice,
        },
        token
      );

      Alert.alert(
        'ثبت راننده موقت (لنگی)',
        res?.message || 'راننده جایگزین با موفقیت برای این روز کاری ثبت شد.'
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorText(err?.message || 'خطا در ثبت راننده موقت در سرور.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={initFormFields}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: colors.borderGold,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: colors.border,
                },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.titleRow}>
              <View style={styles.titleTextCol}>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  تعیین راننده موقت (لنگی)
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                  ]}
                >
                  همگام‌سازی مستقیم با تقویم کاری و اجرای سفر
                </Text>
              </View>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: 'rgba(245, 158, 11, 0.14)' },
                ]}
              >
                <UserPlus size={20} color="#F59E0B" />
              </View>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Context Summary Banner */}
            <View
              style={[
                styles.contextBanner,
                {
                  backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.contextRow}>
                <Text
                  style={[
                    styles.contextValue,
                    { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {tripName || 'سرویس انتخابی'}
                  {tripId ? ` (کد ${toPersianDigits(tripId)})` : ''}
                </Text>
                <Text
                  style={[
                    styles.contextLabel,
                    { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                  ]}
                >
                  سرویس تقویم:
                </Text>
              </View>

              {mainDriverName ? (
                <View style={styles.contextRow}>
                  <Text
                    style={[
                      styles.contextValue,
                      { color: colors.text, fontFamily: Typography.fontFamily.medium },
                    ]}
                  >
                    {mainDriverName}
                  </Text>
                  <Text
                    style={[
                      styles.contextLabel,
                      { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                    ]}
                  >
                    راننده اصلی:
                  </Text>
                </View>
              ) : null}
            </View>

            {errorText ? (
              <View style={styles.errorBanner}>
                <Text
                  style={[
                    styles.errorText,
                    { fontFamily: Typography.fontFamily.medium },
                  ]}
                >
                  {errorText}
                </Text>
              </View>
            ) : null}

            {/* Row 1: Name & Family */}
            <View style={styles.twoColRow}>
              <View style={styles.colField}>
                <View style={styles.labelRow}>
                  <User size={13} color={colors.gold} />
                  <Text
                    style={[
                      styles.label,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    نام خانوادگی *
                  </Text>
                </View>
                <TextInput
                  value={family}
                  onChangeText={setFamily}
                  placeholder="مثلاً: محمدی"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                />
              </View>

              <View style={styles.colField}>
                <View style={styles.labelRow}>
                  <User size={13} color={colors.gold} />
                  <Text
                    style={[
                      styles.label,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    نام *
                  </Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="مثلاً: رضا"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Row 2: Phone & National Code */}
            <View style={styles.twoColRow}>
              <View style={styles.colField}>
                <View style={styles.labelRow}>
                  <Hash size={13} color={colors.gold} />
                  <Text
                    style={[
                      styles.label,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    کد ملی (۱۰ رقم) *
                  </Text>
                </View>
                <TextInput
                  value={nationalCode}
                  onChangeText={setNationalCode}
                  placeholder="0012345678"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={10}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                />
              </View>

              <View style={styles.colField}>
                <View style={styles.labelRow}>
                  <Phone size={13} color={colors.gold} />
                  <Text
                    style={[
                      styles.label,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    شماره موبایل *
                  </Text>
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="09123456789"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={11}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Row 3: Card Number & Price */}
            <View style={styles.twoColRow}>
              <View style={styles.colField}>
                <View style={styles.labelRow}>
                  <Coins size={13} color={colors.gold} />
                  <Text
                    style={[
                      styles.label,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    مبلغ کرایه (ریال) *
                  </Text>
                </View>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="1000000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.gold,
                      fontFamily: Typography.fontFamily.bold,
                    },
                  ]}
                />
              </View>

              <View style={styles.colField}>
                <View style={styles.labelRow}>
                  <CreditCard size={13} color={colors.gold} />
                  <Text
                    style={[
                      styles.label,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    شماره کارت (۱۶ رقم)
                  </Text>
                </View>
                <TextInput
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="6037991122334455"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={16}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Reason */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <FileWarning size={13} color={colors.gold} />
                <Text
                  style={[
                    styles.label,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  علت تعیین راننده جایگزین (Reason) *
                </Text>
              </View>

              <View style={styles.quickWrap}>
                {QUICK_REASONS.map((r) => {
                  const active = reason === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setReason(r)}
                      style={[
                        styles.quickChip,
                        {
                          backgroundColor: active
                            ? colors.goldBg
                            : isDark
                            ? '#1E293B'
                            : '#F1F5F9',
                          borderColor: active ? colors.gold : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickChipText,
                          {
                            color: active ? colors.gold : colors.textSecondary,
                            fontFamily: active
                              ? Typography.fontFamily.bold
                              : Typography.fontFamily.regular,
                          },
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="علت جایگزینی راننده..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.text,
                    fontFamily: Typography.fontFamily.regular,
                  },
                ]}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.gold,
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#090D16" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#090D16" />
                  <Text
                    style={[
                      styles.submitBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    ثبت نهایی راننده لنگی
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: colors.text, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                انصراف
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleTextCol: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    gap: 10,
    paddingVertical: 4,
  },
  contextBanner: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 11,
  },
  contextValue: {
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11.5,
    textAlign: 'right',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colField: {
    flex: 1,
    gap: 5,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 12.5,
    textAlign: 'right',
  },
  quickWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 5,
  },
  quickChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 10.5,
  },
  footer: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
  },
  submitBtn: {
    flex: 2,
    height: 44,
    borderRadius: BorderRadius.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnText: {
    color: '#090D16',
    fontSize: 13,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12.5,
  },
});
