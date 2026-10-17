import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  BookOpen,
  FolderDown,
  Crown,
  ChevronRight,
  Flame,
  Award,
  Zap,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LocalStorageService } from '../services/localStorageService';
import { ExamType } from '../types';

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
      if (res.stats) setStats(res.stats);

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

  // Instagram Story Badges
  const stories = [
    { id: 'neet', label: 'NEET 2026', exam: 'NEET' as ExamType, count: '50 Qs', icon: '🩺' },
    { id: 'jee', label: 'JEE Main', exam: 'JEE' as ExamType, count: '30 Qs', icon: '⚡' },
    { id: 'cet', label: 'State CET', exam: 'CET' as ExamType, count: '60 Qs', icon: '🎯' },
    { id: 'custom', label: 'Unit Test', exam: 'CUSTOM' as ExamType, count: 'Custom', icon: '📝' },
    { id: 'bank', label: 'Full Bank', route: 'QuestionBank', count: '23.6k Qs', icon: '📚' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* WhatsApp / Instagram Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
        <View style={styles.topBarLeft}>
          <View style={styles.storyRingWrapper}>
            <LinearGradient
              colors={['#F59E0B', '#EC4899', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyRing}
            >
              <View style={[styles.avatarCircle, { backgroundColor: theme.cardBg }]}>
                <Text style={styles.avatarLetter}>
                  {(user?.name || user?.email || 'T').charAt(0).toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
          </View>
          <View style={{ marginLeft: 10 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user?.name || 'Chemistry Faculty'}
              </Text>
              <View style={styles.verifiedDot}>
                <CheckCircle2 size={13} color="#10B981" />
              </View>
            </View>
            <Text style={[styles.userSubject, { color: theme.primary }]}>
              {user?.subject || 'Chemistry'} Specialist • {user?.institution || 'Academic Institute'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.proHeaderBadge}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={subscription?.isActive ? ['#10B981', '#059669'] : ['#6366F1', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proHeaderGradient}
          >
            <Crown size={13} color="#FFFFFF" />
            <Text style={styles.proHeaderText}>
              {subscription?.isActive ? 'PRO ACTIVE' : '₹299 PRO'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Instagram Stories Carousel */}
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
            {stories.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.storyItem}
                onPress={() => {
                  if (s.exam) handleLaunchGenerator(s.exam);
                  else if (s.route) navigation.navigate(s.route);
                }}
                activeOpacity={0.75}
              >
                <LinearGradient
                  colors={['#F59E0B', '#EC4899', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.storyRingOuter}
                >
                  <View style={[styles.storyInnerCircle, { backgroundColor: theme.surface }]}>
                    <Text style={styles.storyEmoji}>{s.icon}</Text>
                  </View>
                </LinearGradient>
                <Text style={[styles.storyLabel, { color: theme.text }]} numberOfLines={1}>
                  {s.label}
                </Text>
                <Text style={[styles.storyCount, { color: theme.textMuted }]}>{s.count}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* WhatsApp-Style Filter Pills */}
        <View style={styles.pillsRow}>
          {(['ALL', 'NEET', 'JEE', 'CET'] as const).map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                  },
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '800' : '600' },
                  ]}
                >
                  {filter === 'ALL' ? '⚡ All Exams' : `${filter} 2026`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PRO HERO CARD (Instagram / WhatsApp Luxury Banner) */}
        <View style={styles.heroCardWrapper}>
          <LinearGradient
            colors={['#1E1B4B', '#312E81', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Sparkles size={13} color="#FBBF24" />
                <Text style={styles.heroBadgeText}>OFFICIAL 2026 NTA & STATE PATTERNS</Text>
              </View>
              <Text style={styles.heroPriceTag}>₹299/mo</Text>
            </View>

            <Text style={styles.heroTitle}>Unlimited Question Paper Generator</Text>
            <Text style={styles.heroDesc}>
              Generate zero-duplicate, publication-grade examination PDFs with step-by-step KaTeX solutions.
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNum}>{stats.total.toLocaleString()}+</Text>
                <Text style={styles.heroStatLabel}>{user?.subject} Bank</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNum}>35+15</Text>
                <Text style={styles.heroStatLabel}>NEET Sec A/B</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNum}>PDF Only</Text>
                <Text style={styles.heroStatLabel}>Instant Print</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => handleLaunchGenerator('NEET')}
              activeOpacity={0.85}
            >
              <Text style={styles.heroActionBtnText}>Quick Launch NEET 2026</Text>
              <ArrowUpRight size={18} color="#0F172A" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 2026 EXAM PATTERNS CARDS */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Examination Templates</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>Locked: {user?.subject}</Text>
          </View>

          <View style={styles.examCardsList}>
            {/* NEET 2026 */}
            {(selectedFilter === 'ALL' || selectedFilter === 'NEET') && (
              <TouchableOpacity
                style={[styles.patternCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                onPress={() => handleLaunchGenerator('NEET')}
                activeOpacity={0.8}
              >
                <View style={styles.patternCardHeader}>
                  <View style={[styles.patternBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={[styles.patternBadgeText, { color: '#10B981' }]}>NEET 2026 PATTERN</Text>
                  </View>
                  <Text style={[styles.patternMarks, { color: theme.textMuted }]}>180 Marks • 50 Qs</Text>
                </View>

                <Text style={[styles.patternTitle, { color: theme.text }]}>
                  {user?.subject} Full Mock Architecture
                </Text>
                <Text style={[styles.patternDesc, { color: theme.textSecondary }]}>
                  Section A: 35 Mandatory (+4/-1) • Section B: 15 Questions (Attempt 10)
                </Text>

                <View style={styles.patternFooter}>
                  <View style={styles.featurePill}>
                    <Clock size={12} color={theme.textMuted} />
                    <Text style={[styles.featurePillText, { color: theme.textMuted }]}>50 Mins</Text>
                  </View>
                  <View style={styles.featurePill}>
                    <FileText size={12} color={theme.textMuted} />
                    <Text style={[styles.featurePillText, { color: theme.textMuted }]}>Includes Answer Key</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={[styles.generateLink, { color: theme.primary }]}>Generate →</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* JEE MAIN 2026 */}
            {(selectedFilter === 'ALL' || selectedFilter === 'JEE') && (
              <TouchableOpacity
                style={[styles.patternCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                onPress={() => handleLaunchGenerator('JEE')}
                activeOpacity={0.8}
              >
                <View style={styles.patternCardHeader}>
                  <View style={[styles.patternBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Text style={[styles.patternBadgeText, { color: '#3B82F6' }]}>JEE MAIN 2026</Text>
                  </View>
                  <Text style={[styles.patternMarks, { color: theme.textMuted }]}>100 Marks • 30 Qs</Text>
                </View>

                <Text style={[styles.patternTitle, { color: theme.text }]}>
                  {user?.subject} Engineering Entrance
                </Text>
                <Text style={[styles.patternDesc, { color: theme.textSecondary }]}>
                  Section A: 20 MCQs • Section B: 10 Numerical Value (Attempt any 5)
                </Text>

                <View style={styles.patternFooter}>
                  <View style={styles.featurePill}>
                    <Clock size={12} color={theme.textMuted} />
                    <Text style={[styles.featurePillText, { color: theme.textMuted }]}>60 Mins</Text>
                  </View>
                  <View style={styles.featurePill}>
                    <FileText size={12} color={theme.textMuted} />
                    <Text style={[styles.featurePillText, { color: theme.textMuted }]}>KaTeX Print</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={[styles.generateLink, { color: theme.primary }]}>Generate →</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* STATE CET 2026 */}
            {(selectedFilter === 'ALL' || selectedFilter === 'CET') && (
              <TouchableOpacity
                style={[styles.patternCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
                onPress={() => handleLaunchGenerator('CET')}
                activeOpacity={0.8}
              >
                <View style={styles.patternCardHeader}>
                  <View style={[styles.patternBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Text style={[styles.patternBadgeText, { color: '#8B5CF6' }]}>KCET / CET 2026</Text>
                  </View>
                  <Text style={[styles.patternMarks, { color: theme.textMuted }]}>60 Marks • 60 Qs</Text>
                </View>

                <Text style={[styles.patternTitle, { color: theme.text }]}>
                  Karnataka & State CET Mock Paper
                </Text>
                <Text style={[styles.patternDesc, { color: theme.textSecondary }]}>
                  60 Multiple Choice Questions • 80 Minutes • 0 Negative Marking
                </Text>

                <View style={styles.patternFooter}>
                  <View style={styles.featurePill}>
                    <Clock size={12} color={theme.textMuted} />
                    <Text style={[styles.featurePillText, { color: theme.textMuted }]}>80 Mins</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={[styles.generateLink, { color: theme.primary }]}>Generate →</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* VAULT STATUS (WhatsApp Chat Card Style) */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.vaultCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
            onPress={() => navigation.navigate('SavedPapers')}
            activeOpacity={0.8}
          >
            <View style={[styles.vaultIconSquare, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <FolderDown size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.vaultCardTitle, { color: theme.text }]}>Local Saved Papers Vault</Text>
              <Text style={[styles.vaultCardDesc, { color: theme.textSecondary }]}>
                {localPaperCount} papers securely stored on this device • Instant PDF export
              </Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 45,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyRingWrapper: {
    width: 44,
    height: 44,
  },
  storyRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '900',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  verifiedDot: {
    marginLeft: 2,
  },
  userSubject: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  proHeaderBadge: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  proHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  proHeaderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  storiesContainer: {
    paddingTop: 14,
    paddingBottom: 10,
  },
  storiesScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyRingOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  storyInnerCircle: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyEmoji: {
    fontSize: 22,
  },
  storyLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  storyCount: {
    fontSize: 9,
    marginTop: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  heroCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  heroCard: {
    borderRadius: 22,
    padding: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroPriceTag: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 26,
    marginBottom: 6,
  },
  heroDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatNum: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  heroStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroActionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  heroActionBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  examCardsList: {
    gap: 10,
  },
  patternCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  patternCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  patternBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  patternMarks: {
    fontSize: 11,
    fontWeight: '600',
  },
  patternTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  patternDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  patternFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  generateLink: {
    fontSize: 12,
    fontWeight: '800',
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  vaultIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  vaultCardDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
