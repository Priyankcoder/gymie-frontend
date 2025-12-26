
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MetricRingProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  unit?: string;
  showPercentage?: boolean;
  style?: ViewStyle;
}

export const MetricRing: React.FC<MetricRingProps> = ({
  value,
  maxValue,
  size = 120,
  strokeWidth = 10,
  color,
  backgroundColor,
  label,
  unit,
  showPercentage = false,
  style,
}) => {
  const { colors, typography } = useTheme();
  
  const ringColor = color || colors.accentBlue;
  const bgColor = backgroundColor || colors.progressBackground;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const targetStrokeDashoffset = circumference - (percentage / 100) * circumference;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedStrokeDashoffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(animatedStrokeDashoffset, {
        toValue: targetStrokeDashoffset,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, targetStrokeDashoffset]);

  const displayValue = showPercentage
    ? `${Math.round(percentage)}%`
    : value.toLocaleString();

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.value,
            {
              color: colors.textPrimary,
              fontSize: size * 0.2,
              fontWeight: typography.monoLarge.fontWeight,
            },
          ]}
        >
          {displayValue}
        </Text>
        {unit && (
          <Text
            style={[
              styles.unit,
              {
                color: colors.textSecondary,
                fontSize: size * 0.1,
              },
            ]}
          >
            {unit}
          </Text>
        )}
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: colors.textSecondary,
                fontSize: size * 0.09,
              },
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '600',
  },
  unit: {
    marginTop: 2,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
  },
});

export default MetricRing;
