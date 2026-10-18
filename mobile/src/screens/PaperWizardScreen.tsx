import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { LockOverlay } from '../components/LockOverlay';
import { AppLayout } from '../components/ui/AppLayout';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { ExamType, ClassLevel, PaperGenerationConfig } from '../types';
import { radii, spacing, typography } from '../theme/tokens';

import { ExamPatternCards } from './PaperWizard/ExamPatternCards';
import { ClassSelector } from './PaperWizard/ClassSelector';
import { ChapterSelectorSection } from './PaperWizard/ChapterSelectorSection';
import { PaperConfigForm } from './PaperWizard/PaperConfigForm';

export const PaperWizardScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { user, subscription } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const preselected = route.params?.preselectedExam as ExamType | undefined;

  const [examType, setExamType] = useState<ExamType>(preselected || 'NEET');
  const [selectedClasses, setSelectedClasses] = useState<ClassLevel[]>(['11', '12']);
  const [paperTitle, setPaperTitle] = useState(`${user?.subject || 'Chemistry'} Mock Examination 2026`);
  const [institution, setInstitution] = useState(user?.institution || 'Academic Science Academy');
  const [includeKey, setIncludeKey] = useState(true);
  const [includeSolutions, setIncludeSolutions] = useState(true);

  // Custom parameters
  const [customQuestionCount, setCustomQuestionCount] = useState('30');
  const [customDuration, setCustomDuration] = useState('60');

  // Chapters list
  const [chapters, setChapters] = useState<{ name: string; count: number }[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [isFullSyllabus, setIsFullSyllabus] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Enforce subscription
  if (!subscription?.isActive) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Paper Generator" />
        <LockOverlay
          title="Question Paper Generator Locked"
          description={`Your ${user?.subject} paper generation engine is locked. An active ₹299 monthly subscription is required.`}
          onRenewPress={() => navigation.navigate('Subscription')}
        />
      </View>
    );
  }

  // Load chapters for teacher's subject
  useEffect(() => {
    async function loadChapters() {
      setLoadingChapters(true);
      try {
        const res = await api.getChapters('both');
        if (res.chapters) setChapters(res.chapters);
      } catch (err: any) {
        console.warn('Error loading chapters:', err);
      } finally {
        setLoadingChapters(false);
      }
    }
    loadChapters();
  }, []);

  const toggleChapter = (name: string) => {
    setIsFullSyllabus(false);
    if (selectedChapters.includes(name)) {
      setSelectedChapters((prev) => prev.filter((c) => c !== name));
    } else {
      setSelectedChapters((prev) => [...prev, name]);
    }
  };

  const resetToAll = () => {
    setSelectedChapters([]);
    setIsFullSyllabus(true);
  };

  const toggleClassLevel = (lvl: ClassLevel) => {
    if (selectedClasses.includes(lvl)) {
      if (selectedClasses.length === 1) {
        showToast('Please keep at least one class level selected.', 'warning');
        return;
      }
      setSelectedClasses((prev) => prev.filter((c) => c !== lvl));
    } else {
      setSelectedClasses((prev) => [...prev, lvl]);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const config: PaperGenerationConfig = {
        title: paperTitle.trim() || `${user?.subject || 'Chemistry'} Test Paper`,
        institution_name: institution.trim() || 'Academic Institute',
        exam_type: examType,
        subject: user?.subject || 'Chemistry',
        class_levels: selectedClasses,
        chapters: isFullSyllabus ? [] : selectedChapters,
        total_questions:
          examType === 'CET'
            ? 60
            : examType === 'NEET'
            ? 50
            : examType === 'JEE'
            ? 30
            : parseInt(customQuestionCount, 10) || 30,
        duration_minutes:
          examType === 'CET'
            ? 80
            : examType === 'NEET'
            ? 50
            : examType === 'JEE'
            ? 60
            : parseInt(customDuration, 10) || 60,
        marks_per_question: examType === 'CET' ? 1 : 4,
        negative_marking: examType === 'CET' ? 0 : 1,
        include_answer_key: includeKey,
        include_solutions: includeSolutions,
      };

      const res = await api.generatePaper(config);
      if (res && res.paper) {
        navigation.navigate('PaperReview', { paper: res.paper });
      } else {
        throw new Error('Paper generation returned an empty result.');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not compile paper. Please retry.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const getStatsBadge = () => {
    if (examType === 'NEET') return '50 Questions (35 Sec A + 15 Sec B) • 180 Marks • 50 Mins';
    if (examType === 'JEE') return '30 Questions (20 MCQs + 10 Num) • 100 Marks • 60 Mins';
    if (examType === 'CET') return '60 Objective MCQs • 60 Marks • 80 Mins • 0 Neg';
    return `${customQuestionCount} Custom Questions • ${customDuration} Mins`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Question Paper Generator"
        subtitle={`2026 Examination Patterns • ${user?.subject || 'Chemistry'}`}
      />

      <Toast toast={toast} onDismiss={hideToast} />

      <AppLayout scrollable contentContainerStyle={styles.scrollContent}>
        {/* Dynamic Live Spec Bar */}
        <View style={styles.specBanner}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.22)', 'rgba(236, 72, 153, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.specBannerGradient}
          >
            <Sparkles size={16} color="#A855F7" />
            <Text style={[styles.specBannerText, { color: theme.text }]}>
              {getStatsBadge()}
            </Text>
          </LinearGradient>
        </View>

        {/* STEP 1: Examination Pattern Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>STEP 01</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>2026 Examination Architecture</Text>
          </View>
          <ExamPatternCards selected={examType} onSelect={setExamType} />
        </View>

        {/* STEP 2: Class Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>STEP 02</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Target NCERT Curriculum</Text>
          </View>
          <ClassSelector
            selectedClasses={selectedClasses}
            onToggleClass={toggleClassLevel}
          />
        </View>

        {/* STEP 3: Chapter Coverage */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>STEP 03</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Syllabus Coverage</Text>
          </View>
          <ChapterSelectorSection
            isFullSyllabus={isFullSyllabus}
            setIsFullSyllabus={setIsFullSyllabus}
            selectedChapters={selectedChapters}
            onToggleChapter={toggleChapter}
            onResetToAll={resetToAll}
            chapters={chapters}
            loading={loadingChapters}
            subject={user?.subject || 'Chemistry'}
          />
        </View>

        {/* STEP 4: Paper Metadata & Toggles */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>STEP 04</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Paper Metadata & Toggles</Text>
          </View>
          <PaperConfigForm
            examType={examType}
            paperTitle={paperTitle}
            setPaperTitle={setPaperTitle}
            institution={institution}
            setInstitution={setInstitution}
            customQuestionCount={customQuestionCount}
            setCustomQuestionCount={setCustomQuestionCount}
            customDuration={customDuration}
            setCustomDuration={setCustomDuration}
            includeKey={includeKey}
            setIncludeKey={setIncludeKey}
            includeSolutions={includeSolutions}
            setIncludeSolutions={setIncludeSolutions}
          />
        </View>

        {/* Big Glowing Generate CTA */}
        <View style={styles.ctaWrapper}>
          <Button
            title={`Generate ${examType} 2026 Paper`}
            variant="primary"
            size="lg"
            loading={generating}
            onPress={handleGenerate}
            leftIcon={<Sparkles size={18} color="#FFFFFF" />}
            rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
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
  specBanner: {
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  specBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3.5],
    gap: spacing[2],
  },
  specBannerText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2.5],
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
  },
  ctaWrapper: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
});
