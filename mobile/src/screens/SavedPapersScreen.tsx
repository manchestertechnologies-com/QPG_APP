import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
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

  // Subscription Expiry Enforcement (User Requirement)
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

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Paper', `Delete "${title}" from local device storage?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await LocalStorageService.deletePaper(id);
          loadLocalPapers();
        },
      },
    ]);
  };

  const filteredPapers = papers.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Local Saved Papers Vault"
        subtitle={`${papers.length} Papers Stored on Device`}
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search saved papers..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredPapers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.examBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.examBadgeText, { color: theme.primaryLight }]}>
                    {item.exam_type} 2026
                  </Text>
                </View>
                <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateStr}</Text>
              </View>

              <Text style={[styles.paperTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.instText, { color: theme.textSecondary }]}>
                {item.institution_name} • {item.subject}
              </Text>

              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: theme.textMuted }]}>
                  {item.questions_count} Questions
                </Text>
                <Text style={[styles.metaText, { color: theme.textMuted }]}>•</Text>
                <Text style={[styles.metaText, { color: theme.textMuted }]}>
                  {item.total_marks} Marks
                </Text>
                <Text style={[styles.metaText, { color: theme.textMuted }]}>•</Text>
                <Text style={[styles.metaText, { color: theme.textMuted }]}>
                  {item.duration_minutes} Mins
                </Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.surfaceLight }]}
                  onPress={() => navigation.navigate('PaperReview', { paper: item })}
                >
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Open / Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('PdfPreview', { paper: item })}
                >
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>PDF Export</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: theme.errorBg }]}
                  onPress={() => handleDelete(item.id, item.title)}
                >
                  <Text style={{ color: theme.error, fontSize: 13, fontWeight: '700' }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Saved Papers Yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Generated question papers saved to your device will appear here.
            </Text>
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
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
    gap: 12,
  },
  paperCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  examBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  examBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  instText: {
    fontSize: 12,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
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
});
