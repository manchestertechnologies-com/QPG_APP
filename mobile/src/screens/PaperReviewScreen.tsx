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
  Sparkles,
  Printer,
  Bookmark,
  Trash2,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  FileCheck,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
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
  const [notification, setNotification] = useState<string | null>(null);

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
    setNotification(null);
    try {
      await LocalStorageService.savePaper(paper);
      setSavedSuccess(true);
      setNotification('Paper successfully saved into your local device vault!');
    } catch (err: any) {
      setNotification(err.message || 'Could not save paper to local storage.');
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
    setNotification('Question removed from paper.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Review & Customize"
        subtitle={`${paper.exam_type} 2026 • ${paper.questions_count} Questions • ${paper.total_marks} Marks`}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Success / Alert Toast Notification */}
        {notification && (
          <View style={styles.notificationToast}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={styles.toastText}>{notification}</Text>
          </View>
        )}

        {/* Paper Overview Luxury Card */}
        <View style={[styles.overviewCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.18)', 'rgba(236, 72, 153, 0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.overviewGradient}
          >
            <View style={styles.tagRow}>
              <View style={[styles.examBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.examBadgeText}>{paper.exam_type} 2026</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>VERIFIED PATTERN</Text>
              </View>
            </View>

            <Text style={[styles.paperTitle, { color: theme.text }]}>{paper.title}</Text>
            <Text style={[styles.instName, { color: theme.primaryLight }]}>{paper.institution_name}</Text>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaVal, { color: theme.text }]}>{paper.subject}</Text>
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Subject</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaVal, { color: theme.text }]}>{paper.duration_minutes} Mins</Text>
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Time Allowed</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaVal, { color: theme.text }]}>{paper.total_marks}</Text>
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Total Marks</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaVal, { color: theme.text }]}>{paper.questions_count}</Text>
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Questions</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Top Quick Actions Bar */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleSaveToLocalStorage}
            disabled={saving}
            activeOpacity={0.8}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: savedSuccess ? 'rgba(16, 185, 129, 0.15)' : theme.surface,
                borderColor: savedSuccess ? '#10B981' : theme.surfaceBorder,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <>
                <Bookmark size={16} color={savedSuccess ? '#10B981' : theme.text} />
                <Text style={[styles.btnText, { color: savedSuccess ? '#10B981' : theme.text }]}>
                  {savedSuccess ? 'Saved in Vault' : 'Save to Vault'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportPdf}
            activeOpacity={0.85}
            style={styles.primaryBtnWrapper}
          >
            <LinearGradient
              colors={['#6366F1', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
              pointerEvents="none"
            >
              <FileCheck size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Export Vector PDF</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sections and Questions List */}
        {paper.sections.map((sec, secIdx) => (
          <View key={secIdx} style={styles.sectionBlock}>
            <View style={[styles.secHeaderBox, { backgroundColor: '#0F172A', borderColor: theme.surfaceBorder }]}>
              <View>
                <Text style={[styles.secName, { color: theme.primary }]}>{sec.name.toUpperCase()}</Text>
                <Text style={[styles.secMeta, { color: theme.textSecondary }]}>
                  {sec.questions.length} Questions • Attempt {sec.attempt_count} • (+{sec.marks_per_question}, -{sec.negative_marking})
                </Text>
              </View>
            </View>

            {sec.questions.map((q, qIdx) => (
              <View
                key={q.id + qIdx}
                style={[
                  styles.qCard,
                  { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                ]}
              >
                <View style={styles.qTopRow}>
                  <View style={styles.qBadgeBox}>
                    <Text style={styles.qNum}>Q.{qIdx + 1}</Text>
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={styles.chapterBadge}>
                      <Text style={styles.chapterBadgeText}>{q.chapter}</Text>
                    </View>
                    <View
                      style={[
                        styles.diffBadge,
                        {
                          backgroundColor:
                            q.difficulty === 'easy'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : q.difficulty === 'hard'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.diffBadgeText,
                          {
                            color:
                              q.difficulty === 'easy'
                                ? '#10B981'
                                : q.difficulty === 'hard'
                                ? '#EF4444'
                                : '#F59E0B',
                          },
                        ]}
                      >
                        {q.difficulty?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeQuestion(secIdx, qIdx)}
                    style={styles.trashBtn}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.questionTextWrap}>
                  <MathRenderer content={q.question} fontSize={14.5} lineHeight={22} />
                </View>

                {/* Options List */}
                {q.opt_a && (
                  <View style={styles.optionsWrap}>
                    <View
                      style={[
                        styles.optCard,
                        q.correct_option === 'A' && styles.optCardCorrect,
                        { borderColor: q.correct_option === 'A' ? '#10B981' : theme.surfaceBorder },
                      ]}
                    >
                      <Text style={[styles.optLetter, q.correct_option === 'A' && { color: '#10B981' }]}>
                        (A)
                      </Text>
                      <Text style={[styles.optText, { color: theme.text }]}>{q.opt_a}</Text>
                    </View>

                    <View
                      style={[
                        styles.optCard,
                        q.correct_option === 'B' && styles.optCardCorrect,
                        { borderColor: q.correct_option === 'B' ? '#10B981' : theme.surfaceBorder },
                      ]}
                    >
                      <Text style={[styles.optLetter, q.correct_option === 'B' && { color: '#10B981' }]}>
                        (B)
                      </Text>
                      <Text style={[styles.optText, { color: theme.text }]}>{q.opt_b}</Text>
                    </View>

                    <View
                      style={[
                        styles.optCard,
                        q.correct_option === 'C' && styles.optCardCorrect,
                        { borderColor: q.correct_option === 'C' ? '#10B981' : theme.surfaceBorder },
                      ]}
                    >
                      <Text style={[styles.optLetter, q.correct_option === 'C' && { color: '#10B981' }]}>
                        (C)
                      </Text>
                      <Text style={[styles.optText, { color: theme.text }]}>{q.opt_c}</Text>
                    </View>

                    <View
                      style={[
                        styles.optCard,
                        q.correct_option === 'D' && styles.optCardCorrect,
                        { borderColor: q.correct_option === 'D' ? '#10B981' : theme.surfaceBorder },
                      ]}
                    >
                      <Text style={[styles.optLetter, q.correct_option === 'D' && { color: '#10B981' }]}>
                        (D)
                      </Text>
                      <Text style={[styles.optText, { color: theme.text }]}>{q.opt_d}</Text>
                    </View>
                  </View>
                )}

                {/* Numerical Question answer box */}
                {q.q_type === 'numerical' && (
                  <View style={styles.numericalBox}>
                    <Text style={styles.numericalText}>
                      Numerical Answer: <Text style={{ color: '#10B981', fontWeight: '900' }}>{q.correct_option || q.num_answer}</Text>
                    </Text>
                  </View>
                )}

                {/* Solution Box */}
                {q.solution_text && (
                  <View style={styles.solBlock}>
                    <Text style={styles.solTitle}>Faculty Solution & Explanation:</Text>
                    <MathRenderer content={q.solution_text} fontSize={13} lineHeight={19} />
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Floating Bottom Export Button */}
        <TouchableOpacity
          onPress={handleExportPdf}
          activeOpacity={0.85}
          style={styles.floatingBottomBtn}
        >
          <LinearGradient
            colors={['#6366F1', '#A855F7', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomGradient}
            pointerEvents="none"
          >
            <Printer size={20} color="#FFFFFF" />
            <Text style={styles.bottomBtnText}>Generate Vector PDF Examination Paper</Text>
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  toastText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  overviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  overviewGradient: {
    padding: 18,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  examBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  paperTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  instName: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 3,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  metaLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    gap: 6,
    cursor: 'pointer' as any,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  primaryBtnWrapper: {
    flex: 1.2,
    borderRadius: 14,
    overflow: 'hidden',
    cursor: 'pointer' as any,
  },
  primaryBtnGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionBlock: {
    marginBottom: 18,
  },
  secHeaderBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    marginBottom: 10,
  },
  secName: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  qCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  qTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  qBadgeBox: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  badgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chapterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chapterBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  diffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  trashBtn: {
    padding: 6,
    cursor: 'pointer' as any,
  },
  questionTextWrap: {
    marginBottom: 10,
  },
  optionsWrap: {
    gap: 6,
    marginBottom: 8,
  },
  optCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  optCardCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  optLetter: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#6366F1',
  },
  optText: {
    fontSize: 13,
    flex: 1,
  },
  numericalBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 6,
  },
  numericalText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  solBlock: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  solTitle: {
    color: '#818CF8',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  floatingBottomBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    cursor: 'pointer' as any,
  },
  bottomGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  bottomBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
