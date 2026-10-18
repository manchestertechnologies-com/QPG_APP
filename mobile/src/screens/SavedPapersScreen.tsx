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
import { Search, X, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { LockOverlay } from '../components/LockOverlay';
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
  const [isLocked, setIsLocked] = useState(false);
  const [search, setSearch] = useState('');

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
        subtitle={`${papers.length} Papers Stored on Device`}
      />

      <Toast toast={toast} onDismiss={hideToast} />

      <View style={styles.responsiveContent}>
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
                  : 'Generated question papers saved to your device vault will appear here for fast PDF export.'
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
