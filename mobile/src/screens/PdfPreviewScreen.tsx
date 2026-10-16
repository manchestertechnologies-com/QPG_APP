import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
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
  const [pdfUri, setPdfUri] = useState<string | null>(null);

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
    try {
      let uri = pdfUri;
      if (!uri) {
        const result = await PdfExportService.generatePdf(paper, true, true);
        uri = result.uri;
        setPdfUri(uri);
      }
      await PdfExportService.sharePdf(uri, `${paper.title}.pdf`);
    } catch (err: any) {
      Alert.alert('PDF Export Error', err.message || 'Could not export PDF document.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await PdfExportService.printDirectly(paper, true, true);
    } catch (err: any) {
      Alert.alert('Print Error', err.message || 'Could not send document to printer.');
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Document Information Card */}
        <Card highlight>
          <View style={styles.pdfBadgeRow}>
            <View style={[styles.pdfBadge, { backgroundColor: theme.errorBg, borderColor: theme.error }]}>
              <Text style={[styles.pdfBadgeText, { color: theme.error }]}>SECURE PDF ONLY</Text>
            </View>
            <Text style={[styles.formatNotice, { color: theme.textMuted }]}>
              DOCX / Word exports are strictly disabled
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{paper.title}</Text>
          <Text style={[styles.inst, { color: theme.primary }]}>{paper.institution_name}</Text>

          <View style={styles.specsGrid}>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textSecondary }]}>Pattern:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.exam_type} 2026</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textSecondary }]}>Subject:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.subject}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textSecondary }]}>Questions:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.questions_count}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textSecondary }]}>Total Marks:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.total_marks}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, { color: theme.textSecondary }]}>Time Allowed:</Text>
              <Text style={[styles.specVal, { color: theme.text }]}>{paper.duration_minutes} Minutes</Text>
            </View>
          </View>
        </Card>

        {/* Paper Features Checklist */}
        <Card style={{ marginVertical: 12 }}>
          <Text style={[styles.featuresTitle, { color: theme.text }]}>Included Examination Features:</Text>
          <View style={styles.featureItem}>
            <Text style={{ color: theme.success, fontWeight: '700' }}>✓</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Configurable Institutional Header & Meta Bar
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={{ color: theme.success, fontWeight: '700' }}>✓</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Official 2026 Examination General Instructions
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={{ color: theme.success, fontWeight: '700' }}>✓</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Vector-Sharp KaTeX Mathematical Equations & Chemical Formulas
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={{ color: theme.success, fontWeight: '700' }}>✓</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              High-Resolution Embedded Diagram Illustrations
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={{ color: theme.success, fontWeight: '700' }}>✓</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Official Answer Key & Evaluation Grid Table
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={{ color: theme.success, fontWeight: '700' }}>✓</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              Step-by-Step Mathematical Solutions
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.btnCol}>
          <Button
            title="Download & Share PDF File"
            onPress={handleGenerateAndShare}
            variant="primary"
            loading={generating}
          />

          <Button
            title="Direct AirPrint / WiFi Print"
            onPress={handlePrint}
            variant="outline"
            loading={printing}
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
  pdfBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pdfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  pdfBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  formatNotice: {
    fontSize: 11,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  inst: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  specsGrid: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.15)',
    gap: 6,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specKey: {
    fontSize: 12,
  },
  specVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  featureText: {
    fontSize: 12,
  },
  btnCol: {
    marginTop: 14,
    gap: 10,
  },
});
