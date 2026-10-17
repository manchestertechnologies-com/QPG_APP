import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Stethoscope,
  Compass,
  Trophy,
  Sliders,
  Sparkles,
  CheckCircle2,
  Layers,
  BookOpen,
  ArrowRight,
  Check,
  Building,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { LockOverlay } from '../components/LockOverlay';
import { api } from '../services/api';
import { ExamType, ClassLevel, PaperGenerationConfig } from '../types';

export const PaperWizardScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { user, subscription } = useAuth();

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const toggleClassLevel = (lvl: ClassLevel) => {
    if (selectedClasses.includes(lvl)) {
      if (selectedClasses.length === 1) {
        setErrorMessage('Please keep at least one class level selected.');
        return;
      }
      setSelectedClasses((prev) => prev.filter((c) => c !== lvl));
    } else {
      setSelectedClasses((prev) => [...prev, lvl]);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMessage(null);
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
      setErrorMessage(err.message || 'Could not compile paper. Please retry.');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Generation Error: ${err.message || 'Could not compile paper.'}`);
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
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Live Spec Bar */}
        <View style={styles.specBanner}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.25)', 'rgba(236, 72, 153, 0.15)']}
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

        {/* Error Banner if any */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* STEP 1: Examination Pattern Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>STEP 01</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>2026 Examination Architecture</Text>
          </View>

          <View style={styles.patternGrid}>
            {/* NEET 2026 Card */}
            <TouchableOpacity
              onPress={() => setExamType('NEET')}
              activeOpacity={0.85}
              style={[
                styles.patternCard,
                {
                  backgroundColor: examType === 'NEET' ? '#0F172A' : theme.surface,
                  borderColor: examType === 'NEET' ? '#6366F1' : theme.surfaceBorder,
                  borderWidth: examType === 'NEET' ? 2 : 1,
                },
              ]}
            >
              <View style={styles.patternTopRow}>
                <View
                  style={[
                    styles.patternIconBox,
                    { backgroundColor: examType === 'NEET' ? '#6366F1' : 'rgba(99, 102, 241, 0.15)' },
                  ]}
                >
                  <Stethoscope size={20} color={examType === 'NEET' ? '#FFFFFF' : '#6366F1'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.patternName, { color: theme.text }]}>NEET 2026 Architecture</Text>
                  <Text style={[styles.patternSub, { color: theme.textSecondary }]}>
                    35 Sec A (Mandatory) + 15 Sec B (Attempt 10)
                  </Text>
                </View>
                {examType === 'NEET' && (
                  <View style={styles.checkCircle}>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>
              <View style={styles.patternFooterRow}>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>180 Marks</Text>
                </View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>+4 / -1 Marking</Text>
                </View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>50 Minutes</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* JEE MAIN 2026 Card */}
            <TouchableOpacity
              onPress={() => setExamType('JEE')}
              activeOpacity={0.85}
              style={[
                styles.patternCard,
                {
                  backgroundColor: examType === 'JEE' ? '#0F172A' : theme.surface,
                  borderColor: examType === 'JEE' ? '#A855F7' : theme.surfaceBorder,
                  borderWidth: examType === 'JEE' ? 2 : 1,
                },
              ]}
            >
              <View style={styles.patternTopRow}>
                <View
                  style={[
                    styles.patternIconBox,
                    { backgroundColor: examType === 'JEE' ? '#A855F7' : 'rgba(168, 85, 247, 0.15)' },
                  ]}
                >
                  <Compass size={20} color={examType === 'JEE' ? '#FFFFFF' : '#A855F7'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.patternName, { color: theme.text }]}>JEE MAIN 2026 Architecture</Text>
                  <Text style={[styles.patternSub, { color: theme.textSecondary }]}>
                    20 MCQs + 10 Numerical (Attempt 5)
                  </Text>
                </View>
                {examType === 'JEE' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#A855F7' }]}>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>
              <View style={styles.patternFooterRow}>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>100 Marks</Text>
                </View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>+4 / -1 Marking</Text>
                </View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>60 Minutes</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* KCET / CET 2026 Card */}
            <TouchableOpacity
              onPress={() => setExamType('CET')}
              activeOpacity={0.85}
              style={[
                styles.patternCard,
                {
                  backgroundColor: examType === 'CET' ? '#0F172A' : theme.surface,
                  borderColor: examType === 'CET' ? '#10B981' : theme.surfaceBorder,
                  borderWidth: examType === 'CET' ? 2 : 1,
                },
              ]}
            >
              <View style={styles.patternTopRow}>
                <View
                  style={[
                    styles.patternIconBox,
                    { backgroundColor: examType === 'CET' ? '#10B981' : 'rgba(16, 185, 129, 0.15)' },
                  ]}
                >
                  <Trophy size={20} color={examType === 'CET' ? '#FFFFFF' : '#10B981'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.patternName, { color: theme.text }]}>KCET / State CET 2026</Text>
                  <Text style={[styles.patternSub, { color: theme.textSecondary }]}>
                    60 Objective MCQs • Zero Negative Marking
                  </Text>
                </View>
                {examType === 'CET' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#10B981' }]}>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>
              <View style={styles.patternFooterRow}>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>60 Marks</Text>
                </View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>+1 / 0 Marking</Text>
                </View>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>80 Minutes</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Custom Mode */}
            <TouchableOpacity
              onPress={() => setExamType('CUSTOM')}
              activeOpacity={0.85}
              style={[
                styles.patternCard,
                {
                  backgroundColor: examType === 'CUSTOM' ? '#0F172A' : theme.surface,
                  borderColor: examType === 'CUSTOM' ? '#EC4899' : theme.surfaceBorder,
                  borderWidth: examType === 'CUSTOM' ? 2 : 1,
                },
              ]}
            >
              <View style={styles.patternTopRow}>
                <View
                  style={[
                    styles.patternIconBox,
                    { backgroundColor: examType === 'CUSTOM' ? '#EC4899' : 'rgba(236, 72, 153, 0.15)' },
                  ]}
                >
                  <Sliders size={20} color={examType === 'CUSTOM' ? '#FFFFFF' : '#EC4899'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.patternName, { color: theme.text }]}>Custom Faculty Practice</Text>
                  <Text style={[styles.patternSub, { color: theme.textSecondary }]}>
                    Set custom question count and timing
                  </Text>
                </View>
                {examType === 'CUSTOM' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#EC4899' }]}>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* STEP 2: Target Syllabus Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>STEP 02</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>NCERT Class Levels</Text>
          </View>

          <View style={styles.classRow}>
            {(['11', '12'] as const).map((lvl) => {
              const isSelected = selectedClasses.includes(lvl);
              return (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => toggleClassLevel(lvl)}
                  activeOpacity={0.8}
                  style={[
                    styles.classPill,
                    {
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.classCheckSquare,
                      {
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        borderColor: isSelected ? theme.primary : theme.textMuted,
                      },
                    ]}
                  >
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.classPillText, { color: isSelected ? theme.primary : theme.text }]}>
                    Class {lvl} Syllabus
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* STEP 3: Syllabus Scope */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>STEP 03</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Curriculum Scope</Text>
          </View>

          <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            {/* Full Syllabus Option */}
            <TouchableOpacity
              onPress={() => {
                setIsFullSyllabus(true);
                setSelectedChapters([]);
              }}
              activeOpacity={0.8}
              style={[
                styles.scopeOption,
                isFullSyllabus && { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
              ]}
            >
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: isFullSyllabus ? theme.primary : theme.textMuted },
                ]}
              >
                {isFullSyllabus && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.scopeTitle, { color: theme.text }]}>Full Syllabus (Recommended)</Text>
                <Text style={[styles.scopeSub, { color: theme.textSecondary }]}>
                  Evenly balanced distribution across all 20+ NCERT {user?.subject || 'Chemistry'} chapters.
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            {/* Specific Chapters Option */}
            <View style={{ padding: 14 }}>
              <View style={styles.chapterHeaderRow}>
                <Text style={[styles.chapterHeaderTitle, { color: theme.text }]}>
                  Or Target Specific Chapters ({selectedChapters.length} active)
                </Text>
                {selectedChapters.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedChapters([]);
                      setIsFullSyllabus(true);
                    }}
                  >
                    <Text style={[styles.clearBtn, { color: theme.primary }]}>Reset to All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loadingChapters ? (
                <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.chipsWrap}>
                  {chapters.slice(0, 19).map((ch, idx) => {
                    const isChecked = selectedChapters.includes(ch.name);
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => toggleChapter(ch.name)}
                        activeOpacity={0.8}
                        style={[
                          styles.chapterChip,
                          {
                            backgroundColor: isChecked ? 'rgba(99, 102, 241, 0.2)' : theme.surfaceLight,
                            borderColor: isChecked ? theme.primary : theme.surfaceBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: isChecked ? theme.primary : theme.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {isChecked ? '✓ ' : ''}{ch.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* STEP 4: Paper Metadata & Custom Fields */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>STEP 04</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Paper Metadata & Toggles</Text>
          </View>

          <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.inputField}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Examination Paper Title</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <FileSpreadsheet size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={paperTitle}
                  onChangeText={setPaperTitle}
                  placeholder="e.g. NEET Chemistry Grand Mock Test 2026"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputField}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Institution / Coaching Academy</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Building size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={institution}
                  onChangeText={setInstitution}
                  placeholder="e.g. Manchester Science Institute"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {examType === 'CUSTOM' && (
              <View style={styles.customInputRow}>
                <View style={[styles.inputField, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Total Questions</Text>
                  <TextInput
                    style={[styles.smallInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    keyboardType="number-pad"
                    value={customQuestionCount}
                    onChangeText={setCustomQuestionCount}
                  />
                </View>
                <View style={[styles.inputField, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Duration (Mins)</Text>
                  <TextInput
                    style={[styles.smallInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    keyboardType="number-pad"
                    value={customDuration}
                    onChangeText={setCustomDuration}
                  />
                </View>
              </View>
            )}

            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Include Answer Key Grid</Text>
                <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
                  Appends a 5-column evaluation key table at the end of the test.
                </Text>
              </View>
              <Switch
                value={includeKey}
                onValueChange={setIncludeKey}
                trackColor={{ false: theme.surfaceLight, true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Step-by-Step Solutions</Text>
                <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
                  Provides detailed step-by-step mathematical & chemical explanations.
                </Text>
              </View>
              <Switch
                value={includeSolutions}
                onValueChange={setIncludeSolutions}
                trackColor={{ false: theme.surfaceLight, true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Big Glowing Generate Button */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.85}
          style={styles.generateBtnWrapper}
        >
          <LinearGradient
            colors={['#6366F1', '#A855F7', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBtnGradient}
            pointerEvents="none"
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Compiling 2026 Examination Paper...</Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>
                  Generate {examType} 2026 Paper
                </Text>
                <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
  specBanner: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  specBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  specBannerText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  patternGrid: {
    gap: 10,
  },
  patternCard: {
    borderRadius: 16,
    padding: 14,
    cursor: 'pointer' as any,
  },
  patternTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternName: {
    fontSize: 15,
    fontWeight: '800',
  },
  patternSub: {
    fontSize: 12,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternFooterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillBadgeText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  classRow: {
    flexDirection: 'row',
    gap: 12,
  },
  classPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.2,
    gap: 10,
    cursor: 'pointer' as any,
  },
  classCheckSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classPillText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  cardBox: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scopeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    cursor: 'pointer' as any,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scopeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  scopeSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chapterHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  clearBtn: {
    fontSize: 12,
    fontWeight: '800',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chapterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputField: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  toggleDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  generateBtnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    cursor: 'pointer' as any,
  },
  generateBtnGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
