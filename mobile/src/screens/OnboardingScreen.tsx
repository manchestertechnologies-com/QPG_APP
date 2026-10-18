import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/ui/AppLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { radii, spacing, typography } from '../theme/tokens';

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();

  const features = [
    {
      icon: '🎯',
      title: '2026 Exam Patterns',
      desc: 'Automatic question distribution for NEET (35 Sec A + 15 Sec B), JEE Main (20 MCQs + 10 Numerical), & CET (60 MCQs).',
    },
    {
      icon: '🔒',
      title: 'Subject Specialization',
      desc: 'Designed for individual teachers. Focus exclusively on your subject: Mathematics, Physics, Chemistry, or Biology.',
    },
    {
      icon: '📚',
      title: '89,202+ Question Bank',
      desc: 'Explore real examination questions with diagrams, mathematical equations, options, and step-by-step solutions.',
    },
    {
      icon: '📄',
      title: 'Vector-Sharp PDF Export',
      desc: 'Generate publication-grade PDF question papers with institutional logos, section headings, and answer keys. (PDF only).',
    },
    {
      icon: '💳',
      title: '₹299 / Month Access',
      desc: 'Unlimited question paper generation for 1 full calendar month via direct UPI QR code payment.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppLayout scrollable contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Badge label="TEACHER & INSTITUTION PLATFORM" variant="primary" size="sm" />
          <Text style={[styles.title, { color: theme.text }]}>Welcome to QPG</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            The elite question paper generation engine for CBSE, State Board, NEET, and JEE faculty.
          </Text>
        </View>

        <View style={styles.featuresList}>
          {features.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.featureCard,
                { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              ]}
            >
              <Text style={styles.featureIcon}>{item.icon}</Text>
              <View style={styles.featureTextCol}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Sign In with Email & Password / OTP"
            onPress={() => navigation.navigate('Auth')}
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
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
    paddingTop: spacing[8],
    paddingBottom: spacing[10],
  },
  header: {
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  title: {
    ...typography.display,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.bodyMedium,
  },
  featuresList: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  featureCard: {
    flexDirection: 'row',
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: spacing[3.5],
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    ...typography.label,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  featureDesc: {
    ...typography.caption,
    lineHeight: 18,
  },
  bottomSection: {
    marginTop: spacing[2],
  },
});
