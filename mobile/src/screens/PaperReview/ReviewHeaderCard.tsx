import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { radii, spacing, typography } from '../../theme/tokens';
import { GeneratedPaper } from '../../types';

export interface ReviewHeaderCardProps {
  paper: GeneratedPaper;
}

export const ReviewHeaderCard: React.FC<ReviewHeaderCardProps> = ({ paper }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.16)', 'rgba(236, 72, 153, 0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.tagRow}>
          <Badge label={`${paper.exam_type} 2026`} variant="exam" examType={paper.exam_type} />
          <Badge label="VERIFIED PATTERN" variant="success" size="sm" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{paper.title}</Text>
        <Text style={[styles.institution, { color: theme.primaryLight }]}>{paper.institution_name}</Text>

        <View style={[styles.metaGrid, { borderTopColor: theme.divider }]}>
          <View style={styles.metaCol}>
            <Text style={[styles.metaVal, { color: theme.text }]}>{paper.subject}</Text>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Subject</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaVal, { color: theme.text }]}>{paper.duration_minutes} Mins</Text>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Duration</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaVal, { color: theme.text }]}>{paper.total_marks}</Text>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Total Marks</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaVal, { color: theme.text }]}>{paper.questions_count}</Text>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Questions</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  gradient: {
    padding: spacing[4.5],
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2.5],
  },
  title: {
    ...typography.titleMedium,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  institution: {
    ...typography.bodyMedium,
    fontWeight: '600',
    marginTop: spacing[1],
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
  },
  metaCol: {
    alignItems: 'center',
  },
  metaVal: {
    ...typography.label,
    fontWeight: '800',
  },
  metaLabel: {
    ...typography.caption,
    marginTop: 2,
  },
});
