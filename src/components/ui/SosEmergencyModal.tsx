import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { getCurrentCoordinates, Coordinates } from '@/services/location/gps';
import {
  PhoneCall,
  ShieldAlert,
  Ambulance,
  Wrench,
  X,
  Radio,
} from 'lucide-react-native';

interface SosEmergencyModalProps {
  visible: boolean;
  licensePlate?: string | null;
  onClose: () => void;
}

export function SosEmergencyModal({
  visible,
  licensePlate,
  onClose,
}: SosEmergencyModalProps) {
  const { colors, isDark } = useAppTheme();
  const [coords, setCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (visible) {
      getCurrentCoordinates().then((loc) => setCoords(loc));
    }
  }, [visible]);

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      console.warn('[SOS] Could not open phone dialer:', err?.message);
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: colors.danger,
            },
          ]}
        >
          {/* Top SOS Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
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
                  { color: colors.danger, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                امداد و تماس اضطراری (SOS)
              </Text>
              <Radio size={18} color={colors.danger} style={{ marginLeft: 6 }} />
            </View>
          </View>

          {/* Quick Driver Location & Plate reference bar */}
          <View
            style={[
              styles.infoBar,
              {
                backgroundColor: isDark ? '#1F2937' : '#FEF2F2',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              },
            ]}
          >
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                مختصات فعلی:
              </Text>
              <Text
                style={[
                  styles.infoVal,
                  { color: colors.text, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {coords
                  ? toPersianDigits(`${coords.latitude} , ${coords.longitude}`)
                  : 'در حال دریافت...'}
              </Text>
            </View>

            {licensePlate ? (
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                  پلاک خودرو:
                </Text>
                <Text
                  style={[
                    styles.infoVal,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {licensePlate}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Emergency Call Options */}
          <View style={styles.optionsList}>
            {/* 1. Gitiseir 24/7 Support */}
            <TouchableOpacity
              style={[
                styles.optionItem,
                styles.priorityOption,
                { backgroundColor: '#DC2626' },
              ]}
              onPress={() => handleCall('02191000000')}
              activeOpacity={0.85}
            >
              <View style={styles.callIconBox}>
                <PhoneCall size={18} color="#FFFFFF" />
              </View>
              <View style={styles.optionTexts}>
                <Text
                  style={[
                    styles.optionTitle,
                    { color: '#FFFFFF', fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  پشتیبانی ۲۴ ساعته گیتی‌سیر
                </Text>
                <Text style={[styles.optionSub, { color: 'rgba(255,255,255,0.85)' }]}>
                  {toPersianDigits('۰۲۱-۹۱۰۰۰۰۰۰')} • مرکز عملیات
                </Text>
              </View>
            </TouchableOpacity>

            {/* 2. Police 110 */}
            <TouchableOpacity
              style={[
                styles.optionItem,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleCall('110')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.callIconBox,
                  { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
                ]}
              >
                <ShieldAlert size={18} color="#3B82F6" />
              </View>
              <View style={styles.optionTexts}>
                <Text
                  style={[
                    styles.optionTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  پلیس راهور و ۱۱۰
                </Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  گزارش تصادف یا سانحه جاده‌ای
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Ambulance 115 */}
            <TouchableOpacity
              style={[
                styles.optionItem,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleCall('115')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.callIconBox,
                  { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Ambulance size={18} color="#EF4444" />
              </View>
              <View style={styles.optionTexts}>
                <Text
                  style={[
                    styles.optionTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  اورژانس ۱۱۵
                </Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  امداد پزشکی فوری
                </Text>
              </View>
            </TouchableOpacity>

            {/* 4. Roadside Assistance */}
            <TouchableOpacity
              style={[
                styles.optionItem,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleCall('096440')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.callIconBox,
                  { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                ]}
              >
                <Wrench size={18} color="#F59E0B" />
              </View>
              <View style={styles.optionTexts}>
                <Text
                  style={[
                    styles.optionTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  امداد خودرو جاده‌ای
                </Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  {toPersianDigits('۰۹۶۴۴۰')} • یدک‌کش و خدمات فنی
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={[
              styles.cancelBtn,
              {
                backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                borderColor: colors.border,
              },
            ]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.cancelBtnText,
                { color: colors.text, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              انصراف و بازگشت
            </Text>
          </TouchableOpacity>
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
    marginBottom: Spacing.sm,
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
  infoBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm + 2,
  },
  infoCol: {
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 12,
  },
  optionsList: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  optionItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  priorityOption: {
    borderWidth: 0,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  callIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  optionTexts: {
    flex: 1,
    alignItems: 'flex-start',
  },
  optionTitle: {
    fontSize: 13.5,
    textAlign: 'right',
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 11.5,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'right',
  },
  cancelBtn: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
  },
});
