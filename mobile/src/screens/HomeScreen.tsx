import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LocalStorageService } from '../services/localStorageService';
import { ExamType } from '../types';
import { AppLayout } from '../components/ui/AppLayout';
import { Header } from '../components/Header';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StoriesCarousel, StoryItem } from './Home/StoriesCarousel';
import { HeroQuickGenerateCard } from './Home/HeroQuickGenerateCard';
import { ExamArchitectureGrid } from './Home/ExamArchitectureGrid';
import { RecentVaultSummary } from './Home/RecentVaultSummary';
import { spacing, typography } from '../theme/tokens';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, subscription, refreshSubscription } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'NEET' | 'JEE' | 'CET'>('ALL');
  const [stats, setStats] = useState<{
    class11: number;
    class12: number;
    total: number;
    supportedExams: string[];
  }>({ class11: 11800, class12: 11803, total: 23603, supportedExams: ['NEET', 'JEE', 'CET'] });
  const [localPaperCount, setLocalPaperCount] = useState(0);

  const loadData = async () => {
    try {
      await refreshSubscription();
      const res = await api.getCatalogStats();
      if (res && res.stats) setStats(res.stats);

      const local = await LocalStorageService.getSavedPapers(true);
      setLocalPaperCount(local.totalStoredCount);
    } catch (err) {
      console.warn('Error loading home data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLaunchGenerator = (examType: ExamType) => {
    navigation.navigate('PaperWizard', { preselectedExam: examType });
  };

  const handleSelectStory = (story: StoryItem) => {
    if (story.route) {
      navigation.navigate(story.route);
    } else if (story.exam) {
      handleLaunchGenerator(story.exam);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Header
        showProfile
        onSubscriptionPress={() => navigation.navigate('Subscription')}
      />

      <AppLayout
        contentContainerStyle={styles.container}
      >
        {/* Instagram Story Highlights */}
        <StoriesCarousel onSelectStory={handleSelectStory} />

        {/* Hero Featured Launch Card */}
        <HeroQuickGenerateCard
          onPress={() => handleLaunchGenerator('NEET')}
          subject={user?.subject || 'Chemistry'}
          totalQuestions={stats.total}
          isPro={subscription?.isActive === true}
          freeTrialAvailable={localPaperCount < 1}
        />

        {/* Section: 2026 Architectures */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            2026 Examination Patterns
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Official question distribution & scoring algorithms
          </Text>
        </View>

        {/* Exam Filter Pills */}
        <SegmentedControl
          options={[
            { id: 'ALL', label: 'All Exams' },
            { id: 'NEET', label: 'NEET' },
            { id: 'JEE', label: 'JEE Main' },
          ]}
          selectedId={selectedFilter}
          onSelect={(id) => setSelectedFilter(id as any)}
        />

        {/* Architecture Grid */}
        <ExamArchitectureGrid
          onSelectExam={handleLaunchGenerator}
          filter={selectedFilter}
        />

        {/* Local Vault Shortcut */}
        <RecentVaultSummary
          onPress={() => navigation.navigate('SavedPapersTab')}
          count={localPaperCount}
        />
      </AppLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing[1],
    paddingBottom: spacing[8],
  },
  sectionHeader: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  sectionTitle: {
    ...typography.titleMedium,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
});
