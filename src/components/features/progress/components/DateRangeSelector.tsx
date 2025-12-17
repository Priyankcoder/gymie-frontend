
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';

type DateRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface DateRangeSelectorProps {
  selected: DateRange;
  onSelect: (range: DateRange) => void;
  color?: string;
}

const dateRanges: DateRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selected,
  onSelect,
  color,
}) => {
  const { colors, borderRadius } = useTheme();
  const accentColor = color || colors.accentBlue;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {dateRanges.map((range) => (
        <Pressable
          key={range}
          style={[
            styles.chip,
            {
              backgroundColor: selected === range ? accentColor : colors.inputBackground,
              borderRadius: borderRadius.md,
            },
          ]}
          onPress={() => onSelect(range)}
        >
          <Text style={[styles.chipText, { color: selected === range ? '#FFF' : colors.textSecondary }]}>
            {range}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
