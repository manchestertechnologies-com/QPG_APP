import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { QrCode, Copy, Check, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

export interface UpiQrSectionProps {
  qrData: {
    amount: number;
    upiId: string;
    payeeName: string;
    upiIntentUri: string;
    qrCodeDataUrl: string;
    instructions: string[];
  } | null;
  loading: boolean;
  copiedUpi: boolean;
  onCopyUpi: () => void;
  onOpenUpiApp: () => void;
}

export const UpiQrSection: React.FC<UpiQrSectionProps> = ({
  qrData,
  loading,
  copiedUpi,
  onCopyUpi,
  onOpenUpiApp,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <View style={styles.headerRow}>
        <QrCode size={20} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Pay via Direct UPI QR Code</Text>
      </View>
      <Text style={[styles.desc, { color: theme.textSecondary }]}>
        Scan using PhonePe, Google Pay, Paytm, or BHIM. Zero payment gateway surcharges.
      </Text>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: spacing[6] }} />
      ) : qrData ? (
        <View style={styles.qrContent}>
          {/* QR Frame */}
          <View style={styles.qrFrame}>
            <Image
              source={{ uri: qrData.qrCodeDataUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          {/* Amount Chip */}
          <View style={styles.amountChip}>
            <Text style={styles.amountText}>₹{qrData.amount}</Text>
            <Text style={styles.amountPeriod}>/ 1 Calendar Month</Text>
          </View>

          {/* UPI ID Bar */}
          <View style={[styles.upiIdBar, { backgroundColor: theme.surfaceLight, borderColor: theme.surfaceBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upiLabel, { color: theme.textMuted }]}>UPI ID</Text>
              <Text style={[styles.upiValue, { color: theme.text }]} selectable>
                {qrData.upiId}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCopyUpi}
              activeOpacity={0.7}
              style={styles.copyBtn}
            >
              {copiedUpi ? (
                <Check size={16} color={theme.success} />
              ) : (
                <Copy size={16} color={theme.primary} />
              )}
              <Text style={[styles.copyBtnText, { color: copiedUpi ? theme.success : theme.primary }]}>
                {copiedUpi ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[4.5],
    marginBottom: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  title: {
    ...typography.titleSmall,
    fontWeight: '700',
  },
  desc: {
    ...typography.bodySmall,
    marginBottom: spacing[3.5],
  },
  qrContent: {
    alignItems: 'center',
  },
  qrFrame: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing[2.5],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing[3.5],
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  amountChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1.5],
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3.5],
    borderRadius: radii.full,
    marginBottom: spacing[3.5],
  },
  amountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },
  amountPeriod: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  upiIdBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3.5],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  upiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  upiValue: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[2.5],
    cursor: 'pointer' as any,
  },
  copyBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
