import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Printer,
  Download,
  Share2,
  FileCheck,
  ShieldCheck,
  Check,
  AlertCircle,
  Eye,
  ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { PdfExportService } from '../services/pdfExportService';
import { GeneratedPaper } from '../types';

export const PdfPreviewScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const paper = route.params?.paper as GeneratedPaper;

  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!paper) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title="PDF Preview" />
        <View style={styles.centerBox}>
          <Text style={{ color: theme.textSecondary }}>No paper data provided.</Text>
        </View>
      </View>
    );
  }

  const handleGenerateAndShare = async () => {
    setGenerating(true);
    setErrorMessage(null);
    try {
      const result = await PdfExportService.generatePdf(paper, true, true);
      await PdfExportService.sharePdf(result.uri, `${paper.title}.pdf`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not export PDF document.');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`PDF Notice: ${err.message || 'Unable to open share dialog.'}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    setErrorMessage(null);
    try {
      await PdfExportService.printDirectly(paper, true, true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send document to printer.');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Print Notice: ${err.message || 'Unable to print.'}`);
      }
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="PDF Examination Paper"
        subtitle="Publication-Grade Vector PDF (PDF Only)"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Error banner if any */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Document Header Card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.topBadgeRow}>
            <View style={styles.pdfBadge}>
              <Text style={styles.pdfBadgeText}>VECTOR PDF EXPORT</Text>
            </View>
            <View style={styles.docxBlocked}>
              <Text style={styles.docxBlockedText}>DOCX / WORD DISABLED</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{paper.title}</Text>
          <Text style={[styles.inst, { color: theme.primaryLight }]}>{paper.institution_name}</Text>

          <View style={styles.specsGrid}>
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
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textMuted }]}>Time Duration:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.duration_minutes} Minutes</Text>
            </View>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Publication Specifications:</Text>
          <View style={styles.specList}>
            {[
              'Institutional Custom Header & Examination Code',
              'Official 2026 General Candidate Instructions',
              'Vector-Sharp KaTeX Formulas & Balanced Chemical Reactions',
              'Clean 2-Column Responsive Objective Options',
              'End-of-Test 5-Column Answer Key Grid Table',
              'Faculty Step-by-Step Solutions & Reasoning',
            ].map((item, idx) => (
              <View key={idx} style={styles.specItem}>
                <View style={styles.checkIcon}>
                  <Check size={12} color="#10B981" strokeWidth={3} />
                </View>
                <Text style={[styles.specItemText, { color: theme.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            onPress={handlePrint}
            disabled={printing}
            activeOpacity={0.85}
            style={styles.actionBtnPrimary}
          >
            <LinearGradient
              colors={['#6366F1', '#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
              pointerEvents="none"
            >
              {printing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Printer size={18} color="#FFFFFF" />
                  <Text style={styles.btnTextPrimary}>Print / Save as PDF Document</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGenerateAndShare}
            disabled={generating}
            activeOpacity={0.8}
            style={[styles.actionBtnSecondary, { borderColor: theme.surfaceBorder, backgroundColor: theme.surface }]}
          >
            {generating ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <>
                <Share2 size={18} color={theme.text} />
                <Text style={[styles.btnTextSecondary, { color: theme.text }]}>Open / Share Document</Text>
              </>
            )}
          </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pdfBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pdfBadgeText: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  docxBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  docxBlockedText: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  inst: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 3,
  },
  specsGrid: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specKey: {
    fontSize: 12.5,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  specList: {
    gap: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specItemText: {
    fontSize: 12.5,
    flex: 1,
  },
  actionsWrap: {
    marginTop: 6,
    gap: 10,
  },
  actionBtnPrimary: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    cursor: 'pointer' as any,
  },
  btnGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  actionBtnSecondary: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer' as any,
  },
  btnTextSecondary: {
    fontSize: 14,
    fontWeight: '800',
  },
});
