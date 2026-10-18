import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string = string>({
  options,
  selectedId,
  onSelect,
  style,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isSelected = selectedId === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.8}
            style={[
              styles.segment,
              isSelected && {
                backgroundColor: theme.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: isSelected ? '700' : '600',
                },
              ]}
            >
              {opt.label}
            </Text>
            {opt.badge !== undefined && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.25)'
                      : theme.surfaceLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isSelected ? '#FFFFFF' : theme.textMuted },
                  ]}
                >
                  {opt.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.full,
    padding: spacing[1],
    borderWidth: 1,
    marginVertical: spacing[1.5],
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    cursor: 'pointer' as any,
  },
  label: {
    ...typography.label,
  },
  badge: {
    marginLeft: spacing[1.5],
    paddingHorizontal: spacing[1.5],
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
