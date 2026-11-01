import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { triggerNotificationHaptic } from '@/utils/haptics';
import {
  Repeat,
  X,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Bus,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useSarshoofer } from '@/context/SarshooferContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TodayDriverItem, CreateLangiPayload } from '@/services/api/types';
import { normalizeDigits } from '@/utils/security';
import {
  toPersianDigits,
  formatNumberWithCommas,
  format4DigitGroups,
} from '@/utils/persian-digits';

interface LangiRequestModalProps {
  visible: boolean;
  preselectedDriver: TodayDriverItem | null;
  onClose: () => void;
}

const REASON_PRESETS = [
  'عدم حضور راننده اصلی در ایستگاه مبدا',
  'نقص فنی خودروی راننده اصلی',
  'مرخصی اضطراری راننده خط',
  'تاخیر بیش از حد مجاز و اعزام جایگزین',
];

export function LangiRequestModal({
  visible,
  preselectedDriver,
  onClose,
}: LangiRequestModalProps) {
  const { colors, isDark } = useAppTheme();
  const { drivers, savedShabas, savedCards, submitLangiRequest } = useSarshoofer();

  const [selectedTripCalendarId, setSelectedTripCalendarId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [family, setFamily] = useState<string>('');
  const [nationalCode, setNationalCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [priceStr, setPriceStr] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'shaba' | 'card'>('shaba');
  const [shabaNumber, setShabaNumber] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeDriverItem =
    drivers.find((d) => d.tripWorkCalendarId === selectedTripCalendarId) ||
    preselectedDriver ||
    drivers[0] ||
    null;

  const initFormFields = () => {
    setErrorMsg(null);

    const target = preselectedDriver || drivers[0] || null;
    if (!target) return;

    setSelectedTripCalendarId(target.tripWorkCalendarId);

    if (target.hasLangi && target.langi) {
      // Edit existing Langi mode
      const l = target.langi;
      setName(l.name);
      setFamily(l.family);
      setNationalCode(l.nationalCode);
      setPhoneNumber(l.phoneNumber);
      setPriceStr(String(l.price));
      setPaymentType(l.paymentType);
      setShabaNumber(l.cardAccountNumber || '');
      setCardNumber(l.cardNumber || '');
      setReason(l.reason || REASON_PRESETS[0]);
    } else {
      // New Langi request mode
      setName('');
      setFamily('');
      setNationalCode('');
      setPhoneNumber('');
      setPriceStr(String(target.price || 1500000));
      setPaymentType('shaba');
      setShabaNumber(savedShabas[0]?.value || '');
      setCardNumber(savedCards[0]?.value || '');
      setReason(REASON_PRESETS[0]);
    }
  };

  const handleSelectTrip = (item: TodayDriverItem) => {
    setSelectedTripCalendarId(item.tripWorkCalendarId);
    setPriceStr(String(item.price || 1500000));
    if (item.hasLangi && item.langi) {
      setName(item.langi.name);
      setFamily(item.langi.family);
      setNationalCode(item.langi.nationalCode);
      setPhoneNumber(item.langi.phoneNumber);
      setPaymentType(item.langi.paymentType);
      setShabaNumber(item.langi.cardAccountNumber || '');
      setCardNumber(item.langi.cardNumber || '');
      setReason(item.langi.reason);
    }
  };

  const handleSubmit = async () => {
    if (!activeDriverItem || submitting) return;
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('لطفاً نام راننده لنگی (جایگزین) را وارد کنید.');
      return;
    }
    if (!family.trim()) {
      setErrorMsg('لطفاً نام خانوادگی راننده لنگی را وارد کنید.');
      return;
    }

    const cleanNatCode = normalizeDigits(nationalCode).replace(/\D/g, '');
    if (cleanNatCode.length !== 10) {
      setErrorMsg('کد ملی راننده لنگی الزامی است و باید ۱۰ رقم باشد.');
      return;
    }

    const cleanPhone = normalizeDigits(phoneNumber).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('شماره موبایل راننده لنگی معتبر نیست.');
      return;
    }

    const cleanPrice = Number(normalizeDigits(priceStr).replace(/\D/g, ''));
    if (!cleanPrice || cleanPrice <= 0) {
      setErrorMsg('مبلغ توافقی سرویس الزامی است.');
      return;
    }

    const cleanShaba = normalizeDigits(shabaNumber).replace(/\D/g, '');
    const cleanCard = normalizeDigits(cardNumber).replace(/\D/g, '');

    if (paymentType === 'shaba' && cleanShaba.length !== 24) {
      setErrorMsg('شماره شبا باید ۲۴ رقم (بدون IR) باشد.');
      return;
    }
    if (paymentType === 'card' && cleanCard.length !== 16) {
      setErrorMsg('شماره کارت بانکی باید ۱۶ رقم باشد.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateLangiPayload = {
        tripWorkCalendarId: activeDriverItem.tripWorkCalendarId,
        tripId: activeDriverItem.tripId,
        tripName: activeDriverItem.tripName,
        serviceLocationTitle: activeDriverItem.serviceLocationTitle,
        scheduledTime: `${activeDriverItem.scheduledStartTime} - ${activeDriverItem.scheduledEndTime}`,
        originalDriverName: activeDriverItem.driverFullName,
        originalDriverPhone: activeDriverItem.driverPhone,
        name: name.trim(),
        family: family.trim(),
        nationalCode: cleanNatCode,
        phoneNumber: cleanPhone,
        price: cleanPrice,
        paymentType,
        cardAccountNumber: cleanShaba,
        cardNumber: cleanCard,
        reason: reason.trim() || REASON_PRESETS[0],
      };

      await submitLangiRequest(payload);
      await triggerNotificationHaptic('success');
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || 'خطا در ثبت درخواست لنگی');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={initFormFields}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.langiBorder,
            },
          ]}
        >
          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerRight}>
              <View
                style={[
                  styles.headerIconBox,
                  { backgroundColor: colors.langiBg, borderColor: colors.langi },
                ]}
              >
                <Repeat size={20} color={colors.langi} />
              </View>
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                <Text
                  style={[
                    styles.headerTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {activeDriverItem?.hasLangi
                    ? 'ویرایش اطلاعات راننده لنگی'
                    : 'ثبت درخواست راننده لنگی (جایگزین)'}
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    {
                      color: colors.textSecondary,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                >
                  تکمیل مشخصات راننده جایگزین جهت تایید ناوگان و واریز مالی
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollBody}
          >
            {/* Error Banner */}
            {errorMsg && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.dangerBg,
                    borderColor: colors.danger,
                  },
                ]}
              >
                <AlertTriangle size={16} color={colors.danger} />
                <Text
                  style={[
                    styles.errorBannerText,
                    { color: colors.danger, fontFamily: Typography.fontFamily.medium },
                  ]}
                >
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* 1. Trip / Service Selector (if not locked to a single preselected driver or if switching) */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                ۱. انتخاب سرویس و راننده اصلی امروز:
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tripSelectorRow}
              >
                {drivers.map((d) => {
                  const isSelected = d.tripWorkCalendarId === activeDriverItem?.tripWorkCalendarId;
                  return (
                    <Pressable
                      key={d.tripWorkCalendarId}
                      onPress={() => handleSelectTrip(d)}
                      style={[
                        styles.tripChip,
                        {
                          backgroundColor: isSelected
                            ? colors.langiBg
                            : isDark
                            ? '#071318'
                            : '#F8FAFC',
                          borderColor: isSelected ? colors.langi : colors.border,
                        },
                      ]}
                    >
                      <Bus
                        size={13}
                        color={isSelected ? colors.langi : colors.textMuted}
                      />
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.tripChipDriver,
                            {
                              color: isSelected ? colors.langi : colors.text,
                              fontFamily: Typography.fontFamily.bold,
                            },
                          ]}
                        >
                          {d.driverFullName} ({toPersianDigits(d.scheduledStartTime)})
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.tripChipRoute,
                            {
                              color: colors.textSecondary,
                              fontFamily: Typography.fontFamily.regular,
                            },
                          ]}
                        >
                          {d.tripName}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Substitute Driver Name & Family */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                  ]}
                >
                  نام راننده لنگی *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="مثال: محمد"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#071318' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.medium,
                    },
                  ]}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                  ]}
                >
                  نام خانوادگی *
                </Text>
                <TextInput
                  value={family}
                  onChangeText={setFamily}
                  placeholder="مثال: صادقی"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#071318' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.medium,
                    },
                  ]}
                />
              </View>
            </View>

            {/* 3. National Code & Phone Number */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                  ]}
                >
                  کد ملی (۱۰ رقم) *
                </Text>
                <TextInput
                  value={toPersianDigits(nationalCode)}
                  onChangeText={(val) =>
                    setNationalCode(normalizeDigits(val).replace(/\D/g, '').slice(0, 10))
                  }
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="۰۰۷۴۵۶۷۸۹۱"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#071318' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.bold,
                      textAlign: 'left',
                    },
                  ]}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                  ]}
                >
                  شماره همراه *
                </Text>
                <TextInput
                  value={toPersianDigits(phoneNumber)}
                  onChangeText={(val) =>
                    setPhoneNumber(normalizeDigits(val).replace(/\D/g, '').slice(0, 11))
                  }
                  keyboardType="phone-pad"
                  maxLength={11}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#071318' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.bold,
                      textAlign: 'left',
                    },
                  ]}
                />
              </View>
            </View>

            {/* 4. Agreed Price (Toman) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithHelper}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                  ]}
                >
                  مبلغ توافقی سرویس (تومان) *
                </Text>
                <Text
                  style={[
                    styles.priceHelper,
                    { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {formatNumberWithCommas(priceStr)} تومان
                </Text>
              </View>

              <TextInput
                value={formatNumberWithCommas(priceStr)}
                onChangeText={(val) =>
                  setPriceStr(normalizeDigits(val).replace(/\D/g, '').slice(0, 10))
                }
                keyboardType="number-pad"
                placeholder="۱,۵۰۰,۰۰۰"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#071318' : '#F8FAFC',
                    borderColor: colors.borderGold,
                    color: colors.gold,
                    fontFamily: Typography.fontFamily.bold,
                    textAlign: 'left',
                  },
                ]}
              />
            </View>

            {/* 5. Bank Payment Method: SHABA (24 digits) vs Card (16 digits) */}
            <View
              style={[
                styles.bankSectionBox,
                {
                  backgroundColor: isDark ? '#071318' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.bankTabsRow}>
                <Pressable
                  onPress={() => setPaymentType('shaba')}
                  style={[
                    styles.bankTabBtn,
                    {
                      backgroundColor:
                        paymentType === 'shaba' ? colors.commandBg : 'transparent',
                      borderColor:
                        paymentType === 'shaba' ? colors.command : colors.border,
                    },
                  ]}
                >
                  <CreditCard
                    size={14}
                    color={paymentType === 'shaba' ? colors.command : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.bankTabText,
                      {
                        color:
                          paymentType === 'shaba' ? colors.command : colors.textSecondary,
                        fontFamily: Typography.fontFamily.bold,
                      },
                    ]}
                  >
                    شماره شبا (۲۴ رقم)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentType('card')}
                  style={[
                    styles.bankTabBtn,
                    {
                      backgroundColor:
                        paymentType === 'card' ? colors.commandBg : 'transparent',
                      borderColor:
                        paymentType === 'card' ? colors.command : colors.border,
                    },
                  ]}
                >
                  <CreditCard
                    size={14}
                    color={paymentType === 'card' ? colors.command : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.bankTabText,
                      {
                        color:
                          paymentType === 'card' ? colors.command : colors.textSecondary,
                        fontFamily: Typography.fontFamily.bold,
                      },
                    ]}
                  >
                    شماره کارت (۱۶ رقم)
                  </Text>
                </Pressable>
              </View>

              {paymentType === 'shaba' ? (
                <View style={{ gap: 8 }}>
                  {savedShabas.length > 0 && (
                    <View style={styles.savedBankChips}>
                      {savedShabas.map((s) => (
                        <Pressable
                          key={s.value}
                          onPress={() => setShabaNumber(s.value)}
                          style={[
                            styles.savedBankChip,
                            {
                              backgroundColor:
                                shabaNumber === s.value
                                  ? colors.commandBg
                                  : colors.card,
                              borderColor:
                                shabaNumber === s.value ? colors.command : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.savedBankChipText,
                              {
                                color:
                                  shabaNumber === s.value
                                    ? colors.command
                                    : colors.textSecondary,
                                fontFamily: Typography.fontFamily.medium,
                              },
                            ]}
                          >
                            {s.ownerName}: IR{toPersianDigits(s.value.slice(0, 6))}...
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <TextInput
                    value={format4DigitGroups(shabaNumber)}
                    onChangeText={(val) =>
                      setShabaNumber(normalizeDigits(val).replace(/\D/g, '').slice(0, 24))
                    }
                    keyboardType="number-pad"
                    placeholder="۱۲۰۱ ۷۰۰۰ ۰۰۰۰ ۰۱۲۳ ۴۵۶۷ ۸۹۰۱"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                        fontFamily: Typography.fontFamily.bold,
                        textAlign: 'left',
                      },
                    ]}
                  />
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {savedCards.length > 0 && (
                    <View style={styles.savedBankChips}>
                      {savedCards.map((c) => (
                        <Pressable
                          key={c.value}
                          onPress={() => setCardNumber(c.value)}
                          style={[
                            styles.savedBankChip,
                            {
                              backgroundColor:
                                cardNumber === c.value ? colors.commandBg : colors.card,
                              borderColor:
                                cardNumber === c.value ? colors.command : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.savedBankChipText,
                              {
                                color:
                                  cardNumber === c.value
                                    ? colors.command
                                    : colors.textSecondary,
                                fontFamily: Typography.fontFamily.medium,
                              },
                            ]}
                          >
                            {c.ownerName}: {toPersianDigits(c.value.slice(0, 4))}...
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <TextInput
                    value={format4DigitGroups(cardNumber)}
                    onChangeText={(val) =>
                      setCardNumber(normalizeDigits(val).replace(/\D/g, '').slice(0, 16))
                    }
                    keyboardType="number-pad"
                    placeholder="۶۰۳۷ ۹۹۷۱ ۲۳۴۵ ۸۸۹۹"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                        fontFamily: Typography.fontFamily.bold,
                        textAlign: 'left',
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* 6. Reason for Langi */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                علت ثبت لنگی:
              </Text>
              <View style={styles.reasonChipsWrap}>
                {REASON_PRESETS.map((r) => {
                  const selected = reason === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setReason(r)}
                      style={[
                        styles.reasonChip,
                        {
                          backgroundColor: selected
                            ? colors.langiBg
                            : isDark
                            ? '#071318'
                            : '#F8FAFC',
                          borderColor: selected ? colors.langi : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.reasonChipText,
                          {
                            color: selected ? colors.langi : colors.textSecondary,
                            fontFamily: selected
                              ? Typography.fontFamily.bold
                              : Typography.fontFamily.regular,
                          },
                        ]}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="توضیح علت جایگزینی راننده..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#071318' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.text,
                    fontFamily: Typography.fontFamily.regular,
                  },
                ]}
              />
            </View>
          </ScrollView>

          {/* Sticky Submit Footer */}
          <View style={styles.footerBar}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: colors.langi,
                  opacity: pressed || submitting ? 0.8 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#071318" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#071318" />
                  <Text
                    style={[
                      styles.submitBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    {activeDriverItem?.hasLangi
                      ? 'ذخیره تغییرات راننده لنگی'
                      : 'ثبت نهایی درخواست لنگی'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 10, 14, 0.82)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 2,
    maxHeight: '92%',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15.5,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 11.5,
    textAlign: 'right',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingVertical: 14,
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  errorBannerText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    textAlign: 'right',
  },
  labelWithHelper: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceHelper: {
    fontSize: 12,
  },
  tripSelectorRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 2,
  },
  tripChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxWidth: 230,
  },
  tripChipDriver: {
    fontSize: 12,
  },
  tripChipRoute: {
    fontSize: 10.5,
  },
  twoColRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  input: {
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
    textAlign: 'right',
  },
  bankSectionBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  bankTabsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  bankTabBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  bankTabText: {
    fontSize: 12,
  },
  savedBankChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  savedBankChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  savedBankChipText: {
    fontSize: 10.5,
  },
  reasonChipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  reasonChipText: {
    fontSize: 11,
  },
  footerBar: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  submitBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 14.5,
    color: '#071318',
  },
});
