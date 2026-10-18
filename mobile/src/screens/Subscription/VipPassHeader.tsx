import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { radii, spacing, typography } from '../../theme/tokens';
import { UserSubscription } from '../../types';

export interface VipPassHeaderProps {
  subscription: UserSubscription | null;
  subject?: string;
}

export const VipPassHeader: React.FC<VipPassHeaderProps> = ({ subscription, subject }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#1E1B4B', '#311042', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.crownCircle}>
            <Crown size={22} color="#FBBF24" />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.superTitle}>FACULTY MEMBERSHIP</Text>
            <Text style={styles.title}>QPG Educator Pro Pass</Text>
          </View>
          <Badge
            label={subscription?.isActive ? 'ACTIVE PRO' : 'UPGRADE REQUIRED'}
            variant={subscription?.isActive ? 'success' : 'warning'}
            size="sm"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.col}>
            <Text style={styles.label}>SPECIALIZATION</Text>
            <Text style={styles.val}>{subject || 'Chemistry'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>SUBSCRIPTION</Text>
            <Text style={styles.val}>₹299 / Month</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>REMAINING</Text>
            <Text style={styles.val}>
              {subscription?.isActive ? `${subscription.daysRemaining} Days` : '0 Days'}
            </Text>
          </View>
        </View>

        {subscription?.isActive && (
          <View style={styles.expiryRow}>
            <Clock size={12} color="#94A3B8" />
            <Text style={styles.expiryText}>
              Renews: {subscription.formattedExpiry} (Asia/Kolkata Calendar Cycle)
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    marginBottom: spacing[4],
  },
  gradient: {
    padding: spacing[4.5],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownCircle: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  titleCol: {
    flex: 1,
    marginLeft: spacing[3],
    marginRight: spacing[2],
  },
  superTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: spacing[3.5],
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  val: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginTop: spacing[3],
    paddingTop: spacing[2.5],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  expiryText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
