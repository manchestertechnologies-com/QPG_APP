import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showProfile?: boolean;
  onSubscriptionPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showProfile = true,
  onSubscriptionPress,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, subscription } = useAuth();

  const getSubjectEmoji = (subject?: string) => {
    switch (subject) {
      case 'Mathematics':
        return '📐';
      case 'Physics':
        return '⚡';
      case 'Chemistry':
        return '🧪';
      case 'Biology':
        return '🧬';
      default:
        return '📚';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <LinearGradient
            colors={theme.gradientPrimary as [string, string]}
            style={styles.logoBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoText}>QPG</Text>
          </LinearGradient>
          <View>
            <Text style={[styles.appName, { color: theme.text }]}>Question Paper Generator</Text>
            {user && (
              <View style={styles.subjectTag}>
                <Text style={styles.subjectText}>
                  {getSubjectEmoji(user.subject)} {user.subject} Specialization
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: theme.surfaceLight }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          {showProfile && subscription && (
            <TouchableOpacity
              onPress={onSubscriptionPress}
              style={[
                styles.subBadge,
                {
                  backgroundColor: subscription.isActive ? theme.successBg : theme.warningBg,
                  borderColor: subscription.isActive ? theme.success : theme.warning,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.subText,
                  { color: subscription.isActive ? theme.success : theme.warning },
                ]}
              >
                {subscription.isActive ? 'PRO ACTIVE' : '₹299 UPGRADE'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {title && (
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: theme.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subjectTag: {
    marginTop: 2,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#818CF8',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 16,
  },
  subBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  subText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleSection: {
    marginTop: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 3,
  },
});
