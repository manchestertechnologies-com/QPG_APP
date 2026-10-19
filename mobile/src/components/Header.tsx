import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Moon, Sparkles, Crown, Zap } from 'lucide-react-native';
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

  const isPro = subscription?.isActive === true;

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
      <View style={styles.content}>
        {/* Main Navbar Row (Instagram/WhatsApp style) */}
        <View style={styles.navRow}>
          <View style={styles.brandGroup}>
            <LinearGradient
              colors={['#6366F1', '#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoPill}
            >
              <Sparkles size={15} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
            <View>
              <View style={styles.brandTitleRow}>
                <Text style={[styles.brandTitle, { color: theme.text }]}>QPG</Text>
                <View style={[styles.editionBadge, { backgroundColor: isPro ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)' }]}>
                  <Text style={[styles.editionText, { color: isPro ? theme.success : theme.primaryLight }]}>
                    {isPro ? 'PRO' : 'FREE TRIAL'}
                  </Text>
                </View>
              </View>
              {user && (
                <Text style={[styles.subText, { color: theme.textMuted }]}>
                  {user.subject} Specialist
                </Text>
              )}
            </View>
          </View>

          {/* Right Action Icons */}
          <View style={styles.actionsGroup}>
            {/* Theme Switcher */}
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.surfaceLight }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
              accessibilityLabel="Toggle dark/light theme"
            >
              {isDark ? <Sun size={16} color={theme.text} /> : <Moon size={16} color={theme.text} />}
            </TouchableOpacity>

            {/* Subscription / Plan Pill */}
            {showProfile && (
              <TouchableOpacity
                onPress={onSubscriptionPress}
                activeOpacity={0.8}
                style={[
                  styles.planPill,
                  {
                    backgroundColor: isPro ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    borderColor: isPro ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                  },
                ]}
              >
                {isPro ? (
                  <Crown size={13} color={theme.success} />
                ) : (
                  <Zap size={13} color={theme.warning} />
                )}
                <Text
                  style={[
                    styles.planText,
                    { color: isPro ? theme.success : theme.warning },
                  ]}
                >
                  {isPro ? 'PRO ACTIVE' : '1 FREE PAPER'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Optional Clean Screen Sub-header */}
        {title && (
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
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
    borderBottomWidth: 1,
    paddingTop: spacing[2],
    paddingBottom: spacing[2.5],
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing[4],
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
  },
  logoPill: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  editionBadge: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  editionText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -1,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1.5],
    borderRadius: radii.full,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  planText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pageHeader: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  pageTitle: {
    ...typography.titleMedium,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
});
