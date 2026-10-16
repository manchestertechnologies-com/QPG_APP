import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MathRenderer } from '../components/MathRenderer';
import { LocalStorageService } from '../services/localStorageService';
import { GeneratedPaper, Question } from '../types';

export const PaperReviewScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const initialPaper = route.params?.paper as GeneratedPaper;

  const [paper, setPaper] = useState<GeneratedPaper>(initialPaper);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!paper) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title="Paper Review" />
        <View style={styles.centerBox}>
          <Text style={{ color: theme.textSecondary }}>No paper data provided.</Text>
        </View>
      </View>
    );
  }

  const handleSaveToLocalStorage = async () => {
    setSaving(true);
    try {
      await LocalStorageService.savePaper(paper);
      setSavedSuccess(true);
      Alert.alert('Saved Locally', 'Question paper successfully saved into device storage.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save paper to local storage.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = () => {
    navigation.navigate('PdfPreview', { paper });
  };

  const removeQuestion = (secIndex: number, qIndex: number) => {
    Alert.alert('Remove Question', 'Are you sure you want to remove this question?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = { ...paper };
          updated.sections[secIndex].questions.splice(qIndex, 1);
          updated.questions_count = updated.sections.reduce((acc, s) => acc + s.questions.length, 0);
          setPaper({ ...updated });
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Review & Customize Paper"
        subtitle={`${paper.exam_type} 2026 • ${paper.questions_count} Questions • ${paper.total_marks} Marks`}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Paper Overview Card */}
        <Card highlight>
          <Text style={[styles.paperTitle, { color: theme.text }]}>{paper.title}</Text>
          <Text style={[styles.instName, { color: theme.primary }]}>{paper.institution_name}</Text>
          
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaVal, { color: theme.text }]}>{paper.subject}</Text>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Subject</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaVal, { color: theme.text }]}>{paper.duration_minutes} Mins</Text>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Duration</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaVal, { color: theme.text }]}>{paper.total_marks}</Text>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Total Marks</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons Top */}
        <View style={styles.actionRow}>
          <Button
            title={savedSuccess ? '✓ Saved Locally' : 'Save to Device Storage'}
            onPress={handleSaveToLocalStorage}
            variant={savedSuccess ? 'secondary' : 'outline'}
            loading={saving}
            style={{ flex: 1 }}
          />
          <Button
            title="Export PDF →"
            onPress={handleExportPdf}
            variant="primary"
            style={{ flex: 1 }}
          />
        </View>

        {/* Sections and Questions */}
        {paper.sections.map((sec, secIdx) => (
          <View key={secIdx} style={styles.sectionBlock}>
            <View style={[styles.secHeader, { backgroundColor: theme.surfaceLight }]}>
              <Text style={[styles.secName, { color: theme.primary }]}>{sec.name}</Text>
              <Text style={[styles.secMeta, { color: theme.textSecondary }]}>
                {sec.questions.length} Questions | Attempt: {sec.attempt_count}
              </Text>
            </View>

            {sec.questions.map((q, qIdx) => (
              <View
                key={q.id + qIdx}
                style={[
                  styles.qCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                ]}
              >
                <View style={styles.qTopRow}>
                  <Text style={[styles.qNum, { color: theme.primary }]}>Q.{qIdx + 1}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.tagText, { color: theme.textMuted }]}>{q.chapter}</Text>
                    <Text style={[styles.diffTag, { color: q.difficulty === 'Easy' ? theme.success : q.difficulty === 'Hard' ? theme.error : theme.warning }]}>
                      {q.difficulty}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeQuestion(secIdx, qIdx)}>
                    <Text style={{ color: theme.error, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <MathRenderer content={q.question} fontSize={14} lineHeight={20} />

                {/* Options */}
                {q.opt_a && (
                  <View style={styles.optGrid}>
                    <Text style={[styles.optRow, { color: theme.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: theme.primary }}>(A) </Text>
                      {q.opt_a}
                    </Text>
                    <Text style={[styles.optRow, { color: theme.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: theme.primary }}>(B) </Text>
                      {q.opt_b}
                    </Text>
                    <Text style={[styles.optRow, { color: theme.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: theme.primary }}>(C) </Text>
                      {q.opt_c}
                    </Text>
                    <Text style={[styles.optRow, { color: theme.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: theme.primary }}>(D) </Text>
                      {q.opt_d}
                    </Text>
                  </View>
                )}

                {/* Answer Key Indicator */}
                <View style={styles.qBottomRow}>
                  <Text style={[styles.correctAnswerText, { color: theme.success }]}>
                    Correct Option: {q.correct_option || q.num_answer || 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <Button
            title="Preview & Export Examination PDF"
            onPress={handleExportPdf}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paperTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  instName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.15)',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  metaLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  sectionBlock: {
    marginVertical: 10,
  },
  secHeader: {
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  secName: {
    fontSize: 13,
    fontWeight: '800',
  },
  secMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  qCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  qTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  qNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  diffTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  optGrid: {
    marginTop: 8,
    gap: 4,
    paddingLeft: 4,
  },
  optRow: {
    fontSize: 12,
  },
  qBottomRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.1)',
  },
  correctAnswerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomCta: {
    marginTop: 16,
  },
});
