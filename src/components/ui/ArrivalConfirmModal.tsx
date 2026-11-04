import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { triggerNotificationHaptic } from '@/utils/haptics';
import { DelayMinutesSelector } from './attendance/DelayMinutesSelector';
import {
  CheckCircle2,
  XCircle,
  X,
  Repeat,
  Clock,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, BorderRadius } from '@/constants/theme';
import { TodayDriverItem, ArrivalStatus } from '@/services/api/types';
import { toPersianDigits } from '@/utils/persian-digits';

interface ArrivalConfirmModalProps {
  visible: boolean;
  driverItem: TodayDriverItem | null;
  targetStatus: ArrivalStatus;
  onClose: () => void;
  onConfirm: (
    tripWorkCalendarId: string,
    status: ArrivalStatus,
    note: string,
    openLangiAfter: boolean,
    isDelayed?: boolean,
    delayMinutes?: number
  ) => Promise<void>;
}

const ARRIVED_PRESET_NOTES = [
  'حضور به موقع در ایستگاه مبدا',
  'آماده مسافرگیری و خودرو تمیز',
  'ورود با ۵ دقیقه تاخیر جزئی',
];

const ABSENT_PRESET_NOTES = [
  'عدم حضور در ایستگاه مبدا',
  'اعلام نقص فنی خودرو در مسیر',
  'عدم پاسخگویی به تماس سرشوفر',
  'تاخیر بیش از حد مجاز و نیاز به لنگی',
];

export function ArrivalConfirmModal({
  visible,
  driverItem,
  targetStatus,
  onClose,
  onConfirm,
}: ArrivalConfirmModalProps) {
  const { colors, isDark } = useAppTheme();
  const [note, setNote] = useState<string>('');
  const [openLangiAfter, setOpenLangiAfter] = useState<boolean>(false);
  const [isDelayed, setIsDelayed] = useState<boolean>(false);
  const [delayMinutes, setDelayMinutes] = useState<number>(10);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isArrived = targetStatus === 'arrived';
  const presets = isArrived ? ARRIVED_PRESET_NOTES : ABSENT_PRESET_NOTES;

  const initModalFields = () => {
    if (driverItem) {
      setNote(presets[0]);
      setOpenLangiAfter(!isArrived && !driverItem.hasLangi);
      setIsDelayed(false);
      setDelayMinutes(10);
    }
  };

  if (!driverItem) return null;

  const handleConfirmPress = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(
        driverItem.tripWorkCalendarId,
        targetStatus,
        note.trim(),
        openLangiAfter,
        isArrived ? isDelayed : false,
        isArrived && isDelayed ? delayMinutes : 0
      );
      await triggerNotificationHaptic(isArrived ? 'success' : 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = isArrived ? colors.success : colors.danger;
  const accentBg = isArrived ? colors.successBg : colors.dangerBg;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={initModalFields}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.card,
              borderColor: accentColor,
              shadowColor: colors.shadow,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerRight}>
              <View style={[styles.iconCircle, { backgroundColor: accentBg }]}>
                {isArrived ? (
                  <CheckCircle2 size={22} color={accentColor} />
                ) : (
                  <XCircle size={22} color={accentColor} />
                )}
              </View>
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {isArrived
                    ? 'تایید رسیدن راننده به خط'
                    : 'ثبت عدم حضور (نرسیدن) راننده'}
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color: colors.textSecondary,
                      fontFamily: Typography.fontFamily.medium,
                    },
                  ]}
                >
                  {driverItem.driverFullName} • {toPersianDigits(driverItem.licensePlate)}
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Quick Reason / Note Presets */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
              ]}
            >
              توضیح یا وضعیت حضور (انتخاب سریع یا تایپ):
            </Text>

            <View style={styles.chipsWrap}>
              {presets.map((preset) => {
                const selected = note === preset;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => setNote(preset)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: selected
                          ? accentBg
                          : isDark
                          ? '#071318'
                          : '#F1F5F9',
                        borderColor: selected ? accentColor : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        {
                          color: selected ? accentColor : colors.textSecondary,
                          fontFamily: selected
                            ? Typography.fontFamily.bold
                            : Typography.fontFamily.regular,
                        },
                      ]}
                    >
                      {preset}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="یادداشت تکمیلی سرشوفر..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.noteInput,
                {
                  backgroundColor: isDark ? '#071318' : '#F8FAFC',
                  borderColor: colors.border,
                  color: colors.text,
                  fontFamily: Typography.fontFamily.regular,
                },
              ]}
            />
          </View>

          {/* Delay Selection for Arrived Driver */}
          {isArrived && (
            <View style={styles.delayContainer}>
              <Pressable
                onPress={() => setIsDelayed(!isDelayed)}
                disabled={submitting}
                style={[
                  styles.delayToggleBox,
                  {
                    backgroundColor: isDelayed
                      ? isDark
                        ? 'rgba(245, 158, 11, 0.15)'
                        : '#FEF3C7'
                      : isDark
                      ? '#071318'
                      : '#F8FAFC',
                    borderColor: isDelayed ? '#F59E0B' : colors.border,
                  },
                ]}
              >
                <View style={styles.delayToggleRight}>
                  <Clock size={16} color={isDelayed ? '#F59E0B' : colors.textSecondary} />
                  <Text
                    style={[
                      styles.delayToggleText,
                      {
                        color: isDelayed ? '#F59E0B' : colors.text,
                        fontFamily: isDelayed
                          ? Typography.fontFamily.bold
                          : Typography.fontFamily.medium,
                      },
                    ]}
                  >
                    ثبت تأخیر برای ورود راننده
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggleIndicator,
                    {
                      backgroundColor: isDelayed ? '#F59E0B' : colors.card,
                      borderColor: isDelayed ? '#F59E0B' : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleIndicatorText,
                      {
                        color: isDelayed ? '#FFFFFF' : colors.textMuted,
                        fontFamily: Typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {isDelayed ? 'دارد' : 'ندارد'}
                  </Text>
                </View>
              </Pressable>

              {isDelayed && (
                <View style={{ marginTop: 8 }}>
                  <DelayMinutesSelector
                    delayMinutes={delayMinutes}
                    onChangeMinutes={setDelayMinutes}
                  />
                </View>
              )}
            </View>
          )}

          {/* Smart Langi Follow-up Toggle when driver did NOT arrive */}
          {!isArrived && (
            <View
              style={[
                styles.langiFollowupBox,
                {
                  backgroundColor: colors.langiBg,
                  borderColor: colors.langiBorder,
                },
              ]}
            >
              <View style={styles.langiFollowupTextCol}>
                <View style={styles.langiFollowupTitleRow}>
                  <Repeat size={14} color={colors.langi} />
                  <Text
                    style={[
                      styles.langiFollowupTitle,
                      { color: colors.langi, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    درخواست فوری راننده لنگی (جایگزین)
                  </Text>
                </View>
                <Text
                  style={[
                    styles.langiFollowupDesc,
                    {
                      color: colors.textSecondary,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                >
                  بلافاصله پس از ثبت عدم حضور، فرم ثبت راننده لنگی برای این سرویس باز شود
                </Text>
              </View>

              <Switch
                value={openLangiAfter}
                onValueChange={setOpenLangiAfter}
                trackColor={{ false: '#334155', true: colors.langi }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.footerBtns}>
            <Pressable
              onPress={handleConfirmPress}
              disabled={submitting}
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor: accentColor,
                  opacity: pressed || submitting ? 0.8 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator
                  size="small"
                  color={isArrived ? '#071318' : '#FFFFFF'}
                />
              ) : (
                <>
                  {isArrived ? (
                    <CheckCircle2 size={16} color="#071318" />
                  ) : (
                    <XCircle size={16} color="#FFFFFF" />
                  )}
                  <Text
                    style={[
                      styles.confirmBtnText,
                      {
                        color: isArrived ? '#071318' : '#FFFFFF',
                        fontFamily: Typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {isArrived
                      ? 'ثبت قطعی تأیید حضور راننده'
                      : openLangiAfter
                      ? 'ثبت عدم حضور + باز کردن فرم لنگی'
                      : 'ثبت قطعی عدم حضور راننده'}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#132B38' : '#E2E8F0',
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
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 10, 14, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    textAlign: 'right',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  gpsBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    alignItems: 'flex-end',
  },
  gpsBoxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  gpsBoxTitle: {
    fontSize: 12,
  },
  gpsLoadingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  gpsCoordsValue: {
    fontSize: 12,
    textAlign: 'right',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    textAlign: 'right',
  },
  chipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
  },
  noteInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlign: 'right',
  },
  delayContainer: {
    gap: 6,
  },
  delayToggleBox: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  delayToggleRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  delayToggleText: {
    fontSize: 13,
  },
  toggleIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  toggleIndicatorText: {
    fontSize: 11,
  },
  langiFollowupBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  langiFollowupTextCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
  },
  langiFollowupTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  langiFollowupTitle: {
    fontSize: 12.5,
  },
  langiFollowupDesc: {
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 17,
  },
  footerBtns: {
    gap: 8,
    marginTop: 4,
  },
  confirmBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 14,
  },
  cancelBtn: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
  },
});
