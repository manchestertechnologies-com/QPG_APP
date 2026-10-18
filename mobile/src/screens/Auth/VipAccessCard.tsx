import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography, shadows } from '../../theme/tokens';
import { Badge } from '../../components/ui/Badge';

export interface VipAccessCardProps {
  onPress: () => void;
  loading?: boolean;
}

export const VipAccessCard: React.FC<VipAccessCardProps> = ({ onPress, loading = false }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.vipCard, shadows.glowPrimary]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={loading}
    >
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.25)', 'rgba(168, 85, 247, 0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      >
        <View style={styles.iconCircle}>
          <Sparkles size={20} color="#FFFFFF" />
        </View>

        <View style={styles.contentCol}>
          <View style={styles.badgeRow}>
            <Text style={[styles.title, { color: theme.text }]}>1-Tap Sign In as Chemistry Pro</Text>
            <Badge label="ACTIVE" variant="success" size="sm" />
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            qpgtest@gmail.com • Chemistry Faculty
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <View style={styles.arrowCircle}>
            <ArrowRight size={16} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  vipCard: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.45)',
    overflow: 'hidden',
    marginVertical: spacing[2],
    cursor: 'pointer' as any,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3.5],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCol: {
    flex: 1,
    marginLeft: spacing[3],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    ...typography.label,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
