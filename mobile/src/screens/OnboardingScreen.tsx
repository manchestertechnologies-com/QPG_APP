import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight, Zap, BookOpen, Printer, Crown, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/ui/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { radii, spacing, typography, shadows } from '../theme/tokens';

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { loginWithPassword } = useAuth();
  const [loadingInstant, setLoadingInstant] = useState(false);

  const handleInstantStart = async () => {
    setLoadingInstant(true);
    try {
      await loginWithPassword('qpgtest@gmail.com', '123456');
      navigation.replace('MainTabs');
    } catch {
      // If network fails, navigate to Auth screen
      navigation.navigate('Auth');
    } finally {
      setLoadingInstant(false);
    }
  };

  const featurePillars = [
    {
      icon: <Zap size={18} color="#FBBF24" />,
      title: '2026 Exam Patterns',
      desc: 'NEET 35+15, JEE 20+10 & State CET official marking architectures.',
    },
    {
      icon: <BookOpen size={18} color="#818CF8" />,
      title: '23,603+ Question Bank',
      desc: 'Formulas, chemical reactions, diagrams and faculty explanations.',
    },
    {
      icon: <Printer size={18} color="#34D399" />,
      title: 'Vector-Sharp PDF Export',
      desc: 'Custom institution header, 2-column layout and evaluation key.',
    },
    {
      icon: <Crown size={18} color="#F472B6" />,
      title: '₹299 / Month Access',
      desc: 'Direct UPI payment with zero payment gateway surcharges.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppLayout scrollable contentContainerStyle={styles.scrollContent}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <LinearGradient
              colors={['#6366F1', '#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoPill}
            >
              <Sparkles size={16} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
            <Badge label="EDUCATOR PLATFORM 2026" variant="primary" size="sm" />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Question Paper Generator
          </Text>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            High-yield examination compiler for Chemistry faculty. Generate publication-grade papers in 60 seconds.
          </Text>
        </View>

        {/* Hero Free Trial Card (ChatGPT style - above the fold!) */}
        <View style={[styles.trialHeroCard, shadows.glowPrimary]}>
          <LinearGradient
            colors={['#1E1B4B', '#311042', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trialGradient}
          >
            <View style={styles.trialTopRow}>
              <View style={styles.freeBadge}>
                <Sparkles size={13} color="#FBBF24" />
                <Text style={styles.freeBadgeText}>1 FREE PAPER TRIAL INCLUDED</Text>
              </View>
              <Text style={styles.noCardText}>No credit card needed</Text>
            </View>

            <Text style={styles.trialTitle}>
              Create your 1st examination paper for free
            </Text>

            <Text style={styles.trialDesc}>
              Full curriculum access: select chapters, configure NEET/JEE/CET patterns, customize marks, and download vector PDF.
            </Text>

            {/* Instant 1-Tap Action Button */}
            <TouchableOpacity
              onPress={handleInstantStart}
              disabled={loadingInstant}
              activeOpacity={0.88}
              style={styles.primaryCtaBtn}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
                pointerEvents="none"
              >
                {loadingInstant ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Sparkles size={18} color="#FFFFFF" />
                    <Text style={styles.primaryCtaText}>Start 1 Free Paper Trial</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.demoAccountHint}>
              1-Tap Fast Access • Chemistry Specialist Account
            </Text>
          </LinearGradient>
        </View>

        {/* 2x2 Feature Pillars Grid */}
        <View style={styles.gridSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Platform Capabilities
          </Text>

          <View style={styles.grid}>
            {featurePillars.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.gridCard,
                  { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: theme.surfaceLight }]}>
                  {item.icon}
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Secondary Sign In Link */}
        <View style={styles.footerActions}>
          <Button
            title="Sign In with Custom Email / OTP"
            variant="outline"
            size="md"
            onPress={() => navigation.navigate('Auth')}
            rightIcon={<ArrowRight size={16} color={theme.text} />}
          />
        </View>
      </AppLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing[6],
    paddingBottom: spacing[12],
  },
  header: {
    marginBottom: spacing[4],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  logoPill: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
    letterSpacing: -0.5,
    marginBottom: spacing[1.5],
  },
  subtitle: {
    ...typography.bodyMedium,
    lineHeight: 21,
  },
  trialHeroCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    marginBottom: spacing[6],
  },
  trialGradient: {
    padding: spacing[5],
  },
  trialTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: spacing[2.5],
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 4,
  },
  freeBadgeText: {
    color: '#FBBF24',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noCardText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  trialTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: spacing[1.5],
  },
  trialDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
    marginBottom: spacing[4],
  },
  primaryCtaBtn: {
    borderRadius: radii.md,
    overflow: 'hidden',
    cursor: 'pointer' as any,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3.5],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  demoAccountHint: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing[2.5],
    fontWeight: '500',
  },
  gridSection: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    ...typography.titleSmall,
    fontWeight: '800',
    marginBottom: spacing[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  gridCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[3.5],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2.5],
  },
  cardTitle: {
    ...typography.label,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    ...typography.caption,
    lineHeight: 16,
  },
  footerActions: {
    marginTop: spacing[1],
  },
});
