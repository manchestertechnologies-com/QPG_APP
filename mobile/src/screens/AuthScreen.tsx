import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Atom,
  CheckCircle2,
  Server,
  RefreshCw,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Subject } from '../types';

export const AuthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { loginWithOtp, loginWithPassword } = useAuth();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('qpgtest@gmail.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Chemistry');
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState<string>(api.getBaseUrl());
  const [showBackendConfig, setShowBackendConfig] = useState<boolean>(false);

  const subjects: { id: Subject; label: string; icon: string; count: string }[] = [
    { id: 'Chemistry', label: 'Chemistry', icon: '🧪', count: '23,603+ Qs' },
    { id: 'Physics', label: 'Physics', icon: '⚡', count: '24,757+ Qs' },
    { id: 'Mathematics', label: 'Mathematics', icon: '📐', count: '16,970+ Qs' },
    { id: 'Biology', label: 'Biology', icon: '🧬', count: '23,872+ Qs' },
  ];

  // 1-Tap Instant Login for the user's test teacher
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Instagram/WhatsApp Hero Header */}
        <View style={styles.header}>
          <View style={styles.logoBadgeContainer}>
            <LinearGradient
              colors={['#6366F1', '#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Atom size={28} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>
          </View>
          <Text style={[styles.brandSuper, { color: theme.primary }]}>FACULTY PORTAL</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Question Paper Generator</Text>
          <Text style={[styles.headerDesc, { color: theme.textSecondary }]}>
            High-yield NEET, JEE & CET examination generator for verified educators.
          </Text>
        </View>

        {/* 1-TAP INSTANT LOGIN CARD (WhatsApp/Instagram Tier) */}
        <TouchableOpacity
          style={[styles.vipCard, { borderColor: 'rgba(99, 102, 241, 0.4)' }]}
          onPress={handleInstantLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.22)', 'rgba(168, 85, 247, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipGradient}
            pointerEvents="none"
          >
            <View style={styles.vipIconCircle}>
              <Sparkles size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.vipBadgeRow}>
                <Text style={[styles.vipTitle, { color: theme.text }]}>1-Tap Sign In as Chemistry Pro</Text>
                <View style={styles.proTag}>
                  <Text style={styles.proTagText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={[styles.vipSub, { color: theme.textSecondary }]}>
                qpgtest@gmail.com • Locked to Chemistry
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <View style={styles.arrowCircle}>
                <ArrowRight size={16} color="#FFFFFF" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* OR Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
          <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR ENTER CREDENTIALS</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
        </View>

        {/* Segmented Tab: Password vs OTP */}
        <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <TouchableOpacity
            style={[styles.tabItem, authMode === 'password' && { backgroundColor: theme.primary }]}
            onPress={() => {
              setAuthMode('password');
              setErrorMessage(null);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: authMode === 'password' ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' },
              ]}
            >
              Password Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, authMode === 'otp' && { backgroundColor: theme.primary }]}
            onPress={() => {
              setAuthMode('otp');
              setErrorMessage(null);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: authMode === 'otp' ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' },
              ]}
            >
              Email OTP
            </Text>
          </TouchableOpacity>
        </View>

        {/* ERROR BANNER */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Notice</Text>
            <Text style={styles.errorDesc}>{errorMessage}</Text>
          </View>
        )}

        {/* Form Body */}
        {authMode === 'password' ? (
          <View style={styles.formSection}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Teacher Email</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Mail size={18} color={theme.textMuted} style={styles.inputLeftIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="e.g. qpgtest@gmail.com"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setErrorMessage(null);
                  }}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Password</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Lock size={18} color={theme.textMuted} style={styles.inputLeftIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="e.g. 123456"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onSubmitEditing={handlePasswordLogin}
                  returnKeyType="go"
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMessage(null);
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={theme.textMuted} />
                  ) : (
                    <Eye size={18} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Action Button */}
            <TouchableOpacity
              onPress={handlePasswordLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.submitBtnWrapper}
            >
              <LinearGradient
                colors={theme.gradientPrimary as [string, string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
                pointerEvents="none"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Sign In to Dashboard</Text>
                    <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : step === 'email' ? (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Teacher Email</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Mail size={18} color={theme.textMuted} style={styles.inputLeftIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="teacher@institution.edu"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setErrorMessage(null);
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.submitBtnWrapper}
            >
              <LinearGradient
                colors={theme.gradientPrimary as [string, string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
                pointerEvents="none"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Send 6-Digit OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>OTP Code Sent</Text>
                <TouchableOpacity onPress={() => setStep('email')}>
                  <Text style={[styles.changeLink, { color: theme.primary }]}>Change Email</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.primary,
                    color: theme.text,
                  },
                ]}
                placeholder="123456"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              {devOtpHint && (
                <Text style={styles.devHint}>Dev Code: {devOtpHint}</Text>
              )}
            </View>

            {/* Subject Selector */}
            <View style={styles.subjectSection}>
              <Text style={[styles.subjectTitle, { color: theme.text }]}>Select Your Locked Subject</Text>
              <Text style={[styles.subjectSub, { color: theme.textSecondary }]}>
                Your account will be permanently locked to this subject:
              </Text>

              <View style={styles.subjectsGrid}>
                {subjects.map((s) => {
                  const isSelected = selectedSubject === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSelectedSubject(s.id)}
                      activeOpacity={0.8}
                      style={[
                        styles.subjectCard,
                        {
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : theme.cardBg,
                          borderColor: isSelected ? theme.primary : theme.cardBorder,
                        },
                      ]}
                    >
                      <Text style={styles.subjectIcon}>{s.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subjectLabel, { color: isSelected ? theme.primary : theme.text }]}>
                          {s.label}
                        </Text>
                        <Text style={[styles.subjectCount, { color: theme.textMuted }]}>{s.count}</Text>
                      </View>
                      {isSelected && <CheckCircle2 size={18} color={theme.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.submitBtnWrapper}
            >
              <LinearGradient
                colors={theme.gradientPrimary as [string, string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
                pointerEvents="none"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Verify & Enter Dashboard</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Backend Server Configuration Sheet */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => setShowBackendConfig(!showBackendConfig)}
            style={styles.backendToggle}
            activeOpacity={0.7}
          >
            <Server size={14} color={theme.textMuted} />
            <Text style={[styles.backendToggleText, { color: theme.textMuted }]}>
              API Server: <Text style={{ color: theme.primary, fontWeight: '700' }}>{backendUrl}</Text>{' '}
              {showBackendConfig ? '▲' : '⚙️'}
            </Text>
          </TouchableOpacity>

          {showBackendConfig && (
            <View style={[styles.backendCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              <Text style={[styles.backendCardTitle, { color: theme.textSecondary }]}>
                Connect to Custom Backend URL
              </Text>
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
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  onPress={async () => {
                    if (!backendUrl.trim()) return;
                    await api.setBaseUrl(backendUrl.trim());
                    setShowBackendConfig(false);
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 45,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadgeContainer: {
    marginBottom: 14,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  brandSuper: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 320,
  },
  vipCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
  },
  vipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    pointerEvents: 'none' as any,
  },
  vipIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  proTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vipSub: {
    fontSize: 12,
    marginTop: 3,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  errorDesc: {
    color: '#EF4444',
    fontSize: 12,
    lineHeight: 16,
  },
  formSection: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    height: 50,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  submitBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
  },
  submitBtnGradient: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none' as any,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  otpInput: {
    borderRadius: 14,
    borderWidth: 2,
    height: 54,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  devHint: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  subjectSection: {
    marginTop: 10,
  },
  subjectTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  subjectSub: {
    fontSize: 12,
    marginBottom: 10,
  },
  subjectsGrid: {
    gap: 8,
    marginBottom: 10,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  subjectIcon: {
    fontSize: 22,
  },
  subjectLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  subjectCount: {
    fontSize: 11,
    marginTop: 1,
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  backendToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  backendToggleText: {
    fontSize: 11,
  },
  backendCard: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  backendCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  backendInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  backendInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  saveBtn: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});
