import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Search, X, BookOpen } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';
import { ClassLevel, DifficultyLevel } from '../../types';

export interface QuestionFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSearchSubmit: () => void;
  selectedClass: ClassLevel | 'both';
  setSelectedClass: (val: ClassLevel | 'both') => void;
  selectedChapter: string;
  onOpenChapterPicker: () => void;
  selectedDifficulty: DifficultyLevel | 'all';
  setSelectedDifficulty: (val: DifficultyLevel | 'all') => void;
}

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  selectedClass,
  setSelectedClass,
  selectedChapter,
  onOpenChapterPicker,
  selectedDifficulty,
  setSelectedDifficulty,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Modern Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        <Search size={18} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search keywords, formulas, reactions..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              onSearchSubmit();
            }}
            style={styles.clearBtn}
          >
            <X size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Filter Chips */}
      <View style={styles.chipsRow}>
        {/* Class Chips */}
        {(['both', '11', '12'] as const).map((lvl) => {
          const isSelected = selectedClass === lvl;
          return (
            <TouchableOpacity
              key={lvl}
              onPress={() => setSelectedClass(lvl)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {lvl === 'both' ? 'All Classes' : `Class ${lvl}`}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Chapter Picker Trigger */}
        <TouchableOpacity
          onPress={onOpenChapterPicker}
          activeOpacity={0.8}
          style={[
            styles.chip,
            {
              backgroundColor: selectedChapter !== 'All Chapters' ? 'rgba(99, 102, 241, 0.18)' : theme.surface,
              borderColor: selectedChapter !== 'All Chapters' ? theme.primary : theme.surfaceBorder,
            },
          ]}
        >
          <BookOpen
            size={13}
            color={selectedChapter !== 'All Chapters' ? theme.primaryLight : theme.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.chipText,
              { color: selectedChapter !== 'All Chapters' ? theme.primaryLight : theme.textSecondary },
            ]}
            numberOfLines={1}
          >
            {selectedChapter === 'All Chapters' ? 'All Chapters' : selectedChapter.substring(0, 13) + '...'}
          </Text>
        </TouchableOpacity>

        {/* Difficulty Chips */}
        {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => {
          const isSelected = selectedDifficulty === diff;
          return (
            <TouchableOpacity
              key={diff}
              onPress={() => setSelectedDifficulty(diff as any)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? theme.primaryLight : theme.textMuted },
                ]}
              >
                {diff === 'all' ? 'All Diff' : diff.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[2.5],
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
