import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface MathRendererProps {
  content: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  fontSize = 15,
  color,
  lineHeight = 22,
}) => {
  const { theme } = useTheme();
  const textColor = color || theme.text;

  if (!content) return null;

  // Split content by {{IMG::<url>}}
  const parts = content.split(/(\{\{IMG::https?:\/\/[^\}]+\}\})/g);

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        if (part.startsWith('{{IMG::') && part.endsWith('}}')) {
          const imgUrl = part.slice(7, -2);
          return <DiagramView key={`img_${index}`} uri={imgUrl} />;
        }

        // Clean LaTeX tags for native mobile display while preserving clarity
        const formattedText = cleanTextForDisplay(part);
        if (!formattedText) return null;

        return (
          <Text
            key={`txt_${index}`}
            style={[styles.text, { fontSize, color: textColor, lineHeight }]}
          >
            {formattedText}
          </Text>
        );
      })}
    </View>
  );
};

const DiagramView: React.FC<{ uri: string }> = ({ uri }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[styles.imgWrapper, { backgroundColor: '#FFFFFF', borderColor: theme.surfaceBorder }]}>
      {loading && !error && (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.primary} size="small" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={styles.diagramImage}
        resizeMode="contain"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>Diagram could not be loaded</Text>
      )}
    </View>
  );
};

/**
 * Normalizes common LaTeX markers for clean, legible native mobile reading
 */
function cleanTextForDisplay(raw: string): string {
  if (!raw) return '';

  return raw
    .replace(/\$\$/g, '\n')
    .replace(/\$/g, '')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\displaystyle/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\ne/g, '≠')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\rightleftharpoons/g, '⇌')
    .replace(/\[QBP_DIFFICULTY:[^\]]+\]/g, '')
    .replace(/\[QBP_EXAM:[^\]]+\]/g, '')
    .trim();
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  text: {
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  imgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    minHeight: 140,
    overflow: 'hidden',
  },
  diagramImage: {
    width: '100%',
    height: 180,
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
