import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

interface LockOverlayProps {
  title?: string;
  description?: string;
  onRenewPress: () => void;
}

export const LockOverlay: React.FC<LockOverlayProps> = ({
  title = 'Subscription Required',
  description,
  onRenewPress,
}) => {
  const { theme } = useTheme();
  const { subscription } = useAuth();

  const isExpired = subscription?.status === 'expired';
  const defaultDesc = isExpired
    ? `Your subscription expired on ${subscription?.formattedExpiry}. To preserve academic integrity and platform services, access to question papers and the question bank is paused until renewal.`
    : 'An active ₹299/month subscription is required to access this feature and generate examination papers.';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.contentCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.warningBg }]}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {isExpired ? 'Subscription Expired' : title}
        </Text>

        <Text style={[styles.desc, { color: theme.textSecondary }]}>
          {description || defaultDesc}
        </Text>

        <View style={[styles.priceBox, { backgroundColor: theme.surfaceLight }]}>
          <Text style={[styles.planName, { color: theme.textSecondary }]}>Premium Monthly</Text>
          <Text style={[styles.planPrice, { color: theme.primary }]}>₹299 <Text style={styles.perMonth}>/ month</Text></Text>
          <Text style={[styles.planBenefit, { color: theme.textMuted }]}>
            Unlimited 2026 NEET, JEE & CET Papers • Full Bank Access • PDF Export
          </Text>
        </View>

        <Button
          title="Renew Subscription (₹299)"
          onPress={onRenewPress}
          variant="primary"
          style={styles.btn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  priceBox: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  planName: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 4,
  },
  perMonth: {
    fontSize: 13,
    fontWeight: '500',
  },
  planBenefit: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  btn: {
    width: '100%',
  },
});
