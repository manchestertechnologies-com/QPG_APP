import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, shadows } from '../../theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  highlight?: boolean;
  highlightColor?: string;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  highlight = false,
  highlightColor,
  onPress,
  style,
  activeOpacity = 0.85,
}) => {
  const { theme } = useTheme();

  const paddingValues = {
    none: 0,
    sm: spacing[2.5],
    md: spacing[4],
    lg: spacing[5],
  };

  const getBorderColor = () => {
    if (highlight) return highlightColor || theme.primary;
    if (variant === 'outlined') return theme.surfaceBorder;
    return theme.cardBorder;
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.cardBg,
    borderColor: getBorderColor(),
    borderWidth: highlight ? 1.5 : 1,
    borderRadius: radii.lg,
    padding: paddingValues[padding],
    ...(variant === 'elevated' ? shadows.subtle : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[styles.base, cardStyle, styles.interactive, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    marginVertical: spacing[1.5],
    overflow: 'hidden',
  },
  interactive: {
    cursor: 'pointer' as any,
  },
});
