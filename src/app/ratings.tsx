import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import {
  getDriverRatingsApi,
  DriverRatingStats,
  SAMPLE_DRIVER_RATINGS,
} from '@/services/api/ratings';
import {
  ArrowRight,
  Star,
  ThumbsUp,
  TrendingUp,
  AlertCircle,
  Car,
  Calendar,
} from 'lucide-react-native';

export default function RatingsScreen() {
  const { colors, isDark } = useAppTheme();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<DriverRatingStats>(SAMPLE_DRIVER_RATINGS);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;
    getDriverRatingsApi(token)
      .then((res) => {
        if (!isCancelled && res && res.result) {
          setStats(res.result);
        }
      })
      .catch((err: any) => {
        console.log('[RatingsScreen] Error loading ratings:', err?.message);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [token, refreshIndex]);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshIndex((prev) => prev + 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/' as any);
            }
          }}
          style={[
            styles.backBtn,
            { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="بازگشت"
        >
          <ArrowRight size={18} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          امتیاز و نظرسنجی مسافران
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : (
          <>
            {/* 1. Hero Big Rating Card */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: colors.gold,
                  shadowColor: colors.gold,
                },
              ]}
            >
              <View style={[styles.topGoldBar, { backgroundColor: colors.gold }]} />

              <Text
                style={[
                  styles.heroRatingNumber,
                  { color: colors.gold, fontFamily: Typography.fontFamily.bold },
                ]}
              >
                {toPersianDigits(stats.overallRating.toFixed(2))}
              </Text>

              {/* Star Row */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starIndex) => (
                  <Star
                    key={starIndex}
                    size={24}
                    color={colors.gold}
                    fill={colors.gold}
                    style={{ marginHorizontal: 3 }}
                  />
                ))}
              </View>

              <Text
                style={[
                  styles.heroSubText,
                  { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
                ]}
              >
                از بین {toPersianDigits(stats.totalReviews)} نظر ثبت‌شده مسافران
              </Text>
            </View>

            {/* 2. Quick Trip Performance Metrics */}
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Calendar size={16} color={colors.gold} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  سفرهای این هفته
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {toPersianDigits(stats.tripsThisWeek)}
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Car size={16} color={colors.gold} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  سفرهای امروز
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  {toPersianDigits(stats.tripsToday)}
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <TrendingUp size={16} color={colors.success} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  نرخ رضایت
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: colors.success, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  ٪{toPersianDigits(stats.satisfactionRate)}
                </Text>
              </View>
            </View>

            {/* 3. Top Positive Attributes */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIconBadge,
                    { backgroundColor: 'rgba(52, 211, 153, 0.12)' },
                  ]}
                >
                  <ThumbsUp size={15} color={colors.success} />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  نقاط قوت برجسته شما
                </Text>
              </View>

              <View style={styles.tagsList}>
                {stats.topPositives.map((tag) => (
                  <View key={tag.id} style={styles.tagItem}>
                    <View style={styles.tagLabelRow}>
                      <Text
                        style={[
                          styles.tagLabel,
                          { color: colors.text, fontFamily: Typography.fontFamily.medium },
                        ]}
                      >
                        {tag.label}
                      </Text>
                      <View
                        style={[
                          styles.votePill,
                          {
                            backgroundColor: 'rgba(52, 211, 153, 0.12)',
                            borderColor: 'rgba(52, 211, 153, 0.3)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.votePillText,
                            { color: colors.success, fontFamily: Typography.fontFamily.bold },
                          ]}
                        >
                          {toPersianDigits(tag.count)} رای
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.track,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.05)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.fill,
                          {
                            backgroundColor: colors.success,
                            width: `${tag.percentage}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* 4. Top Improvement Attributes */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIconBadge,
                    { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                  ]}
                >
                  <AlertCircle size={15} color="#F59E0B" />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, fontFamily: Typography.fontFamily.bold },
                  ]}
                >
                  نکات قابل توجه و بهبود
                </Text>
              </View>

              <View style={styles.tagsList}>
                {stats.topImprovements.map((tag) => (
                  <View key={tag.id} style={styles.tagItem}>
                    <View style={styles.tagLabelRow}>
                      <Text
                        style={[
                          styles.tagLabel,
                          { color: colors.text, fontFamily: Typography.fontFamily.medium },
                        ]}
                      >
                        {tag.label}
                      </Text>
                      <View
                        style={[
                          styles.votePill,
                          {
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            borderColor: 'rgba(245, 158, 11, 0.3)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.votePillText,
                            { color: '#F59E0B', fontFamily: Typography.fontFamily.bold },
                          ]}
                        >
                          {toPersianDigits(tag.count)} مورد
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.track,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.05)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.fill,
                          {
                            backgroundColor: '#F59E0B',
                            width: `${Math.max(tag.percentage * 4, 10)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  topGoldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
  },
  heroRatingNumber: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubText: {
    fontSize: 12.5,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm + 2,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  statValue: {
    fontSize: 16,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: 14,
  },
  tagsList: {
    gap: Spacing.sm + 4,
  },
  tagItem: {
    gap: 6,
  },
  tagLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagLabel: {
    fontSize: 13,
  },
  votePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  votePillText: {
    fontSize: 11,
  },
  track: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2.5,
  },
});
