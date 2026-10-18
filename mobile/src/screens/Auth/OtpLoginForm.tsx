import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Mail, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { InputField } from '../../components/ui/InputField';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { radii, spacing, typography } from '../../theme/tokens';
import { Subject } from '../../types';

export interface OtpLoginFormProps {
  step: 'email' | 'otp';
  setStep: (step: 'email' | 'otp') => void;
  email: string;
  setEmail: (val: string) => void;
  otp: string;
  setOtp: (val: string) => void;
  devOtpHint: string | null;
  selectedSubject: Subject;
  setSelectedSubject: (s: Subject) => void;
  name: string;
  setName: (val: string) => void;
  institution: string;
  setInstitution: (val: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  loading: boolean;
}

const subjects: { id: Subject; label: string; icon: string; count: string }[] = [
  { id: 'Chemistry', label: 'Chemistry', icon: '🧪', count: '23,603+ Qs' },
  { id: 'Physics', label: 'Physics', icon: '⚡', count: '24,757+ Qs' },
  { id: 'Mathematics', label: 'Mathematics', icon: '📐', count: '16,970+ Qs' },
  { id: 'Biology', label: 'Biology', icon: '🧬', count: '23,872+ Qs' },
];

export const OtpLoginForm: React.FC<OtpLoginFormProps> = ({
  step,
  setStep,
  email,
  setEmail,
  otp,
  setOtp,
  devOtpHint,
  selectedSubject,
  setSelectedSubject,
  onSendOtp,
  onVerifyOtp,
  loading,
}) => {
  const { theme } = useTheme();

  if (step === 'email') {
    return (
      <View style={styles.container}>
        <InputField
          label="Teacher Email"
          placeholder="teacher@institution.edu"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Mail size={18} color={theme.textMuted} />}
          onSubmitEditing={onSendOtp}
          returnKeyType="send"
        />

        <View style={styles.btnRow}>
          <Button
            title="Send 6-Digit OTP Code"
            onPress={onSendOtp}
            loading={loading}
            variant="primary"
            size="lg"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.changeEmailRow}>
        <Text style={[styles.codeSentText, { color: theme.textSecondary }]}>
          Code sent to: <Text style={{ color: theme.text, fontWeight: '700' }}>{email}</Text>
        </Text>
        <TouchableOpacity onPress={() => setStep('email')} activeOpacity={0.7}>
          <Text style={[styles.changeLink, { color: theme.primaryLight }]}>Change</Text>
        </TouchableOpacity>
      </View>

      <InputField
        label="6-Digit Verification Code"
        placeholder="123456"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        hint={devOtpHint ? `Dev auto-code: ${devOtpHint}` : null}
        onSubmitEditing={onVerifyOtp}
      />

      {/* Locked Subject Selection Grid */}
      <View style={styles.subjectBox}>
        <Text style={[styles.subjectTitle, { color: theme.text }]}>Select Your Locked Subject</Text>
        <Text style={[styles.subjectSubtitle, { color: theme.textSecondary }]}>
          Faculty account access is permanently tailored to your discipline:
        </Text>

        <View style={styles.subjectGrid}>
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
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : theme.surfaceLight,
                    borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                  },
                ]}
              >
                <Text style={styles.subjectIcon}>{s.icon}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.subjectLabel, { color: isSelected ? theme.primaryLight : theme.text }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.subjectCount, { color: theme.textMuted }]}>{s.count}</Text>
                </View>
                {isSelected && <CheckCircle2 size={16} color={theme.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.btnRow}>
        <Button
          title="Verify & Enter Dashboard"
          onPress={onVerifyOtp}
          loading={loading}
          variant="primary"
          size="lg"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[1.5],
  },
  btnRow: {
    marginTop: spacing[2],
  },
  changeEmailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  codeSentText: {
    ...typography.bodySmall,
  },
  changeLink: {
    ...typography.caption,
    fontWeight: '700',
    cursor: 'pointer' as any,
  },
  subjectBox: {
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  subjectTitle: {
    ...typography.label,
  },
  subjectSubtitle: {
    ...typography.caption,
    marginTop: 2,
    marginBottom: spacing[2],
  },
  subjectGrid: {
    gap: spacing[1.5],
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2.5],
    borderRadius: radii.md,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  subjectIcon: {
    fontSize: 20,
  },
  subjectLabel: {
    ...typography.label,
  },
  subjectCount: {
    ...typography.overline,
    fontWeight: '600',
  },
});
