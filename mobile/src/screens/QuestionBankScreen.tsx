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
          description={`Your ${user?.subject} question bank access is locked. Active subscription required to browse and practice.`}
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
      setTotalCount(res.total);
      setHasMore(res.hasMore);
      setOffset(currentOffset + 15);
    } catch (err) {
      console.warn('Error loading questions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const renderQuestionCard = ({ item, index }: { item: Question; index: number }) => {
    const diffColor =
      item.difficulty === 'Easy'
        ? theme.success
        : item.difficulty === 'Hard'
        ? theme.error
        : theme.warning;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedQuestion(item)}
        style={[styles.questionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLight }]}>
              <Text style={[styles.miniBadgeText, { color: theme.textSecondary }]}>
                Class {item.klass}
              </Text>
            </View>
            <View style={[styles.miniBadge, { backgroundColor: theme.surfaceLight }]}>
              <Text style={[styles.miniBadgeText, { color: theme.textSecondary }]}>
                {item.chapter}
              </Text>
            </View>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{item.difficulty}</Text>
          </View>
        </View>

        <MathRenderer content={item.question} fontSize={14} lineHeight={20} />

        {/* Options Preview */}
        {(item.opt_a || item.opt_b) && (
          <View style={styles.optionsPreview}>
            <Text style={[styles.optRow, { color: theme.textSecondary }]} numberOfLines={1}>
              <Text style={{ fontWeight: '700', color: theme.primary }}>(A) </Text>
              {item.opt_a}
            </Text>
            <Text style={[styles.optRow, { color: theme.textSecondary }]} numberOfLines={1}>
              <Text style={{ fontWeight: '700', color: theme.primary }}>(B) </Text>
              {item.opt_b}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={[styles.typeText, { color: theme.textMuted }]}>
            Type: {item.q_type.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={[styles.inspectBtn, { color: theme.primary }]}>View Details & Solution →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title={`${user?.subject} Question Bank`}
        subtitle={`${totalCount.toLocaleString()} Verified Questions Available`}
      />

      {/* Filter Bar */}
      <View style={styles.filterSection}>
        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Text style={styles.searchIcon}>🔍</Text>
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
              <Text style={{ color: theme.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Filters */}
        <View style={styles.chipsRow}>
          {/* Class Chips */}
          {(['both', '11', '12'] as const).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              onPress={() => setSelectedClass(lvl)}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedClass === lvl ? theme.primary : theme.surfaceLight,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: selectedClass === lvl ? '#fff' : theme.text }]}>
                {lvl === 'both' ? 'All Classes' : `Class ${lvl}`}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Chapter Selector */}
          <TouchableOpacity
            onPress={() => setShowChapterModal(true)}
            style={[styles.chip, { backgroundColor: selectedChapter !== 'All Chapters' ? theme.secondary : theme.surfaceLight }]}
          >
            <Text style={[styles.chipText, { color: selectedChapter !== 'All Chapters' ? '#fff' : theme.text }]}>
              📖 {selectedChapter === 'All Chapters' ? 'Chapter' : selectedChapter.substring(0, 14) + '...'}
            </Text>
          </TouchableOpacity>

          {/* Difficulty Chips */}
          {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
            <TouchableOpacity
              key={diff}
              onPress={() => setSelectedDifficulty(diff)}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedDifficulty === diff ? theme.surfaceBorder : theme.surfaceLight,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: selectedDifficulty === diff ? theme.primaryLight : theme.textMuted }]}>
                {diff === 'all' ? 'All Diff' : diff}
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
            Loading {user?.subject} Questions...
          </Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          renderItem={renderQuestionCard}
          contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Questions Found</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Try broadening your chapter or difficulty filter.
              </Text>
            </View>
          }
        />
      )}

      {/* Chapter Selection Modal */}
      <Modal visible={showChapterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Chapter</Text>
              <TouchableOpacity onPress={() => setShowChapterModal(false)}>
                <Text style={[styles.modalClose, { color: theme.textSecondary }]}>✕</Text>
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
                        selectedChapter === item.name ? theme.surfaceLight : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setSelectedChapter(item.name);
                    setShowChapterModal(false);
                  }}
                >
                  <Text style={[styles.chapterName, { color: theme.text }]}>{item.name}</Text>
                  {item.count > 0 && (
                    <Text style={[styles.chapterCount, { color: theme.textMuted }]}>
                      {item.count} Qs
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
          <View style={[styles.detailModalBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            {selectedQuestion && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Question Details</Text>
                  <TouchableOpacity onPress={() => setSelectedQuestion(null)}>
                    <Text style={[styles.modalClose, { color: theme.textSecondary }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={[selectedQuestion]}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={{ paddingBottom: 20 }}>
                      <Text style={[styles.detailMeta, { color: theme.primary }]}>
                        {item.chapter} • Class {item.klass} • {item.difficulty}
                      </Text>

                      <View style={{ marginVertical: 12 }}>
                        <MathRenderer content={item.question} fontSize={16} lineHeight={24} />
                      </View>

                      {/* Options */}
                      <View style={styles.optionsList}>
                        {item.opt_a ? (
                          <View style={styles.optBox}>
                            <Text style={[styles.optTag, { color: item.correct_option === 'A' ? theme.success : theme.primary }]}>
                              (A) {item.correct_option === 'A' ? '✓ CORRECT' : ''}
                            </Text>
                            <MathRenderer content={item.opt_a} />
                          </View>
                        ) : null}
                        {item.opt_b ? (
                          <View style={styles.optBox}>
                            <Text style={[styles.optTag, { color: item.correct_option === 'B' ? theme.success : theme.primary }]}>
                              (B) {item.correct_option === 'B' ? '✓ CORRECT' : ''}
                            </Text>
                            <MathRenderer content={item.opt_b} />
                          </View>
                        ) : null}
                        {item.opt_c ? (
                          <View style={styles.optBox}>
                            <Text style={[styles.optTag, { color: item.correct_option === 'C' ? theme.success : theme.primary }]}>
                              (C) {item.correct_option === 'C' ? '✓ CORRECT' : ''}
                            </Text>
                            <MathRenderer content={item.opt_c} />
                          </View>
                        ) : null}
                        {item.opt_d ? (
                          <View style={styles.optBox}>
                            <Text style={[styles.optTag, { color: item.correct_option === 'D' ? theme.success : theme.primary }]}>
                              (D) {item.correct_option === 'D' ? '✓ CORRECT' : ''}
                            </Text>
                            <MathRenderer content={item.opt_d} />
                          </View>
                        ) : null}
                      </View>

                      {/* Solution */}
                      {item.solution_text && (
                        <View style={[styles.solutionCard, { backgroundColor: theme.surfaceLight }]}>
                          <Text style={[styles.solutionHead, { color: theme.primary }]}>Step-by-Step Solution:</Text>
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
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    gap: 12,
  },
  questionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '800',
  },
  optionsPreview: {
    marginTop: 8,
    gap: 4,
  },
  optRow: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.15)',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inspectBtn: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    maxHeight: '75%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  detailModalBox: {
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalClose: {
    fontSize: 20,
    fontWeight: '700',
    padding: 4,
  },
  chapterItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  chapterCount: {
    fontSize: 12,
  },
  detailMeta: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  optionsList: {
    gap: 8,
    marginVertical: 12,
  },
  optBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
  },
  optTag: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  solutionCard: {
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  solutionHead: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
});
