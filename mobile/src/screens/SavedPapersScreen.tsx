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
import { Search, X, Sparkles, Crown } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { LocalStorageService } from '../services/localStorageService';
import { GeneratedPaper } from '../types';
import { layout, radii, spacing, typography } from '../theme/tokens';
import { SavedPaperCard } from './SavedPapers/SavedPaperCard';

export const SavedPapersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, subscription } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [totalStored, setTotalStored] = useState(0);
  const [search, setSearch] = useState('');

  const isPro = subscription?.isActive === true;

  const loadLocalPapers = async () => {
    const res = await LocalStorageService.getSavedPapers(true);
    setTotalStored(res.totalStoredCount);
    setPapers(res.papers);
  };

  useEffect(() => {
    loadLocalPapers();
  }, [subscription]);

  const handleDelete = async (id: string, title: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete "${title}" from device storage?`);
      if (!confirmed) return;
    }
    await LocalStorageService.deletePaper(id);
    showToast(`Deleted "${title}"`, 'info');
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
        subtitle={`${papers.length} Paper${papers.length === 1 ? '' : 's'} Stored on Device`}
        onSubscriptionPress={() => navigation.navigate('Subscription')}
      />

      <Toast toast={toast} onDismiss={hideToast} />

      <View style={styles.responsiveContent}>
        {/* Free trial / Pro status notice */}
        {!isPro && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.85}
            style={[styles.trialNotice, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}
          >
            <Sparkles size={14} color={theme.warning} />
            <Text style={[styles.trialNoticeText, { color: theme.text }]}>
              {papers.length >= 1
                ? '1 Free Paper created! Upgrade to Pro (₹299/mo) for unlimited papers.'
                : '1 Free Examination Paper trial available! Create your paper anytime.'}
            </Text>
            <Crown size={14} color={theme.warning} />
          </TouchableOpacity>
        )}

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
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                <X size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredPapers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SavedPaperCard
              paper={item}
              onOpen={() => navigation.navigate('PaperReview', { paper: item })}
              onExport={() => navigation.navigate('PdfPreview', { paper: item })}
              onDelete={() => handleDelete(item.id, item.title)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={search ? 'No Matches Found' : 'No Saved Papers Yet'}
              description={
                search
                  ? `No papers matching "${search}". Try a different keyword.`
                  : 'Generated question papers saved to your device vault will appear here for instant PDF export.'
              }
              actionLabel="Create 2026 Examination Paper"
              onAction={() => navigation.navigate('GenerateTab')}
            />
          }
        />
      </View>
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
  trialNotice: {
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
  trialNoticeText: {
    ...typography.caption,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: spacing[2],
  },
  searchSection: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    height: '100%',
  },
  clearBtn: {
    padding: spacing[1],
    cursor: 'pointer' as any,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
  },
});
