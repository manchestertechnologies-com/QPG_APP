import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Moon, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { layout, radii, spacing, typography } from '../theme/tokens';

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

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <LinearGradient
              colors={theme.gradientPrimary as [string, string, string]}
              style={styles.logoBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles size={18} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>
            <View>
              <Text style={[styles.appName, { color: theme.text }]}>QPG Exam Engine</Text>
              {user && (
                <View style={styles.subjectTag}>
                  <Text style={[styles.subjectText, { color: theme.primaryLight }]}>
                    {user.subject} Specialist • {user.role?.toUpperCase()}
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
              accessibilityLabel="Toggle dark/light mode"
            >
              {isDark ? <Sun size={16} color={theme.text} /> : <Moon size={16} color={theme.text} />}
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
                  {subscription.isActive ? 'PRO ACTIVE' : 'UPGRADE'}
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing[4],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    ...typography.titleSmall,
  },
  subjectTag: {
    marginTop: 2,
  },
  subjectText: {
    ...typography.caption,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  subBadge: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  subText: {
    ...typography.overline,
  },
  titleSection: {
    marginTop: spacing[3],
  },
  mainTitle: {
    ...typography.display,
  },
  subtitle: {
    ...typography.bodyMedium,
    marginTop: 3,
  },
});
