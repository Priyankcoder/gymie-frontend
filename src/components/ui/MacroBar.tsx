
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface MacroBarProps {
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
  color: string;
  style?: ViewStyle;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  label,
  value,
  maxValue,
  unit = 'g',
  color,
  style,
}) => {
  const { colors, typography, borderRadius } = useTheme();
  
  // Handle edge cases: division by zero, negative values, NaN
  const safeValue = Math.max(0, isNaN(value) ? 0 : value);
  const safeMaxValue = Math.max(1, isNaN(maxValue) ? 1 : maxValue);
  const percentage = Math.min((safeValue / safeMaxValue) * 100, 100);
  
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {value}{unit} / {maxValue}{unit}
        </Text>
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.progressBackground,
            borderRadius: borderRadius.full,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: color,
              borderRadius: borderRadius.full,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  track: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

export default MacroBar;
