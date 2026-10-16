import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Subject } from '../types';

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(title + (message ? `\n\n${message}` : ''));
    }
  } else {
    Alert.alert(title, message);
  }
};

export const AuthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { loginWithOtp, loginWithPassword } = useAuth();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Chemistry');
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState<string>(api.getBaseUrl());
  const [showBackendConfig, setShowBackendConfig] = useState<boolean>(false);

  const subjects: { id: Subject; label: string; icon: string; desc: string }[] = [
    { id: 'Chemistry', label: 'Chemistry', icon: '🧪', desc: 'Class 11 & 12 • 23,603+ Questions' },
    { id: 'Physics', label: 'Physics', icon: '⚡', desc: 'Class 11 & 12 • 24,757+ Questions' },
    { id: 'Mathematics', label: 'Mathematics', icon: '📐', desc: 'Class 11 & 12 • 16,970+ Questions' },
    { id: 'Biology', label: 'Biology', icon: '🧬', desc: 'Class 11 & 12 • 23,872+ Questions' },
  ];

  const handlePasswordLogin = async () => {
    setErrorMessage(null);
    if (!email || !email.includes('@')) {
      const msg = 'Please enter a valid academic or personal email address.';
      setErrorMessage(msg);
      showAlert('Invalid Email', msg);
      return;
    }
    if (!password) {
      const msg = 'Please enter your account password.';
      setErrorMessage(msg);
      showAlert('Password Required', msg);
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(email.trim(), password);
      navigation.replace('MainTabs');
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.';
      setErrorMessage(msg);
      showAlert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('qpgtest@gmail.com');
    setPassword('123456');
    setErrorMessage(null);
  };

  const handleSendOtp = async () => {
    setErrorMessage(null);
    if (!email || !email.includes('@')) {
      const msg = 'Please enter a valid academic or personal email address.';
      setErrorMessage(msg);
      showAlert('Invalid Email', msg);
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(email.trim());
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
        setOtp(res.devOtp); // pre-fill for ease of testing
      }
      setStep('otp');
      showAlert('OTP Sent', `A 6-digit verification code has been sent to ${email.trim()}.`);
    } catch (err: any) {
      const msg = err.message || 'Could not send verification OTP.';
      setErrorMessage(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (!otp || otp.trim().length < 4) {
      const msg = 'Please enter the 6-digit verification code.';
      setErrorMessage(msg);
      showAlert('Invalid OTP', msg);
      return;
    }

    setLoading(true);
    try {
      await loginWithOtp(email.trim(), otp.trim(), selectedSubject, name.trim(), institution.trim());
      navigation.replace('MainTabs');
    } catch (err: any) {
      const msg = err.message || 'Invalid or expired OTP.';
      setErrorMessage(msg);
      showAlert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTag, { color: theme.primary }]}>FACULTY AUTHENTICATION</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Teacher Sign In</Text>
          <Text style={[styles.headerDesc, { color: theme.textSecondary }]}>
            Access your subject-specialized question bank and generate high-yield papers.
          </Text>
        </View>

        {/* Tab Switcher: Password vs OTP */}
        <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              authMode === 'password' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setAuthMode('password')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: authMode === 'password' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              Password Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              authMode === 'otp' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setAuthMode('otp')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: authMode === 'otp' ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              Email OTP Login
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'password' ? (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Teacher Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="teacher@school.edu or gmail.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Enter password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Quick-fill Button for Test Teacher */}
            <TouchableOpacity
              style={styles.quickFillBadge}
              onPress={fillTestCredentials}
              activeOpacity={0.7}
            >
              <Text style={styles.quickFillText}>
                ⚡ Fill Test Chemistry Account (qpgtest@gmail.com / 123456)
              </Text>
            </TouchableOpacity>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠️ Sign In Failed</Text>
                <Text style={styles.errorDesc}>{errorMessage}</Text>
              </View>
            )}

            <Button
              title="Sign In with Password"
              onPress={handlePasswordLogin}
              loading={loading}
              variant="primary"
            />

            {/* Backend Server URL Indicator & Configuration */}
            <View style={styles.backendContainer}>
              <TouchableOpacity
                onPress={() => setShowBackendConfig(!showBackendConfig)}
                style={styles.backendToggle}
                activeOpacity={0.7}
              >
                <Text style={[styles.backendToggleText, { color: theme.textSecondary }]}>
                  🌐 Backend API:{' '}
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>{backendUrl}</Text>{' '}
                  <Text style={{ color: theme.primary }}>{showBackendConfig ? '▲ Hide' : '▼ (Change URL)'}</Text>
                </Text>
              </TouchableOpacity>

              {showBackendConfig && (
                <View style={styles.backendInputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                        color: theme.text,
                        fontSize: 13,
                        paddingVertical: 8,
                      },
                    ]}
                    placeholder="https://your-backend.onrender.com"
                    placeholderTextColor={theme.textMuted}
                    value={backendUrl}
                    onChangeText={setBackendUrl}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={[styles.saveUrlBtn, { backgroundColor: theme.primary }]}
                    onPress={async () => {
                      if (!backendUrl.trim()) return;
                      await api.setBaseUrl(backendUrl.trim());
                      setErrorMessage(null);
                      showAlert('Backend URL Updated', `API connected to ${backendUrl.trim()}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveUrlBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : step === 'email' ? (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Teacher Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="teacher@institution.edu or gmail.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.noticeBox}>
              <Text style={[styles.noticeTitle, { color: theme.primary }]}>💡 One Email = One Account</Text>
              <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                Your OTP will be sent to this email. You will choose your subject specialization next.
              </Text>
            </View>

            <Button
              title="Send Verification Code"
              onPress={handleSendOtp}
              loading={loading}
              variant="primary"
            />
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  6-Digit OTP Sent to {email}
                </Text>
                <TouchableOpacity onPress={() => setStep('email')}>
                  <Text style={[styles.changeEmail, { color: theme.primary }]}>Change</Text>
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
                <Text style={styles.devHint}>Development OTP: {devOtpHint}</Text>
              )}
            </View>

            {/* Teacher Details & Subject Selection (User Requirement) */}
            <View style={styles.questionSection}>
              <Text style={[styles.questionHeader, { color: theme.text }]}>
                Select Your Subject Specialization
              </Text>
              <Text style={[styles.questionSub, { color: theme.textSecondary }]}>
                As an individual teacher, your account will only generate and browse papers for this subject:
              </Text>

              <View style={styles.subjectsGrid}>
                {subjects.map((s) => {
                  const isSelected = selectedSubject === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSelectedSubject(s.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.subjectCard,
                        {
                          backgroundColor: isSelected ? theme.cardBg : theme.surfaceLight,
                          borderColor: isSelected ? theme.primary : theme.cardBorder,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.subjectIcon}>{s.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subjectName, { color: theme.text }]}>{s.label}</Text>
                        <Text style={[styles.subjectDetail, { color: theme.textSecondary }]}>
                          {s.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Your Name (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Institution / Coaching Name (For Paper Header)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. Apex Pre-University College"
                  placeholderTextColor={theme.textMuted}
                  value={institution}
                  onChangeText={setInstitution}
                />
              </View>
            </View>

            <Button
              title="Verify & Enter Dashboard"
              onPress={handleVerifyOtp}
              loading={loading}
              variant="primary"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  changeEmail: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  otpInput: {
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
  },
  devHint: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  noticeBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  questionSection: {
    marginVertical: 10,
  },
  questionHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  questionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  subjectsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  subjectIcon: {
    fontSize: 26,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  subjectDetail: {
    fontSize: 11,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickFillBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickFillText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
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
  backendContainer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  backendToggle: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  backendToggleText: {
    fontSize: 12,
    textAlign: 'center',
  },
  backendInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  saveUrlBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveUrlBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
