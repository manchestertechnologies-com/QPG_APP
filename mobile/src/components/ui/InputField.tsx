import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

export interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string | null;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  showClear?: boolean;
  onClear?: () => void;
  containerStyle?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  hint,
  leftIcon,
  isPassword = false,
  showClear = false,
  onClear,
  containerStyle,
  style,
  value,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = Boolean(value && value.length > 0);

  const getBorderColor = () => {
    if (error) return theme.error;
    if (isFocused) return theme.primary;
    return theme.inputBorder;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBg,
            borderColor: getBorderColor(),
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          {...props}
        />

        {showClear && hasValue && onClear && (
          <TouchableOpacity
            onPress={onClear}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={theme.textMuted} />
            ) : (
              <Eye size={18} color={theme.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={[styles.feedbackText, { color: theme.error }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.feedbackText, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing[1.5],
  },
  labelRow: {
    marginBottom: spacing[1],
  },
  label: {
    ...typography.label,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    height: 48,
  },
  leftIcon: {
    marginRight: spacing[2.5],
  },
  input: {
    flex: 1,
    height: '100%',
    ...typography.bodyMedium,
  },
  actionBtn: {
    padding: spacing[1],
    marginLeft: spacing[1.5],
    cursor: 'pointer' as any,
  },
  feedbackText: {
    ...typography.caption,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
});
