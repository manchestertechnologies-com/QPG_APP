import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { SubscriptionBanner } from '../components/SubscriptionBanner';
import { Card } from '../components/Card';
import { api } from '../services/api';
import { LocalStorageService } from '../services/localStorageService';
import { ExamType } from '../types';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, subscription, refreshSubscription } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<{
    class11: number;
    class12: number;
    total: number;
    supportedExams: string[];
  }>({ class11: 0, class12: 0, total: 0, supportedExams: [] });
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title={`Hello, ${user?.name || 'Faculty Member'}`}
        subtitle={`${user?.institution || 'Academic Institute'} • ${user?.subject} Department`}
        onSubscriptionPress={() => navigation.navigate('Subscription')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Subscription / Plan Status Banner */}
        <SubscriptionBanner onPress={() => navigation.navigate('Subscription')} />

        {/* 2026 Examination Patterns Quick Launch */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>2026 Examination Generator</Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
              {user?.subject} Paper Architecture
            </Text>
          </View>

          <View style={styles.examGrid}>
            {/* NEET 2026 */}
            <TouchableOpacity
              onPress={() => handleLaunchGenerator('NEET')}
              activeOpacity={0.8}
              style={[styles.examCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              <LinearGradient
                colors={['#059669', '#10B981']}
                style={styles.examBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.examBadgeText}>NEET 2026</Text>
              </LinearGradient>
              <Text style={[styles.examCardTitle, { color: theme.text }]}>
                {user?.subject} Section
              </Text>
              <Text style={[styles.examCardDesc, { color: theme.textSecondary }]}>
                35 Sec A + 15 Sec B (Attempt 10) • 180 Marks (+4/-1)
              </Text>
              <Text style={[styles.examCardAction, { color: theme.primary }]}>Generate Paper →</Text>
            </TouchableOpacity>

            {/* JEE Main 2026 */}
            <TouchableOpacity
              onPress={() => handleLaunchGenerator('JEE')}
              activeOpacity={0.8}
              style={[styles.examCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              <LinearGradient
                colors={['#2563EB', '#3B82F6']}
                style={styles.examBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.examBadgeText}>JEE MAIN 2026</Text>
              </LinearGradient>
              <Text style={[styles.examCardTitle, { color: theme.text }]}>
                {user?.subject} Paper
              </Text>
              <Text style={[styles.examCardDesc, { color: theme.textSecondary }]}>
                20 MCQs + 10 Numerical (Attempt 5) • 100 Marks (+4/-1)
              </Text>
              <Text style={[styles.examCardAction, { color: theme.primary }]}>Generate Paper →</Text>
            </TouchableOpacity>

            {/* KCET / State CET 2026 */}
            <TouchableOpacity
              onPress={() => handleLaunchGenerator('CET')}
              activeOpacity={0.8}
              style={[styles.examCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              <LinearGradient
                colors={['#7C3AED', '#8B5CF6']}
                style={styles.examBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.examBadgeText}>CET / KCET 2026</Text>
              </LinearGradient>
              <Text style={[styles.examCardTitle, { color: theme.text }]}>
                State CET Test
              </Text>
              <Text style={[styles.examCardDesc, { color: theme.textSecondary }]}>
                60 Questions • 60 Marks • 80 Mins (No negative marking)
              </Text>
              <Text style={[styles.examCardAction, { color: theme.primary }]}>Generate Paper →</Text>
            </TouchableOpacity>

            {/* Custom Chapter Test */}
            <TouchableOpacity
              onPress={() => handleLaunchGenerator('CUSTOM')}
              activeOpacity={0.8}
              style={[styles.examCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              <LinearGradient
                colors={['#D97706', '#F59E0B']}
                style={styles.examBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.examBadgeText}>CUSTOM TEST</Text>
              </LinearGradient>
              <Text style={[styles.examCardTitle, { color: theme.text }]}>
                Chapter / Unit Test
              </Text>
              <Text style={[styles.examCardDesc, { color: theme.textSecondary }]}>
                Choose specific chapters, question count & difficulty mix
              </Text>
              <Text style={[styles.examCardAction, { color: theme.primary }]}>Configure →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Question Bank Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Question Bank Repository</Text>
          <Card>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={[styles.statNumber, { color: theme.primary }]}>
                  {stats.total.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {user?.subject} Questions
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={[styles.statNumber, { color: theme.text }]}>
                  {stats.class11.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Class 11</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={[styles.statNumber, { color: theme.text }]}>
                  {stats.class12.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Class 12</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.browseBtn, { backgroundColor: theme.surfaceLight }]}
              onPress={() => navigation.navigate('QuestionBank')}
              activeOpacity={0.7}
            >
              <Text style={[styles.browseText, { color: theme.text }]}>
                Explore {user?.subject} Question Bank →
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Local Storage Saved Papers Vault */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Local Saved Papers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SavedPapers')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>Open Vault →</Text>
            </TouchableOpacity>
          </View>

          <Card>
            <View style={styles.vaultRow}>
              <View style={[styles.vaultIconBox, { backgroundColor: theme.surfaceLight }]}>
                <Text style={styles.vaultIcon}>📁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vaultTitle, { color: theme.text }]}>
                  {localPaperCount} Papers in Local Device Storage
                </Text>
                <Text style={[styles.vaultDesc, { color: theme.textSecondary }]}>
                  {subscription?.isActive
                    ? 'Saved locally on device. Instant PDF export & print.'
                    : 'Saved on device. Re-activate subscription to unlock.'}
                </Text>
              </View>
            </View>
          </Card>
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
    paddingBottom: 40,
  },
  section: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  examGrid: {
    gap: 12,
  },
  examCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  examBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  examBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  examCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  examCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  examCardAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  browseBtn: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  browseText: {
    fontSize: 13,
    fontWeight: '700',
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  vaultIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultIcon: {
    fontSize: 24,
  },
  vaultTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  vaultDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
