import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Sparkles, Crown } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../services/api';
import { Question, ClassLevel, DifficultyLevel } from '../types';
import { layout, radii, spacing, typography } from '../theme/tokens';

import { QuestionFilters } from './QuestionBank/QuestionFilters';
import { QuestionListItem } from './QuestionBank/QuestionListItem';
import { ChapterPickerModal } from './QuestionBank/ChapterPickerModal';
import { QuestionDetailModal } from './QuestionBank/QuestionDetailModal';

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

  const isPro = subscription?.isActive === true;

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

  const handleResetFilters = () => {
    setSelectedClass('both');
    setSelectedChapter('All Chapters');
    setSelectedDifficulty('all');
    setSearchQuery('');
    loadQuestions(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title={`${user?.subject || 'Chemistry'} Question Bank`}
        subtitle={`${totalCount.toLocaleString()} Verified Questions Available`}
        onSubscriptionPress={() => navigation.navigate('Subscription')}
      />

      <View style={styles.responsiveContent}>
        {/* Trial / Explorer Banner */}
        {!isPro && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.85}
            style={[styles.trialBanner, { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}
          >
            <Sparkles size={14} color={theme.primary} />
            <Text style={[styles.trialBannerText, { color: theme.text }]}>
              Free Explorer Tier: Browsing full database • 1 Free Paper trial included
            </Text>
            <Crown size={14} color={theme.warning} />
          </TouchableOpacity>
        )}

        <QuestionFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={() => loadQuestions(true)}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedChapter={selectedChapter}
          onOpenChapterPicker={() => setShowChapterModal(true)}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
        />

        {loading ? (
          <View style={styles.skeletonContainer}>
            <CardSkeleton count={4} />
          </View>
        ) : (
          <FlatList
            data={questions}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            renderItem={({ item }) => (
              <QuestionListItem
                question={item}
                onPress={() => setSelectedQuestion(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasMore && !loadingMore) loadQuestions(false);
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={theme.primary} style={{ marginVertical: spacing[5] }} />
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                title="No Questions Found"
                description="Try adjusting your keywords, class levels, or chapter filters."
                actionLabel="Reset All Filters"
                onAction={handleResetFilters}
              />
            }
          />
        )}
      </View>

      {/* Chapter Picker Modal */}
      <ChapterPickerModal
        visible={showChapterModal}
        onClose={() => setShowChapterModal(false)}
        chapters={chapterList}
        totalCount={totalCount}
        selectedChapter={selectedChapter}
        onSelectChapter={setSelectedChapter}
      />

      {/* Question Detail Modal */}
      <QuestionDetailModal
        question={selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  responsiveContent: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3.5],
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  trialBannerText: {
    ...typography.caption,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: spacing[2],
  },
  skeletonContainer: {
    padding: spacing[4],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
  },
});
