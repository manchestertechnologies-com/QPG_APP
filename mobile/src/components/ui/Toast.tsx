import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography, shadows } from '../../theme/tokens';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type?: ToastType;
  message: string;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  onDismiss,
  style,
}) => {
  const { theme } = useTheme();

  const config = {
    success: {
      icon: <CheckCircle2 size={18} color={theme.success} />,
      bg: theme.successBg,
      border: 'rgba(16, 185, 129, 0.35)',
      text: theme.success,
    },
    error: {
      icon: <AlertCircle size={18} color={theme.error} />,
      bg: theme.errorBg,
      border: 'rgba(239, 68, 68, 0.35)',
      text: theme.error,
    },
    warning: {
      icon: <AlertTriangle size={18} color={theme.warning} />,
      bg: theme.warningBg,
      border: 'rgba(245, 158, 11, 0.35)',
      text: theme.warning,
    },
    info: {
      icon: <Info size={18} color={theme.primaryLight} />,
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.35)',
      text: theme.primaryLight,
    },
  };

  const current = config[type];

  return (
    <View
      style={[
        styles.toast,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
        },
        shadows.subtle,
        style,
      ]}
    >
      <View style={styles.icon}>{current.icon}</View>
      <Text style={[styles.message, { color: current.text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={15} color={current.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    marginVertical: spacing[1.5],
  },
  icon: {
    marginRight: spacing[2.5],
  },
  message: {
    flex: 1,
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  dismissBtn: {
    marginLeft: spacing[2],
    padding: spacing[0.5],
    cursor: 'pointer' as any,
  },
});
