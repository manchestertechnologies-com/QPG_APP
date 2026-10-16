import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { api } from '../services/api';
import { PaymentRequest } from '../types';

export const SubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, subscription, refreshSubscription } = useAuth();

  const [qrData, setQrData] = useState<{
    amount: number;
    upiId: string;
    payeeName: string;
    upiIntentUri: string;
    qrCodeDataUrl: string;
    instructions: string[];
  } | null>(null);

  const [loadingQr, setLoadingQr] = useState(true);
  const [utr, setUtr] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<PaymentRequest[]>([]);

  const loadData = async () => {
    try {
      const qrRes = await api.getUpiQr();
      setQrData(qrRes);

      const reqRes = await api.getMyPaymentRequests();
      setMyRequests(reqRes.requests || []);
    } catch (err) {
      console.warn('Error loading subscription info:', err);
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenUpiApp = async () => {
    if (!qrData?.upiIntentUri) return;
    try {
      const canOpen = await Linking.canOpenURL(qrData.upiIntentUri);
      if (canOpen) {
        await Linking.openURL(qrData.upiIntentUri);
      } else {
        Alert.alert(
          'UPI App Not Found',
          `Please scan the QR code using your UPI app (GPay, PhonePe, Paytm, BHIM) or transfer to ${qrData.upiId}.`
        );
      }
    } catch (err) {
      Alert.alert('Notice', `Please transfer ₹${qrData?.amount} to UPI ID: ${qrData?.upiId}`);
    }
  };

  const handleSubmitPayment = async () => {
    const cleanUtr = utr.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 8) {
      Alert.alert('Invalid UTR', 'Please enter your 12-digit UPI Transaction Reference (UTR) number.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitPayment(cleanUtr, new Date().toISOString(), note.trim());
      Alert.alert(
        'Payment Submitted',
        'Your payment verification request has been submitted to the admin team. Once verified, your 1-month subscription will be activated automatically.'
      );
      setUtr('');
      setNote('');
      await loadData();
      await refreshSubscription();
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not submit payment request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Subscription & Payments"
        subtitle="₹299 / Month • Direct UPI Payment"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Plan Card if Active */}
        {subscription?.isActive ? (
          <Card highlight style={{ borderColor: theme.success, marginBottom: 16 }}>
            <View style={styles.activeBannerRow}>
              <View style={[styles.activeDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.activeHeading, { color: theme.success }]}>
                Premium Monthly Active
              </Text>
            </View>
            <Text style={[styles.expiryDetail, { color: theme.text }]}>
              Valid until: {subscription.formattedExpiry} ({subscription.daysRemaining} days remaining)
            </Text>
            <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
              Unlimited paper generation, full {user?.subject} question bank access, and PDF exports enabled.
            </Text>
          </Card>
        ) : (
          <Card highlight style={{ borderColor: theme.warning, marginBottom: 16 }}>
            <View style={styles.activeBannerRow}>
              <View style={[styles.activeDot, { backgroundColor: theme.warning }]} />
              <Text style={[styles.activeHeading, { color: theme.warning }]}>
                {subscription?.status === 'expired' ? 'Subscription Expired' : 'No Active Subscription'}
              </Text>
            </View>
            <Text style={[styles.expiryDetail, { color: theme.text }]}>
              {subscription?.status === 'expired'
                ? `Expired on ${subscription.formattedExpiry}. Please renew for ₹299 to restore access.`
                : 'Subscribe for ₹299 to unlock unlimited 2026 paper generation.'}
            </Text>
          </Card>
        )}

        {/* UPI QR Payment Card */}
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Pay via UPI QR Code</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            Scan using Google Pay, PhonePe, Paytm, or any BHIM UPI application.
          </Text>

          {loadingQr ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 30 }} />
          ) : qrData ? (
            <View style={styles.qrContainer}>
              {/* QR Image */}
              <View style={styles.qrFrame}>
                <Image
                  source={{ uri: qrData.qrCodeDataUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>

              {/* Amount Badge */}
              <View style={[styles.amountBadge, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.amountLabel, { color: theme.primary }]}>Amount to Pay:</Text>
                <Text style={[styles.amountVal, { color: theme.primary }]}>₹{qrData.amount}</Text>
                <Text style={[styles.amountDuration, { color: theme.textMuted }]}>/ 1 Calendar Month</Text>
              </View>

              {/* UPI ID Details */}
              <View style={[styles.upiInfoBox, { backgroundColor: theme.surfaceLight }]}>
                <Text style={[styles.upiIdLabel, { color: theme.textSecondary }]}>UPI ID:</Text>
                <Text style={[styles.upiIdVal, { color: theme.text }]} selectable>
                  {qrData.upiId}
                </Text>
                <Text style={[styles.payeeVal, { color: theme.textMuted }]}>
                  Payee: {qrData.payeeName}
                </Text>
              </View>

              {/* Open UPI App Button */}
              <Button
                title="Open in UPI Payment App"
                onPress={handleOpenUpiApp}
                variant="outline"
                style={{ width: '100%', marginTop: 10 }}
              />
            </View>
          ) : null}
        </Card>

        {/* Verification Submission Form */}
        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Submit Payment for Verification</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            After completing payment in your UPI app, copy and enter the 12-digit UPI Reference Number (UTR) below:
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              12-Digit UPI Reference Number (UTR) *
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="e.g. 428172938102"
              placeholderTextColor={theme.textMuted}
              value={utr}
              onChangeText={setUtr}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Transaction Notes / Remarks (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="e.g. Paid via GPay at 4:30 PM"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          <Button
            title="Submit UTR for Verification"
            onPress={handleSubmitPayment}
            loading={submitting}
            variant="primary"
          />

          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
            Notice: Verification is performed by administrators against actual account credits. Duplicate or falsified UTRs will be rejected.
          </Text>
        </Card>

        {/* My Payment Verification Requests History */}
        {myRequests.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Submitted Verification Requests
            </Text>

            {myRequests.map((req) => {
              const statusColor =
                req.status === 'approved'
                  ? theme.success
                  : req.status === 'rejected'
                  ? theme.error
                  : theme.warning;

              const dateStr = new Date(req.created_at).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'short',
                timeStyle: 'short',
              });

              return (
                <Card key={req.id} style={{ marginVertical: 6 }}>
                  <View style={styles.reqTop}>
                    <Text style={[styles.reqUtr, { color: theme.primaryLight }]}>UTR: {req.utr}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {req.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.reqDate, { color: theme.textSecondary }]}>
                    Submitted: {dateStr} • ₹{req.amount}
                  </Text>
                  {req.rejection_reason && (
                    <Text style={[styles.rejectionReason, { color: theme.error }]}>
                      Note: {req.rejection_reason}
                    </Text>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  activeBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  expiryDetail: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  benefitDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
    marginBottom: 14,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 14,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  amountDuration: {
    fontSize: 12,
  },
  upiInfoBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  upiIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  upiIdVal: {
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 2,
  },
  payeeVal: {
    fontSize: 11,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  reqTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqUtr: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  reqDate: {
    fontSize: 11,
    marginTop: 4,
  },
  rejectionReason: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
