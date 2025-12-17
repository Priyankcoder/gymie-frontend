
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';

type MetricType = 'weight' | 'reps' | 'volume' | '1rm';

interface MetricSelectorProps {
  selected: MetricType;
  onSelect: (metric: MetricType) => void;
}

const metrics: { key: MetricType; label: string }[] = [
  { key: 'weight', label: 'Weight' },
  { key: 'reps', label: 'Reps' },
  { key: 'volume', label: 'Volume' },
  { key: '1rm', label: '1RM' },
];

export const MetricSelector: React.FC<MetricSelectorProps> = ({
  selected,
  onSelect,
}) => {
  const { colors, borderRadius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground, borderRadius: borderRadius.md }]}>
      {metrics.map((metric) => (
        <Pressable
          key={metric.key}
          style={[
            styles.toggle,
            {
              backgroundColor: selected === metric.key ? colors.accentBlue : 'transparent',
              borderRadius: borderRadius.sm,
            },
          ]}
          onPress={() => onSelect(metric.key)}
        >
          <Text style={[styles.toggleText, { color: selected === metric.key ? '#FFF' : colors.textSecondary }]}>
            {metric.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 2,
    marginBottom: 12,
  },
  toggle: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
