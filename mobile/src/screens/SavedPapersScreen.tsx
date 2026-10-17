import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  FolderDown,
  FileText,
  Trash2,
  ExternalLink,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { LockOverlay } from '../components/LockOverlay';
import { LocalStorageService } from '../services/localStorageService';
import { GeneratedPaper } from '../types';

export const SavedPapersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, subscription } = useAuth();

  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [totalStored, setTotalStored] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const loadLocalPapers = async () => {
    const isActive = subscription?.isActive === true;
    const res = await LocalStorageService.getSavedPapers(isActive);
    setIsLocked(res.isLocked);
    setTotalStored(res.totalStoredCount);
    setPapers(res.papers);
  };

  useEffect(() => {
    loadLocalPapers();
  }, [subscription]);

  // Subscription Expiry Enforcement
  if (isLocked || !subscription?.isActive) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Saved Papers Vault" />
        <LockOverlay
          title="Saved Papers Locked"
          description={`You have ${totalStored} question papers preserved in local storage. Under platform subscription policy, access to previously created papers is locked until your ₹299 monthly subscription is renewed.`}
          onRenewPress={() => navigation.navigate('Subscription')}
        />
      </View>
    );
  }

  const handleDelete = async (id: string, title: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete "${title}" from device storage?`);
      if (!confirmed) return;
    }
    await LocalStorageService.deletePaper(id);
    setNotification(`Deleted "${title}"`);
    loadLocalPapers();
  };

  const filteredPapers = papers.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.exam_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Local Saved Papers Vault"
        subtitle={`${papers.length} Papers Stored on Device`}
      />

      {/* Search Header */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <Search size={18} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search saved papers or exams..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: theme.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notification Toast */}
      {notification && (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.toastText}>{notification}</Text>
        </View>
      )}

      <FlatList
        data={filteredPapers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const dateStr = new Date(item.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <View
              style={[
                styles.paperCard,
                { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <View style={[styles.examBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Text style={styles.examBadgeText}>{item.exam_type} 2026</Text>
                  </View>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>{item.subject}</Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Calendar size={13} color={theme.textMuted} />
                  <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateStr}</Text>
                </View>
              </View>

              <Text style={[styles.paperTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.instText, { color: theme.textSecondary }]}>
                {item.institution_name}
              </Text>

              {/* Stats pill row */}
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>{item.questions_count} Questions</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>{item.total_marks} Marks</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>{item.duration_minutes} Mins</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtnSecondary, { borderColor: theme.surfaceBorder, backgroundColor: theme.surfaceLight }]}
                  onPress={() => navigation.navigate('PaperReview', { paper: item })}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={15} color={theme.text} />
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Open / Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => navigation.navigate('PdfPreview', { paper: item })}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#6366F1', '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                    pointerEvents="none"
                  >
                    <Printer size={15} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>PDF Export</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                  onPress={() => handleDelete(item.id, item.title)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <View style={styles.emptyIconCircle}>
              <FolderDown size={36} color="#6366F1" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Saved Papers Yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Generated question papers saved to your device vault will appear here for fast PDF export.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('GenerateTab')}
              style={styles.emptyCta}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#6366F1', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyCtaGradient}
                pointerEvents="none"
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.emptyCtaText}>Create 2026 Examination Paper</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  toastText: {
    color: '#10B981',
    fontSize: 12.5,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
  },
  paperCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
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
  },
  examBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examBadgeText: {
    color: '#818CF8',
    fontSize: 10.5,
    fontWeight: '900',
  },
  subjectBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectBadgeText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11.5,
  },
  paperTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  instText: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    gap: 6,
    cursor: 'pointer' as any,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  actionBtnPrimary: {
    flex: 1.2,
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer' as any,
  },
  primaryGradient: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  emptyCenter: {
    alignItems: 'center',
    padding: 30,
    marginTop: 30,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 20,
  },
  emptyCta: {
    borderRadius: 14,
    overflow: 'hidden',
    cursor: 'pointer' as any,
  },
  emptyCtaGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
