import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography, shadows } from '../../theme/tokens';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  rightIcon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const { theme } = useTheme();

  const isInteractiveDisabled = disabled || loading;

  const sizeStyles = {
    sm: {
      paddingVertical: spacing[1.5],
      paddingHorizontal: spacing[3],
      height: 36,
      fontSize: typography.bodySmall.fontSize,
    },
    md: {
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing[4],
      height: 46,
      fontSize: typography.label.fontSize,
    },
    lg: {
      paddingVertical: spacing[3.5],
      paddingHorizontal: spacing[5],
      height: 52,
      fontSize: typography.titleSmall.fontSize,
    },
  };

  const currentSize = sizeStyles[size];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isInteractiveDisabled}
        activeOpacity={0.82}
        style={[
          styles.base,
          { width: fullWidth ? '100%' : 'auto' },
          shadows.glowPrimary,
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={disabled ? ['#334155', '#1E293B'] : (theme.gradientPrimary as [string, string, string])}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal },
          ]}
          pointerEvents="none"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.contentRow}>
              {icon && <View style={styles.leftIcon}>{icon}</View>}
              <Text
                style={[
                  styles.btnText,
                  { fontSize: currentSize.fontSize, color: '#FFFFFF' },
                  textStyle,
                ]}
              >
                {title}
              </Text>
              {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  let bg = theme.surfaceLight;
  let textCol = theme.text;
  let border = 'transparent';

  if (variant === 'outline') {
    bg = 'transparent';
    border = theme.surfaceBorder;
    textCol = theme.text;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    border = 'transparent';
    textCol = theme.primaryLight;
  } else if (variant === 'danger') {
    bg = theme.errorBg;
    border = 'rgba(239, 68, 68, 0.35)';
    textCol = theme.error;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInteractiveDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border !== 'transparent' ? 1 : 0,
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          width: fullWidth ? '100%' : 'auto',
          justifyContent: 'center',
          alignItems: 'center',
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textCol} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.leftIcon}>{icon}</View>}
          <Text
            style={[
              styles.btnText,
              { fontSize: currentSize.fontSize, color: textCol },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    overflow: 'hidden',
    marginVertical: spacing[1],
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
  },
  gradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  rightIcon: {
    marginLeft: spacing[2],
  },
  btnText: {
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  disabled: {
    opacity: 0.5,
  },
});
