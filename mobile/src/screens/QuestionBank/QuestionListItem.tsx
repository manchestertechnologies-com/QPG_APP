import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { MathRenderer } from '../../components/MathRenderer';
import { radii, spacing, typography } from '../../theme/tokens';
import { Question } from '../../types';

export interface QuestionListItemProps {
  question: Question;
  onPress: () => void;
}

export const QuestionListItem: React.FC<QuestionListItemProps> = ({ question, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Badge label={`Class ${question.klass}`} variant="primary" size="sm" />
          <Badge label={question.chapter} variant="outline" size="sm" />
        </View>

        <Badge
          label={question.difficulty?.toUpperCase()}
          variant="difficulty"
          difficulty={question.difficulty}
          size="sm"
        />
      </View>

      <View style={styles.contentWrap}>
        <MathRenderer content={question.question} fontSize={14.5} lineHeight={22} />
      </View>

      {/* Options Preview */}
      {(question.opt_a || question.opt_b) && (
        <View style={styles.optionsWrap}>
          {question.opt_a && (
            <View style={styles.previewOptRow}>
              <Text style={[styles.optLetter, { color: theme.primaryLight }]}> (A) </Text>
              <Text style={[styles.optText, { color: theme.textSecondary }]} numberOfLines={1}>
                {question.opt_a}
              </Text>
            </View>
          )}
          {question.opt_b && (
            <View style={styles.previewOptRow}>
              <Text style={[styles.optLetter, { color: theme.primaryLight }]}> (B) </Text>
              <Text style={[styles.optText, { color: theme.textSecondary }]} numberOfLines={1}>
                {question.opt_b}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.footerRow, { borderTopColor: theme.divider }]}>
        <Text style={[styles.examTags, { color: theme.textMuted }]}>
          {question.exams?.join(' • ') || 'NEET • JEE'}
        </Text>
        <View style={styles.ctaRow}>
          <Text style={[styles.ctaText, { color: theme.primaryLight }]}>View Details & Solution</Text>
          <ChevronRight size={14} color={theme.primaryLight} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[3],
    cursor: 'pointer' as any,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2.5],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    flex: 1,
    flexWrap: 'wrap',
    marginRight: spacing[2],
  },
  contentWrap: {
    marginBottom: spacing[2.5],
  },
  optionsWrap: {
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  previewOptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optLetter: {
    fontSize: 12,
    fontWeight: '800',
  },
  optText: {
    ...typography.bodySmall,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[2.5],
    borderTopWidth: 1,
  },
  examTags: {
    ...typography.caption,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ctaText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
