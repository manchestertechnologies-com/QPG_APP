import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing } from '../../theme/tokens';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 18,
  borderRadius = radii.sm,
  style,
}) => {
  const { theme } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.surfaceLight,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.cardSkeleton,
        {
          backgroundColor: theme.surface,
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <Skeleton width={90} height={20} borderRadius={radii.sm} />
        <Skeleton width={60} height={16} borderRadius={radii.sm} />
      </View>
      <Skeleton width="92%" height={16} style={{ marginTop: spacing[3] }} />
      <Skeleton width="75%" height={16} style={{ marginTop: spacing[1.5] }} />
      <View style={styles.bottomRow}>
        <Skeleton width={110} height={14} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    marginVertical: spacing[1.5],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
});
