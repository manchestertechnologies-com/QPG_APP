import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, ArrowRight, Crown, Bookmark, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AppLayout } from '../components/ui/AppLayout';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { LocalStorageService } from '../services/localStorageService';
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
  const [localPaperCount, setLocalPaperCount] = useState(0);

  const isPro = subscription?.isActive === true;
  const isTrialExhausted = !isPro && localPaperCount >= 1;

  // Check saved papers count to verify free trial usage
  useEffect(() => {
    async function checkFreeUsage() {
      try {
        const local = await LocalStorageService.getSavedPapers(true);
        setLocalPaperCount(local.totalStoredCount);
      } catch (err) {
        console.warn('Error reading saved papers:', err);
      }
    }
    checkFreeUsage();
  }, [subscription]);

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
    if (isTrialExhausted) {
      showToast('Free trial limit reached (1 paper). Upgrade to Pro for unlimited generation!', 'warning');
      navigation.navigate('Subscription');
      return;
    }

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
        // Save to local storage automatically
        await LocalStorageService.savePaper(res.paper);
        setLocalPaperCount((prev) => prev + 1);
        navigation.navigate('PaperReview', { paper: res.paper });
      } else {
        throw new Error('Paper generation returned an empty result.');
      }
    } catch (err: any) {
      if (err.message?.includes('TRIAL_LIMIT_REACHED') || err.message?.includes('Trial Complete')) {
        showToast('Free paper trial limit reached. Upgrade to Pro for ₹299/mo!', 'warning');
        navigation.navigate('Subscription');
      } else {
        showToast(err.message || 'Could not compile paper. Please retry.', 'error');
      }
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
        onSubscriptionPress={() => navigation.navigate('Subscription')}
      />

      <Toast toast={toast} onDismiss={hideToast} />

      <AppLayout scrollable contentContainerStyle={styles.scrollContent}>
        {/* Trial Status / Plan Banner */}
        {isTrialExhausted ? (
          <View style={[styles.paywallCard, { backgroundColor: theme.surface, borderColor: theme.warning }]}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.15)', 'rgba(236, 72, 153, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.paywallGradient}
            >
              <View style={styles.paywallHeader}>
                <Crown size={22} color={theme.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paywallTitle, { color: theme.text }]}>
                    Free Trial Complete (1 of 1 Paper Created)
                  </Text>
                  <Text style={[styles.paywallDesc, { color: theme.textSecondary }]}>
                    You have generated your 1 free examination paper! Upgrade to QPG Educator Pro for ₹299/month for unlimited 2026 paper generation, question bank access, and vector PDF exports.
                  </Text>
                </View>
              </View>

              <View style={styles.paywallActions}>
                <View style={{ flex: 1.2 }}>
                  <Button
                    title="Upgrade to Pro (₹299/Mo)"
                    variant="primary"
                    size="md"
                    onPress={() => navigation.navigate('Subscription')}
                    leftIcon={<Crown size={16} color="#FFFFFF" />}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="View Saved Paper"
                    variant="outline"
                    size="md"
                    onPress={() => navigation.navigate('SavedPapersTab')}
                    leftIcon={<Bookmark size={15} color={theme.text} />}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.specBanner}>
            <LinearGradient
              colors={
                isPro
                  ? ['rgba(16, 185, 129, 0.22)', 'rgba(99, 102, 241, 0.12)']
                  : ['rgba(245, 158, 11, 0.22)', 'rgba(99, 102, 241, 0.12)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.specBannerGradient}
            >
              {isPro ? (
                <Zap size={16} color={theme.success} />
              ) : (
                <Sparkles size={16} color={theme.warning} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.specBannerText, { color: theme.text }]}>
                  {isPro
                    ? 'PRO UNLIMITED: ' + getStatsBadge()
                    : '1 FREE PAPER TRIAL: ' + getStatsBadge()}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

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

        {/* Big Generate CTA */}
        <View style={styles.ctaWrapper}>
          <Button
            title={
              isTrialExhausted
                ? 'Upgrade to Pro for Unlimited Papers'
                : `Generate ${examType} 2026 Paper ${!isPro ? '(Free Trial)' : ''}`
            }
            variant="primary"
            size="lg"
            loading={generating}
            onPress={handleGenerate}
            leftIcon={
              isTrialExhausted ? (
                <Crown size={18} color="#FFFFFF" />
              ) : (
                <Sparkles size={18} color="#FFFFFF" />
              )
            }
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
  paywallCard: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  paywallGradient: {
    padding: spacing[4],
  },
  paywallHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  paywallTitle: {
    ...typography.label,
    fontWeight: '800',
    fontSize: 15,
  },
  paywallDesc: {
    ...typography.bodySmall,
    marginTop: 4,
    lineHeight: 18,
  },
  paywallActions: {
    flexDirection: 'row',
    gap: spacing[2.5],
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
    gap: spacing[2.5],
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
