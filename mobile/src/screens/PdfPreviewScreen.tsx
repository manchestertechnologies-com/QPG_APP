import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Printer, Share2, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { AppLayout } from '../components/ui/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { PdfExportService } from '../services/pdfExportService';
import { GeneratedPaper } from '../types';
import { radii, spacing, typography } from '../theme/tokens';

export const PdfPreviewScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const paper = route.params?.paper as GeneratedPaper;

  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!paper) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title="PDF Preview" />
        <EmptyState
          title="No Paper Found"
          description="We couldn't find any paper to preview. Please return to Paper Generator."
          actionLabel="Go to Paper Wizard"
          onAction={() => navigation.navigate('PaperWizard')}
        />
      </View>
    );
  }

  const handleGenerateAndShare = async () => {
    setGenerating(true);
    try {
      const result = await PdfExportService.generatePdf(paper, true, true);
      await PdfExportService.sharePdf(result.uri, `${paper.title}.pdf`);
      showToast('Document ready for sharing.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not export PDF document.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await PdfExportService.printDirectly(paper, true, true);
      showToast('Print dialog initiated.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Could not send document to printer.', 'error');
    } finally {
      setPrinting(false);
    }
  };

  const publicationSpecs = [
    'Institutional Custom Header & Examination Code',
    'Official 2026 General Candidate Instructions',
    'Vector-Sharp KaTeX Formulas & Balanced Chemical Reactions',
    'Clean 2-Column Responsive Objective Options',
    'End-of-Test 5-Column Answer Key Grid Table',
    'Faculty Step-by-Step Solutions & Reasoning',
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="PDF Examination Paper"
        subtitle="Publication-Grade Vector PDF (PDF Only)"
      />

      <Toast toast={toast} onDismiss={hideToast} />

      <AppLayout scrollable contentContainerStyle={styles.scrollContent}>
        {/* Document Header Card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.topBadgeRow}>
            <Badge label="VECTOR PDF EXPORT" variant="primary" size="sm" />
            <Badge label="DOCX / WORD DISABLED" variant="danger" size="sm" />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{paper.title}</Text>
          <Text style={[styles.institution, { color: theme.primaryLight }]}>{paper.institution_name}</Text>

          <View style={[styles.specsTable, { borderTopColor: theme.divider }]}>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textMuted }]}>Pattern Architecture:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.exam_type} 2026</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textMuted }]}>Subject Specialization:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.subject}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textMuted }]}>Total Questions:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.questions_count}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textMuted }]}>Total Examination Marks:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.total_marks}</Text>
            </View>
            <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.specKey, { color: theme.textMuted }]}>Time Duration:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.duration_minutes} Minutes</Text>
            </View>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Publication Specifications:</Text>
          <View style={styles.specList}>
            {publicationSpecs.map((item, idx) => (
              <View key={idx} style={styles.specItem}>
                <View style={[styles.checkCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Check size={12} color={theme.success} strokeWidth={3} />
                </View>
                <Text style={[styles.specItemText, { color: theme.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsWrap}>
          <Button
            title="Print / Save as PDF Document"
            variant="primary"
            size="lg"
            loading={printing}
            onPress={handlePrint}
            leftIcon={<Printer size={18} color="#FFFFFF" />}
          />

          <Button
            title="Open / Share Document"
            variant="outline"
            size="md"
            loading={generating}
            onPress={handleGenerateAndShare}
            leftIcon={<Share2 size={18} color={theme.text} />}
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
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[4.5],
    marginBottom: spacing[4],
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
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
    marginBottom: spacing[3],
  },
  specsTable: {
    borderTopWidth: 1,
    paddingTop: spacing[2],
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  specKey: {
    ...typography.caption,
  },
  specVal: {
    ...typography.caption,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.label,
    fontWeight: '800',
    marginBottom: spacing[3],
  },
  specList: {
    gap: spacing[2.5],
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specItemText: {
    ...typography.bodySmall,
    flex: 1,
  },
  actionsWrap: {
    gap: spacing[3],
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
});
