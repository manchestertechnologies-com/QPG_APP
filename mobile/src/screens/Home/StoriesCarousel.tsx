import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';
import { ExamType } from '../../types';

export interface StoryItem {
  id: string;
  label: string;
  exam?: ExamType;
  route?: string;
  count: string;
  icon: string;
}

export interface StoriesCarouselProps {
  onSelectStory: (story: StoryItem) => void;
}

export const StoriesCarousel: React.FC<StoriesCarouselProps> = ({ onSelectStory }) => {
  const { theme } = useTheme();

  const stories: StoryItem[] = [
    { id: 'neet', label: 'NEET 2026', exam: 'NEET', count: '50 Qs', icon: '🩺' },
    { id: 'jee', label: 'JEE Main', exam: 'JEE', count: '30 Qs', icon: '📐' },
    { id: 'cet', label: 'State CET', exam: 'CET', count: '60 Qs', icon: '🏆' },
    { id: 'custom', label: 'Custom Test', exam: 'CUSTOM', count: 'Flexible', icon: '⚙️' },
    { id: 'bank', label: 'Question Bank', route: 'QuestionBank', count: '23.6k Qs', icon: '📚' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stories.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelectStory(item)}
            activeOpacity={0.8}
            style={styles.storyCol}
          >
            <LinearGradient
              colors={['#F59E0B', '#EC4899', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            >
              <View style={[styles.avatarCircle, { backgroundColor: theme.surface }]}>
                <Text style={styles.storyIcon}>{item.icon}</Text>
              </View>
            </LinearGradient>

            <Text style={[styles.storyLabel, { color: theme.text }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.storyCount, { color: theme.textMuted }]}>{item.count}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[2],
  },
  scrollContent: {
    paddingHorizontal: spacing[1],
    gap: spacing[3],
  },
  storyCol: {
    alignItems: 'center',
    width: 68,
    cursor: 'pointer' as any,
  },
  gradientRing: {
    width: 58,
    height: 58,
    borderRadius: radii.full,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyIcon: {
    fontSize: 22,
  },
  storyLabel: {
    ...typography.caption,
    fontWeight: '700',
    marginTop: spacing[1],
    textAlign: 'center',
  },
  storyCount: {
    fontSize: 10,
    fontWeight: '600',
  },
});
