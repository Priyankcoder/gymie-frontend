
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Apple-style easing curve: confident finish, no bounce
// Slower, more deliberate animation
const APPLE_EASING = {
  duration: 1800,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
  useNativeDriver: false,
};

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
  const { colors, typography, isDark } = useTheme();
  
  const ringColor = color || colors.accentBlue;
  
  // Get a darker version of the ring color for overflow rings
  const getDarkerColor = (hexColor: string, level: number) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Darken progressively: level 1 = 85%, level 2 = 70%, level 3 = 55%, etc.
    const factor = Math.max(0.85 - (level - 1) * 0.15, 0.3);
    const darkR = Math.round(r * factor);
    const darkG = Math.round(g * factor);
    const darkB = Math.round(b * factor);
    
    return `rgb(${darkR}, ${darkG}, ${darkB})`;
  };
  
  // Get lighter highlight color for gradient (11 o'clock light source)
  const getLighterColor = (hexColor: string, boost: number = 1.3) => {
    const hex = hexColor.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * boost);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * boost);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * boost);
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Get darker shadow color
  const getShadowColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) * 0.6;
    const g = parseInt(hex.substr(2, 2), 16) * 0.6;
    const b = parseInt(hex.substr(4, 2), 16) * 0.6;
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Get a lighter/softer version of the ring color for background
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    
    // For light theme, use a very subtle tinted background
    if (!isDark) {
      // Extract RGB from hex color and create a very light tint
      const hex = ringColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Create a very light tint (95% white + 5% color)
      const lightR = Math.round(r * 0.05 + 255 * 0.95);
      const lightG = Math.round(g * 0.05 + 255 * 0.95);
      const lightB = Math.round(b * 0.05 + 255 * 0.95);
      
      return `rgba(${lightR}, ${lightG}, ${lightB}, 0.3)`;
    }
    
    // For dark theme, use the existing color
    return colors.progressBackground;
  };
  
  const bgColor = getBackgroundColor();
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate percentage - allow over 100%
  const percentage = (value / maxValue) * 100;
  const isOverTarget = value > maxValue;
  
  // For display, cap at 100% for the main ring
  const displayPercentage = Math.min(percentage, 100);
  const targetStrokeDashoffset = circumference - (displayPercentage / 100) * circumference;
  
  // Calculate how many complete overflow rings and the partial ring
  const overflowPercentage = percentage - 100;
  const numCompleteOverflowRings = Math.floor(overflowPercentage / 100);
  const partialOverflowPercentage = overflowPercentage % 100;
  
  // Create animated values for each overflow ring
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedStrokeDashoffset = useRef(new Animated.Value(circumference)).current;
  const animatedOverflowOffsets = useRef<Animated.Value[]>([]).current;
  
  // Initialize animated values for overflow rings
  if (animatedOverflowOffsets.length === 0) {
    for (let i = 0; i < 5; i++) { // Support up to 5 overflow rings (600%)
      animatedOverflowOffsets.push(new Animated.Value(circumference));
    }
  }

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(animatedValue, APPLE_EASING),
      Animated.timing(animatedStrokeDashoffset, {
        toValue: targetStrokeDashoffset,
        ...APPLE_EASING,
      }),
    ];

    if (isOverTarget) {
      animatedOverflowOffsets.forEach((offset, i) => {
        if (i < numCompleteOverflowRings) {
          // Complete overflow rings with micro-pause at 100%
          animations.push(
            Animated.sequence([
              Animated.delay(i * 200), // Slight stagger for each ring - increased for slower animation
              Animated.timing(offset, {
                toValue: 0,
                ...APPLE_EASING,
              }),
            ])
          );
        } else if (i === numCompleteOverflowRings && partialOverflowPercentage > 0) {
          // Partial overflow ring
          const partialOffset = circumference - (partialOverflowPercentage / 100) * circumference;
          animations.push(
            Animated.sequence([
              Animated.delay(i * 200),
              Animated.timing(offset, {
                toValue: partialOffset,
                ...APPLE_EASING,
              }),
            ])
          );
        } else {
          // Reset unused rings
          offset.setValue(circumference);
        }
      });
    } else {
      // Reset all overflow rings if not over target
      animatedOverflowOffsets.forEach(offset => {
        offset.setValue(circumference);
      });
    }

    Animated.parallel(animations).start();
  }, [value, targetStrokeDashoffset, isOverTarget, numCompleteOverflowRings, partialOverflowPercentage]);

  const displayValue = showPercentage
    ? `${Math.round(percentage)}%`
    : Math.round(value).toLocaleString();

  // Adjust font sizes for better fit
  const valueFontSize = size < 100 ? size * 0.14 : size * 0.16;
  const targetFontSize = size < 100 ? size * 0.10 : size * 0.12;
  const separatorFontSize = size < 100 ? size * 0.09 : size * 0.10;


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
          strokeLinecap="round"
        />
        
        {/* Main Progress Circle */}
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
        
        {/* Overflow Rings - Layered on top with darker colors */}
        {isOverTarget && animatedOverflowOffsets.map((offset, index) => {
          const shouldRenderComplete = index < numCompleteOverflowRings;
          const shouldRenderPartial = index === numCompleteOverflowRings && partialOverflowPercentage > 0;
          
          if (!shouldRenderComplete && !shouldRenderPartial) return null;
          
          const overflowColor = getDarkerColor(ringColor, index + 1);
          
          return (
            <AnimatedCircle
              key={`overflow-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={overflowColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
      <View style={styles.textContainer}>
        {showPercentage ? (
          <Text
            style={[
              styles.value,
              {
                color: colors.textPrimary,
                fontSize: size * 0.2,
                fontWeight: '600',
                fontFamily: 'System',
              },
            ]}
          >
            {displayValue}
          </Text>
        ) : (
          <View style={styles.valueContainer}>
            <Text
              style={[
                styles.currentValue,
                {
                  color: isOverTarget ? colors.warning : colors.textPrimary,
                  fontSize: valueFontSize,
                  fontWeight: '600',
                  fontFamily: 'System',
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {displayValue}
            </Text>
            <Text
              style={[
                styles.separator,
                {
                  color: colors.textSecondary,
                  fontSize: separatorFontSize,
                  opacity: 0.5,
                  fontFamily: 'System',
                },
              ]}
            >
              /
            </Text>
            <Text
              style={[
                styles.targetValue,
                {
                  color: colors.textSecondary,
                  fontSize: targetFontSize,
                  fontWeight: '500',
                  fontFamily: 'System',
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {Math.round(maxValue).toLocaleString()}
            </Text>
          </View>
        )}
        {unit && (
          <Text
            style={[
              styles.unit,
              {
                color: colors.textSecondary,
                fontSize: size * 0.08,
                opacity: 0.6,
                fontWeight: '500',
                fontFamily: 'System',
              },
            ]}
            numberOfLines={1}
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
                fontSize: size * 0.085,
                fontWeight: '500',
                fontFamily: 'System',
              },
            ]}
            numberOfLines={1}
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
    maxWidth: '80%',
    zIndex: 10,
  },
  value: {
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'nowrap',
  },
  currentValue: {
    fontWeight: '600',
    flexShrink: 1,
    letterSpacing: -0.5,
  },
  separator: {
    fontWeight: '400',
    marginHorizontal: 2,
  },
  targetValue: {
    fontWeight: '500',
    flexShrink: 1,
    letterSpacing: -0.3,
  },
  unit: {
    marginTop: 2,
    letterSpacing: 0.3,
  },
  label: {
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default MetricRing;
