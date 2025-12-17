
/**
 * EmptyWorkoutState Component
 * Displays when no active workout - prompts user to start
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';

interface EmptyWorkoutStateProps {
  hasScheduled: boolean;
  onStartEmpty: () => void;
  onUseTemplate: () => void;
}

export const EmptyWorkoutState: React.FC<EmptyWorkoutStateProps> = ({
  hasScheduled,
  onStartEmpty,
  onUseTemplate,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name="barbell-outline" size={80} color={colors.textSecondary} />
      
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {hasScheduled ? 'Or Start Custom Workout' : 'Ready to Train?'}
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Start a new workout or use a template
      </Text>
      
      <View style={styles.buttons}>
        <Button
          title="Empty Workout"
          variant="outline"
          onPress={onStartEmpty}
          style={{ flex: 1 }}
        />
        <Button
          title="Use Template"
          onPress={onUseTemplate}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
