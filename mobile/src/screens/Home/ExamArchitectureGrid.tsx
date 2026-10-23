import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stethoscope, Compass, Trophy, ArrowRight, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';
import { ExamType } from '../../types';

export interface ExamArchitectureGridProps {
  onSelectExam: (exam: ExamType) => void;
  filter: 'ALL' | 'NEET' | 'JEE' | 'CET';
}

export const ExamArchitectureGrid: React.FC<ExamArchitectureGridProps> = ({
  onSelectExam,
  filter,
}) => {
  const { theme } = useTheme();

  const architectures = [
    {
      id: 'NEET' as ExamType,
      name: 'NEET 2026 Architecture',
      spec: '35 Sec A + 15 Sec B (Attempt 10)',
      marks: '180 Marks • +4 / -1 Marking',
      duration: '50 Minutes',
      icon: <Stethoscope size={20} color="#6366F1" />,
      color: '#6366F1',
      show: filter === 'ALL' || filter === 'NEET',
    },
    {
      id: 'JEE' as ExamType,
      name: 'JEE MAIN Architecture',
      spec: '20 MCQs + 5 Numerical Questions',
      marks: '100 Marks • +4 / -1 Marking',
      duration: '60 Minutes',
      icon: <Compass size={20} color="#A855F7" />,
      color: '#A855F7',
      show: filter === 'ALL' || filter === 'JEE',
    },
    {
      id: 'KCET' as ExamType,
      name: 'KCET Architecture',
      spec: 'Direct 60 Compulsory MCQs',
      marks: '60 Marks • 0 Negative Marking',
      duration: '80 Minutes',
      icon: <Trophy size={20} color="#10B981" />,
      color: '#10B981',
      show: filter === 'ALL' || filter === 'KCET',
    },
  ];

  return (
    <View style={styles.container}>
      {architectures
        .filter((a) => a.show)
        .map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelectExam(item.id)}
            activeOpacity={0.85}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
              },
            ]}
          >
            <View style={styles.topRow}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '18' }]}>
                {item.icon}
              </View>

              <View style={styles.textCol}>
                <Text style={[styles.title, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.specText, { color: theme.textSecondary }]}>
                  {item.spec}
                </Text>
              </View>

              <View style={styles.arrowCircle}>
                <ArrowRight size={15} color={theme.textMuted} />
              </View>
            </View>

            <View style={styles.footerRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.marks}</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[2.5],
    marginVertical: spacing[1.5],
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[3.5],
    cursor: 'pointer' as any,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
    marginLeft: spacing[3],
  },
  title: {
    ...typography.label,
    fontWeight: '700',
  },
  specText: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingTop: spacing[2.5],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  pillText: {
    color: '#94A3B8',
    ...typography.caption,
    fontWeight: '600',
  },
});
