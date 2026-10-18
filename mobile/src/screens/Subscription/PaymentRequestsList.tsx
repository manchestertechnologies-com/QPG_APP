import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { History } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { radii, spacing, typography } from '../../theme/tokens';
import { PaymentRequest } from '../../types';

export interface PaymentRequestsListProps {
  requests: PaymentRequest[];
}

export const PaymentRequestsList: React.FC<PaymentRequestsListProps> = ({ requests }) => {
  const { theme } = useTheme();

  if (requests.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <History size={16} color={theme.textMuted} />
        <Text style={[styles.title, { color: theme.text }]}>Transaction Requests</Text>
      </View>

      <View style={styles.list}>
        {requests.map((req) => {
          const statusVariant =
            req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning';

          return (
            <View
              key={req.id}
              style={[
                styles.itemCard,
                { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              ]}
            >
              <View style={styles.topRow}>
                <Text style={[styles.utrText, { color: theme.text }]}>UTR: {req.utr}</Text>
                <Badge
                  label={req.status?.toUpperCase() || 'PENDING'}
                  variant={statusVariant}
                  size="sm"
                />
              </View>
              <Text style={[styles.metaText, { color: theme.textMuted }]}>
                Amount: ₹{req.amount} • {new Date(req.createdAt || req.paymentTime).toLocaleDateString('en-IN')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[6],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  title: {
    ...typography.label,
    fontWeight: '800',
  },
  list: {
    gap: spacing[2.5],
  },
  itemCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing[3.5],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  utrText: {
    ...typography.caption,
    fontWeight: '800',
  },
  metaText: {
    ...typography.caption,
  },
});
