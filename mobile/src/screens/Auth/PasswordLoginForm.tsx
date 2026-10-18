import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { InputField } from '../../components/ui/InputField';
import { Button } from '../../components/ui/Button';
import { spacing } from '../../theme/tokens';

export interface PasswordLoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const PasswordLoginForm: React.FC<PasswordLoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <InputField
        label="Teacher Academic Email"
        placeholder="e.g. qpgtest@gmail.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon={<Mail size={18} color={theme.textMuted} />}
        showClear
        onClear={() => setEmail('')}
      />

      <InputField
        label="Account Password"
        placeholder="e.g. 123456"
        value={password}
        onChangeText={setPassword}
        isPassword
        leftIcon={<Lock size={18} color={theme.textMuted} />}
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />

      <View style={styles.btnRow}>
        <Button
          title="Sign In to Faculty Dashboard"
          onPress={onSubmit}
          loading={loading}
          variant="primary"
          size="lg"
          rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
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
});
