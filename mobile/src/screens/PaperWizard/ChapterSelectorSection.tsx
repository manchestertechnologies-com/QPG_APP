import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

export interface ChapterSelectorSectionProps {
  isFullSyllabus: boolean;
  setIsFullSyllabus: (val: boolean) => void;
  selectedChapters: string[];
  onToggleChapter: (name: string) => void;
  onResetToAll: () => void;
  chapters: { name: string; count: number }[];
  loading: boolean;
  subject: string;
}

export const ChapterSelectorSection: React.FC<ChapterSelectorSectionProps> = ({
  isFullSyllabus,
  setIsFullSyllabus,
  selectedChapters,
  onToggleChapter,
  onResetToAll,
  chapters,
  loading,
  subject,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      {/* Full Syllabus Option */}
      <TouchableOpacity
        onPress={() => {
          setIsFullSyllabus(true);
          onResetToAll();
        }}
        activeOpacity={0.8}
        style={[
          styles.fullSyllabusRow,
          isFullSyllabus && { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
        ]}
      >
        <View
          style={[
            styles.radioCircle,
            { borderColor: isFullSyllabus ? theme.primary : theme.textMuted },
          ]}
        >
          {isFullSyllabus && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
        </View>

        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.text }]}>Full Syllabus (Recommended)</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Balanced distribution across all NCERT {subject} chapters.
          </Text>
        </View>
      </TouchableOpacity>

      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      {/* Specific Chapter Chips */}
      <View style={styles.chaptersBox}>
        <View style={styles.headerRow}>
          <Text style={[styles.boxTitle, { color: theme.text }]}>
            Or Target Specific Chapters ({selectedChapters.length} active)
          </Text>
          {selectedChapters.length > 0 && (
            <TouchableOpacity onPress={onResetToAll} activeOpacity={0.7}>
              <Text style={[styles.resetBtn, { color: theme.primaryLight }]}>Reset to All</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: spacing[3] }} />
        ) : (
          <View style={styles.chipsWrap}>
            {chapters.slice(0, 19).map((ch, idx) => {
              const isChecked = selectedChapters.includes(ch.name);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onToggleChapter(ch.name)}
                  activeOpacity={0.8}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isChecked ? 'rgba(99, 102, 241, 0.18)' : theme.surfaceLight,
                      borderColor: isChecked ? theme.primary : theme.surfaceBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isChecked ? theme.primaryLight : theme.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {isChecked ? '✓ ' : ''}{ch.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fullSyllabusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3.5],
    cursor: 'pointer' as any,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
  },
  textCol: {
    marginLeft: spacing[3],
    flex: 1,
  },
  title: {
    ...typography.label,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  chaptersBox: {
    padding: spacing[3.5],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2.5],
  },
  boxTitle: {
    ...typography.label,
  },
  resetBtn: {
    ...typography.caption,
    fontWeight: '700',
    cursor: 'pointer' as any,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  chip: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1.5],
    borderRadius: radii.full,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
