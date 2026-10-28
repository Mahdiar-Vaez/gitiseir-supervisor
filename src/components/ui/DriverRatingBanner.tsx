import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';
import { Star, ChevronLeft, Sparkles } from 'lucide-react-native';

interface DriverRatingBannerProps {
  score?: number;
  totalReviews?: number;
  topTrait?: string;
  secondTrait?: string;
  onPress?: () => void;
}

export function DriverRatingBanner({
  score = 4.85,
  totalReviews = 342,
  topTrait = 'بوی مطبوع کابین',
  secondTrait = 'رانندگی ایمن',
  onPress,
}: DriverRatingBannerProps) {
  const { colors, isDark } = useAppTheme();

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics optional
    }
    if (onPress) {
      onPress();
    } else {
      router.navigate('/ratings' as any);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`امتیاز راننده ${score} از ۵. لمس برای مشاهده جزئیات`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: colors.gold,
          shadowColor: colors.gold,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* Top golden accent line */}
      <View style={[styles.topGoldBar, { backgroundColor: colors.gold }]} />

      <View style={styles.contentRow}>
        {/* Right side: Star Score + Tagline */}
        <View style={styles.scoreCol}>
          <View style={styles.ratingNumberRow}>
            <Star size={18} color={colors.gold} fill={colors.gold} style={{ marginLeft: 5 }} />
            <Text
              style={[
                styles.scoreText,
                { color: colors.gold, fontFamily: Typography.fontFamily.bold },
              ]}
            >
              {toPersianDigits(score.toFixed(2))}
            </Text>
            <Text style={[styles.maxScoreText, { color: colors.textMuted }]}>
              {toPersianDigits('از ۵')}
            </Text>
          </View>

          <Text
            style={[
              styles.reviewCountText,
              { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular },
            ]}
          >
            امتیاز کیفی شما • {toPersianDigits(totalReviews)} نظر مسافران
          </Text>
        </View>

        {/* Left side: Minimal Chevron */}
        <View style={styles.chevronBox}>
          <ChevronLeft size={20} color={colors.gold} />
        </View>
      </View>

      {/* Bottom Mini Tags */}
      <View style={styles.tagsRow}>
        <View style={styles.traitChip}>
          <Sparkles size={11} color={colors.success} style={{ marginLeft: 4 }} />
          <Text
            style={[
              styles.traitChipText,
              { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {topTrait}
          </Text>
        </View>

        <View style={styles.traitChip}>
          <Sparkles size={11} color={colors.success} style={{ marginLeft: 4 }} />
          <Text
            style={[
              styles.traitChipText,
              { color: colors.textSecondary, fontFamily: Typography.fontFamily.medium },
            ]}
          >
            {secondTrait}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.2,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  topGoldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreCol: {
    alignItems: 'flex-start',
  },
  ratingNumberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 20,
    lineHeight: 26,
    marginLeft: 6,
  },
  maxScoreText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
  },
  reviewCountText: {
    fontSize: 12,
    textAlign: 'right',
  },
  chevronBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  traitChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  traitChipText: {
    fontSize: 11,
  },
});
