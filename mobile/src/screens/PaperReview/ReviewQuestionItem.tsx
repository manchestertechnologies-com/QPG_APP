import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { MathRenderer } from '../../components/MathRenderer';
import { radii, spacing, typography } from '../../theme/tokens';
import { Question } from '../../types';

export interface ReviewQuestionItemProps {
  question: Question;
  index: number;
  onRemove: () => void;
}

export const ReviewQuestionItem: React.FC<ReviewQuestionItemProps> = ({
  question,
  index,
  onRemove,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={[styles.qBadge, { backgroundColor: theme.surfaceLight }]}>
          <Text style={[styles.qNum, { color: theme.primaryLight }]}>Q.{index + 1}</Text>
        </View>

        <View style={styles.metaBadges}>
          <Badge label={question.chapter} variant="outline" size="sm" />
          <Badge
            label={question.difficulty?.toUpperCase()}
            variant="difficulty"
            difficulty={question.difficulty}
            size="sm"
          />
        </View>

        <TouchableOpacity
          onPress={onRemove}
          style={styles.trashBtn}
          activeOpacity={0.7}
        >
          <Trash2 size={15} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Question Content */}
      <View style={styles.contentWrap}>
        <MathRenderer content={question.question} fontSize={14.5} lineHeight={22} />
      </View>

      {/* Options if MCQ */}
      {question.opt_a && (
        <View style={styles.optionsGrid}>
          {(['A', 'B', 'C', 'D'] as const).map((letter) => {
            const optText =
              letter === 'A'
                ? question.opt_a
                : letter === 'B'
                ? question.opt_b
                : letter === 'C'
                ? question.opt_c
                : question.opt_d;

            if (!optText) return null;
            const isCorrect = question.correct_option === letter;

            return (
              <View
                key={letter}
                style={[
                  styles.optCard,
                  {
                    backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.08)' : theme.surfaceLight,
                    borderColor: isCorrect ? theme.success : theme.surfaceBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optLetter,
                    { color: isCorrect ? theme.success : theme.textSecondary },
                  ]}
                >
                  ({letter})
                </Text>
                <Text
                  style={[
                    styles.optText,
                    { color: isCorrect ? theme.success : theme.text },
                  ]}
                >
                  {optText}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Numerical Answer */}
      {question.q_type === 'numerical' && (
        <View style={[styles.numericalBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: theme.success }]}>
          <Text style={[styles.numericalLabel, { color: theme.textSecondary }]}>
            Numerical Answer:{' '}
            <Text style={{ color: theme.success, fontWeight: '800' }}>
              {question.correct_option || question.num_answer}
            </Text>
          </Text>
        </View>
      )}

      {/* Solution Box */}
      {question.solution_text && (
        <View style={[styles.solutionBox, { backgroundColor: theme.surfaceLight, borderColor: theme.divider }]}>
          <Text style={[styles.solutionTitle, { color: theme.primaryLight }]}>
            Faculty Solution & Explanation:
          </Text>
          <MathRenderer content={question.solution_text} fontSize={13} lineHeight={19} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[3.5],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  qBadge: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  qNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaBadges: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  trashBtn: {
    padding: spacing[1.5],
    borderRadius: radii.sm,
    cursor: 'pointer' as any,
  },
  contentWrap: {
    marginBottom: spacing[3.5],
  },
  optionsGrid: {
    gap: spacing[2],
    marginBottom: spacing[2.5],
  },
  optCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing[2],
  },
  optLetter: {
    fontSize: 13,
    fontWeight: '800',
  },
  optText: {
    fontSize: 13.5,
    flex: 1,
    lineHeight: 18,
  },
  numericalBox: {
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing[2],
  },
  numericalLabel: {
    fontSize: 13,
  },
  solutionBox: {
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing[3],
  },
  solutionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: spacing[1.5],
    letterSpacing: 0.3,
  },
});
