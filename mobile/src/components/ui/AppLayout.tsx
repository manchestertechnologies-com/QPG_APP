import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { layout, spacing } from '../../theme/tokens';

interface AppLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
  maxWidth?: number;
  keyboardAvoiding?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  scrollable = true,
  contentContainerStyle,
  style,
  maxWidth = layout.maxContentWidth,
  keyboardAvoiding = true,
}) => {
  const { theme } = useTheme();

  const innerContent = (
    <View style={[styles.innerContainer, { maxWidth }]}>
      {children}
    </View>
  );

  const containerStyle = [styles.container, { backgroundColor: theme.background }, style];

  if (scrollable) {
    const scrollContent = (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={[
          styles.scrollContent,
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {innerContent}
      </ScrollView>
    );

    if (keyboardAvoiding) {
      return (
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: theme.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {scrollContent}
        </KeyboardAvoidingView>
      );
    }
    return scrollContent;
  }

  return (
    <View style={containerStyle}>
      {innerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: spacing[8],
  },
  innerContainer: {
    width: '100%',
    paddingHorizontal: spacing[4],
    alignSelf: 'center',
  },
});
