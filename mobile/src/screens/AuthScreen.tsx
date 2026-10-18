import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Atom, Server, Settings } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Subject } from '../types';
import { AppLayout } from '../components/ui/AppLayout';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Toast } from '../components/ui/Toast';
import { VipAccessCard } from './Auth/VipAccessCard';
import { PasswordLoginForm } from './Auth/PasswordLoginForm';
import { OtpLoginForm } from './Auth/OtpLoginForm';
import { radii, spacing, typography } from '../theme/tokens';

export const AuthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { loginWithOtp, loginWithPassword } = useAuth();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('qpgtest@gmail.com');
  const [password, setPassword] = useState('123456');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Chemistry');
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState<string>(api.getBaseUrl());
  const [showBackendConfig, setShowBackendConfig] = useState<boolean>(false);

  const handleInstantLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithPassword('qpgtest@gmail.com', '123456');
      navigation.replace('MainTabs');
    } catch (err: any) {
      setErrorMessage(err.message || 'Instant login failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setErrorMessage(null);
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid academic or personal email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(email.trim(), password);
      navigation.replace('MainTabs');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setErrorMessage(null);
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(email.trim());
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
        setOtp(res.devOtp);
      }
      setStep('otp');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (!otp || otp.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await loginWithOtp(email.trim(), otp.trim(), selectedSubject, name.trim(), institution.trim());
      navigation.replace('MainTabs');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout contentContainerStyle={styles.container}>
      {/* Clean Brand Header */}
      <View style={styles.brandHeader}>
        <LinearGradient
          colors={theme.gradientPrimary as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}
        >
          <Atom size={28} color="#FFFFFF" strokeWidth={2.2} />
        </LinearGradient>
        <Text style={[styles.brandSuper, { color: theme.primaryLight }]}>FACULTY PORTAL</Text>
        <Text style={[styles.title, { color: theme.text }]}>Question Paper Generator</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          High-yield NEET, JEE & CET examination generator for verified educators.
        </Text>
      </View>

      {/* 1-Tap Fast VIP Access */}
      <VipAccessCard onPress={handleInstantLogin} loading={loading} />

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
        <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR ENTER CREDENTIALS</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
      </View>

      {/* Segmented Auth Selector */}
      <SegmentedControl
        options={[
          { id: 'password', label: 'Password Sign In' },
          { id: 'otp', label: 'Email OTP' },
        ]}
        selectedId={authMode}
        onSelect={(mode) => {
          setAuthMode(mode as any);
          setErrorMessage(null);
        }}
      />

      {/* Error feedback toast */}
      {errorMessage && (
        <Toast
          type="error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Form Card */}
      <View style={styles.formContainer}>
        {authMode === 'password' ? (
          <PasswordLoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onSubmit={handlePasswordLogin}
            loading={loading}
          />
        ) : (
          <OtpLoginForm
            step={step}
            setStep={setStep}
            email={email}
            setEmail={setEmail}
            otp={otp}
            setOtp={setOtp}
            devOtpHint={devOtpHint}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            name={name}
            setName={setName}
            institution={institution}
            setInstitution={setInstitution}
            onSendOtp={handleSendOtp}
            onVerifyOtp={handleVerifyOtp}
            loading={loading}
          />
        )}
      </View>

      {/* Backend Server Configuration */}
      <View style={styles.footerSection}>
        <TouchableOpacity
          onPress={() => setShowBackendConfig(!showBackendConfig)}
          style={styles.serverPill}
          activeOpacity={0.7}
        >
          <Server size={14} color={theme.textMuted} />
          <Text style={[styles.serverPillText, { color: theme.textMuted }]}>
            API Endpoint: <Text style={{ color: theme.primaryLight, fontWeight: '700' }}>{backendUrl}</Text>
          </Text>
        </TouchableOpacity>

        {showBackendConfig && (
          <View style={[styles.backendCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <Text style={[styles.backendTitle, { color: theme.textSecondary }]}>Change API Endpoint URL</Text>
            <View style={styles.backendInputRow}>
              <TextInput
                style={[
                  styles.backendInput,
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                ]}
                placeholder="https://your-backend.onrender.com"
                placeholderTextColor={theme.textMuted}
                value={backendUrl}
                onChangeText={setBackendUrl}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.backendSaveBtn, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  if (!backendUrl.trim()) return;
                  await api.setBaseUrl(backendUrl.trim());
                  setShowBackendConfig(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.backendSaveBtnText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  brandSuper: {
    ...typography.overline,
    marginBottom: spacing[1],
  },
  title: {
    ...typography.display,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing[1.5],
    maxWidth: 320,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[3],
    gap: spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.overline,
  },
  formContainer: {
    marginTop: spacing[2],
  },
  footerSection: {
    alignItems: 'center',
    marginTop: spacing[6],
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    gap: spacing[2],
    cursor: 'pointer' as any,
  },
  serverPillText: {
    ...typography.caption,
  },
  backendCard: {
    marginTop: spacing[2.5],
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    width: '100%',
  },
  backendTitle: {
    ...typography.caption,
    marginBottom: spacing[1.5],
  },
  backendInputRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  backendInput: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing[2.5],
    height: 40,
    fontSize: 13,
  },
  backendSaveBtn: {
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  backendSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
});
