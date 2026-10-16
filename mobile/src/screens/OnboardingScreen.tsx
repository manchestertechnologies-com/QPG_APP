import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.tag, { color: theme.primary }]}>TEACHER & INSTITUTION PLATFORM</Text>
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
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
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
            title="Sign In with Email & OTP"
            onPress={() => navigation.navigate('Auth')}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  tag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  featuresList: {
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  bottomSection: {
    marginTop: 8,
  },
});
