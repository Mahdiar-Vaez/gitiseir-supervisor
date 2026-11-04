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
  UserX,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useSarshoofer } from '@/context/SarshooferContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TodayDriverItem, CreateLangiPayload } from '@/services/api/types';
import {
  toPersianDigits,
  sanitizeDigitsInput,
  formatPhoneForApi,
  formatNationalCodeForApi,
  formatBankNumberForApi,
  formatPriceForApi,
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

function extractEditableLangiName(target: TodayDriverItem | null): {
  firstName: string;
  lastName: string;
} {
  if (!target?.hasLangi || !target.langi) {
    return { firstName: '', lastName: '' };
  }
  const rawName = (target.langi.name || '').trim();
  const rawFamily = (target.langi.family || '').trim();
  const plannedFull = (
    target.plannedDriverFullName ||
    target.driverFullName ||
    ''
  ).trim();
  const combined = `${rawName} ${rawFamily}`.trim();

  if (
    !rawName ||
    rawName === 'راننده موقت' ||
    rawName === 'راننده موقت (لنگی)' ||
    combined === 'راننده موقت' ||
    combined === 'راننده موقت (لنگی)' ||
    (plannedFull && combined === plannedFull) ||
    (plannedFull && rawName === plannedFull)
  ) {
    return { firstName: '', lastName: '' };
  }

  return { firstName: rawName, lastName: rawFamily };
}

export function LangiRequestModal({
  visible,
  preselectedDriver,
  onClose,
}: LangiRequestModalProps) {
  const { colors, isDark } = useAppTheme();
  const { drivers, savedShabas, savedCards, submitLangiRequest } = useSarshoofer();

  const initialTarget = preselectedDriver || drivers[0] || null;
  const initialLangi =
    initialTarget?.hasLangi && initialTarget?.langi ? initialTarget.langi : null;
  const initialNames = extractEditableLangiName(initialTarget);

  const [selectedTripCalendarId, setSelectedTripCalendarId] = useState<string>(
    initialTarget?.tripWorkCalendarId || ''
  );
  const [name, setName] = useState<string>(initialNames.firstName);
  const [family, setFamily] = useState<string>(initialNames.lastName);
  const [nationalCode, setNationalCode] = useState<string>(
    sanitizeDigitsInput(initialLangi?.nationalCode || '', 10)
  );
  const [phoneNumber, setPhoneNumber] = useState<string>(
    sanitizeDigitsInput(initialLangi?.phoneNumber || '', 11)
  );
  const [priceStr, setPriceStr] = useState<string>(
    sanitizeDigitsInput(
      initialLangi?.price ?? initialTarget?.price ?? 1500000,
      12
    ) || '1500000'
  );
  const [paymentType, setPaymentType] = useState<'card' | 'shaba'>(
    initialLangi?.paymentType || 'card'
  );
  const [cardNumber, setCardNumber] = useState<string>(
    sanitizeDigitsInput(
      initialLangi?.cardNumber || savedCards[0]?.value || '',
      16
    )
  );
  const [shabaNumber, setShabaNumber] = useState<string>(
    sanitizeDigitsInput(
      initialLangi?.cardAccountNumber || savedShabas[0]?.value || '',
      24
    )
  );
  const [reason, setReason] = useState<string>(
    initialLangi?.reason || REASON_PRESETS[0]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeDriverItem =
    drivers.find((d) => d.tripWorkCalendarId === selectedTripCalendarId) ||
    preselectedDriver ||
    drivers[0] ||
    null;

  const handleSelectTrip = (item: TodayDriverItem) => {
    setSelectedTripCalendarId(item.tripWorkCalendarId);
    if (item.price && item.price > 0) {
      setPriceStr(sanitizeDigitsInput(item.price, 12));
    }
    if (item.hasLangi && item.langi) {
      const editableNames = extractEditableLangiName(item);
      if (editableNames.firstName) setName(editableNames.firstName);
      if (editableNames.lastName) setFamily(editableNames.lastName);
      if (item.langi.nationalCode) {
        setNationalCode(sanitizeDigitsInput(item.langi.nationalCode, 10));
      }
      if (item.langi.phoneNumber) {
        setPhoneNumber(sanitizeDigitsInput(item.langi.phoneNumber, 11));
      }
      if (item.langi.cardNumber) {
        setCardNumber(sanitizeDigitsInput(item.langi.cardNumber, 16));
      }
      if (item.langi.cardAccountNumber) {
        setShabaNumber(sanitizeDigitsInput(item.langi.cardAccountNumber, 24));
      }
      if (item.langi.reason) {
        setReason(item.langi.reason);
      }
    }
  };

  const handleSubmit = async () => {
    if (!activeDriverItem || submitting) return;
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedFamily = family.trim();

    if (!trimmedName) {
      setErrorMsg('لطفاً نام راننده لنگی (جایگزین) را وارد کنید.');
      return;
    }
    if (!trimmedFamily) {
      setErrorMsg('لطفاً نام خانوادگی راننده لنگی را وارد کنید.');
      return;
    }

    const cleanNatCode = formatNationalCodeForApi(nationalCode);
    if (cleanNatCode.length !== 10) {
      setErrorMsg('کد ملی راننده لنگی باید دقیقاً ۱۰ رقم باشد.');
      return;
    }

    const cleanPhone = formatPhoneForApi(phoneNumber);
    if (cleanPhone.length < 10) {
      setErrorMsg('شماره موبایل راننده لنگی معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }

    const cleanPrice = formatPriceForApi(priceStr);
    if (!cleanPrice || cleanPrice <= 0) {
      setErrorMsg('لطفاً مبلغ توافقی سرویس را به صورت عدد وارد کنید.');
      return;
    }

    const rawCardDigits = formatBankNumberForApi(cardNumber, 24);
    const rawShabaDigits = formatBankNumberForApi(shabaNumber, 24);

    let finalCardNumber = '';
    let finalAccountNumber = '';
    let resolvedPaymentType: 'card' | 'shaba' = paymentType;

    if (paymentType === 'card') {
      if (rawCardDigits.length === 16) {
        finalCardNumber = rawCardDigits;
        finalAccountNumber = rawShabaDigits.length === 24 ? rawShabaDigits : rawCardDigits;
      } else if (rawShabaDigits.length === 24) {
        resolvedPaymentType = 'shaba';
        finalAccountNumber = rawShabaDigits;
        finalCardNumber = rawShabaDigits.slice(0, 16);
      } else {
        setErrorMsg('لطفاً شماره کارت ۱۶ رقمی راننده لنگی را به صورت کامل وارد کنید.');
        return;
      }
    } else {
      if (rawShabaDigits.length === 24) {
        finalAccountNumber = rawShabaDigits;
        finalCardNumber =
          rawCardDigits.length === 16 ? rawCardDigits : rawShabaDigits.slice(0, 16);
      } else if (rawShabaDigits.length === 16) {
        resolvedPaymentType = 'card';
        finalCardNumber = rawShabaDigits;
        finalAccountNumber = rawShabaDigits;
      } else if (rawCardDigits.length === 16) {
        resolvedPaymentType = 'card';
        finalCardNumber = rawCardDigits;
        finalAccountNumber = rawCardDigits;
      } else {
        setErrorMsg(
          'لطفاً شماره شبا (۲۴ رقم بدون IR) یا در تب شماره کارت، شماره کارت ۱۶ رقمی را وارد کنید.'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: CreateLangiPayload = {
        tripWorkCalendarId: activeDriverItem.tripWorkCalendarId,
        tripId: activeDriverItem.tripId,
        tripName: activeDriverItem.tripName,
        serviceLocationTitle: activeDriverItem.serviceLocationTitle,
        scheduledTime: `${activeDriverItem.scheduledStartTime} - ${activeDriverItem.scheduledEndTime}`,
        originalDriverName:
          activeDriverItem.plannedDriverFullName || activeDriverItem.driverFullName,
        originalDriverPhone:
          activeDriverItem.plannedDriverMobile || activeDriverItem.driverPhone,
        name: trimmedName,
        family: trimmedFamily,
        nationalCode: cleanNatCode,
        phoneNumber: cleanPhone,
        price: cleanPrice,
        paymentType: resolvedPaymentType,
        cardAccountNumber: finalAccountNumber,
        cardNumber: finalCardNumber,
        reason: reason.trim() || REASON_PRESETS[0],
      };

      await submitLangiRequest(payload);
      await triggerNotificationHaptic('success');
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || 'خطا در ثبت درخواست راننده لنگی در سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const absentMainDriverName =
    activeDriverItem?.plannedDriverFullName ||
    activeDriverItem?.driverFullName ||
    'نامشخص';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
                  مشخصات راننده جایگزین را وارد کنید تا در سرویس امروز ثبت شود
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

            {/* 1. Target Service & Absent Main Driver Summary Banner */}
            {activeDriverItem && (
              <View
                style={[
                  styles.selectedServiceBanner,
                  {
                    backgroundColor: isDark ? '#071318' : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.selectedServiceRow}>
                  <Bus size={15} color={colors.gold} />
                  <Text
                    style={[
                      styles.selectedServiceTitle,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    سرویس: {activeDriverItem.tripName} (ساعت{' '}
                    {toPersianDigits(activeDriverItem.scheduledStartTime)})
                  </Text>
                </View>
                <View style={styles.selectedServiceRow}>
                  <UserX size={14} color={colors.danger} />
                  <Text
                    style={[
                      styles.absentDriverText,
                      {
                        color: colors.textSecondary,
                        fontFamily: Typography.fontFamily.medium,
                      },
                    ]}
                  >
                    جایگزین برای راننده اصلی غایب:{' '}
                    <Text
                      style={{
                        color: colors.danger,
                        fontFamily: Typography.fontFamily.bold,
                      }}
                    >
                      {absentMainDriverName}
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Trip switcher only if opened without a specific card preselected */}
            {!preselectedDriver && drivers.length > 1 && (
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  تغییر سرویس مورد نظر:
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tripSelectorRow}
                >
                  {drivers.map((d) => {
                    const isSelected =
                      d.tripWorkCalendarId === activeDriverItem?.tripWorkCalendarId;
                    return (
                      <Pressable
                        key={d.tripWorkCalendarId}
                        onPress={() => handleSelectTrip(d)}
                        style={[
                          styles.tripChip,
                          {
                            backgroundColor: isSelected
                              ? colors.commandBg
                              : isDark
                              ? '#071318'
                              : '#F8FAFC',
                            borderColor: isSelected ? colors.command : colors.border,
                          },
                        ]}
                      >
                        <Bus
                          size={13}
                          color={isSelected ? colors.command : colors.textMuted}
                        />
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.tripChipDriver,
                              {
                                color: isSelected ? colors.command : colors.text,
                                fontFamily: Typography.fontFamily.bold,
                              },
                            ]}
                          >
                            {d.tripName} ({toPersianDigits(d.scheduledStartTime)})
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
                            راننده خط: {d.plannedDriverFullName || d.driverFullName}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Section Title for New Substitute Driver */}
            <Text
              style={[
                styles.sectionDividerTitle,
                { color: colors.langi, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              مشخصات راننده لنگی (جایگزین جدید):
            </Text>

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
                  placeholder="مثال: رضا"
                  placeholderTextColor={colors.textMuted}
                  autoCorrect={false}
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
                  نام خانوادگی لنگی *
                </Text>
                <TextInput
                  value={family}
                  onChangeText={setFamily}
                  placeholder="مثال: محمدی"
                  placeholderTextColor={colors.textMuted}
                  autoCorrect={false}
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
                <View style={styles.labelWithHelper}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                    ]}
                  >
                    کد ملی (۱۰ رقم) *
                  </Text>
                  <Text
                    style={[
                      styles.digitCountHelper,
                      {
                        color:
                          nationalCode.length === 10
                            ? colors.success
                            : colors.textMuted,
                        fontFamily: Typography.fontFamily.regular,
                      },
                    ]}
                  >
                    {toPersianDigits(nationalCode.length)}/۱۰
                  </Text>
                </View>
                <TextInput
                  value={nationalCode}
                  onChangeText={(val) => setNationalCode(sanitizeDigitsInput(val, 10))}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholder="0012345678"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#071318' : '#F8FAFC',
                      borderColor:
                        nationalCode.length === 10 ? colors.success : colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.bold,
                    },
                  ]}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithHelper}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                    ]}
                  >
                    شماره همراه *
                  </Text>
                  <Text
                    style={[
                      styles.digitCountHelper,
                      {
                        color:
                          phoneNumber.length >= 10
                            ? colors.success
                            : colors.textMuted,
                        fontFamily: Typography.fontFamily.regular,
                      },
                    ]}
                  >
                    {toPersianDigits(phoneNumber.length)}/۱۱
                  </Text>
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={(val) => setPhoneNumber(sanitizeDigitsInput(val, 11))}
                  keyboardType="phone-pad"
                  maxLength={11}
                  placeholder="09123456789"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#071318' : '#F8FAFC',
                      borderColor:
                        phoneNumber.length >= 10 ? colors.success : colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.bold,
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
                value={priceStr}
                onChangeText={(val) => setPriceStr(sanitizeDigitsInput(val, 12))}
                keyboardType="numeric"
                maxLength={12}
                placeholder="1500000"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#071318' : '#F8FAFC',
                    borderColor: colors.borderGold,
                    color: colors.gold,
                    fontFamily: Typography.fontFamily.bold,
                  },
                ]}
              />
            </View>

            {/* 5. Bank Payment Method: Card (16 digits - Default) vs SHABA (24 digits) */}
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
              </View>

              {paymentType === 'card' ? (
                <View style={{ gap: 6 }}>
                  {savedCards.length > 0 && (
                    <View style={styles.savedBankChips}>
                      {savedCards.map((c) => (
                        <Pressable
                          key={c.value}
                          onPress={() => setCardNumber(sanitizeDigitsInput(c.value, 16))}
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

                  <View style={styles.labelWithHelper}>
                    <Text
                      style={[
                        styles.digitCountHelper,
                        { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
                      ]}
                    >
                      شماره کارت ۱۶ رقمی (بدون خط تیره):
                    </Text>
                    <Text
                      style={[
                        styles.digitCountHelper,
                        {
                          color:
                            cardNumber.length === 16 ? colors.success : colors.textMuted,
                          fontFamily: Typography.fontFamily.bold,
                        },
                      ]}
                    >
                      {toPersianDigits(cardNumber.length)} / ۱۶ رقم
                    </Text>
                  </View>

                  <TextInput
                    value={cardNumber}
                    onChangeText={(val) => setCardNumber(sanitizeDigitsInput(val, 16))}
                    keyboardType="numeric"
                    maxLength={16}
                    placeholder="مثال: 6037991122334455"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor:
                          cardNumber.length === 16 ? colors.success : colors.border,
                        color: colors.text,
                        fontFamily: Typography.fontFamily.bold,
                      },
                    ]}
                  />

                  {cardNumber.length > 0 && (
                    <Text
                      style={[
                        styles.formattedBankPreview,
                        { color: colors.command, fontFamily: Typography.fontFamily.medium },
                      ]}
                    >
                      نمایش چهاررقمی: {format4DigitGroups(cardNumber)}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={{ gap: 6 }}>
                  {savedShabas.length > 0 && (
                    <View style={styles.savedBankChips}>
                      {savedShabas.map((s) => (
                        <Pressable
                          key={s.value}
                          onPress={() => setShabaNumber(sanitizeDigitsInput(s.value, 24))}
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

                  <View style={styles.labelWithHelper}>
                    <Text
                      style={[
                        styles.digitCountHelper,
                        { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
                      ]}
                    >
                      شماره شبا ۲۴ رقمی (بدون IR):
                    </Text>
                    <Text
                      style={[
                        styles.digitCountHelper,
                        {
                          color:
                            shabaNumber.length === 24 ? colors.success : colors.textMuted,
                          fontFamily: Typography.fontFamily.bold,
                        },
                      ]}
                    >
                      {toPersianDigits(shabaNumber.length)} / ۲۴ رقم
                    </Text>
                  </View>

                  <TextInput
                    value={shabaNumber}
                    onChangeText={(val) => setShabaNumber(sanitizeDigitsInput(val, 24))}
                    keyboardType="numeric"
                    maxLength={24}
                    placeholder="مثال: 120170000000012345678901"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.card,
                        borderColor:
                          shabaNumber.length === 24 ? colors.success : colors.border,
                        color: colors.text,
                        fontFamily: Typography.fontFamily.bold,
                      },
                    ]}
                  />

                  {shabaNumber.length > 0 && (
                    <Text
                      style={[
                        styles.formattedBankPreview,
                        { color: colors.command, fontFamily: Typography.fontFamily.medium },
                      ]}
                    >
                      IR {format4DigitGroups(shabaNumber)}
                    </Text>
                  )}
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
  selectedServiceBanner: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  selectedServiceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  selectedServiceTitle: {
    fontSize: 13,
    textAlign: 'right',
    flex: 1,
  },
  absentDriverText: {
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
  },
  sectionDividerTitle: {
    fontSize: 13,
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
  digitCountHelper: {
    fontSize: 11,
  },
  priceHelper: {
    fontSize: 12,
  },
  formattedBankPreview: {
    fontSize: 11.5,
    textAlign: 'left',
    paddingHorizontal: 4,
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
