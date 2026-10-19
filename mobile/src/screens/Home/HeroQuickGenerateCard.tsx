import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight, Zap, Crown } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography, shadows } from '../../theme/tokens';

export interface HeroQuickGenerateCardProps {
  onPress: () => void;
  subject: string;
  totalQuestions: number;
  isPro?: boolean;
  freeTrialAvailable?: boolean;
}

export const HeroQuickGenerateCard: React.FC<HeroQuickGenerateCardProps> = ({
  onPress,
  subject,
  totalQuestions,
  isPro = false,
  freeTrialAvailable = true,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[styles.container, shadows.glowPrimary]}
    >
      <LinearGradient
        colors={['#1E1B4B', '#311042', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      >
        <View style={styles.badgeRow}>
          <View style={styles.specBadge}>
            <Zap size={13} color="#FBBF24" />
            <Text style={styles.specBadgeText}>
              {isPro ? '2026 PRO ENGINE' : freeTrialAvailable ? '1 FREE PAPER TRIAL' : 'PRO REQUIRED'}
            </Text>
          </View>
          <Text style={styles.bankCount}>
            {totalQuestions.toLocaleString()}+ Qs
          </Text>
        </View>

        <Text style={styles.title}>
          Generate {subject} Examination Paper
        </Text>

        <Text style={styles.desc}>
          {freeTrialAvailable && !isPro
            ? 'Try our 2026 exam generator for free: automatic syllabus distribution for NEET, JEE & CET with KaTeX formulas and answer keys.'
            : 'Automatic syllabus balancing for NEET, JEE Main & State CET with KaTeX formulas and answer keys.'}
        </Text>

        <View style={styles.btnRow}>
          <View style={[styles.launchBtn, { backgroundColor: isPro || freeTrialAvailable ? '#6366F1' : '#10B981' }]}>
            {isPro || freeTrialAvailable ? (
              <Sparkles size={16} color="#FFFFFF" />
            ) : (
              <Crown size={16} color="#FFFFFF" />
            )}
            <Text style={styles.launchBtnText}>
              {freeTrialAvailable && !isPro
                ? 'Create 1st Free Paper'
                : isPro
                ? 'Create Examination Paper'
                : 'Upgrade to Create Paper (₹299)'}
            </Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    marginVertical: spacing[2],
    cursor: 'pointer' as any,
  },
  gradient: {
    padding: spacing[4.5],
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2.5],
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  specBadgeText: {
    color: '#FBBF24',
    ...typography.overline,
  },
  bankCount: {
    color: '#A5B4FC',
    ...typography.caption,
    fontWeight: '700',
  },
  title: {
    ...typography.titleLarge,
    color: '#FFFFFF',
  },
  desc: {
    ...typography.bodyMedium,
    color: '#94A3B8',
    marginTop: spacing[1],
    marginBottom: spacing[3.5],
    lineHeight: 19,
  },
  btnRow: {
    flexDirection: 'row',
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3.5],
    borderRadius: radii.md,
    gap: spacing[1.5],
  },
  launchBtnText: {
    color: '#FFFFFF',
    ...typography.label,
    fontWeight: '800',
  },
});
