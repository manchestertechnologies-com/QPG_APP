import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stethoscope, Compass, Trophy, Sliders, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';
import { ExamType } from '../../types';

export interface ExamPatternCardsProps {
  selected: ExamType;
  onSelect: (type: ExamType) => void;
}

export const ExamPatternCards: React.FC<ExamPatternCardsProps> = ({ selected, onSelect }) => {
  const { theme } = useTheme();

  const patterns = [
    {
      id: 'NEET' as ExamType,
      name: 'NEET Architecture',
      spec: 'Direct 45 Compulsory Questions',
      marks: '180 Marks',
      marking: '+4 / -1 Marking',
      duration: '50 Minutes',
      icon: <Stethoscope size={18} color="#FFFFFF" />,
      color: '#6366F1',
    },
    {
      id: 'JEE' as ExamType,
      name: 'JEE MAIN Architecture',
      spec: '20 MCQs + 5 Numerical Questions',
      marks: '100 Marks',
      marking: '+4 / -1 Marking',
      duration: '60 Minutes',
      icon: <Compass size={18} color="#FFFFFF" />,
      color: '#A855F7',
    },
    {
      id: 'CUSTOM' as ExamType,
      name: 'Custom Faculty Practice',
      spec: 'User-defined questions, time, and marks',
      marks: 'Configurable',
      marking: 'Custom marking',
      duration: 'Flexible',
      icon: <Sliders size={18} color="#FFFFFF" />,
      color: '#EC4899',
    },
  ];

  return (
    <View style={styles.grid}>
      {patterns.map((item) => {
        const isSelected = selected === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.85}
            style={[
              styles.card,
              {
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : theme.surface,
                borderColor: isSelected ? item.color : theme.surfaceBorder,
                borderWidth: isSelected ? 1.5 : 1,
              },
            ]}
          >
            <View style={styles.topRow}>
              <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                {item.icon}
              </View>

              <View style={styles.titleCol}>
                <Text style={[styles.title, { color: isSelected ? theme.text : theme.textSecondary }]}>
                  {item.name}
                </Text>
                <Text style={[styles.spec, { color: theme.textMuted }]}>{item.spec}</Text>
              </View>

              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: item.color }]}>
                  <Check size={13} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </View>

            <View style={styles.pillsRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.marks}</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.marking}</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: spacing[2],
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing[3.5],
    cursor: 'pointer' as any,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCol: {
    flex: 1,
    marginLeft: spacing[3],
  },
  title: {
    ...typography.label,
    fontWeight: '700',
  },
  spec: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2.5],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2.5,
    borderRadius: radii.xs,
  },
  pillText: {
    color: '#94A3B8',
    ...typography.caption,
    fontWeight: '600',
  },
});
