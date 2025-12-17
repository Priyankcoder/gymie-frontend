
/**
 * TemplateModal Component
 * Modal for selecting workout templates
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { WorkoutTemplate } from '../../../../types';

interface TemplateModalProps {
  visible: boolean;
  templates: WorkoutTemplate[];
  onClose: () => void;
  onSelectTemplate: (template: WorkoutTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  visible,
  templates,
  onClose,
  onSelectTemplate,
}) => {
  const { colors, borderRadius } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderRadius: borderRadius.lg },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Choose Template
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Template List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {templates.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="folder-open-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No templates yet
                </Text>
              </View>
            ) : (
              templates.map((template) => (
                <Pressable
                  key={template.id}
                  style={[styles.templateItem, { borderBottomColor: colors.border }]}
                  onPress={() => onSelectTemplate(template)}
                >
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: template.color || colors.accentBlue },
                    ]}
                  />
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: colors.textPrimary }]}>
                      {template.name}
                    </Text>
                    <Text
                      style={[styles.templateExercises, { color: colors.textSecondary }]}
                    >
                      {template.exercises.length} exercises
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  templateExercises: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
