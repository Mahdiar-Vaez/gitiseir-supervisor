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
import { confirmAttendanceApi } from '@/services/api/supervisor';
import { DayTripGridItem } from '@/services/api/types';
import {
  X,
  CheckCircle2,
  UserCheck,
  FileText,
  Clock,
  CalendarCheck,
  History,
} from 'lucide-react-native';

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
}

const QUICK_NOTES = [
  'حضور به‌موقع در مبدأ سرویس',
  'تأیید حضور و آمادگی کامل خودرو',
  'تأیید سفر جامانده (فراموشی ثبت شروع/پایان توسط راننده)',
  'حضور با هماهنگی سرشوفر خط',
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
}: ConfirmAttendanceModalProps) {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();

  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [note, setNote] = useState<string>('حضور به‌موقع در مبدأ سرویس');
  const [isMissedTripMode, setIsMissedTripMode] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const initFields = () => {
    const initialId =
      calendarDayId ||
      (dayTrips.length > 0 ? dayTrips[0].tripWorkCalendarId : '');
    setSelectedCalendarId(initialId);
    setNote('حضور به‌موقع در مبدأ سرویس');
    setIsMissedTripMode(false);
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

  const handleToggleMissedMode = () => {
    const next = !isMissedTripMode;
    setIsMissedTripMode(next);
    if (next) {
      setNote('تأیید انجام سفر جامانده (راننده فراموش کرده در اپ ثبت کند)');
    } else {
      setNote('حضور به‌موقع در مبدأ سرویس');
    }
  };

  const handleSubmit = async () => {
    const targetId = selectedCalendarId.trim();
    if (!targetId) {
      showError(
        'شناسه تقویم کاری مشخص نشده است. لطفاً یک سرویس را انتخاب نمایید.',
        'خطای اعتبارسنجی'
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await confirmAttendanceApi(
        {
          calendarDayId: targetId,
          note: note.trim() || 'تأیید حضور توسط سرشوفر',
        },
        token
      );
      showSuccess(
        res?.message ||
          (selectedDateLabel
            ? `اختصاص و تأیید حضور سفر در روز ${selectedDateLabel} با موفقیت ثبت شد.`
            : 'حضور راننده برای این سرویس با موفقیت تأیید شد.'),
        'ثبت حضور موفق'
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showError(
        err?.message || 'امکان ثبت حضور در حال حاضر وجود ندارد.',
        'خطا در تأیید حضور'
      );
    } finally {
      setSubmitting(false);
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
                  {selectedDateLabel
                    ? `اختصاص سفر به روز ${selectedDateLabel}`
                    : 'تأیید حضور راننده'}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                  ]}
                >
                  ثبت و مدیریت حضور راننده در سامانه ناوگان
                </Text>
              </View>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: 'rgba(16, 185, 129, 0.14)' },
                ]}
              >
                <UserCheck size={20} color="#10B981" />
              </View>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Day Trips Picker (if opened from calendar day header) */}
            {dayTrips.length > 0 ? (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <CalendarCheck size={14} color={colors.gold} />
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    انتخاب سرویس این روز ({toPersianDigits(dayTrips.length)} مورد):
                  </Text>
                </View>
                <View style={styles.tripSelectorList}>
                  {dayTrips.map((t) => {
                    const isSelected =
                      t.tripWorkCalendarId === selectedCalendarId;
                    return (
                      <TouchableOpacity
                        key={t.tripWorkCalendarId}
                        onPress={() =>
                          setSelectedCalendarId(t.tripWorkCalendarId)
                        }
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

            {/* Trip Summary Box */}
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

            {/* Manual CalendarDayId Input (when day has no preloaded trips or supervisor wants to enter UUID) */}
            {!calendarDayId && dayTrips.length === 0 ? (
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  شناسه تقویم کاری سرویس:
                </Text>
                <TextInput
                  value={selectedCalendarId}
                  onChangeText={setSelectedCalendarId}
                  placeholder="کد شناسه سرویس در تقویم"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.singleLineInput,
                    {
                      backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                />
              </View>
            ) : null}

            {/* US-05 Missed Trip Toggle */}
            <TouchableOpacity
              onPress={handleToggleMissedMode}
              activeOpacity={0.8}
              style={[
                styles.missedTripToggle,
                {
                  backgroundColor: isMissedTripMode
                    ? 'rgba(245, 158, 11, 0.14)'
                    : isDark
                    ? '#1E293B'
                    : '#F1F5F9',
                  borderColor: isMissedTripMode ? '#F59E0B' : colors.border,
                },
              ]}
            >
              <History
                size={16}
                color={isMissedTripMode ? '#F59E0B' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.missedTripText,
                  {
                    color: isMissedTripMode ? '#F59E0B' : colors.textSecondary,
                    fontFamily: isMissedTripMode
                      ? Typography.fontFamily.bold
                      : Typography.fontFamily.medium,
                  },
                ]}
              >
                ثبت به عنوان سفر جامانده (فراموشی ثبت توسط راننده)
              </Text>
            </TouchableOpacity>

            {/* Quick Note Chips */}
            <View style={styles.quickNotesWrap}>
              {QUICK_NOTES.map((item) => {
                const active = note === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setNote(item)}
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
                <FileText size={14} color={colors.gold} />
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  یادداشت سرشوفر (note)
                </Text>
              </View>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="توضیحات حضور راننده یا علت ثبت سفر را وارد کنید..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
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

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: '#10B981',
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text
                    style={[
                      styles.submitBtnText,
                      { fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    {selectedDateLabel
                      ? `ثبت برای روز ${selectedDateLabel}`
                      : 'ثبت و تأیید حضور'}
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
    maxHeight: '88%',
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
    fontSize: 14.5,
  },
  subtitle: {
    fontSize: 10.5,
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
    paddingVertical: 2,
  },
  tripSelectorList: {
    gap: 6,
  },
  tripOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'flex-end',
  },
  tripOptionTitle: {
    fontSize: 12,
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
    fontSize: 11.5,
  },
  infoValue: {
    fontSize: 12.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  missedTripToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  missedTripText: {
    fontSize: 11.5,
    textAlign: 'right',
    flex: 1,
  },
  quickNotesWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12,
    textAlign: 'right',
  },
  singleLineInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    textAlign: 'right',
    minHeight: 72,
    textAlignVertical: 'top',
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
    color: '#FFFFFF',
    fontSize: 12.5,
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
