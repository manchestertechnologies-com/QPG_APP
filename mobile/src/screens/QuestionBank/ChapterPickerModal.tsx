import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radii, spacing, typography } from '../../theme/tokens';

export interface ChapterPickerModalProps {
  visible: boolean;
  onClose: () => void;
  chapters: { name: string; count: number }[];
  totalCount: number;
  selectedChapter: string;
  onSelectChapter: (name: string) => void;
}

export const ChapterPickerModal: React.FC<ChapterPickerModalProps> = ({
  visible,
  onClose,
  chapters,
  totalCount,
  selectedChapter,
  onSelectChapter,
}) => {
  const { theme } = useTheme();

  const data = [{ name: 'All Chapters', count: totalCount }, ...chapters];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.title, { color: theme.text }]}>Select NCERT Chapter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={data}
            keyExtractor={(item, i) => item.name + i}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedChapter === item.name;
              return (
                <TouchableOpacity
                  style={[
                    styles.item,
                    isSelected && { backgroundColor: 'rgba(99, 102, 241, 0.12)' },
                  ]}
                  onPress={() => {
                    onSelectChapter(item.name);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.textWrap}>
                    <Text
                      style={[
                        styles.name,
                        { color: isSelected ? theme.primaryLight : theme.text },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.count > 0 && (
                      <Text style={[styles.count, { color: theme.textMuted }]}>
                        {item.count.toLocaleString()} Questions
                      </Text>
                    )}
                  </View>
                  {isSelected && <Check size={16} color={theme.primary} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4.5],
    paddingVertical: spacing[3.5],
    borderBottomWidth: 1,
  },
  title: {
    ...typography.titleSmall,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing[1],
    cursor: 'pointer' as any,
  },
  listContent: {
    paddingVertical: spacing[2],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4.5],
    cursor: 'pointer' as any,
  },
  textWrap: {
    flex: 1,
    paddingRight: spacing[2],
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  count: {
    ...typography.caption,
    marginTop: 2,
  },
});
