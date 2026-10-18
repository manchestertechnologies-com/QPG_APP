import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { X, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MathRenderer } from '../../components/MathRenderer';
import { radii, spacing, typography } from '../../theme/tokens';
import { Question } from '../../types';

export interface QuestionDetailModalProps {
  question: Question | null;
  onClose: () => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({ question, onClose }) => {
  const { theme } = useTheme();
  const [showSolution, setShowSolution] = useState(true);

  if (!question) return null;

  return (
    <Modal visible={!!question} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <View style={styles.titleWrap}>
              <Text style={[styles.title, { color: theme.text }]}>Question Specification</Text>
              <Text style={[styles.subTitle, { color: theme.textMuted }]}>
                {question.exams?.join(' • ') || 'NEET • JEE'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Badges */}
            <View style={styles.badgeRow}>
              <Badge label={`Class ${question.klass}`} variant="primary" size="sm" />
              <Badge label={question.chapter} variant="outline" size="sm" />
              <Badge
                label={question.difficulty?.toUpperCase()}
                variant="difficulty"
                difficulty={question.difficulty}
                size="sm"
              />
            </View>

            {/* Question Text */}
            <View style={styles.questionBox}>
              <MathRenderer content={question.question} fontSize={15} lineHeight={23} />
            </View>

            {/* Options */}
            {(question.opt_a || question.opt_b) && (
              <View style={styles.optionsList}>
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
                      <View style={styles.optHeader}>
                        <Text
                          style={[
                            styles.optLetter,
                            { color: isCorrect ? theme.success : theme.primaryLight },
                          ]}
                        >
                          ({letter}) {isCorrect && '✓ CORRECT'}
                        </Text>
                      </View>
                      <MathRenderer content={optText} fontSize={14} lineHeight={20} />
                    </View>
                  );
                })}
              </View>
            )}

            {/* Numerical Answer */}
            {question.q_type === 'numerical' && (
              <View style={[styles.numericalBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: theme.success }]}>
                <Text style={[styles.numericalText, { color: theme.textSecondary }]}>
                  Numerical Answer:{' '}
                  <Text style={{ color: theme.success, fontWeight: '800' }}>
                    {question.correct_option || question.num_answer}
                  </Text>
                </Text>
              </View>
            )}

            {/* Faculty Solution */}
            {question.solution_text && (
              <View style={[styles.solutionBox, { backgroundColor: theme.surfaceLight, borderColor: theme.divider }]}>
                <TouchableOpacity
                  style={styles.solutionHeader}
                  onPress={() => setShowSolution((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <View style={styles.solutionTitleRow}>
                    <Sparkles size={15} color={theme.primaryLight} />
                    <Text style={[styles.solutionTitle, { color: theme.primaryLight }]}>
                      Faculty Solution & Reasoning
                    </Text>
                  </View>
                  {showSolution ? (
                    <ChevronUp size={16} color={theme.textMuted} />
                  ) : (
                    <ChevronDown size={16} color={theme.textMuted} />
                  )}
                </TouchableOpacity>

                {showSolution && (
                  <View style={styles.solutionContent}>
                    <MathRenderer content={question.solution_text} fontSize={13.5} lineHeight={21} />
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: theme.divider }]}>
            <Button title="Close Preview" variant="secondary" size="md" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalBox: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '85%',
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4.5],
    paddingVertical: spacing[3.5],
    borderBottomWidth: 1,
  },
  titleWrap: {
    gap: 2,
  },
  title: {
    ...typography.titleSmall,
    fontWeight: '700',
  },
  subTitle: {
    ...typography.caption,
  },
  closeBtn: {
    padding: spacing[1],
    cursor: 'pointer' as any,
  },
  scrollContent: {
    padding: spacing[4.5],
    paddingBottom: spacing[6],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[1.5],
    marginBottom: spacing[3.5],
  },
  questionBox: {
    marginBottom: spacing[4],
  },
  optionsList: {
    gap: spacing[2.5],
    marginBottom: spacing[4],
  },
  optCard: {
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  optHeader: {
    marginBottom: spacing[1],
  },
  optLetter: {
    fontSize: 12,
    fontWeight: '800',
  },
  numericalBox: {
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing[4],
  },
  numericalText: {
    ...typography.bodyMedium,
  },
  solutionBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  solutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3.5],
    cursor: 'pointer' as any,
  },
  solutionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  solutionTitle: {
    ...typography.label,
    fontWeight: '800',
  },
  solutionContent: {
    paddingHorizontal: spacing[3.5],
    paddingBottom: spacing[3.5],
  },
  footer: {
    padding: spacing[3.5],
    borderTopWidth: 1,
  },
});
