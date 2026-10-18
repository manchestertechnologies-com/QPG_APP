import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { FileSpreadsheet, Building } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { InputField } from '../../components/ui/InputField';
import { radii, spacing, typography } from '../../theme/tokens';
import { ExamType } from '../../types';

export interface PaperConfigFormProps {
  examType: ExamType;
  paperTitle: string;
  setPaperTitle: (val: string) => void;
  institution: string;
  setInstitution: (val: string) => void;
  customQuestionCount: string;
  setCustomQuestionCount: (val: string) => void;
  customDuration: string;
  setCustomDuration: (val: string) => void;
  includeKey: boolean;
  setIncludeKey: (val: boolean) => void;
  includeSolutions: boolean;
  setIncludeSolutions: (val: boolean) => void;
}

export const PaperConfigForm: React.FC<PaperConfigFormProps> = ({
  examType,
  paperTitle,
  setPaperTitle,
  institution,
  setInstitution,
  customQuestionCount,
  setCustomQuestionCount,
  customDuration,
  setCustomDuration,
  includeKey,
  setIncludeKey,
  includeSolutions,
  setIncludeSolutions,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
      <View style={styles.inputsBox}>
        <InputField
          label="Examination Paper Title"
          placeholder="e.g. NEET Chemistry Grand Mock Test 2026"
          value={paperTitle}
          onChangeText={setPaperTitle}
          leftIcon={<FileSpreadsheet size={18} color={theme.textMuted} />}
        />

        <InputField
          label="Institution / Coaching Academy"
          placeholder="e.g. Manchester Science Institute"
          value={institution}
          onChangeText={setInstitution}
          leftIcon={<Building size={18} color={theme.textMuted} />}
        />

        {examType === 'CUSTOM' && (
          <View style={styles.customRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Questions"
                value={customQuestionCount}
                onChangeText={setCustomQuestionCount}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Duration (Mins)"
                value={customDuration}
                onChangeText={setCustomDuration}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      {/* Toggles */}
      <View style={styles.togglesBox}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: spacing[3] }}>
            <Text style={[styles.toggleTitle, { color: theme.text }]}>Include Answer Key Grid</Text>
            <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
              Appends a 5-column evaluation key table at the end of the test.
            </Text>
          </View>
          <Switch
            value={includeKey}
            onValueChange={setIncludeKey}
            trackColor={{ false: theme.surfaceLight, true: theme.success }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1, paddingRight: spacing[3] }}>
            <Text style={[styles.toggleTitle, { color: theme.text }]}>Step-by-Step Solutions</Text>
            <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
              Provides detailed mathematical and chemical step-by-step reasoning.
            </Text>
          </View>
          <Switch
            value={includeSolutions}
            onValueChange={setIncludeSolutions}
            trackColor={{ false: theme.surfaceLight, true: theme.success }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputsBox: {
    padding: spacing[3.5],
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing[2.5],
  },
  divider: {
    height: 1,
  },
  togglesBox: {
    paddingHorizontal: spacing[3.5],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleTitle: {
    ...typography.label,
  },
  toggleDesc: {
    ...typography.bodySmall,
    marginTop: 2,
  },
});
