import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'secondary';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const variantStyles = {
    primary: {
      bg: 'rgba(99, 102, 241, 0.14)',
      border: 'rgba(99, 102, 241, 0.35)',
      text: theme.primaryLight,
    },
    success: {
      bg: theme.successBg,
      border: 'rgba(16, 185, 129, 0.35)',
      text: theme.success,
    },
    warning: {
      bg: theme.warningBg,
      border: 'rgba(245, 158, 11, 0.35)',
      text: theme.warning,
    },
    error: {
      bg: theme.errorBg,
      border: 'rgba(239, 68, 68, 0.35)',
      text: theme.error,
    },
    neutral: {
      bg: 'rgba(255, 255, 255, 0.06)',
      border: theme.surfaceBorder,
      text: theme.textSecondary,
    },
    secondary: {
      bg: 'rgba(139, 92, 246, 0.14)',
      border: 'rgba(139, 92, 246, 0.35)',
      text: '#C084FC',
    },
  };

  const current = variantStyles[variant];
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? spacing[1.5] : spacing[2],
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          isSm ? typography.overline : typography.caption,
          { color: current.text, fontWeight: '700' },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    letterSpacing: 0.3,
  },
});
