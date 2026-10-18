import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { LockOverlay } from '../components/LockOverlay';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../services/api';
import { Question, ClassLevel, DifficultyLevel } from '../types';
import { layout, spacing } from '../theme/tokens';

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
      />

      <View style={styles.responsiveContent}>
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
  skeletonContainer: {
    padding: spacing[4],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
  },
});
