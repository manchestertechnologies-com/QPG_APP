import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Crown,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  History,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
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
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const loadData = async () => {
    try {
      const qrRes = await api.getUpiQr();
      setQrData(qrRes);

      const reqRes = await api.getMyPaymentRequests();
      setMyRequests(reqRes.requests || []);
    } catch (err: any) {
      console.warn('Error loading subscription info:', err);
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyUpi = () => {
    if (!qrData?.upiId) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(qrData.upiId);
    }
    setCopiedUpi(true);
    setNotification(`UPI ID "${qrData.upiId}" copied to clipboard!`);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleOpenUpiApp = () => {
    if (!qrData?.upiIntentUri) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = qrData.upiIntentUri;
    }
  };

  const handleSubmitPayment = async () => {
    setNotification(null);
    const cleanUtr = utr.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      setNotification('Please enter your 12-digit UPI Reference (UTR) number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitPayment(cleanUtr, new Date().toISOString(), note.trim());
      setNotification(res.message || 'Payment submitted! Subscription active.');
      setUtr('');
      setNote('');
      await loadData();
      await refreshSubscription();
    } catch (err: any) {
      setNotification(err.message || 'Could not submit payment request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Instant VIP Pass for Testing
  const handleQuickActivate = async () => {
    setSubmitting(true);
    try {
      const fakeUtr = 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000);
      await api.submitPayment(fakeUtr, new Date().toISOString(), 'Tester Quick Activation');
      await refreshSubscription();
      setNotification('VIP Pro Access successfully activated for 30 Days!');
      await loadData();
    } catch (err: any) {
      setNotification(err.message || 'Activation failed.');
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Toast Notification */}
        {notification && (
          <View style={styles.notificationToast}>
            <CheckCircle2 size={16} color="#10B981" />
            <Text style={styles.toastText}>{notification}</Text>
          </View>
        )}

        {/* Instagram/WhatsApp Luxury VIP Pass Card */}
        <View style={styles.vipPassCard}>
          <LinearGradient
            colors={['#1E1B4B', '#311042', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipPassGradient}
          >
            <View style={styles.vipPassHeader}>
              <View style={styles.crownCircle}>
                <Crown size={22} color="#FBBF24" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.vipPassSuper}>FACULTY MEMBERSHIP</Text>
                <Text style={styles.vipPassTitle}>QPG Educator Pro Pass</Text>
              </View>
              <View style={[styles.activeStatusTag, { backgroundColor: subscription?.isActive ? '#10B981' : '#F59E0B' }]}>
                <Text style={styles.activeStatusText}>
                  {subscription?.isActive ? 'ACTIVE PRO' : 'UPGRADE REQUIRED'}
                </Text>
              </View>
            </View>

            <View style={styles.vipPassDivider} />

            <View style={styles.vipPassDetails}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>SPECIALIZATION</Text>
                <Text style={styles.detailVal}>{user?.subject || 'Chemistry'}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>FEE</Text>
                <Text style={styles.detailVal}>₹299 / Month</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>REMAINING</Text>
                <Text style={styles.detailVal}>
                  {subscription?.isActive ? `${subscription.daysRemaining} Days` : '0 Days'}
                </Text>
              </View>
            </View>

            {subscription?.isActive && (
              <View style={styles.expiryRow}>
                <Clock size={13} color="#94A3B8" />
                <Text style={styles.expiryText}>
                  Renews: {subscription.formattedExpiry} (Asia/Kolkata Calendar Cycle)
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* 1-Tap Quick Dev/Tester Pass */}
        <TouchableOpacity
          onPress={handleQuickActivate}
          disabled={submitting}
          activeOpacity={0.85}
          style={styles.quickActivateBtn}
        >
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.25)', 'rgba(168, 85, 247, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quickActivateGradient}
          >
            <Sparkles size={16} color="#A855F7" />
            <Text style={[styles.quickActivateText, { color: theme.text }]}>
              {subscription?.isActive ? 'Extend 30 Days Pro Access (1-Tap)' : 'Activate 30 Days VIP Pro (1-Tap Test)'}
            </Text>
            <ArrowRight size={14} color="#A855F7" />
          </LinearGradient>
        </TouchableOpacity>

        {/* UPI QR Payment Box */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <QrCode size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Pay via Direct UPI QR Code</Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
            Scan using PhonePe, Google Pay, Paytm, or BHIM. Zero payment gateway surcharges.
          </Text>

          {loadingQr ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 30 }} />
          ) : qrData ? (
            <View style={styles.qrSection}>
              {/* QR Image Container */}
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

              {/* UPI ID Copy Bar */}
              <View style={[styles.upiIdBar, { backgroundColor: theme.surfaceLight, borderColor: theme.surfaceBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.upiLabel, { color: theme.textMuted }]}>UPI ID</Text>
                  <Text style={[styles.upiValue, { color: theme.text }]} selectable>
                    {qrData.upiId}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyUpi}
                  activeOpacity={0.7}
                  style={styles.copyBtn}
                >
                  {copiedUpi ? (
                    <Check size={16} color="#10B981" />
                  ) : (
                    <Copy size={16} color={theme.primary} />
                  )}
                  <Text style={[styles.copyBtnText, { color: copiedUpi ? '#10B981' : theme.primary }]}>
                    {copiedUpi ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        {/* UTR Verification Submission Form */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <ShieldCheck size={20} color="#10B981" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Submit UTR for Verification</Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
            After paying ₹299, copy the 12-digit UPI Reference Number (UTR) from your payment app and submit below:
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              12-Digit UPI Reference Number (UTR) *
            </Text>
            <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="e.g. 428190382910"
                placeholderTextColor={theme.textMuted}
                value={utr}
                onChangeText={setUtr}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Optional Remarks / Payment App Used
            </Text>
            <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="e.g. Google Pay from Prof. Chemistry"
                placeholderTextColor={theme.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmitPayment}
            disabled={submitting}
            activeOpacity={0.85}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
              pointerEvents="none"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" strokeWidth={3} />
                  <Text style={styles.submitBtnText}>Submit UTR for Instant Verification</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Verification History */}
        {myRequests.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeaderRow}>
              <History size={16} color={theme.textMuted} />
              <Text style={[styles.historyTitle, { color: theme.text }]}>Transaction Requests</Text>
            </View>

            {myRequests.map((req) => (
              <View
                key={req.id}
                style={[
                  styles.historyCard,
                  { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
                ]}
              >
                <View style={styles.historyTopRow}>
                  <Text style={[styles.historyUtr, { color: theme.text }]}>UTR: {req.utr}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          req.status === 'approved'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : req.status === 'rejected'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            req.status === 'approved'
                              ? '#10B981'
                              : req.status === 'rejected'
                              ? '#EF4444'
                              : '#F59E0B',
                        },
                      ]}
                    >
                      {req.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.historyMeta, { color: theme.textMuted }]}>
                  Amount: ₹{req.amount} • {new Date(req.createdAt || req.paymentTime).toLocaleDateString('en-IN')}
                </Text>
              </View>
            ))}
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
    padding: 16,
    paddingBottom: 40,
  },
  notificationToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  toastText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  vipPassCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  vipPassGradient: {
    padding: 18,
  },
  vipPassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipPassSuper: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  vipPassTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  activeStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  vipPassDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 14,
  },
  vipPassDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  expiryText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  quickActivateBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    cursor: 'pointer' as any,
  },
  quickActivateGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActivateText: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginLeft: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 6,
  },
  qrFrame: {
    width: 190,
    height: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  amountChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 14,
    gap: 6,
  },
  amountText: {
    color: '#818CF8',
    fontSize: 18,
    fontWeight: '900',
  },
  amountPeriod: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  upiIdBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginTop: 12,
  },
  upiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  upiValue: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    cursor: 'pointer' as any,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 13.5,
  },
  submitBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
    cursor: 'pointer' as any,
  },
  submitBtnGradient: {
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  historySection: {
    marginTop: 4,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyUtr: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  historyMeta: {
    fontSize: 11.5,
    marginTop: 4,
  },
});
