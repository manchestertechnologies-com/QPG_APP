import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface SubscriptionBannerProps {
  onPress: () => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onPress }) => {
  const { theme } = useTheme();
  const { subscription } = useAuth();

  const isActive = subscription?.isActive;

  if (isActive) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
        <View style={[styles.activeBox, { backgroundColor: theme.cardBg, borderColor: theme.success }]}>
          <View style={styles.leftRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            <View>
              <Text style={[styles.activeTitle, { color: theme.text }]}>
                Premium Monthly Active
              </Text>
              <Text style={[styles.expiryText, { color: theme.textSecondary }]}>
                {subscription.daysRemaining} days remaining (Expires: {subscription.formattedExpiry})
              </Text>
            </View>
          </View>
          <View style={[styles.pill, { backgroundColor: theme.successBg }]}>
            <Text style={[styles.pillText, { color: theme.success }]}>MANAGE</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#4338CA']}
        style={styles.bannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.bannerContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SPECIAL LAUNCH OFFER</Text>
          </View>
          <Text style={styles.bannerHeading}>Unlimited Question Paper Generator</Text>
          <Text style={styles.bannerSub}>
            Generate unlimited 2026 NEET, JEE & CET papers with instant PDF export.
          </Text>
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.priceLabel}>Subscription Price</Text>
              <Text style={styles.priceVal}>₹299 <Text style={styles.period}>/ month</Text></Text>
            </View>
            <View style={styles.ctaBtn}>
              <Text style={styles.ctaText}>Get Access →</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activeBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  expiryText: {
    fontSize: 11,
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bannerGradient: {
    borderRadius: 16,
    padding: 18,
  },
  bannerContent: {
    gap: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  bannerSub: {
    color: '#C7D2FE',
    fontSize: 12,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  priceLabel: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '600',
  },
  priceVal: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  period: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C7D2FE',
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  ctaText: {
    color: '#312E81',
    fontWeight: '800',
    fontSize: 13,
  },
});
