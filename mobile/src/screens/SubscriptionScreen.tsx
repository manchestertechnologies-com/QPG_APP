import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AppLayout } from '../components/ui/AppLayout';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { PaymentRequest } from '../types';
import { spacing } from '../theme/tokens';

import { VipPassHeader } from './Subscription/VipPassHeader';
import { UpiQrSection } from './Subscription/UpiQrSection';
import { UtrSubmissionForm } from './Subscription/UtrSubmissionForm';
import { PaymentRequestsList } from './Subscription/PaymentRequestsList';

export const SubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, subscription, refreshSubscription } = useAuth();
  const { toast, showToast, hideToast } = useToast();

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
    showToast(`UPI ID "${qrData.upiId}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleOpenUpiApp = () => {
    if (!qrData?.upiIntentUri) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = qrData.upiIntentUri;
    }
  };

  const handleSubmitPayment = async () => {
    const cleanUtr = utr.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      showToast('Please enter your 12-digit UPI Reference (UTR) number.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitPayment(cleanUtr, new Date().toISOString(), note.trim());
      showToast(res.message || 'Payment submitted! Subscription active.', 'success');
      setUtr('');
      setNote('');
      await loadData();
      await refreshSubscription();
    } catch (err: any) {
      showToast(err.message || 'Could not submit payment request.', 'error');
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
      showToast('VIP Pro Access successfully activated for 30 Days!', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Activation failed.', 'error');
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

      <Toast toast={toast} onDismiss={hideToast} />

      <AppLayout scrollable contentContainerStyle={styles.scrollContent}>
        {/* Luxury VIP Pass Card */}
        <VipPassHeader subscription={subscription} subject={user?.subject} />

        {/* 1-Tap Quick Dev/Tester Pass */}
        <View style={styles.quickActivateBox}>
          <Button
            title={
              subscription?.isActive
                ? 'Extend 30 Days Pro Access (1-Tap)'
                : 'Activate 30 Days VIP Pro (1-Tap Test)'
            }
            variant="outline"
            size="md"
            loading={submitting}
            onPress={handleQuickActivate}
            leftIcon={<Sparkles size={16} color={theme.primary} />}
            rightIcon={<ArrowRight size={16} color={theme.primary} />}
          />
        </View>

        {/* UPI QR Code Section */}
        <UpiQrSection
          qrData={qrData}
          loading={loadingQr}
          copiedUpi={copiedUpi}
          onCopyUpi={handleCopyUpi}
          onOpenUpiApp={handleOpenUpiApp}
        />

        {/* UTR Verification Submission Form */}
        <UtrSubmissionForm
          utr={utr}
          setUtr={setUtr}
          note={note}
          setNote={setNote}
          submitting={submitting}
          onSubmit={handleSubmitPayment}
        />

        {/* Verification History */}
        <PaymentRequestsList requests={myRequests} />
      </AppLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[12],
  },
  quickActivateBox: {
    marginBottom: spacing[4],
  },
});
