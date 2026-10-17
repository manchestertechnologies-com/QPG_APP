import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  X,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { LockOverlay } from '../components/LockOverlay';
import { MathRenderer } from '../components/MathRenderer';
import { api } from '../services/api';
import { Question, ClassLevel, DifficultyLevel } from '../types';

export const QuestionBankScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, subscription } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);

  // Filters
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'both'>('both');
  const [selectedChapter, setSelectedChapter] = useState<string>('All Chapters');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Chapter Modal
  const [chapterList, setChapterList] = useState<{ name: string; count: number }[]>([]);
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);

  // Detail Modal
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Enforce subscription locking
  if (!subscription?.isActive) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Question Bank" />
        <LockOverlay
          title="Question Bank Locked"
          description={`Your ${user?.subject || 'Chemistry'} question bank access is locked. Active ₹299 monthly subscription required.`}
          onRenewPress={() => navigation.navigate('Subscription')}
        />
      </View>
    );
  }

  // Load chapters list
  useEffect(() => {
    async function fetchChapters() {
      try {
        const res = await api.getChapters(selectedClass === 'both' ? undefined : selectedClass);
        if (res.chapters) setChapterList(res.chapters);
      } catch (err) {
        console.warn('Error fetching chapters:', err);
      }
    }
    fetchChapters();
  }, [selectedClass]);

  // Load questions on filter change
  useEffect(() => {
    loadQuestions(true);
  }, [selectedClass, selectedChapter, selectedDifficulty]);

  const loadQuestions = async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await api.queryQuestions({
        classLevel: selectedClass === 'both' ? undefined : selectedClass,
        chapter: selectedChapter === 'All Chapters' ? undefined : selectedChapter,
        difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
        search: searchQuery.trim() || undefined,
        limit: 15,
        offset: currentOffset,
      });

      if (reset) {
        setQuestions(res.questions);
      } else {
        setQuestions((prev) => [...prev, ...res.questions]);
      }
      setTotalCount(res.total || 23603);
      setHasMore(res.hasMore);
      setOffset(currentOffset + 15);
    } catch (err) {
      console.warn('Error loading questions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const renderQuestionCard = ({ item }: { item: Question }) => {
    const isEasy = item.difficulty === 'easy' || item.difficulty === 'Easy';
    const isHard = item.difficulty === 'hard' || item.difficulty === 'Hard';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedQuestion(item)}
        style={[
          styles.questionCard,
          { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.miniBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Text style={styles.classBadgeText}>Class {item.klass}</Text>
            </View>
            <View style={styles.chapterBadge}>
              <Text style={styles.chapterBadgeText} numberOfLines={1}>
                {item.chapter}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.diffBadge,
              {
                backgroundColor: isEasy
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isHard
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
              },
            ]}
          >
            <Text
              style={[
                styles.diffText,
                { color: isEasy ? '#10B981' : isHard ? '#EF4444' : '#F59E0B' },
              ]}
            >
              {item.difficulty?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.questionContent}>
          <MathRenderer content={item.question} fontSize={14.5} lineHeight={22} />
        </View>

        {/* Options Preview */}
        {(item.opt_a || item.opt_b) && (
          <View style={styles.optionsPreview}>
            <View style={styles.previewOptRow}>
              <Text style={styles.optLetter}>(A)</Text>
              <Text style={[styles.optValue, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.opt_a}
              </Text>
            </View>
            <View style={styles.previewOptRow}>
              <Text style={styles.optLetter}>(B)</Text>
              <Text style={[styles.optValue, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.opt_b}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={[styles.typeText, { color: theme.textMuted }]}>
            {item.exams?.join(' • ') || 'NEET • JEE'}
          </Text>
          <View style={styles.viewDetailsRow}>
            <Text style={[styles.inspectBtn, { color: theme.primaryLight }]}>View Details & Solution</Text>
            <ChevronRight size={14} color={theme.primaryLight} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title={`${user?.subject || 'Chemistry'} Question Bank`}
        subtitle={`${totalCount.toLocaleString()} Verified Questions Available`}
      />

      {/* Filter Section */}
      <View style={styles.filterSection}>
        {/* WhatsApp-Style Search Input */}
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <Search size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search keywords, formulas, reactions..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => loadQuestions(true)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); loadQuestions(true); }}>
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Filter Chips */}
        <View style={styles.chipsRow}>
          {/* Class Chips */}
          {(['both', '11', '12'] as const).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              onPress={() => setSelectedClass(lvl)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedClass === lvl ? theme.primary : theme.surface,
                  borderColor: selectedClass === lvl ? theme.primary : theme.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selectedClass === lvl ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {lvl === 'both' ? 'All Classes' : `Class ${lvl}`}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Chapter Selector */}
          <TouchableOpacity
            onPress={() => setShowChapterModal(true)}
            activeOpacity={0.8}
            style={[
              styles.chip,
              {
                backgroundColor: selectedChapter !== 'All Chapters' ? 'rgba(99, 102, 241, 0.2)' : theme.surface,
                borderColor: selectedChapter !== 'All Chapters' ? theme.primary : theme.surfaceBorder,
              },
            ]}
          >
            <BookOpen size={13} color={selectedChapter !== 'All Chapters' ? theme.primaryLight : theme.textMuted} style={{ marginRight: 4 }} />
            <Text
              style={[
                styles.chipText,
                { color: selectedChapter !== 'All Chapters' ? theme.primaryLight : theme.textSecondary },
              ]}
              numberOfLines={1}
            >
              {selectedChapter === 'All Chapters' ? 'All Chapters' : selectedChapter.substring(0, 14) + '...'}
            </Text>
          </TouchableOpacity>

          {/* Difficulty Chips */}
          {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
            <TouchableOpacity
              key={diff}
              onPress={() => setSelectedDifficulty(diff as any)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedDifficulty === diff ? 'rgba(255, 255, 255, 0.08)' : theme.surface,
                  borderColor: selectedDifficulty === diff ? theme.primary : theme.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selectedDifficulty === diff ? theme.primaryLight : theme.textMuted },
                ]}
              >
                {diff === 'all' ? 'All Diff' : diff.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Questions List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading {user?.subject || 'Chemistry'} Questions...
          </Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          renderItem={renderQuestionCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadQuestions(false);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Search size={36} color={theme.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Questions Found</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Try adjusting your search terms or chapter filters.
              </Text>
            </View>
          }
        />
      )}

      {/* Chapter Selection Modal */}
      <Modal visible={showChapterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select NCERT Chapter</Text>
              <TouchableOpacity onPress={() => setShowChapterModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[{ name: 'All Chapters', count: totalCount }, ...chapterList]}
              keyExtractor={(item, i) => item.name + i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.chapterItem,
                    {
                      backgroundColor:
                        selectedChapter === item.name ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setSelectedChapter(item.name);
                    setShowChapterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.chapterName,
                      { color: selectedChapter === item.name ? theme.primaryLight : theme.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.count > 0 && (
                    <Text style={[styles.chapterCount, { color: theme.textMuted }]}>
                      {item.count.toLocaleString()} Qs
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Question Detail Modal */}
      <Modal visible={!!selectedQuestion} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            {selectedQuestion && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Question Details</Text>
                  <TouchableOpacity onPress={() => setSelectedQuestion(null)} style={styles.modalCloseBtn}>
                    <X size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={[selectedQuestion]}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={{ paddingBottom: 20 }}>
                      <View style={styles.detailBadgeRow}>
                        <View style={styles.detailChapterBadge}>
                          <Text style={styles.detailChapterText}>{item.chapter}</Text>
                        </View>
                        <View style={styles.detailClassBadge}>
                          <Text style={styles.detailClassText}>Class {item.klass}</Text>
                        </View>
                      </View>

                      <View style={{ marginVertical: 12 }}>
                        <MathRenderer content={item.question} fontSize={15} lineHeight={23} />
                      </View>

                      {/* Options */}
                      <View style={styles.optionsList}>
                        {item.opt_a ? (
                          <View
                            style={[
                              styles.optBox,
                              item.correct_option === 'A' && styles.optBoxCorrect,
                              { borderColor: item.correct_option === 'A' ? '#10B981' : theme.surfaceBorder },
                            ]}
                          >
                            <Text style={[styles.optTag, { color: item.correct_option === 'A' ? '#10B981' : theme.primary }]}>
                              (A) {item.correct_option === 'A' ? '✓ CORRECT' : ''}
                            </Text>
                            <MathRenderer content={item.opt_a} />
                          </View>
                        ) : null}
                        {item.opt_b ? (
                          <View
                            style={[
                              styles.optBox,
                              item.correct_option === 'B' && styles.optBoxCorrect,
                              { borderColor: item.correct_option === 'B' ? '#10B981' : theme.surfaceBorder },
                            ]}
                          >
                            <Text style={[styles.optTag, { color: item.correct_option === 'B' ? '#10B981' : theme.primary }]}>
                              (B) {item.correct_option === 'B' ? '✓ CORRECT' : ''}
                            </Text>
                            <MathRenderer content={item.opt_b} />
                          </View>
                        ) : null}
                        {item.opt_c ? (
                          <View
                            style={[
                              styles.optBox,
                              item.correct_option === 'C' && styles.optBoxCorrect,
                              { borderColor: item.correct_option === 'C' ? '#10B981' : theme.surfaceBorder },
                            ]}
                          >
                            <Text style={[styles.optTag, { color: item.correct_option === 'C' ? '#10B981' : theme.primary }]}>
                              (C) {item.correct_option === 'C' ? '✓ CORRECT' : ''}
                            </Text>
                            <MathRenderer content={item.opt_c} />
                          </View>
                        ) : null}
                        {item.opt_d ? (
                          <View
                            style={[
                              styles.optBox,
                              item.correct_option === 'D' && styles.optBoxCorrect,
                              { borderColor: item.correct_option === 'D' ? '#10B981' : theme.surfaceBorder },
                            ]}
                          >
                            <Text style={[styles.optTag, { color: item.correct_option === 'D' ? '#10B981' : theme.primary }]}>
                              (D) {item.correct_option === 'D' ? '✓ CORRECT' : ''}
                            </Text>
                            <MathRenderer content={item.opt_d} />
                          </View>
                        ) : null}
                      </View>

                      {/* Solution */}
                      {item.solution_text && (
                        <View style={styles.solutionCard}>
                          <Text style={styles.solutionHead}>Faculty Step-by-Step Solution:</Text>
                          <MathRenderer content={item.solution_text} />
                        </View>
                      )}
                    </View>
                  )}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
  },
  questionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    cursor: 'pointer' as any,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classBadgeText: {
    color: '#818CF8',
    fontSize: 10.5,
    fontWeight: '900',
  },
  chapterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 150,
  },
  chapterBadgeText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  questionContent: {
    marginVertical: 6,
  },
  optionsPreview: {
    gap: 4,
    marginTop: 6,
    paddingLeft: 4,
  },
  previewOptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optLetter: {
    color: '#6366F1',
    fontWeight: '800',
    fontSize: 12,
  },
  optValue: {
    fontSize: 12.5,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inspectBtn: {
    fontSize: 12,
    fontWeight: '800',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13.5,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '75%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  detailModalBox: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 4,
    cursor: 'pointer' as any,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },
  chapterName: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  chapterCount: {
    fontSize: 11.5,
    marginLeft: 8,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailChapterBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailChapterText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '800',
  },
  detailClassBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailClassText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  optionsList: {
    gap: 8,
    marginVertical: 10,
  },
  optBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  optBoxCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  optTag: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  solutionCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  solutionHead: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
});
