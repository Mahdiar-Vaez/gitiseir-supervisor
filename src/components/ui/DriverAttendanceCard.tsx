import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Repeat,
  ChevronLeft,
} from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TodayDriverItem, ArrivalStatus } from '@/services/api/types';
import { toPersianDigits } from '@/utils/persian-digits';

interface DriverAttendanceCardProps {
  item: TodayDriverItem;
  isProcessingGps?: boolean;
  onPressArrivalAction: (item: TodayDriverItem, targetStatus: ArrivalStatus) => void;
  onPressLangiAction: (item: TodayDriverItem) => void;
}

export function DriverAttendanceCard({
  item,
  isProcessingGps = false,
  onPressArrivalAction,
  onPressLangiAction,
}: DriverAttendanceCardProps) {
  const { colors } = useAppTheme();

  const handleCallDriver = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const getStatusMeta = () => {
    switch (item.arrivalStatus) {
      case 'arrived':
        return {
          label: 'رسیده',
          bg: colors.successBg,
          color: colors.success,
          borderColor: colors.success,
          Icon: CheckCircle2,
        };
      case 'not_arrived':
        return {
          label: 'نرسیده',
          bg: colors.dangerBg,
          color: colors.danger,
          borderColor: colors.danger,
          Icon: XCircle,
        };
      default:
        return {
          label: 'در انتظار',
          bg: colors.goldBg,
          color: colors.gold,
          borderColor: colors.borderGold,
          Icon: Clock,
        };
    }
  };

  const statusMeta = getStatusMeta();
  const StatusIcon = statusMeta.Icon;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor:
            item.arrivalStatus === 'arrived'
              ? 'rgba(16, 185, 129, 0.35)'
              : item.arrivalStatus === 'not_arrived'
              ? 'rgba(251, 113, 133, 0.38)'
              : colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* 1. Header Row: Driver Name & Plate (Right) | Time, Status & Call (Left) */}
      <View style={styles.headerRow}>
        <View style={styles.driverInfoRight}>
          <Text
            numberOfLines={1}
            style={[
              styles.driverName,
              { color: colors.text, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {item.driverFullName}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.vehicleSubText,
              { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {item.vehicleType} • {toPersianDigits(item.licensePlate)}
          </Text>
        </View>

        <View style={styles.headerLeftActions}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusMeta.bg,
                borderColor: statusMeta.borderColor,
              },
            ]}
          >
            <StatusIcon size={11} color={statusMeta.color} />
            <Text
              style={[
                styles.statusPillText,
                { color: statusMeta.color, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {statusMeta.label} • {toPersianDigits(item.scheduledStartTime)}
            </Text>
          </View>

          <Pressable
            onPress={() => handleCallDriver(item.driverPhone)}
            accessibilityLabel={`تماس با ${item.driverFullName}`}
            style={({ pressed }) => [
              styles.callIconBtn,
              {
                backgroundColor: colors.commandBg,
                borderColor: colors.commandBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Phone size={14} color={colors.command} />
          </Pressable>
        </View>
      </View>

      {/* 2. Route / Service Title */}
      <Text
        numberOfLines={1}
        style={[
          styles.tripName,
          { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
        ]}
      >
        {item.tripName}
      </Text>

      {/* 3. Compact Confirmation Timestamp (if confirmed) */}
      {item.gpsStamp && (
        <Text
          numberOfLines={1}
          style={[
            styles.stampLine,
            {
              color:
                item.arrivalStatus === 'arrived' ? colors.success : colors.danger,
              fontFamily: Typography.fontFamily.medium,
            },
          ]}
        >
          ✓ ثبت شده در ساعت {item.gpsStamp.verifiedAtTime} همراه با ارسال لوکیشن
          {item.gpsStamp.note ? ` (${item.gpsStamp.note})` : ''}
        </Text>
      )}

      {/* 4. Compact Langi Status Badge (if Langi assigned) */}
      {item.hasLangi && item.langi && (
        <Pressable
          onPress={() => onPressLangiAction(item)}
          style={({ pressed }) => [
            styles.langiCompactBar,
            {
              backgroundColor: colors.langiBg,
              borderColor: colors.langiBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.langiCompactRight}>
            <Repeat size={12} color={colors.langi} />
            <Text
              numberOfLines={1}
              style={[
                styles.langiCompactText,
                { color: colors.langi, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              لنگی: {item.langi.name} {item.langi.family} •{' '}
              {item.langi.fullyAcceptedAndPayed
                ? 'تایید نهایی شده'
                : 'منتظر اعلام فرایند'}
            </Text>
          </View>
          <ChevronLeft size={13} color={colors.langi} />
        </Pressable>
      )}

      {/* 5. Action Buttons: Confirm Arrived | Confirm Not Arrived | Request Langi */}
      <View style={styles.actionsBar}>
        <Pressable
          onPress={() => onPressArrivalAction(item, 'arrived')}
          disabled={isProcessingGps}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor:
                item.arrivalStatus === 'arrived'
                  ? colors.success
                  : 'rgba(16, 185, 129, 0.14)',
              borderColor: colors.success,
              opacity: pressed || isProcessingGps ? 0.75 : 1,
            },
          ]}
        >
          {isProcessingGps ? (
            <ActivityIndicator
              size="small"
              color={item.arrivalStatus === 'arrived' ? '#071318' : colors.success}
            />
          ) : (
            <>
              <CheckCircle2
                size={14}
                color={item.arrivalStatus === 'arrived' ? '#071318' : colors.success}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color:
                      item.arrivalStatus === 'arrived' ? '#071318' : colors.success,
                    fontFamily: Typography.fontFamily.bold,
                  },
                ]}
              >
                {item.arrivalStatus === 'arrived' ? 'رسیده ✓' : 'تایید رسیدن'}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => onPressArrivalAction(item, 'not_arrived')}
          disabled={isProcessingGps}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor:
                item.arrivalStatus === 'not_arrived'
                  ? colors.danger
                  : 'rgba(244, 63, 94, 0.12)',
              borderColor: colors.danger,
              opacity: pressed || isProcessingGps ? 0.75 : 1,
            },
          ]}
        >
          <XCircle
            size={14}
            color={item.arrivalStatus === 'not_arrived' ? '#FFFFFF' : colors.danger}
          />
          <Text
            style={[
              styles.actionBtnText,
              {
                color:
                  item.arrivalStatus === 'not_arrived' ? '#FFFFFF' : colors.danger,
                fontFamily: Typography.fontFamily.bold,
              },
            ]}
          >
            {item.arrivalStatus === 'not_arrived' ? 'نرسیده ✗' : 'ثبت نرسیدن'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onPressLangiAction(item)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: item.hasLangi ? colors.langi : colors.langiBg,
              borderColor: colors.langi,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Repeat
            size={13}
            color={item.hasLangi ? '#071318' : colors.langi}
          />
          <Text
            style={[
              styles.actionBtnText,
              {
                color: item.hasLangi ? '#071318' : colors.langi,
                fontFamily: Typography.fontFamily.bold,
              },
            ]}
          >
            {item.hasLangi ? 'وضعیت لنگی' : 'درخواست لنگی'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  driverInfoRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  driverName: {
    fontSize: 15,
    textAlign: 'right',
  },
  vehicleSubText: {
    fontSize: 11.5,
    textAlign: 'right',
  },
  headerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
  },
  callIconBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripName: {
    fontSize: 12.5,
    textAlign: 'right',
  },
  stampLine: {
    fontSize: 11,
    textAlign: 'right',
  },
  langiCompactBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  langiCompactRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  langiCompactText: {
    fontSize: 11.5,
    textAlign: 'right',
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  actionBtnText: {
    fontSize: 11,
  },
});
