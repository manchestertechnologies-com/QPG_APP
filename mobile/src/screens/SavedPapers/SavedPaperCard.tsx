import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ExternalLink, Printer, Trash2, Calendar } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { radii, spacing, typography } from '../../theme/tokens';
import { GeneratedPaper } from '../../types';

export interface SavedPaperCardProps {
  paper: GeneratedPaper;
  onOpen: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export const SavedPaperCard: React.FC<SavedPaperCardProps> = ({
  paper,
  onOpen,
  onExport,
  onDelete,
}) => {
  const { theme } = useTheme();

  const dateStr = new Date(paper.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Badge label={`${paper.exam_type} 2026`} variant="exam" examType={paper.exam_type} size="sm" />
          <Badge label={paper.subject} variant="outline" size="sm" />
        </View>

        <View style={styles.dateRow}>
          <Calendar size={13} color={theme.textMuted} />
          <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateStr}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{paper.title}</Text>
      <Text style={[styles.institution, { color: theme.textSecondary }]}>{paper.institution_name}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: theme.surfaceLight }]}>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {paper.questions_count} Questions
          </Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: theme.surfaceLight }]}>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {paper.total_marks} Marks
          </Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: theme.surfaceLight }]}>
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {paper.duration_minutes} Mins
          </Text>
        </View>
      </View>

      {/* Action Row */}
      <View style={[styles.actionRow, { borderTopColor: theme.divider }]}>
        <View style={{ flex: 1 }}>
          <Button
            title="Open / Edit"
            variant="secondary"
            size="sm"
            onPress={onOpen}
            leftIcon={<ExternalLink size={14} color={theme.text} />}
          />
        </View>

        <View style={{ flex: 1.2 }}>
          <Button
            title="PDF Export"
            variant="primary"
            size="sm"
            onPress={onExport}
            leftIcon={<Printer size={14} color="#FFFFFF" />}
          />
        </View>

        <TouchableOpacity
          onPress={onDelete}
          style={[styles.deleteBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[3.5],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2.5],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  dateText: {
    ...typography.caption,
  },
  title: {
    ...typography.titleSmall,
    fontWeight: '700',
    marginBottom: spacing[0.5],
  },
  institution: {
    ...typography.bodySmall,
    marginBottom: spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3.5],
  },
  statPill: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2.5],
    borderRadius: radii.sm,
  },
  statText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
});
