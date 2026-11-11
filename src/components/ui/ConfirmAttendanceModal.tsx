import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import {
  confirmAttendanceApi,
  markDriverAbsentApi,
} from '@/services/api/supervisor';
import { DayTripGridItem } from '@/services/api/types';
import { DelayMinutesSelector } from './attendance/DelayMinutesSelector';
import {
  X,
  CheckCircle2,
  UserCheck,
  UserX,
  FileText,
  Clock,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react-native';

export type AttendanceModalMode = 'confirm' | 'absent';

interface ConfirmAttendanceModalProps {
  visible: boolean;
  calendarDayId: string | null;
  tripId?: number | null;
  tripName?: string;
  driverName?: string;
  tripTime?: string;
  selectedDateLabel?: string;
  dayTrips?: DayTripGridItem[];
  onClose: () => void;
  onSuccess?: () => void;
  onDriverMarkedAbsent?: (calendarDayId: string) => void;
}

const QUICK_NOTES = [
  'حضور به‌موقع در مبدأ سرویس',
  'تأیید حضور و آمادگی کامل خودرو',
  'تأیید سفر جامانده (فراموشی ثبت توسط راننده)',
  'حضور با هماهنگی سرشوفر خط',
];

const QUICK_ABSENT_REASONS = [
  'عدم حضور راننده در مبدأ سرویس',
  'عدم پاسخگویی به تماس سرشوفر',
  'نقص فنی خودرو و عدم حضور راننده',
  'مرخصی اضطراری و هماهنگ نشده',
];

export function ConfirmAttendanceModal({
  visible,
  calendarDayId,
  tripId,
  tripName,
  driverName,
  tripTime,
  selectedDateLabel,
  dayTrips = [],
  onClose,
  onSuccess,
  onDriverMarkedAbsent,
}: ConfirmAttendanceModalProps) {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState<AttendanceModalMode>('confirm');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [note, setNote] = useState<string>('حضور به‌موقع در مبدأ سرویس');
  const [absentReason, setAbsentReason] = useState<string>(
    'عدم حضور راننده در مبدأ سرویس'
  );
  const [isDelayed, setIsDelayed] = useState<boolean>(false);
  const [delayMinutes, setDelayMinutes] = useState<number>(10);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const initFields = () => {
    const initialId =
      calendarDayId ||
      (dayTrips.length > 0 ? dayTrips[0].tripWorkCalendarId : '');
    setSelectedCalendarId(initialId);
    setMode('confirm');
    setNote('حضور به‌موقع در مبدأ سرویس');
    setAbsentReason('عدم حضور راننده در مبدأ سرویس');
    setIsDelayed(false);
    setDelayMinutes(10);
    setSubmitting(false);
  };

  if (!visible) return null;

  const activeTripObj = dayTrips.find(
    (t) => t.tripWorkCalendarId === selectedCalendarId
  );

  const effectiveTripName =
    activeTripObj?.tripName || tripName || 'سرویس انتخابی';
  const effectiveTripId = activeTripObj?.tripId ?? tripId;
  const effectiveDriverName = activeTripObj?.driverFullName || driverName;
  const effectiveTripTime =
    activeTripObj?.outbound?.start
      ? `${activeTripObj.outbound.start.slice(0, 5)} تا ${
          activeTripObj.outbound.end?.slice(0, 5) || ''
        }`
      : tripTime;

  // Pessimistic Submission for Confirming Attendance
  const handleConfirmAttendance = async (targetId: string) => {
    setSubmitting(true);
    try {
      const res = await confirmAttendanceApi(
        {
          calendarDayId: targetId,
          note: note.trim() || 'تأیید حضور توسط سرشوفر',
          isDelayed,
          delayMinutes: isDelayed ? delayMinutes : 0,
        },
        token
      );

      showSuccess(
        res?.message ||
          (isDelayed
            ? `حضور راننده با ثبت ${toPersianDigits(delayMinutes)} دقیقه تأخیر با موفقیت تأیید شد.`
            : 'حضور راننده با موفقیت تأیید شد.'),
        'ثبت حضور موفق'
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      if (err?.statusCode === 409) {
        showError(
          'وضعیت این سفر توسط کاربر دیگری تغییر یافته است (تعارض همزمانی). لطفاً صفحه را تازه‌سازی کنید.',
          'خطای همزمانی'
        );
      } else {
        showError(
          err?.message || 'امکان ثبت حضور در حال حاضر وجود ندارد.',
          'خطا در تأیید حضور'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Pessimistic Submission for Marking Driver Absent
  const handleMarkAbsent = async (targetId: string) => {
    setSubmitting(true);
    try {
      const res = await markDriverAbsentApi(
        {
          calendarDayId: targetId,
          reason: absentReason.trim() || 'عدم حضور راننده در سرویس',
        },
        token
      );

      showSuccess(
        res?.message || 'عدم حضور (غیبت) راننده با موفقیت در سامانه ثبت شد.',
        'ثبت غیبت راننده'
      );
      onSuccess?.();
      onClose();

      // Immediately offer assigning temporary replacement driver
      if (onDriverMarkedAbsent) {
        setTimeout(() => {
          onDriverMarkedAbsent(targetId);
        }, 250);
      }
    } catch (err: any) {
      if (err?.statusCode === 409) {
        showError(
          'وضعیت این سفر قبلاً ثبت یا بازنویسی شده است.',
          'خطای همزمانی'
        );
      } else {
        showError(
          err?.message || 'خطا در ثبت غیبت راننده در سرور.',
          'خطا در ثبت عدم حضور'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const targetId = selectedCalendarId.trim();
    if (!targetId) {
      showError(
        'شناسه تقویم کاری مشخص نشده است. لطفاً یک سرویس را انتخاب نمایید.',
        'خطای اعتبارسنجی'
      );
      return;
    }

    if (mode === 'confirm') {
      if (isDelayed && delayMinutes <= 0) {
        showError(
          'تعداد دقیقه تأخیر باید بزرگ‌تر از صفر باشد.',
          'خطای اعتبارسنجی'
        );
        return;
      }
      handleConfirmAttendance(targetId);
    } else {
      handleMarkAbsent(targetId);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={initFields}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: mode === 'confirm' ? colors.borderGold : colors.danger,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
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
                  {mode === 'confirm'
                    ? 'ثبت و تأیید حضور راننده'
                    : 'ثبت عدم حضور (غیبت راننده)'}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                  ]}
                >
                  {selectedDateLabel
                    ? `مربوط به برنامه روز ${selectedDateLabel}`
                    : 'مدیریت وضعیت حضور در سرویس امروز'}
                </Text>
              </View>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor:
                      mode === 'confirm'
                        ? 'rgba(16, 185, 129, 0.14)'
                        : 'rgba(239, 68, 68, 0.14)',
                  },
                ]}
              >
                {mode === 'confirm' ? (
                  <UserCheck size={20} color="#10B981" />
                ) : (
                  <UserX size={20} color="#EF4444" />
                )}
              </View>
            </View>
          </View>

          {/* Mode Switcher Tabs */}
          <View
            style={[
              styles.modeSwitcherRow,
              {
                backgroundColor: isDark ? '#0B0F19' : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setMode('confirm')}
              disabled={submitting}
              style={[
                styles.modeTab,
                mode === 'confirm' && [
                  styles.activeModeTab,
                  { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                ],
              ]}
            >
              <UserCheck
                size={14}
                color={mode === 'confirm' ? '#10B981' : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === 'confirm' ? '#10B981' : colors.textMuted,
                    fontFamily:
                      mode === 'confirm'
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.medium,
                  },
                ]}
              >
                تأیید حضور
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('absent')}
              disabled={submitting}
              style={[
                styles.modeTab,
                mode === 'absent' && [
                  styles.activeModeTab,
                  { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                ],
              ]}
            >
              <UserX
                size={14}
                color={mode === 'absent' ? '#EF4444' : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === 'absent' ? '#EF4444' : colors.textMuted,
                    fontFamily:
                      mode === 'absent'
                        ? Typography.fontFamily.bold
                        : Typography.fontFamily.medium,
                  },
                ]}
              >
                ثبت غیبت راننده
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Day Trips Selector (if multiple exist) */}
            {dayTrips.length > 1 ? (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <CalendarCheck size={13} color={colors.gold} />
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    انتخاب سرویس ({toPersianDigits(dayTrips.length)} مورد):
                  </Text>
                </View>
                <View style={styles.tripSelectorList}>
                  {dayTrips.map((t) => {
                    const isSelected = t.tripWorkCalendarId === selectedCalendarId;
                    return (
                      <TouchableOpacity
                        key={t.tripWorkCalendarId}
                        onPress={() => setSelectedCalendarId(t.tripWorkCalendarId)}
                        disabled={submitting}
                        style={[
                          styles.tripOptionBtn,
                          {
                            backgroundColor: isSelected
                              ? colors.goldBg
                              : isDark
                              ? '#0B0F19'
                              : '#F8FAFC',
                            borderColor: isSelected ? colors.gold : colors.border,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.tripOptionTitle,
                            {
                              color: isSelected ? colors.gold : colors.text,
                              fontFamily: isSelected
                                ? Typography.fontFamily.bold
                                : Typography.fontFamily.medium,
                            },
                          ]}
                        >
                          {t.tripName} ({toPersianDigits(t.driverFullName || 'بدون راننده')})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Trip Info Summary Box */}
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {effectiveTripName}
                  {effectiveTripId ? ` (${toPersianDigits(effectiveTripId)})` : ''}
                </Text>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                  ]}
                >
                  نام سرویس:
                </Text>
              </View>

              {effectiveDriverName ? (
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    {effectiveDriverName}
                  </Text>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                    ]}
                  >
                    راننده:
                  </Text>
                </View>
              ) : null}

              {effectiveTripTime ? (
                <View style={styles.infoRow}>
                  <View style={styles.timeRow}>
                    <Clock size={12} color={colors.gold} />
                    <Text
                      style={[
                        styles.infoValue,
                        { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                      ]}
                    >
                      {toPersianDigits(effectiveTripTime)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                    ]}
                  >
                    ساعت سرویس:
                  </Text>
                </View>
              ) : null}
            </View>

            {/* CONFIRM MODE SECTION */}
            {mode === 'confirm' ? (
              <>
                {/* Delay Toggle Button */}
                <TouchableOpacity
                  onPress={() => setIsDelayed(!isDelayed)}
                  disabled={submitting}
                  activeOpacity={0.8}
                  style={[
                    styles.delayToggleBox,
                    {
                      backgroundColor: isDelayed
                        ? 'rgba(245, 158, 11, 0.12)'
                        : isDark
                        ? '#1E293B'
                        : '#F1F5F9',
                      borderColor: isDelayed ? '#F59E0B' : colors.border,
                    },
                  ]}
                >
                  <View style={styles.delayToggleRight}>
                    <Clock
                      size={16}
                      color={isDelayed ? '#F59E0B' : colors.textSecondary}
                    />
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
                      ثبت تأخیر برای این سرویس
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
                      {isDelayed ? 'فعال' : 'خیر'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Subcomponent: Delay Minutes Selector */}
                {isDelayed && (
                  <DelayMinutesSelector
                    delayMinutes={delayMinutes}
                    onChangeMinutes={setDelayMinutes}
                  />
                )}

                {/* Quick Note Chips */}
                <View style={styles.quickNotesWrap}>
                  {QUICK_NOTES.map((item) => {
                    const active = note === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={() => setNote(item)}
                        disabled={submitting}
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
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Note Input */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <FileText size={13} color={colors.gold} />
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.text, fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      یادداشت سرشوفر:
                    </Text>
                  </View>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    editable={!submitting}
                    placeholder="توضیحات تکمیلی یا علت تایید را وارد کنید..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
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
              </>
            ) : (
              /* ABSENT MODE SECTION */
              <>
                <View
                  style={[
                    styles.absentNoticeBox,
                    {
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    },
                  ]}
                >
                  <AlertTriangle size={15} color="#EF4444" />
                  <Text
                    style={[
                      styles.absentNoticeText,
                      { color: '#EF4444', fontFamily: Typography.fontFamily.medium },
                    ]}
                  >
                    با ثبت غیبت، وضعیت سرویس به «غایب» تغییر یافته و بلافاصله فرم
                    تعیین راننده جایگزین (لنگی) باز می‌شود.
                  </Text>
                </View>

                {/* Quick Absent Reasons */}
                <View style={styles.quickNotesWrap}>
                  {QUICK_ABSENT_REASONS.map((r) => {
                    const active = absentReason === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setAbsentReason(r)}
                        disabled={submitting}
                        style={[
                          styles.quickChip,
                          {
                            backgroundColor: active
                              ? 'rgba(239, 68, 68, 0.14)'
                              : isDark
                              ? '#1E293B'
                              : '#F1F5F9',
                            borderColor: active ? '#EF4444' : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickChipText,
                            {
                              color: active ? '#EF4444' : colors.textSecondary,
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

                {/* Reason Text Input */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <FileText size={13} color="#EF4444" />
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.text, fontFamily: Typography.fontFamily.bold },
                      ]}
                    >
                      علت دقیق عدم حضور:
                    </Text>
                  </View>
                  <TextInput
                    value={absentReason}
                    onChangeText={setAbsentReason}
                    editable={!submitting}
                    placeholder="علت غیبت راننده را بنویسید..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
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
              </>
            )}
          </ScrollView>

          {/* Actions / Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: mode === 'confirm' ? '#10B981' : '#DC2626',
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  {mode === 'confirm' ? (
                    <CheckCircle2 size={16} color="#FFFFFF" />
                  ) : (
                    <UserX size={16} color="#FFFFFF" />
                  )}
                  <Text
                    style={[
                      styles.submitBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    {mode === 'confirm'
                      ? isDelayed
                        ? `تأیید حضور (با ${toPersianDigits(delayMinutes)} دقیقه تأخیر)`
                        : 'ثبت و تأیید حضور'
                      : 'ثبت غیبت و تخصیص راننده جایگزین'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
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
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleTextCol: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitcherRow: {
    flexDirection: 'row-reverse',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    gap: 5,
  },
  activeModeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 11.5,
  },
  scrollBody: {
    gap: 10,
    paddingBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11.5,
  },
  tripSelectorList: {
    gap: 5,
  },
  tripOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tripOptionTitle: {
    fontSize: 11,
    textAlign: 'right',
  },
  infoBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
  },
  infoValue: {
    fontSize: 11.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  delayToggleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  delayToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  delayToggleText: {
    fontSize: 12,
  },
  toggleIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  toggleIndicatorText: {
    fontSize: 10.5,
  },
  quickNotesWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 10.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 9,
    fontSize: 12,
    textAlign: 'right',
  },
  absentNoticeBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 8,
  },
  absentNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
  },
});
