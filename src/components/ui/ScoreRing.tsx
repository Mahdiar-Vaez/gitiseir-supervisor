import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { toPersianDigits } from '@/utils/persian-digits';

interface ScoreRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({ score, size = 136, strokeWidth = 10 }: ScoreRingProps) {
  const { colors } = useAppTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (score / 100) * circumference;

  // Determine performance tier & color
  const getRatingInfo = (s: number) => {
    if (s >= 90) return { label: 'عالی', color: colors.success };
    if (s >= 75) return { label: 'خوب', color: colors.gold };
    if (s >= 60) return { label: 'نیازمند بهبود', color: colors.warning };
    return { label: 'نیازمند بررسی', color: colors.danger };
  };

  const rating = getRatingInfo(score);
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.cardSubtle}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={rating.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text
          style={[
            styles.scoreNumber,
            { color: colors.text, fontFamily: Typography.fontFamily.bold },
          ]}
        >
          {toPersianDigits(score)}
        </Text>
        <Text
          style={[
            styles.scoreOutOf,
            { color: colors.textMuted, fontFamily: Typography.fontFamily.regular },
          ]}
        >
          از {toPersianDigits(100)}
        </Text>
        <View
          style={[
            styles.ratingPill,
            {
              backgroundColor: colors.cardSubtle,
              borderColor: rating.color,
            },
          ]}
        >
          <Text
            style={[
              styles.ratingLabel,
              { color: rating.color, fontFamily: Typography.fontFamily.bold },
            ]}
          >
            {rating.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 28,
    lineHeight: 34,
  },
  scoreOutOf: {
    fontSize: 11,
    marginBottom: 2,
  },
  ratingPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginTop: 2,
  },
  ratingLabel: {
    fontSize: 10,
  },
});
