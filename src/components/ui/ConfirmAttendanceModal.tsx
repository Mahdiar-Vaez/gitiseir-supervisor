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
  Alert,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { confirmAttendanceApi } from '@/services/api/supervisor';
import { X, CheckCircle2, UserCheck, FileText, Clock } from 'lucide-react-native';

interface ConfirmAttendanceModalProps {
  visible: boolean;
  calendarDayId: string | null;
  tripId?: number | null;
  tripName?: string;
  driverName?: string;
  tripTime?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_NOTES = [
  'حضور به‌موقع در مبدأ سرویس',
  'تأیید حضور و آمادگی کامل خودرو',
  'حضور با هماهنگی سرشوفر',
];

export function ConfirmAttendanceModal({
  visible,
  calendarDayId,
  tripId,
  tripName,
  driverName,
  tripTime,
  onClose,
  onSuccess,
}: ConfirmAttendanceModalProps) {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();

  const [note, setNote] = useState<string>('حضور به‌موقع در مبدأ سرویس');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!visible || !calendarDayId) return null;

  const handleSubmit = async () => {
    if (!calendarDayId) return;
    try {
      setSubmitting(true);
      const res = await confirmAttendanceApi(
        {
          calendarDayId,
          note: note.trim() || 'تأیید حضور توسط سرشوفر',
        },
        token
      );
      Alert.alert(
        'ثبت حضور موفق',
        res?.message || 'حضور راننده برای این سرویس با موفقیت تأیید شد.'
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Alert.alert(
        'خطا در ثبت حضور',
        err?.message || 'امکان ثبت حضور در حال حاضر وجود ندارد.'
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
      onShow={() => setNote('حضور به‌موقع در مبدأ سرویس')}
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
                  تأیید حضور راننده
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
                  ]}
                >
                  ثبت در بورد نظارتی سرشوفر
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
                {tripName || 'سرویس انتخابی'}
                {tripId ? ` (${toPersianDigits(tripId)})` : ''}
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

            {driverName ? (
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {driverName}
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

            {tripTime ? (
              <View style={styles.infoRow}>
                <View style={styles.timeRow}>
                  <Clock size={12} color={colors.gold} />
                  <Text
                    style={[
                      styles.infoValue,
                      { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                    ]}
                  >
                    {toPersianDigits(tripTime)}
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
                یادداشت سرشوفر (Note)
              </Text>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="توضیحات حضور راننده را وارد کنید..."
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
                    ثبت و تأیید حضور
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
    maxWidth: 430,
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
