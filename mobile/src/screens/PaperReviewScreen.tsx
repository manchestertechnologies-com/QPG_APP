import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bookmark, FileCheck, ArrowRight, Printer, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { AppLayout } from '../components/ui/AppLayout';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { LocalStorageService } from '../services/localStorageService';
import { GeneratedPaper } from '../types';
import { radii, spacing, typography } from '../theme/tokens';

import { ReviewHeaderCard } from './PaperReview/ReviewHeaderCard';
import { ReviewQuestionItem } from './PaperReview/ReviewQuestionItem';

export const PaperReviewScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const initialPaper = route.params?.paper as GeneratedPaper;

  const [paper, setPaper] = useState<GeneratedPaper>(initialPaper);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!paper) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title="Paper Review" />
        <EmptyState
          title="No Paper Found"
          description="We couldn't find any generated paper data. Please configure and generate a new paper."
          actionLabel="Go to Paper Wizard"
          onAction={() => navigation.navigate('PaperWizard')}
        />
      </View>
    );
  }

  const handleSaveToLocalStorage = async () => {
    setSaving(true);
    try {
      await LocalStorageService.savePaper(paper);
      setSavedSuccess(true);
      showToast('Paper successfully saved into your local device vault!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not save paper to local storage.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = () => {
    navigation.navigate('PdfPreview', { paper });
  };

  const removeQuestion = (secIndex: number, qIndex: number) => {
    const updated = { ...paper };
    updated.sections[secIndex].questions.splice(qIndex, 1);
    updated.questions_count = updated.sections.reduce((acc, s) => acc + s.questions.length, 0);
    setPaper({ ...updated });
    showToast('Question removed from paper.', 'info');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Review & Customize"
        subtitle={`${paper.exam_type} 2026 • ${paper.questions_count} Questions • ${paper.total_marks} Marks`}
      />

      <Toast toast={toast} onDismiss={hideToast} />

      <AppLayout scrollable contentContainerStyle={styles.scrollContent}>
        {/* Luxury Overview Card */}
        <ReviewHeaderCard paper={paper} />

        {/* Action Controls */}
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <Button
              title={savedSuccess ? 'Saved in Vault' : 'Save to Vault'}
              variant={savedSuccess ? 'outline' : 'secondary'}
              size="md"
              loading={saving}
              onPress={handleSaveToLocalStorage}
              leftIcon={<Bookmark size={16} color={savedSuccess ? theme.success : theme.text} />}
            />
          </View>
          <View style={{ flex: 1.2 }}>
            <Button
              title="Export Vector PDF"
              variant="primary"
              size="md"
              onPress={handleExportPdf}
              leftIcon={<FileCheck size={16} color="#FFFFFF" />}
              rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
            />
          </View>
        </View>

        {/* Sections and Questions */}
        {paper.sections.map((sec, secIdx) => (
          <View key={secIdx} style={styles.sectionWrap}>
            <View style={[styles.secHeader, { backgroundColor: theme.surfaceLight, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.secTitle, { color: theme.primaryLight }]}>
                {sec.name.toUpperCase()}
              </Text>
              <Text style={[styles.secMeta, { color: theme.textSecondary }]}>
                {sec.questions.length} Questions • Attempt {sec.attempt_count} • (+{sec.marks_per_question}, -{sec.negative_marking})
              </Text>
            </View>

            {sec.questions.map((q, qIdx) => (
              <ReviewQuestionItem
                key={`${q.id}_${qIdx}`}
                question={q}
                index={qIdx}
                onRemove={() => removeQuestion(secIdx, qIdx)}
              />
            ))}
          </View>
        ))}

        {/* Bottom Primary Export Button */}
        <View style={styles.bottomCta}>
          <Button
            title="Generate Vector PDF Paper"
            variant="primary"
            size="lg"
            onPress={handleExportPdf}
            leftIcon={<Printer size={20} color="#FFFFFF" />}
          />
        </View>
      </AppLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[12],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2.5],
    marginBottom: spacing[4.5],
  },
  sectionWrap: {
    marginBottom: spacing[4],
  },
  secHeader: {
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3.5],
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  secTitle: {
    ...typography.label,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secMeta: {
    ...typography.caption,
  },
  bottomCta: {
    marginTop: spacing[3],
    marginBottom: spacing[6],
  },
});
