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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import {
  Send,
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Lock,
} from 'lucide-react-native';

interface ManagementContactModalProps {
  visible: boolean;
  onClose: () => void;
}

type SubjectType = 'suggestion' | 'issue' | 'private';

interface SubjectOption {
  id: SubjectType;
  label: string;
  icon: React.ComponentType<{ size: number; color: string; style?: any }>;
}

const SUBJECT_OPTIONS: SubjectOption[] = [
  { id: 'suggestion', label: 'پیشنهاد بهبود', icon: Sparkles },
  { id: 'issue', label: 'گزارش مشکل', icon: AlertTriangle },
  { id: 'private', label: 'پیام خصوصی', icon: Lock },
];

export function ManagementContactModal({
  visible,
  onClose,
}: ManagementContactModalProps) {
  const { colors, isDark } = useAppTheme();

  const [subject, setSubject] = useState<SubjectType>('suggestion');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const resetForm = () => {
    setMessage('');
    setSubject('suggestion');
    setIsSubmitted(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    // Simulate direct dispatch to management endpoint
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics fallback
      }
      setTimeout(() => {
        handleClose();
      }, 1600);
    }, 800);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: colors.gold,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                ارتباط مستقیم با مدیریت
              </Text>
              <ShieldCheck size={18} color={colors.gold} style={{ marginLeft: 6 }} />
            </View>
          </View>

          {isSubmitted ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={46} color={colors.success} style={{ marginBottom: 10 }} />
              <Text
                style={[
                  styles.successTitle,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                پیام شما با موفقیت ثبت شد
              </Text>
              <Text
                style={[
                  styles.successSub,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                این پیام محرمانه مستقیماً به دست مدیریت خواهد رسید.
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
                ]}
              >
                انتقادات، پیشنهادات یا گزارش‌های خود را مستقیماً به گوش مدیریت ارشد برسانید.
              </Text>

              {/* Subject Chips */}
              <View style={styles.chipsRow}>
                {SUBJECT_OPTIONS.map((item) => {
                  const isSelected = subject === item.id;
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSubject(item.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(212, 175, 55, 0.16)'
                              : '#F5EEDB'
                            : isDark
                            ? '#1E293B'
                            : '#F1F5F9',
                          borderColor: isSelected ? colors.gold : colors.border,
                        },
                      ]}
                    >
                      <Icon
                        size={13}
                        color={isSelected ? colors.gold : colors.textSecondary}
                        style={{ marginLeft: 5 }}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? colors.gold : colors.textSecondary,
                            fontFamily: isSelected
                              ? Typography.fontFamily.bold
                              : Typography.fontFamily.medium,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Text Area */}
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="متن پیام خود را اینجا بنویسید..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={400}
                  textAlign="right"
                  textAlignVertical="top"
                  style={[
                    styles.textInput,
                    {
                      color: colors.text,
                      fontFamily: Typography.fontFamily.regular,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.charCounter,
                    { color: colors.textMuted },
                  ]}
                >
                  {toPersianDigits(`${message.length} / ۴۰۰`)}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: colors.gold,
                      opacity: !message.trim() || isSubmitting ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#0B0F19" />
                  ) : (
                    <>
                      <Send size={15} color="#0B0F19" style={{ marginLeft: 6 }} />
                      <Text
                        style={[
                          styles.submitBtnText,
                          {
                            color: colors.goldButtonText,
                            fontFamily: Typography.fontFamily.bold,
                          },
                        ]}
                      >
                        ارسال پیام
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    {
                      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.cancelBtnText,
                      { color: colors.text, fontFamily: Typography.fontFamily.bold },
                    ]}
                  >
                    انصراف
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
    ...StyleSheet.absoluteFill,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: Spacing.sm + 2,
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm + 2,
    gap: 6,
  },
  chip: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
  },
  inputBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    height: 115,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    lineHeight: 20,
  },
  charCounter: {
    fontSize: 10.5,
    alignSelf: 'flex-start',
  },
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  submitBtn: {
    flex: 1.6,
    height: 42,
    borderRadius: BorderRadius.md,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 13.5,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  successTitle: {
    fontSize: 15,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 12,
    textAlign: 'center',
  },
});
