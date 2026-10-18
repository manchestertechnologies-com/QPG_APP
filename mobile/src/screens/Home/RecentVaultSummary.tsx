import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FolderDown, ChevronRight, FileCheck } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

export interface RecentVaultSummaryProps {
  onPress: () => void;
  count: number;
}

export const RecentVaultSummary: React.FC<RecentVaultSummaryProps> = ({
  onPress,
  count,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
        },
      ]}
    >
      <View style={styles.leftRow}>
        <View style={styles.iconCircle}>
          <FolderDown size={20} color="#6366F1" />
        </View>

        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.text }]}>Local Saved Papers Vault</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {count > 0 ? `${count} papers preserved for vector PDF print` : 'No papers generated yet'}
          </Text>
        </View>
      </View>

      <ChevronRight size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3.5],
    borderRadius: radii.lg,
    borderWidth: 1,
    marginVertical: spacing[2],
    cursor: 'pointer' as any,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
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
});
