import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { InputField } from '../../components/ui/InputField';
import { Button } from '../../components/ui/Button';
import { radii, spacing, typography } from '../../theme/tokens';

export interface UtrSubmissionFormProps {
  utr: string;
  setUtr: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}

export const UtrSubmissionForm: React.FC<UtrSubmissionFormProps> = ({
  utr,
  setUtr,
  note,
  setNote,
  submitting,
  onSubmit,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <View style={styles.headerRow}>
        <ShieldCheck size={20} color={theme.success} />
        <Text style={[styles.title, { color: theme.text }]}>Submit UTR for Verification</Text>
      </View>
      <Text style={[styles.desc, { color: theme.textSecondary }]}>
        After paying ₹299, copy the 12-digit UPI Reference Number (UTR) from your payment app and submit below:
      </Text>

      <View style={styles.inputsBox}>
        <InputField
          label="12-Digit UPI Reference Number (UTR) *"
          placeholder="e.g. 428190382910"
          value={utr}
          onChangeText={setUtr}
          autoCapitalize="characters"
        />

        <InputField
          label="Optional Remarks / Payment App Used"
          placeholder="e.g. Google Pay from Prof. Chemistry"
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.btnWrapper}>
          <Button
            title="Submit UTR for Instant Verification"
            variant="primary"
            size="md"
            loading={submitting}
            onPress={onSubmit}
            leftIcon={<Check size={18} color="#FFFFFF" strokeWidth={3} />}
          />
        </View>
      </View>
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
    marginBottom: spacing[4],
  },
  inputsBox: {
    gap: spacing[3.5],
  },
  btnWrapper: {
    marginTop: spacing[1],
  },
});
