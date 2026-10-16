import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { LockOverlay } from '../components/LockOverlay';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
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
  const [paperTitle, setPaperTitle] = useState(`${user?.subject} Examination 2026`);
  const [institution, setInstitution] = useState(user?.institution || 'Academic Institute');
  const [includeKey, setIncludeKey] = useState(true);
  const [includeSolutions, setIncludeSolutions] = useState(true);

  // Custom parameters
  const [customQuestionCount, setCustomQuestionCount] = useState('30');
  const [customDuration, setCustomDuration] = useState('60');
  const [customMarks, setCustomMarks] = useState('4');
  const [customNegative, setCustomNegative] = useState('1');

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
      } catch (err) {
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
        Alert.alert('Required', 'Please keep at least one class level selected.');
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
        title: paperTitle.trim() || `${user?.subject} Test Paper`,
        institution_name: institution.trim() || 'Academic Institute',
        exam_type: examType,
        subject: user!.subject,
        class_levels: selectedClasses,
        chapters: isFullSyllabus ? [] : selectedChapters,
        total_questions: examType === 'CET' ? 60 : examType === 'NEET' ? 50 : examType === 'JEE' ? 30 : parseInt(customQuestionCount, 10) || 30,
        duration_minutes: examType === 'CET' ? 80 : examType === 'NEET' ? 50 : examType === 'JEE' ? 60 : parseInt(customDuration, 10) || 60,
        marks_per_question: examType === 'CET' ? 1 : 4,
        negative_marking: examType === 'CET' ? 0 : 1,
        include_answer_key: includeKey,
        include_solutions: includeSolutions,
      };

      const res = await api.generatePaper(config);
      navigation.navigate('PaperReview', { paper: res.paper });
    } catch (err: any) {
      Alert.alert('Generation Error', err.message || 'Could not compile paper.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Question Paper Generator"
        subtitle={`2026 Examination Patterns • ${user?.subject}`}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Select 2026 Exam Architecture */}
        <View style={styles.section}>
          <Text style={[styles.stepLabel, { color: theme.primary }]}>STEP 1: EXAMINATION PATTERN</Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select 2026 Architecture</Text>

          <View style={styles.patternGrid}>
            <TouchableOpacity
              onPress={() => setExamType('NEET')}
              style={[
                styles.patternCard,
                {
                  backgroundColor: examType === 'NEET' ? theme.cardBg : theme.surfaceLight,
                  borderColor: examType === 'NEET' ? theme.primary : theme.cardBorder,
                  borderWidth: examType === 'NEET' ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.patternIcon}>🩺</Text>
              <Text style={[styles.patternName, { color: theme.text }]}>NEET 2026</Text>
              <Text style={[styles.patternMeta, { color: theme.textSecondary }]}>
                35 Sec A + 15 Sec B (Attempt 10) • 180 Marks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExamType('JEE')}
              style={[
                styles.patternCard,
                {
                  backgroundColor: examType === 'JEE' ? theme.cardBg : theme.surfaceLight,
                  borderColor: examType === 'JEE' ? theme.primary : theme.cardBorder,
                  borderWidth: examType === 'JEE' ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.patternIcon}>📐</Text>
              <Text style={[styles.patternName, { color: theme.text }]}>JEE MAIN 2026</Text>
              <Text style={[styles.patternMeta, { color: theme.textSecondary }]}>
                20 MCQs + 10 Numerical (Attempt 5) • 100 Marks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExamType('CET')}
              style={[
                styles.patternCard,
                {
                  backgroundColor: examType === 'CET' ? theme.cardBg : theme.surfaceLight,
                  borderColor: examType === 'CET' ? theme.primary : theme.cardBorder,
                  borderWidth: examType === 'CET' ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.patternIcon}>🏆</Text>
              <Text style={[styles.patternName, { color: theme.text }]}>KCET / CET 2026</Text>
              <Text style={[styles.patternMeta, { color: theme.textSecondary }]}>
                60 Questions • 60 Marks • 80 Mins • 0 Neg Mark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExamType('CUSTOM')}
              style={[
                styles.patternCard,
                {
                  backgroundColor: examType === 'CUSTOM' ? theme.cardBg : theme.surfaceLight,
                  borderColor: examType === 'CUSTOM' ? theme.primary : theme.cardBorder,
                  borderWidth: examType === 'CUSTOM' ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.patternIcon}>⚙️</Text>
              <Text style={[styles.patternName, { color: theme.text }]}>CUSTOM PRACTICE</Text>
              <Text style={[styles.patternMeta, { color: theme.textSecondary }]}>
                Custom question count, time, and marks
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2: Target Classes */}
        <View style={styles.section}>
          <Text style={[styles.stepLabel, { color: theme.primary }]}>STEP 2: TARGET CLASSES</Text>
          <View style={styles.classRow}>
            {(['11', '12'] as const).map((lvl) => {
              const isSelected = selectedClasses.includes(lvl);
              return (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => toggleClassLevel(lvl)}
                  style={[
                    styles.classBtn,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surfaceLight,
                    },
                  ]}
                >
                  <Text style={[styles.classBtnText, { color: isSelected ? '#fff' : theme.text }]}>
                    {isSelected ? '✓ ' : ''}Class {lvl} Syllabus
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 3: Syllabus / Chapters Selection */}
        <View style={styles.section}>
          <Text style={[styles.stepLabel, { color: theme.primary }]}>STEP 3: CHAPTERS & SYLLABUS</Text>
          <Card>
            <TouchableOpacity
              onPress={() => {
                setIsFullSyllabus(true);
                setSelectedChapters([]);
              }}
              style={styles.fullSyllabusRow}
            >
              <View style={[styles.radioCircle, { borderColor: theme.primary }]}>
                {isFullSyllabus && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fullSyllabusTitle, { color: theme.text }]}>Full Syllabus (All Chapters)</Text>
                <Text style={[styles.fullSyllabusSub, { color: theme.textSecondary }]}>
                  Evenly distributes questions across the complete {user?.subject} curriculum.
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={[styles.chapterPickLabel, { color: theme.textSecondary }]}>
              Or Select Specific Chapters ({selectedChapters.length} selected):
            </Text>

            {loadingChapters ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
            ) : (
              <View style={styles.chaptersScroll}>
                {chapters.slice(0, 16).map((ch, idx) => {
                  const isChecked = selectedChapters.includes(ch.name);
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => toggleChapter(ch.name)}
                      style={[
                        styles.chItem,
                        {
                          backgroundColor: isChecked ? theme.primary + '15' : 'transparent',
                          borderColor: isChecked ? theme.primary : theme.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.chCheck, { color: isChecked ? theme.primary : theme.textMuted }]}>
                        {isChecked ? '☑' : '☐'}
                      </Text>
                      <Text
                        style={[
                          styles.chName,
                          { color: isChecked ? theme.primaryLight : theme.text },
                        ]}
                        numberOfLines={1}
                      >
                        {ch.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>
        </View>

        {/* Step 4: Paper Header & Details */}
        <View style={styles.section}>
          <Text style={[styles.stepLabel, { color: theme.primary }]}>STEP 4: PAPER METADATA</Text>
          <Card>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Paper Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={paperTitle}
                onChangeText={setPaperTitle}
                placeholder="e.g. NEET Grand Mock Test 2026"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Institution / Coaching Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={institution}
                onChangeText={setInstitution}
                placeholder="Apex Educational Institute"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Custom Mode Extra Inputs */}
            {examType === 'CUSTOM' && (
              <View style={styles.customGrid}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Questions</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    keyboardType="number-pad"
                    value={customQuestionCount}
                    onChangeText={setCustomQuestionCount}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Duration (Mins)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    keyboardType="number-pad"
                    value={customDuration}
                    onChangeText={setCustomDuration}
                  />
                </View>
              </View>
            )}

            {/* Toggles */}
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleText, { color: theme.text }]}>Include Answer Key Grid</Text>
              <Switch
                value={includeKey}
                onValueChange={setIncludeKey}
                trackColor={{ false: theme.surfaceLight, true: theme.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleText, { color: theme.text }]}>Include Step-by-Step Solutions</Text>
              <Switch
                value={includeSolutions}
                onValueChange={setIncludeSolutions}
                trackColor={{ false: theme.surfaceLight, true: theme.primary }}
              />
            </View>
          </Card>
        </View>

        {/* Generate Button */}
        <View style={styles.btnSection}>
          <Button
            title={generating ? 'Compiling 2026 Question Paper...' : `Generate ${examType} Paper`}
            onPress={handleGenerate}
            loading={generating}
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
  section: {
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  patternGrid: {
    gap: 10,
  },
  patternCard: {
    borderRadius: 12,
    padding: 14,
  },
  patternIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  patternName: {
    fontSize: 15,
    fontWeight: '800',
  },
  patternMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  classRow: {
    flexDirection: 'row',
    gap: 10,
  },
  classBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  classBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fullSyllabusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fullSyllabusTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  fullSyllabusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    marginVertical: 12,
  },
  chapterPickLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  chaptersScroll: {
    gap: 6,
  },
  chItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  chCheck: {
    fontSize: 16,
  },
  chName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  customGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnSection: {
    marginTop: 8,
  },
});
