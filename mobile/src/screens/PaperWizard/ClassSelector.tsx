import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';
import { ClassLevel } from '../../types';

export interface ClassSelectorProps {
  selectedClasses: ClassLevel[];
  onToggleClass: (lvl: ClassLevel) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  selectedClasses,
  onToggleClass,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      {(['11', '12'] as const).map((lvl) => {
        const isSelected = selectedClasses.includes(lvl);
        return (
          <TouchableOpacity
            key={lvl}
            onPress={() => onToggleClass(lvl)}
            activeOpacity={0.8}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : theme.surface,
                borderColor: isSelected ? theme.primary : theme.surfaceBorder,
              },
            ]}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? theme.primary : 'transparent',
                  borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                },
              ]}
            >
              {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
            </View>
            <Text
              style={[
                styles.label,
                { color: isSelected ? theme.primaryLight : theme.text },
              ]}
            >
              Class {lvl} Syllabus
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[2.5],
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3.5],
    borderRadius: radii.md,
    borderWidth: 1.2,
    gap: spacing[2.5],
    cursor: 'pointer' as any,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...typography.label,
  },
});
